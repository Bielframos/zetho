import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  PLATFORM_ID,
  SecurityContext,
  signal,
  untracked,
} from '@angular/core';
import {
  CommonModule,
  DOCUMENT,
  isPlatformBrowser,
  NgTemplateOutlet,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthStore } from '../../../auth/auth.store';
import { NotificationStore } from '../../../system/notifications/notification.store';
import { SeoService } from '../../../system/seo/seo.service';
import { ZCoinsService } from '../../../zCoins/zcoins.service';
import { UiLoading } from '../../../../shared/ui/loading';
import { RichTextEditorComponent } from '../../../../shared/ui/rich-text-editor/rich-text-editor';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { createSsrTaskRunner } from '../../../../utils/ssr-task';
import { ForumService } from '../../forum.service';
import {
  ForumPostDetailResponse,
  ForumPostItem,
  ForumReplyItem,
  ForumSort,
} from '../../forum.types';

export interface NestedReplyBucket {
  items: ForumReplyItem[];
  page: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  hidden: boolean;
}

@Component({
  selector: 'app-forum-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgTemplateOutlet,
    RouterLink,
    RelativeTimePipe,
    RichTextEditorComponent,
    UiLoading,
  ],
  templateUrl: './forum-post.html',
})
export class ForumPostPage implements OnDestroy {
  readonly authStore = inject(AuthStore);
  private readonly forumService = inject(ForumService);
  private readonly notification = inject(NotificationStore);
  private readonly seo = inject(SeoService);
  private readonly zCoinsService = inject(ZCoinsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly runAsSsrTask = createSsrTaskRunner();
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private requestGeneration = 0;
  private loadedPostKey: string | null = null;
  private scrollFrameId: number | null = null;
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;

  readonly post = signal<ForumPostItem | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly replies = signal<ForumReplyItem[]>([]);
  readonly repliesPage = signal(1);
  readonly repliesTotal = signal(0);
  readonly repliesHasMore = signal(false);
  readonly loadingMoreReplies = signal(false);
  readonly replySort = signal<ForumSort>('recent');

  readonly nestedReplies = signal<Record<string, NestedReplyBucket>>({});

  readonly rootReplyContent = signal('');
  readonly submittingRootReply = signal(false);

  readonly replyingToId = signal<string | null>(null);
  readonly inlineReplyContent = signal('');
  readonly submittingInlineReply = signal(false);

  readonly editingId = signal<string | null>(null);
  readonly editTitle = signal('');
  readonly editContent = signal('');
  readonly savingEdit = signal(false);

  readonly deletingIds = signal<Set<string>>(new Set());
  readonly votingIds = signal<Set<string>>(new Set());
  readonly highlightedCommentId = signal<string | null>(null);

  readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null },
  );

  readonly commentIdParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('commentId'))),
    { initialValue: null },
  );

  private readonly viewerKey = computed(() =>
    JSON.stringify([
      this.authStore.user()?.$id ?? null,
      this.authStore.profile()?.$id ?? null,
    ]),
  );

  readonly rootReplyTextLength = computed(() =>
    this.extractPlainText(this.rootReplyContent()).length,
  );

  readonly canSubmitRootReply = computed(() => {
    const len = this.rootReplyTextLength();
    return !this.submittingRootReply() && len >= 3 && len <= 4000;
  });

  readonly inlineReplyTextLength = computed(() =>
    this.extractPlainText(this.inlineReplyContent()).length,
  );

  readonly canSubmitInlineReply = computed(() => {
    const len = this.inlineReplyTextLength();
    return !this.submittingInlineReply() && len >= 3 && len <= 4000;
  });

  readonly editTextLength = computed(() =>
    this.extractPlainText(this.editContent()).length,
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearScheduledHighlight();
    });

    effect(() => {
      const slug = this.slug();
      const commentId = this.commentIdParam();
      const sort = this.replySort();
      const viewer = this.viewerKey();
      if (!slug) return;

      const currentPost = untracked(() => this.post());
      if (
        currentPost &&
        slug === currentPost.slug &&
        this.loadedPostKey === `${currentPost.$id}:${sort}:${viewer}:${commentId ?? ''}`
      ) {
        return;
      }

      untracked(() => {
        void this.loadPost(slug, commentId, sort, viewer);
      });
    });
  }

  ngOnDestroy(): void {
    this.seo.clearJsonLd('forum-post');
  }

  safeHtml(content: string | null | undefined): string {
    if (!content) return '';
    return this.sanitizer.sanitize(SecurityContext.HTML, content) ?? '';
  }

  authorInitial(item: ForumPostItem | ForumReplyItem): string {
    return item.author?.gamertag?.trim().charAt(0).toUpperCase() || 'Z';
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  canManage(item: ForumPostItem | ForumReplyItem): boolean {
    const profileId = this.authStore.profile()?.$id;
    if (!profileId) return false;
    return item.author?.$id === profileId || this.authStore.isAdmin();
  }

  setReplySort(sort: ForumSort): void {
    if (this.replySort() === sort) return;
    this.replySort.set(sort);
  }

  nestedBucket(parentId: string): NestedReplyBucket | undefined {
    return this.nestedReplies()[parentId];
  }

  async toggleOrLoadNestedReplies(parent: ForumReplyItem): Promise<void> {
    const bucket = this.nestedBucket(parent.$id);
    if (bucket && bucket.items.length > 0 && !bucket.hasMore) {
      this.nestedReplies.update((map) => ({
        ...map,
        [parent.$id]: {
          ...bucket,
          hidden: !bucket.hidden,
        },
      }));
      return;
    }

    if (bucket && bucket.hidden) {
      this.nestedReplies.update((map) => ({
        ...map,
        [parent.$id]: {
          ...bucket,
          hidden: false,
        },
      }));
      return;
    }

    await this.loadNestedReplies(parent.$id);
  }

  async loadNestedReplies(parentId: string): Promise<void> {
    const bucket = this.nestedBucket(parentId);
    if (bucket?.loading) return;

    const nextPage = bucket ? bucket.page + 1 : 1;
    const generation = this.requestGeneration;

    this.nestedReplies.update((map) => ({
      ...map,
      [parentId]: {
        items: bucket?.items ?? [],
        page: bucket?.page ?? 0,
        total: bucket?.total ?? 0,
        hasMore: bucket?.hasMore ?? false,
        loading: true,
        hidden: false,
      },
    }));

    try {
      const response = await this.forumService.getReplies(parentId, {
        page: nextPage,
        pageSize: 6,
        sort: 'recent',
      });

      if (generation !== this.requestGeneration) return;

      this.nestedReplies.update((map) => {
        const prev = map[parentId]?.items ?? [];
        return {
          ...map,
          [parentId]: {
            items: this.mergeItems(prev, response.items),
            page: response.page,
            total: response.total,
            hasMore: response.hasMore,
            loading: false,
            hidden: false,
          },
        };
      });
    } catch {
      if (generation !== this.requestGeneration) return;
      this.nestedReplies.update((map) => {
        const current = map[parentId];
        if (!current) return map;
        return {
          ...map,
          [parentId]: { ...current, loading: false },
        };
      });
      this.notification.show({
        message: 'Não foi possível carregar as respostas.',
        type: 'error',
      });
    }
  }

  async loadMoreRootReplies(): Promise<void> {
    const post = this.post();
    if (!post || this.loadingMoreReplies() || !this.repliesHasMore()) return;

    const generation = this.requestGeneration;
    const nextPage = this.repliesPage() + 1;
    this.loadingMoreReplies.set(true);

    try {
      const response = await this.forumService.getReplies(post.$id, {
        page: nextPage,
        pageSize: 10,
        sort: this.replySort(),
      });
      if (generation !== this.requestGeneration) return;

      this.replies.update((prev) => this.mergeItems(prev, response.items));
      this.repliesPage.set(response.page);
      this.repliesTotal.set(response.total);
      this.repliesHasMore.set(response.hasMore);
    } catch {
      if (generation === this.requestGeneration) {
        this.notification.show({
          message: 'Não foi possível carregar mais respostas.',
          type: 'error',
        });
      }
    } finally {
      if (generation === this.requestGeneration) {
        this.loadingMoreReplies.set(false);
      }
    }
  }

  async submitRootReply(event: Event): Promise<void> {
    event.preventDefault();
    const post = this.post();
    const content = this.rootReplyContent().trim();
    if (!post || !this.canSubmitRootReply() || !content) return;

    this.submittingRootReply.set(true);
    try {
      const created = await this.forumService.createReply({
        gameId: post.gameId,
        parentId: post.$id,
        content,
      });

      void this.zCoinsService.applyInput('engaged').catch(() => undefined);

      const newReply = this.buildLocalReplyItem(created, post, 1, post.$id);
      this.requestGeneration += 1;
      this.replies.update((list) => [
        newReply,
        ...list.filter((item) => item.$id !== newReply.$id),
      ]);
      this.repliesTotal.update((total) => total + 1);
      this.post.update((current) =>
        current ? { ...current, replyCount: (current.replyCount ?? 0) + 1 } : null,
      );
      this.rootReplyContent.set('');
      this.notification.show({
        message: 'Resposta publicada!',
        type: 'success',
      });
    } catch (error) {
      this.notification.show({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível publicar sua resposta.',
        type: 'error',
      });
    } finally {
      this.submittingRootReply.set(false);
    }
  }

  startReplyTo(comment: ForumReplyItem): void {
    this.editingId.set(null);
    this.replyingToId.set(comment.$id);
    this.inlineReplyContent.set('');
  }

  cancelInlineReply(): void {
    this.replyingToId.set(null);
    this.inlineReplyContent.set('');
  }

  async submitInlineReply(
    event: Event,
    parent: ForumReplyItem,
  ): Promise<void> {
    event.preventDefault();
    const post = this.post();
    const content = this.inlineReplyContent().trim();
    if (!post || !this.canSubmitInlineReply() || !content) return;

    this.submittingInlineReply.set(true);
    try {
      const created = await this.forumService.createReply({
        gameId: post.gameId,
        parentId: parent.$id,
        content,
      });

      void this.zCoinsService.applyInput('engaged').catch(() => undefined);

      const nextDepth = Math.min(3, (parent.depth ?? 1) + 1);
      const newReply = this.buildLocalReplyItem(
        created,
        post,
        nextDepth,
        parent.$id,
      );

      this.requestGeneration += 1;
      this.nestedReplies.update((map) => {
        const existing = map[parent.$id];
        const prevItems = existing?.items ?? [];
        return {
          ...map,
          [parent.$id]: {
            items: [
              ...prevItems.filter((item) => item.$id !== newReply.$id),
              newReply,
            ],
            page: existing?.page ?? 1,
            total: (existing?.total ?? 0) + 1,
            hasMore: existing?.hasMore ?? false,
            loading: false,
            hidden: false,
          },
        };
      });

      this.incrementItemReplyCount(parent.$id, 1);
      this.cancelInlineReply();
      this.notification.show({
        message: 'Resposta publicada!',
        type: 'success',
      });
    } catch (error) {
      this.notification.show({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível publicar sua resposta.',
        type: 'error',
      });
    } finally {
      this.submittingInlineReply.set(false);
    }
  }

  startEdit(item: ForumPostItem | ForumReplyItem): void {
    if (!this.canManage(item)) return;
    this.replyingToId.set(null);
    this.editingId.set(item.$id);
    this.editTitle.set(item.parentId ? '' : item.title);
    this.editContent.set(item.content);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editTitle.set('');
    this.editContent.set('');
  }

  canSaveEdit(isRootPost: boolean): boolean {
    if (this.savingEdit()) return false;
    const textLen = this.editTextLength();
    const maxLen = isRootPost ? 8000 : 4000;
    if (textLen < 3 || textLen > maxLen) return false;
    if (isRootPost) {
      const titleLen = this.editTitle().trim().length;
      if (titleLen < 3 || titleLen > 255) return false;
    }
    return true;
  }

  async saveEdit(
    event: Event,
    item: ForumPostItem | ForumReplyItem,
  ): Promise<void> {
    event.preventDefault();
    const isRoot = !item.parentId;
    if (!this.canSaveEdit(isRoot)) return;

    const payload: { title?: string; content: string } = {
      content: this.editContent().trim(),
    };
    if (isRoot) {
      payload.title = this.editTitle().trim();
    }

    this.savingEdit.set(true);
    try {
      const updated = await this.forumService.updateComment(item.$id, payload);
      const nextContent = updated.content ?? payload.content;
      const nextTitle = isRoot
        ? (updated.title ?? payload.title ?? item.title)
        : '';
      const nextSlug = isRoot ? (updated.slug ?? item.slug) : '';

      if (isRoot) {
        this.post.update((current) =>
          current
            ? {
                ...current,
                title: nextTitle,
                slug: nextSlug,
                content: nextContent,
                excerpt: this.extractPlainText(nextContent).slice(0, 240),
                $updatedAt: updated.$updatedAt ?? new Date().toISOString(),
              }
            : null,
        );
        if (nextSlug && nextSlug !== this.slug()) {
          void this.router.navigate(['/forum', nextSlug], {
            replaceUrl: true,
            queryParamsHandling: 'preserve',
          });
        }
      } else {
        this.updateReplyInTree(item.$id, (reply) => ({
          ...reply,
          content: nextContent,
          excerpt: this.extractPlainText(nextContent).slice(0, 240),
          $updatedAt: updated.$updatedAt ?? new Date().toISOString(),
        }));
      }

      this.cancelEdit();
      this.notification.show({
        message: isRoot ? 'Publicação atualizada!' : 'Resposta atualizada!',
        type: 'success',
      });
    } catch (error) {
      this.notification.show({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar as alterações.',
        type: 'error',
      });
    } finally {
      this.savingEdit.set(false);
    }
  }

  async deleteItem(item: ForumPostItem | ForumReplyItem): Promise<void> {
    if (!this.canManage(item) || this.deletingIds().has(item.$id)) return;
    const isRoot = !item.parentId;
    const confirmationMessage = isRoot
      ? 'Deseja realmente excluir esta publicação e todas as respostas?'
      : 'Deseja realmente excluir esta resposta?';
    if (this.isBrowser && !confirm(confirmationMessage)) return;

    this.deletingIds.update((set) => new Set(set).add(item.$id));
    try {
      await this.forumService.deleteComment(item.$id);
      if (isRoot) {
        this.notification.show({
          message: 'Publicação excluída.',
          type: 'success',
        });
        void this.router.navigate(['/forum']);
        return;
      }

      this.removeReplyFromTree(item);
      this.notification.show({
        message: 'Resposta excluída.',
        type: 'success',
      });
    } catch (error) {
      this.notification.show({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível excluir.',
        type: 'error',
      });
    } finally {
      this.deletingIds.update((set) => {
        const next = new Set(set);
        next.delete(item.$id);
        return next;
      });
    }
  }

  async voteItem(
    item: ForumPostItem | ForumReplyItem,
    operation: 'up' | 'down',
  ): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      this.notification.show({
        message: 'Entre na sua conta para votar.',
        type: 'info',
      });
      return;
    }
    if (this.votingIds().has(item.$id)) return;

    const prevVote = item.viewerVote;
    const nextVote = prevVote === operation ? null : operation;
    const prevVoteCount = item.voteCount ?? 0;

    let delta = 0;
    if (!prevVote) {
      delta = operation === 'up' ? 1 : -1;
    } else if (prevVote === operation) {
      delta = operation === 'up' ? -1 : 1;
    } else {
      delta = operation === 'up' ? 2 : -2;
    }

    const optimisticCount = Math.max(0, prevVoteCount + delta);
    this.votingIds.update((set) => new Set(set).add(item.$id));
    this.applyVoteToItem(item.$id, optimisticCount, nextVote);

    try {
      const result = await this.forumService.voteComment(item.$id, nextVote);
      this.applyVoteToItem(item.$id, result.voteCount, result.viewerVote);
    } catch {
      this.applyVoteToItem(item.$id, prevVoteCount, prevVote);
      this.notification.show({
        message: 'Não foi possível registrar seu voto.',
        type: 'error',
      });
    } finally {
      this.votingIds.update((set) => {
        const next = new Set(set);
        next.delete(item.$id);
        return next;
      });
    }
  }

  async sharePost(): Promise<void> {
    const post = this.post();
    if (!post || !this.isBrowser) return;

    const url = this.seo.toAbsoluteUrl(`/forum/${post.slug}`);
    try {
      await navigator.clipboard.writeText(url);
      this.notification.show({
        message: 'Link da discussão copiado!',
        type: 'success',
      });
    } catch {
      this.notification.show({
        message: 'Não foi possível copiar o link.',
        type: 'error',
      });
    }
  }

  private loadPost(
    slugOrId: string,
    commentId: string | null,
    sort: ForumSort,
    viewer: string,
  ): Promise<void> {
    return this.runAsSsrTask(async () => {
      const generation = ++this.requestGeneration;
      this.loading.set(true);
      this.error.set(false);

      try {
        const detail = await this.forumService.getPostBySlugOrId(slugOrId, {
          commentId,
          sort,
        });

        if (generation !== this.requestGeneration) return;

        if (!detail) {
          void this.router.navigate(['/404'], { replaceUrl: true });
          return;
        }

        const resolvedCommentId =
          commentId ??
          detail.focusedThread?.targetCommentId ??
          detail.focusedThread?.targetId ??
          null;
        this.loadedPostKey = `${detail.post.$id}:${sort}:${viewer}:${resolvedCommentId ?? ''}`;

        this.post.set(detail.post);
        this.replies.set(detail.replies.items);
        this.repliesPage.set(detail.replies.page);
        this.repliesTotal.set(detail.replies.total);
        this.repliesHasMore.set(detail.replies.hasMore);

        const initialNested: Record<string, NestedReplyBucket> = {};
        if (detail.focusedThread?.repliesByParent) {
          for (const [parentId, items] of Object.entries(
            detail.focusedThread.repliesByParent,
          )) {
            if (parentId === detail.post.$id) {
              this.replies.update((curr) => this.mergeItems(curr, items));
              continue;
            }
            initialNested[parentId] = {
              items,
              page: 1,
              total: items.length,
              hasMore: false,
              loading: false,
              hidden: false,
            };
          }
        } else if (detail.focusedThread?.repliesByParentId) {
          for (const [parentId, pageData] of Object.entries(
            detail.focusedThread.repliesByParentId,
          )) {
            if (parentId === detail.post.$id) {
              this.replies.update((curr) =>
                this.mergeItems(curr, pageData.items),
              );
              continue;
            }
            initialNested[parentId] = {
              items: pageData.items,
              page: pageData.page,
              total: pageData.total,
              hasMore: pageData.hasMore,
              loading: false,
              hidden: false,
            };
          }
        }
        this.nestedReplies.set(initialNested);

        const seoMeta = detail.seo ??
          detail.post.seo ?? {
            indexable: true,
            canonicalSlug: detail.post.slug || detail.post.$id,
            description: detail.post.excerpt || detail.post.title,
          };

        this.applyPostSeo(detail, seoMeta);

        if (seoMeta.canonicalSlug && slugOrId !== seoMeta.canonicalSlug) {
          void this.router.navigate(['/forum', seoMeta.canonicalSlug], {
            replaceUrl: true,
            queryParams: resolvedCommentId
              ? { commentId: resolvedCommentId }
              : {},
          });
        }

        if (resolvedCommentId) {
          this.scheduleScrollAndHighlight(resolvedCommentId, generation);
        }
      } catch {
        if (generation === this.requestGeneration) {
          this.error.set(true);
        }
      } finally {
        if (generation === this.requestGeneration) {
          this.loading.set(false);
        }
      }
    });
  }

  private applyPostSeo(
    detail: ForumPostDetailResponse,
    seo: { indexable: boolean; canonicalSlug: string; description: string },
  ): void {
    const { post, replies } = detail;
    const gameName = post.game?.name;
    const title = gameName
      ? `${post.title} — ${gameName} | Fórum Zetho`
      : `${post.title} — Fórum Zetho`;
    const canonicalPath = `/forum/${seo.canonicalSlug}`;
    const canonicalUrl = this.seo.toAbsoluteUrl(canonicalPath);

    this.seo.apply({
      title,
      description: seo.description,
      canonical: canonicalPath,
      robots: seo.indexable ? 'index,follow' : 'noindex,follow',
      ogType: 'article',
      ogImage: post.game?.coverUrl ?? undefined,
    });

    const authorSchema = post.author?.gamertag
      ? {
          '@type': 'Person',
          name: post.author.gamertag,
          url: this.seo.toAbsoluteUrl(`/player/${post.author.gamertag}`),
        }
      : {
          '@type': 'Organization',
          name: 'Zetho',
          url: this.seo.toAbsoluteUrl('/'),
        };

    const breadcrumbItems: Record<string, unknown>[] = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: this.seo.toAbsoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Fórum',
        item: this.seo.toAbsoluteUrl('/forum'),
      },
    ];

    if (post.game?.name && post.game?.slug) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: post.game.name,
        item: this.seo.toAbsoluteUrl(`/jogo/${post.game.slug}`),
      });
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 4,
        name: post.title,
        item: canonicalUrl,
      });
    } else {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonicalUrl,
      });
    }

    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
       '@id': canonicalUrl,
      headline: post.title,
      text: post.excerpt || seo.description,
      articleBody: post.excerpt || seo.description,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      datePublished: post.$createdAt,
      dateModified: post.$updatedAt || post.$createdAt,
      inLanguage: 'pt-BR',
      isAccessibleForFree: true,
      author: authorSchema,
      publisher: {
        '@type': 'Organization',
        name: 'Zetho',
        url: this.seo.toAbsoluteUrl('/'),
      },
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: post.voteCount ?? 0,
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: post.replyCount ?? replies.total ?? 0,
        },
      ],
      commentCount: post.replyCount ?? replies.total ?? 0,
      comment: replies.items.slice(0, 10).map((reply) => ({
        '@type': 'Comment',
        text: reply.excerpt,
        datePublished: reply.$createdAt,
        upvoteCount: reply.voteCount ?? 0,
        author: reply.author?.gamertag
          ? {
              '@type': 'Person',
              name: reply.author.gamertag,
              url: this.seo.toAbsoluteUrl(`/player/${reply.author.gamertag}`),
            }
          : {
              '@type': 'Organization',
              name: 'Zetho',
            },
      })),
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
    };

    if (post.game) {
      jsonLd['about'] = {
        '@type': 'VideoGame',
        name: post.game.name,
        url: this.seo.toAbsoluteUrl(`/jogo/${post.game.slug}`),
        ...(post.game.coverUrl ? { image: post.game.coverUrl } : {}),
      };
    }

    this.seo.setJsonLd('forum-post', jsonLd);
  }

  private scheduleScrollAndHighlight(
    targetCommentId: string,
    generation: number,
  ): void {
    if (!this.isBrowser) return;

    this.clearScheduledHighlight();
    this.highlightedCommentId.set(targetCommentId);

    const browserWindow = this.document.defaultView;
    if (!browserWindow) return;

    this.scrollFrameId = browserWindow.requestAnimationFrame(() => {
      this.scrollFrameId = null;
      if (generation !== this.requestGeneration) return;

      this.document
        .getElementById(`comment-${targetCommentId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      this.highlightTimer = setTimeout(() => {
        if (generation === this.requestGeneration) {
          this.highlightedCommentId.set(null);
        }
        this.highlightTimer = null;
      }, 4500);
    });
  }

  private clearScheduledHighlight(): void {
    const browserWindow = this.document.defaultView;
    if (this.scrollFrameId !== null && browserWindow) {
      browserWindow.cancelAnimationFrame(this.scrollFrameId);
    }
    this.scrollFrameId = null;

    if (this.highlightTimer !== null) {
      clearTimeout(this.highlightTimer);
    }
    this.highlightTimer = null;
  }

  private buildLocalReplyItem(
    created: {
      $id: string;
      $createdAt?: string;
      $updatedAt?: string;
      content: string;
      voteCount?: number;
      replyCount?: number;
      depth?: number;
    },
    post: ForumPostItem,
    depth: number,
    parentId: string,
  ): ForumReplyItem {
    const profile = this.authStore.profile();
    return {
      $id: created.$id,
      $createdAt: created.$createdAt ?? new Date().toISOString(),
      $updatedAt: created.$updatedAt,
      gameId: post.gameId,
      title: '',
      slug: '',
      content: created.content,
      excerpt: this.extractPlainText(created.content).slice(0, 240),
      parentId,
      depth: created.depth ?? depth,
      voteCount: created.voteCount ?? 0,
      replyCount: created.replyCount ?? 0,
      viewerVote: null,
      author: profile
        ? {
            $id: profile.$id,
            gamertag: profile.gamertag,
            avatarUrl: profile.avatarUrl ?? null,
          }
        : null,
      game: null,
    };
  }

  private applyVoteToItem(
    commentId: string,
    voteCount: number,
    viewerVote: 'up' | 'down' | null,
  ): void {
    if (this.post()?.$id === commentId) {
      this.post.update((current) =>
        current ? { ...current, voteCount, viewerVote } : null,
      );
      return;
    }

    this.updateReplyInTree(commentId, (reply) => ({
      ...reply,
      voteCount,
      viewerVote,
    }));
  }

  private updateReplyInTree(
    commentId: string,
    updater: (reply: ForumReplyItem) => ForumReplyItem,
  ): void {
    this.replies.update((list) =>
      list.map((item) => (item.$id === commentId ? updater(item) : item)),
    );

    this.nestedReplies.update((map) => {
      const next: Record<string, NestedReplyBucket> = {};
      for (const [parentId, bucket] of Object.entries(map)) {
        next[parentId] = {
          ...bucket,
          items: bucket.items.map((item) =>
            item.$id === commentId ? updater(item) : item,
          ),
        };
      }
      return next;
    });
  }

  private incrementItemReplyCount(commentId: string, delta: number): void {
    if (this.post()?.$id === commentId) {
      this.post.update((current) =>
        current
          ? {
              ...current,
              replyCount: Math.max(0, (current.replyCount ?? 0) + delta),
            }
          : null,
      );
      return;
    }

    this.updateReplyInTree(commentId, (reply) => ({
      ...reply,
      replyCount: Math.max(0, (reply.replyCount ?? 0) + delta),
    }));
  }

  private removeReplyFromTree(target: ForumReplyItem): void {
    const removedIds = new Set<string>([target.$id]);
    const collectDescendants = (parentId: string) => {
      const children = this.nestedReplies()[parentId]?.items ?? [];
      for (const child of children) {
        removedIds.add(child.$id);
        collectDescendants(child.$id);
      }
    };
    collectDescendants(target.$id);

    this.replies.update((list) =>
      list.filter((item) => !removedIds.has(item.$id)),
    );

    this.nestedReplies.update((map) => {
      const next: Record<string, NestedReplyBucket> = {};
      for (const [parentId, bucket] of Object.entries(map)) {
        if (removedIds.has(parentId)) continue;
        const filtered = bucket.items.filter(
          (item) => !removedIds.has(item.$id),
        );
        next[parentId] = {
          ...bucket,
          items: filtered,
          total:
            parentId === target.parentId
              ? Math.max(0, bucket.total - 1)
              : bucket.total,
        };
      }
      return next;
    });

    if (target.parentId) {
      this.incrementItemReplyCount(target.parentId, -1);
      if (target.parentId === this.post()?.$id) {
        this.repliesTotal.update((total) => Math.max(0, total - 1));
      }
    }
  }

  private mergeItems(
    current: ForumReplyItem[],
    incoming: ForumReplyItem[],
  ): ForumReplyItem[] {
    const ids = new Set(current.map((item) => item.$id));
    return [...current, ...incoming.filter((item) => !ids.has(item.$id))];
  }

  private extractPlainText(value: string): string {
    return value
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
