import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthStore } from '../../../auth/auth.store';
import { GameService } from '../../../games/games.service';
import { FeedReviewContent } from '../../../ratings/components/feed-review-content';
import { NotificationStore } from '../../../system/notifications/notification.store';
import { SeoService } from '../../../system/seo/seo.service';
import { ZCoinsService } from '../../../zCoins/zcoins.service';
import {
  UiCombobox,
  UiComboboxOption,
  UiComboboxSearch,
} from '../../../../shared/ui/combobox/combobox';
import { InfiniteScrollDirective } from '../../../../shared/ui/infinite-scroll';
import { UiLoading } from '../../../../shared/ui/loading';
import { RichTextEditorComponent } from '../../../../shared/ui/rich-text-editor/rich-text-editor';
import { UiSkeleton } from '../../../../shared/ui/skeleton';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { createSsrTaskRunner } from '../../../../utils/ssr-task';
import { ForumService } from '../../forum.service';
import {
  ForumGameSummary,
  ForumPostItem,
  ForumSort,
} from '../../forum.types';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-forum-feed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    FeedReviewContent,
    InfiniteScrollDirective,
    RelativeTimePipe,
    RichTextEditorComponent,
    UiCombobox,
    UiLoading,
    UiSkeleton,
  ],
  templateUrl: './forum-feed.html',
})
export class ForumFeedPage implements OnDestroy {
  readonly authStore = inject(AuthStore);
  private readonly forumService = inject(ForumService);
  private readonly gameService = inject(GameService);
  private readonly notification = inject(NotificationStore);
  private readonly seo = inject(SeoService);
  private readonly zCoinsService = inject(ZCoinsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly runAsSsrTask = createSsrTaskRunner();
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly searchedGamesById = new Map<string, ForumGameSummary>();
  private requestGeneration = 0;

  readonly posts = signal<ForumPostItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly hasMore = computed(() => this.page() < this.totalPages());

  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly loadMoreError = signal(false);

  readonly sort = signal<ForumSort>('recent');
  readonly activeGame = signal<ForumGameSummary | null>(null);
  readonly filterGameOptions = signal<UiComboboxOption[]>([]);

  readonly composerOpen = signal(false);
  readonly submittingPost = signal(false);
  readonly postTitle = signal('');
  readonly postContent = signal('');
  readonly selectedPostGames = signal<UiComboboxOption[]>([]);

  readonly votingPostIds = signal<Set<string>>(new Set());

  readonly gameSlugParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('jogo'))),
    { initialValue: null },
  );

  readonly createParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('criar'))),
    { initialValue: null },
  );

  private readonly viewerKey = computed(() =>
    JSON.stringify([
      this.authStore.user()?.$id ?? null,
      this.authStore.profile()?.$id ?? null,
    ]),
  );

  readonly postPlainTextLength = computed(() =>
    this.extractPlainTextLength(this.postContent()),
  );

  readonly canSubmitPost = computed(() => {
    const titleLen = this.postTitle().trim().length;
    const textLen = this.postPlainTextLength();
    const hasGame = this.selectedPostGames().length > 0;
    return (
      !this.submittingPost() &&
      hasGame &&
      titleLen >= 3 &&
      titleLen <= 255 &&
      textLen >= 3 &&
      textLen <= 8000
    );
  });

  readonly searchGames: UiComboboxSearch = async (query) => {
    const response = await this.gameService.searchGame(query, { pageSize: 6 });
    return response.rows.map((game) => {
      const summary: ForumGameSummary = {
        $id: game.$id,
        name: game.name,
        slug: game.slug,
        coverUrl: game.coverUrl ?? null,
        releaseYear: game.releaseYear ? String(game.releaseYear) : null,
      };
      this.searchedGamesById.set(game.$id, summary);
      return {
        id: game.$id,
        label: game.name,
        description: game.releaseYear ? String(game.releaseYear) : undefined,
        imageUrl: game.coverUrl,
        imageShape: 'cover',
      };
    });
  };

  constructor() {
    this.applyFeedSeo(null);

    effect(() => {
      const selected = this.filterGameOptions()[0];
      if (!selected) return;

      const gameSummary = this.searchedGamesById.get(selected.id);
      untracked(() => {
        this.filterGameOptions.set([]);
        if (gameSummary?.slug) {
          void this.router.navigate(['/forum'], {
            queryParams: { jogo: gameSummary.slug },
          });
        } else {
          this.activeGame.set({
            $id: selected.id,
            name: selected.label,
            slug: '',
            coverUrl: selected.imageUrl ?? null,
            releaseYear: selected.description ?? null,
          });
          void this.loadInitial();
        }
      });
    });

    effect(() => {
      const gameSlug = this.gameSlugParam();
      const sort = this.sort();
      this.viewerKey();

      untracked(() => {
        void this.loadInitial({ gameSlug, sort });
      });
    });

    effect(() => {
      const shouldOpenCreate = this.createParam() === '1';
      const isAuthed = this.authStore.isAuthenticated();
      if (shouldOpenCreate && isAuthed) {
        untracked(() => {
          this.openComposer();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.seo.clearJsonLd('forum-feed');
  }

  setSort(nextSort: ForumSort): void {
    if (this.sort() === nextSort) return;
    this.sort.set(nextSort);
  }

  clearGameFilter(): void {
    this.activeGame.set(null);
    this.filterGameOptions.set([]);
    if (this.gameSlugParam()) {
      void this.router.navigate(['/forum'], { queryParams: {} });
    } else {
      void this.loadInitial({ gameSlug: null, sort: this.sort() });
    }
  }

  toggleComposer(): void {
    if (this.composerOpen()) {
      this.closeComposer();
    } else {
      this.openComposer();
    }
  }

  openComposer(): void {
    const active = this.activeGame();
    if (active && this.selectedPostGames().length === 0) {
      this.selectedPostGames.set([
        {
          id: active.$id,
          label: active.name,
          description: active.releaseYear ?? undefined,
          imageUrl: active.coverUrl ?? undefined,
          imageShape: 'cover',
        },
      ]);
    }
    this.composerOpen.set(true);
  }

  closeComposer(): void {
    this.composerOpen.set(false);
  }

  onEditorContentChange(html: string): void {
    this.postContent.set(html);
  }

  async submitPost(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSubmitPost()) return;

    const selectedGame = this.selectedPostGames()[0];
    const title = this.postTitle().trim();
    const content = this.postContent().trim();
    if (!selectedGame || !title || !content) return;

    this.submittingPost.set(true);
    try {
      const created = await this.forumService.createPost({
        gameId: selectedGame.id,
        title,
        content,
      });

      void this.zCoinsService.applyInput('engaged').catch(() => undefined);

      const profile = this.authStore.profile();
      const gameSummary =
        this.searchedGamesById.get(selectedGame.id) ??
        (this.activeGame()?.$id === selectedGame.id ? this.activeGame() : null) ?? {
          $id: selectedGame.id,
          name: selectedGame.label,
          slug: '',
          coverUrl: selectedGame.imageUrl ?? null,
          releaseYear: selectedGame.description ?? null,
        };

      const optimisticPost: ForumPostItem = {
        $id: created.$id,
        $createdAt: created.$createdAt ?? new Date().toISOString(),
        $updatedAt: created.$updatedAt,
        gameId: selectedGame.id,
        title: created.title ?? title,
        slug: created.slug ?? created.$id,
        content: created.content ?? content,
        excerpt: this.extractPlainText(created.content ?? content).slice(0, 240),
        parentId: null,
        depth: 0,
        voteCount: created.voteCount ?? 0,
        replyCount: 0,
        viewerVote: null,
        author: profile
          ? {
              $id: profile.$id,
              gamertag: profile.gamertag,
              avatarUrl: profile.avatarUrl ?? null,
            }
          : null,
        game: gameSummary,
      };

      this.requestGeneration += 1;
      const activeFilterGame = this.activeGame();
      if (!activeFilterGame || activeFilterGame.$id === selectedGame.id) {
        this.posts.update((current) => [
          optimisticPost,
          ...current.filter((item) => item.$id !== optimisticPost.$id),
        ]);
        this.total.update((count) => count + 1);
      }

      this.postTitle.set('');
      this.postContent.set('');
      this.composerOpen.set(false);
      this.notification.show({
        message: 'Publicação criada no Fórum!',
        type: 'success',
      });
    } catch (error) {
      this.notification.show({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível criar a publicação.',
        type: 'error',
      });
    } finally {
      this.submittingPost.set(false);
    }
  }

  async votePost(post: ForumPostItem, operation: 'up' | 'down'): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      this.notification.show({
        message: 'Entre na sua conta para votar nas discussões.',
        type: 'info',
      });
      return;
    }
    if (this.votingPostIds().has(post.$id)) return;

    const prevVote = post.viewerVote;
    const nextVote = prevVote === operation ? null : operation;
    const prevVoteCount = post.voteCount ?? 0;

    let delta = 0;
    if (!prevVote) {
      delta = operation === 'up' ? 1 : -1;
    } else if (prevVote === operation) {
      delta = operation === 'up' ? -1 : 1;
    } else {
      delta = operation === 'up' ? 2 : -2;
    }

    this.votingPostIds.update((set) => new Set(set).add(post.$id));
    this.posts.update((items) =>
      items.map((item) =>
        item.$id === post.$id
          ? {
              ...item,
              viewerVote: nextVote,
              voteCount: Math.max(0, prevVoteCount + delta),
            }
          : item,
      ),
    );

    try {
      const result = await this.forumService.voteComment(post.$id, nextVote);
      this.posts.update((items) =>
        items.map((item) =>
          item.$id === post.$id
            ? {
                ...item,
                viewerVote: result.viewerVote,
                voteCount: result.voteCount,
              }
            : item,
        ),
      );
    } catch {
      this.posts.update((items) =>
        items.map((item) =>
          item.$id === post.$id
            ? {
                ...item,
                viewerVote: prevVote,
                voteCount: prevVoteCount,
              }
            : item,
        ),
      );
      this.notification.show({
        message: 'Não foi possível registrar seu voto.',
        type: 'error',
      });
    } finally {
      this.votingPostIds.update((set) => {
        const next = new Set(set);
        next.delete(post.$id);
        return next;
      });
    }
  }

  retry(): void {
    void this.loadInitial({
      gameSlug: this.gameSlugParam(),
      sort: this.sort(),
    });
  }

  async loadMore(): Promise<void> {
    if (
      this.loading() ||
      this.loadingMore() ||
      this.loadMoreError() ||
      !this.hasMore()
    ) {
      return;
    }

    const generation = this.requestGeneration;
    const nextPage = this.page() + 1;
    const gameSlug = this.gameSlugParam();
    const activeGameId = !gameSlug ? this.activeGame()?.$id : undefined;
    const sort = this.sort();

    this.loadingMore.set(true);
    this.loadMoreError.set(false);

    try {
      const response = await this.forumService.getPosts({
        page: nextPage,
        pageSize: PAGE_SIZE,
        gameSlug: gameSlug ?? undefined,
        gameId: activeGameId,
        sort,
      });

      if (generation !== this.requestGeneration) return;

      this.posts.update((current) => this.mergePosts(current, response.items));
      this.page.set(response.page);
      this.totalPages.set(response.totalPages);
      this.total.set(response.total);
    } catch {
      if (generation === this.requestGeneration) {
        this.loadMoreError.set(true);
      }
    } finally {
      if (generation === this.requestGeneration) {
        this.loadingMore.set(false);
      }
    }
  }

  retryLoadMore(): void {
    this.loadMoreError.set(false);
    void this.loadMore();
  }

  authorInitial(post: ForumPostItem): string {
    return post.author?.gamertag?.trim().charAt(0).toUpperCase() || 'Z';
  }

  private loadInitial(
    opts: { gameSlug?: string | null; sort?: ForumSort } = {},
  ): Promise<void> {
    return this.runAsSsrTask(async () => {
      const generation = ++this.requestGeneration;
      const gameSlug =
        opts.gameSlug !== undefined ? opts.gameSlug : this.gameSlugParam();
      const activeGameId = !gameSlug ? this.activeGame()?.$id : undefined;
      const sort = opts.sort ?? this.sort();

      this.loading.set(true);
      this.error.set(false);
      this.loadMoreError.set(false);

      try {
        const response = await this.forumService.getPosts({
          page: 1,
          pageSize: PAGE_SIZE,
          gameSlug: gameSlug ?? undefined,
          gameId: activeGameId,
          sort,
        });

        if (generation !== this.requestGeneration) return;

        this.posts.set(response.items);
        this.total.set(response.total);
        this.page.set(response.page);
        this.totalPages.set(response.totalPages);

        const resolvedGame = response.game ?? response.selectedGame ?? null;

        if (gameSlug) {
          this.activeGame.set(resolvedGame);
          if (resolvedGame && this.selectedPostGames().length === 0) {
            this.selectedPostGames.set([
              {
                id: resolvedGame.$id,
                label: resolvedGame.name,
                description: resolvedGame.releaseYear ?? undefined,
                imageUrl: resolvedGame.coverUrl ?? undefined,
                imageShape: 'cover',
              },
            ]);
          }
        } else if (!activeGameId) {
          this.activeGame.set(null);
        }

        this.applyFeedSeo(resolvedGame);
      } catch {
        if (generation !== this.requestGeneration) return;
        this.posts.set([]);
        this.error.set(true);
      } finally {
        if (generation === this.requestGeneration) {
          this.loading.set(false);
        }
      }
    });
  }

  private applyFeedSeo(game: ForumGameSummary | null): void {
    const title = game
      ? `Fórum de ${game.name} — Discussões na Comunidade | Zetho`
      : 'Fórum da Comunidade — Discussões sobre Jogos | Zetho';
    const description = game
      ? `Participe das discussões, teorias e dicas da comunidade sobre ${game.name} no Fórum do Zetho.`
      : 'Debata teorias, dicas, análises e experiências sobre seus jogos favoritos no Fórum da comunidade Zetho.';
    const canonical = game?.slug ? `/forum?jogo=${encodeURIComponent(game.slug)}` : '/forum';

    this.seo.apply({
      title,
      description,
      canonical: '/forum',
      robots: game ? 'noindex,follow' : 'index,follow',
      ogType: 'website',
      ogImage: game?.coverUrl ?? undefined,
    });

    this.seo.setJsonLd('forum-feed', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: this.seo.toAbsoluteUrl(canonical),
      inLanguage: 'pt-BR',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Zetho',
        url: this.seo.toAbsoluteUrl('/'),
      },
    });
  }

  private mergePosts(
    current: ForumPostItem[],
    incoming: ForumPostItem[],
  ): ForumPostItem[] {
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

  private extractPlainTextLength(value: string): number {
    return this.extractPlainText(value).length;
  }
}
