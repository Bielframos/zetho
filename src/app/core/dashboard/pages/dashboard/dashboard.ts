import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiFeedGame } from './feed-game';
import { EntryCommentsDrawer } from './entry-comments-drawer';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiSkeleton } from '../../../../shared/ui/skeleton';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { AuthStore } from '../../../auth/auth.store';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import {
  CommentVoteState,
  DashboardFeedItem,
  DashboardService,
  FeedScope,
  FeedGameStatus,
  SuggestedConnection,
} from '../../dashboard.service';
import { ConnectionsService } from '../../../connections/connections.service';
import { NotificationStore } from '../../../notifications/notification.store';
import { appwrite } from '../../../appwrite/appwrite.client';
import {
  CommentService,
  CommentThread,
} from '../../../comments/comments.service';
import { CommentRow } from '../../../../types';

type InlineThreadComment = Pick<
  CommentRow,
  '$id' | '$createdAt' | 'content' | 'userProfile' | 'parentId' | 'replyCount'
> & {
  optimistic?: boolean;
};

type InlineCommentThread = {
  parent: InlineThreadComment;
  replies: InlineThreadComment[];
  totalReplies: number;
};

type CommentFeedItem = DashboardFeedItem & { replyCount?: number };

const STATUS_LABELS: Record<FeedGameStatus, string> = {
  completed: 'zerou',
  backlog: 'adicionou à biblioteca',
  playing: 'começou a jogar',
  dropped: 'abandonou',
};

const STATUS_ICONS: Record<FeedGameStatus, string> = {
  completed: 'ph-fill ph-trophy',
  backlog: 'ph-fill ph-books',
  playing: 'ph-fill ph-game-controller',
  dropped: 'ph-fill ph-x-circle',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    RelativeTimePipe,
    NgTemplateOutlet,
    UiFeedGame,
    EntryCommentsDrawer,
    UiLoading,
    UiSkeleton,
    UpperCasePipe,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnDestroy {
  authStore = inject(AuthStore);
  dashboardService = inject(DashboardService);
  private connectionsService = inject(ConnectionsService);
  private notification = inject(NotificationStore);
  private commentService = inject(CommentService);

  feed = signal<DashboardFeedItem[]>([]);
  activeFeedScope = signal<FeedScope>('connections');
  loadingFeed = signal(false);
  feedPage = signal(1);
  hasMoreFeed = signal(false);
  loadingMoreFeed = signal(false);
  updatingCommentVoteIds = signal<Set<string>>(new Set());
  updatingEntryLikeIds = signal<Set<string>>(new Set());
  selectedEntry = signal<DashboardFeedItem | null>(null);
  expandedCommentThreadIds = signal<Set<string>>(new Set());
  openCommentComposerIds = signal<Set<string>>(new Set());
  loadingCommentThreadIds = signal<Set<string>>(new Set());
  commentThreads = signal<Record<string, InlineCommentThread>>({});
  commentThreadErrors = signal<Record<string, string>>({});
  commentReplyErrors = signal<Record<string, string>>({});
  commentReplyDrafts = signal<Record<string, string>>({});
  submittingCommentReplyIds = signal<Set<string>>(new Set());

  suggestedConnections = signal<SuggestedConnection[]>([]);
  loadingSuggestions = signal(false);
  followingIds = signal<Set<string>>(new Set());

  // Sentinela observada para o carregamento infinito.
  private sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;
  private feedRequestId = 0;
  private nextCommentThreadRequestId = 0;
  private commentThreadRequestIds = new Map<string, number>();
  private nextCommentReplyRequestId = 0;
  private commentReplyRequestIds = new Map<string, number>();

  get profile() {
    return this.authStore.profile();
  }

  constructor() {
    void this.loadFeed();
    void this.loadSuggestedConnections();

    afterNextRender(() => this.setupInfiniteScroll());
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.commentThreadRequestIds.clear();
    this.commentReplyRequestIds.clear();
  }

  private setupInfiniteScroll() {
    const el = this.sentinel()?.nativeElement;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void this.loadMoreFeed();
      },
      { rootMargin: '600px' },
    );
    this.observer.observe(el);
  }

  statusLabel(status?: FeedGameStatus) {
    return status ? STATUS_LABELS[status] : '';
  }

  statusIcon(status?: FeedGameStatus) {
    return status ? STATUS_ICONS[status] : 'ph ph-game-controller';
  }

  // ------------------------------------------------------------------
  // Feed
  // ------------------------------------------------------------------
  private async loadFeed() {
    const requestId = ++this.feedRequestId;
    const scope = this.activeFeedScope();
    this.loadingFeed.set(true);
    try {
      const res = await this.dashboardService.getPersonalFeed(1, 12, scope);
      if (requestId !== this.feedRequestId) return;
      this.feed.set(res.items);
      this.hasMoreFeed.set(res.hasMore);
      this.feedPage.set(1);
    } catch (e) {
      console.error(e);
    } finally {
      if (requestId === this.feedRequestId) this.loadingFeed.set(false);
    }
  }

  setFeedScope(scope: FeedScope) {
    if (scope === this.activeFeedScope()) return;
    this.activeFeedScope.set(scope);
    this.feed.set([]);
    this.hasMoreFeed.set(false);
    this.feedPage.set(1);
    this.selectedEntry.set(null);
    this.resetInlineCommentState();
    void this.loadFeed();
  }

  async loadMoreFeed() {
    if (this.loadingMoreFeed() || !this.hasMoreFeed()) return;

    this.loadingMoreFeed.set(true);
    const nextPage = this.feedPage() + 1;
    const requestId = this.feedRequestId;
    const scope = this.activeFeedScope();

    try {
      const res = await this.dashboardService.getPersonalFeed(
        nextPage,
        12,
        scope,
      );
      if (
        requestId !== this.feedRequestId ||
        scope !== this.activeFeedScope()
      ) {
        return;
      }
      this.feed.update((prev) => [...prev, ...res.items]);
      this.hasMoreFeed.set(res.hasMore);
      this.feedPage.set(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      if (requestId === this.feedRequestId) this.loadingMoreFeed.set(false);
    }
  }

  latestCovers(list: { latestAdditions?: string[] }) {
    return (list.latestAdditions ?? [])
      .map((item) => {
        try {
          return JSON.parse(item) as { gameName: string; gameCoverUrl: string };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  listLink(list: { userProfile?: { gamertag: string } | null; slug?: string }) {
    const gamertag = list.userProfile?.gamertag;
    return gamertag && list.slug
      ? ['/player', gamertag, 'listas', list.slug]
      : null;
  }

  isCommentThreadExpanded(commentId: string) {
    return this.expandedCommentThreadIds().has(commentId);
  }

  isCommentThreadLoading(commentId: string) {
    return this.loadingCommentThreadIds().has(commentId);
  }

  isCommentComposerOpen(commentId: string) {
    return this.openCommentComposerIds().has(commentId);
  }

  isCommentReplySubmitting(commentId: string) {
    return this.submittingCommentReplyIds().has(commentId);
  }

  commentThread(commentId: string) {
    return this.commentThreads()[commentId] ?? null;
  }

  commentThreadError(commentId: string) {
    return this.commentThreadErrors()[commentId] ?? '';
  }

  commentReplyError(commentId: string) {
    return this.commentReplyErrors()[commentId] ?? '';
  }

  commentReplyDraft(commentId: string) {
    return this.commentReplyDrafts()[commentId] ?? '';
  }

  commentReplyCount(item: DashboardFeedItem) {
    return (item as CommentFeedItem).replyCount ?? 0;
  }

  commentThreadReplies(item: DashboardFeedItem) {
    return (
      this.commentThread(item.$id)?.replies.filter(
        (reply) => reply.$id !== item.$id,
      ) ?? []
    );
  }

  setCommentReplyDraft(commentId: string, value: string) {
    this.commentReplyDrafts.update((drafts) => ({
      ...drafts,
      [commentId]: value,
    }));
    this.clearCommentReplyError(commentId);
  }

  toggleCommentComposer(item: DashboardFeedItem) {
    if (item.type !== 'comment') return;

    this.openCommentComposerIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(item.$id)) {
        next.delete(item.$id);
      } else {
        next.add(item.$id);
      }
      return next;
    });
  }

  async toggleCommentThread(item: DashboardFeedItem) {
    if (item.type !== 'comment') return;

    if (this.isCommentThreadExpanded(item.$id)) {
      this.expandedCommentThreadIds.update((ids) => {
        const next = new Set(ids);
        next.delete(item.$id);
        return next;
      });
      return;
    }

    this.expandedCommentThreadIds.update((ids) => new Set(ids).add(item.$id));
    if (!this.commentThread(item.$id)) {
      await this.loadCommentThread(item);
    }
  }

  async loadCommentThread(item: DashboardFeedItem) {
    if (item.type !== 'comment' || this.isCommentThreadLoading(item.$id)) {
      return this.commentThread(item.$id);
    }

    const gameId = this.commentGameId(item);
    if (!gameId) {
      this.setCommentThreadError(
        item.$id,
        'Não foi possível identificar o jogo deste comentário.',
      );
      return null;
    }

    const requestId = ++this.nextCommentThreadRequestId;
    this.commentThreadRequestIds.set(item.$id, requestId);
    this.loadingCommentThreadIds.update((ids) => new Set(ids).add(item.$id));
    this.clearCommentThreadError(item.$id);

    try {
      const thread = await this.commentService.getCommentThread(
        gameId,
        item.$id,
      );
      if (this.commentThreadRequestIds.get(item.$id) !== requestId) return null;
      if (!thread) {
        this.setCommentThreadError(
          item.$id,
          'Não foi possível carregar esta conversa.',
        );
        return null;
      }

      const inlineThread = this.toInlineCommentThread(thread);
      this.commentThreads.update((threads) => ({
        ...threads,
        [item.$id]: inlineThread,
      }));
      return inlineThread;
    } catch (error) {
      console.error(error);
      if (this.commentThreadRequestIds.get(item.$id) === requestId) {
        this.setCommentThreadError(
          item.$id,
          'Não foi possível carregar esta conversa.',
        );
      }
      return null;
    } finally {
      if (this.commentThreadRequestIds.get(item.$id) === requestId) {
        this.commentThreadRequestIds.delete(item.$id);
        this.loadingCommentThreadIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.$id);
          return next;
        });
      }
    }
  }

  async submitCommentReply(item: DashboardFeedItem) {
    if (item.type !== 'comment' || this.isCommentReplySubmitting(item.$id)) {
      return;
    }

    const content = this.commentReplyDraft(item.$id).trim();
    if (!content) return;

    const profile = this.authStore.profile();
    const gameId = this.commentGameId(item);
    if (!profile || !gameId) {
      this.setCommentReplyError(
        item.$id,
        profile
          ? 'Não foi possível identificar o jogo deste comentário.'
          : 'Entre na sua conta para responder.',
      );
      return;
    }

    const previousThread = this.commentThread(item.$id);
    const previousReplyCount = this.commentReplyCount(item);
    const optimisticId = `optimistic-${item.$id}-${Date.now()}`;
    const optimisticReply: InlineThreadComment = {
      $id: optimisticId,
      $createdAt: new Date().toISOString(),
      content,
      userProfile: profile,
      parentId: item.$id,
      replyCount: 0,
      optimistic: true,
    };
    const requestId = ++this.nextCommentReplyRequestId;
    this.commentReplyRequestIds.set(item.$id, requestId);

    this.submittingCommentReplyIds.update((ids) => new Set(ids).add(item.$id));
    this.commentReplyDrafts.update((drafts) => ({
      ...drafts,
      [item.$id]: '',
    }));
    this.clearCommentReplyError(item.$id);
    if (previousThread && !this.isReplyFeedItem(item)) {
      this.commentThreads.update((threads) => ({
        ...threads,
        [item.$id]: {
          ...previousThread,
          replies: [...previousThread.replies, optimisticReply],
          totalReplies: previousThread.totalReplies + 1,
        },
      }));
    }
    this.setFeedCommentReplyCount(item.$id, previousReplyCount + 1);

    try {
      const created = await this.commentService.createComment({
        gameId,
        userProfileId: profile.$id,
        content,
        parentId: item.$id,
        depth:
          item.parentComment && item.parentComment.$id !== item.$id ? 2 : 1,
      });
      if (this.commentReplyRequestIds.get(item.$id) !== requestId) return;
      this.commentThreads.update((threads) => {
        const current = threads[item.$id];
        if (!current) return threads;
        return {
          ...threads,
          [item.$id]: {
            ...current,
            replies: current.replies.map((reply) =>
              reply.$id === optimisticId ? created : reply,
            ),
          },
        };
      });
      this.openCommentComposerIds.update((ids) => {
        const next = new Set(ids);
        next.delete(item.$id);
        return next;
      });
    } catch (error) {
      console.error(error);
      if (this.commentReplyRequestIds.get(item.$id) !== requestId) return;
      if (previousThread && !this.isReplyFeedItem(item)) {
        this.commentThreads.update((threads) => ({
          ...threads,
          [item.$id]: previousThread,
        }));
      }
      this.setFeedCommentReplyCount(item.$id, previousReplyCount);
      this.commentReplyDrafts.update((drafts) => ({
        ...drafts,
        [item.$id]: content,
      }));
      this.setCommentReplyError(
        item.$id,
        'Não foi possível enviar sua resposta.',
      );
    } finally {
      if (this.commentReplyRequestIds.get(item.$id) === requestId) {
        this.commentReplyRequestIds.delete(item.$id);
        this.submittingCommentReplyIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.$id);
          return next;
        });
      }
    }
  }

  async voteFeedComment(commentId: string, operation: 'up' | 'down') {
    if (this.updatingCommentVoteIds().has(commentId)) return;

    const previous = this.feed();
    this.updatingCommentVoteIds.update((ids) => new Set(ids).add(commentId));
    this.applyOptimisticCommentVote(commentId, operation);

    try {
      const state = await this.dashboardService.voteComment(
        commentId,
        operation,
      );
      this.applyCommentVoteState(commentId, state);
    } catch (e) {
      console.error(e);
      this.feed.set(previous);
    } finally {
      this.updatingCommentVoteIds.update((ids) => {
        const next = new Set(ids);
        next.delete(commentId);
        return next;
      });
    }
  }

  private applyOptimisticCommentVote(
    commentId: string,
    operation: 'up' | 'down',
  ) {
    this.feed.update((items) =>
      items.map((item) => {
        if (item.type !== 'comment' || item.$id !== commentId) return item;

        const currentVote = item.viewerVote ?? null;
        let delta = 0;
        let viewerVote: 'up' | 'down' | null = operation;

        if (!currentVote) {
          delta = operation === 'up' ? 1 : (item.voteCount ?? 0) > 0 ? -1 : 0;
        } else if (currentVote === operation) {
          delta =
            operation === 'up'
              ? (item.voteCount ?? 0) > 0
                ? -1
                : 0
              : (item.voteCount ?? 0) > 0
                ? 1
                : 0;
          viewerVote = null;
        } else {
          delta =
            operation === 'up'
              ? (item.voteCount ?? 0) > 0
                ? 2
                : 1
              : (item.voteCount ?? 0) > 1
                ? -2
                : (item.voteCount ?? 0) > 0
                  ? -1
                  : 0;
        }

        return {
          ...item,
          viewerVote,
          voteCount: Math.max(0, (item.voteCount ?? 0) + delta),
        };
      }),
    );
  }

  private applyCommentVoteState(commentId: string, state: CommentVoteState) {
    this.feed.update((items) =>
      items.map((item) =>
        item.type === 'comment' && item.$id === commentId
          ? {
              ...item,
              voteCount: state.newVoteCount,
              viewerVote: state.viewerVote,
            }
          : item,
      ),
    );
  }

  async toggleEntryLike(entryId: string) {
    if (this.updatingEntryLikeIds().has(entryId)) return;
    const previous = this.feed().find((item) => item.$id === entryId);
    if (!previous) return;

    this.updatingEntryLikeIds.update((ids) => new Set(ids).add(entryId));
    this.feed.update((items) =>
      items.map((item) =>
        item.$id === entryId && item.type === 'status'
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likeCount: Math.max(
                0,
                (item.likeCount ?? 0) + (item.likedByMe ? -1 : 1),
              ),
            }
          : item,
      ),
    );

    try {
      const state = await this.dashboardService.toggleEntryLike(entryId);
      this.feed.update((items) =>
        items.map((item) =>
          item.$id === entryId
            ? {
                ...item,
                likedByMe: state.likedByMe,
                likeCount: state.likeCount,
                commentCount: state.commentCount,
              }
            : item,
        ),
      );
    } catch (error) {
      this.feed.update((items) =>
        items.map((item) => (item.$id === entryId ? previous : item)),
      );
      this.notification.show({
        message: 'Não foi possível atualizar a curtida.',
        type: 'error',
      });
    } finally {
      this.updatingEntryLikeIds.update((ids) => {
        const next = new Set(ids);
        next.delete(entryId);
        return next;
      });
    }
  }

  openEntryComments(item: DashboardFeedItem) {
    this.selectedEntry.set(item);
  }

  updateEntryCommentCount(entryId: string, delta: number) {
    this.feed.update((items) =>
      items.map((item) =>
        item.$id === entryId
          ? {
              ...item,
              commentCount: Math.max(0, (item.commentCount ?? 0) + delta),
            }
          : item,
      ),
    );
    const selected = this.feed().find((item) => item.$id === entryId) ?? null;
    this.selectedEntry.set(selected);
  }

  private commentGameId(item: DashboardFeedItem) {
    return item.gameId ?? item.game?.$id ?? null;
  }

  private isReplyFeedItem(item: DashboardFeedItem) {
    return !!item.parentComment && item.parentComment.$id !== item.$id;
  }

  private toInlineCommentThread(thread: CommentThread): InlineCommentThread {
    return {
      parent: thread.parent,
      replies: thread.replies,
      totalReplies: thread.totalReplies,
    };
  }

  private setFeedCommentReplyCount(commentId: string, replyCount: number) {
    this.feed.update((items) =>
      items.map((item) =>
        item.type === 'comment' && item.$id === commentId
          ? { ...item, replyCount: Math.max(0, replyCount) }
          : item,
      ),
    );
  }

  private setCommentThreadError(commentId: string, message: string) {
    this.commentThreadErrors.update((errors) => ({
      ...errors,
      [commentId]: message,
    }));
  }

  private clearCommentThreadError(commentId: string) {
    this.commentThreadErrors.update((errors) => {
      if (!(commentId in errors)) return errors;
      const next = { ...errors };
      delete next[commentId];
      return next;
    });
  }

  private setCommentReplyError(commentId: string, message: string) {
    this.commentReplyErrors.update((errors) => ({
      ...errors,
      [commentId]: message,
    }));
  }

  private clearCommentReplyError(commentId: string) {
    this.commentReplyErrors.update((errors) => {
      if (!(commentId in errors)) return errors;
      const next = { ...errors };
      delete next[commentId];
      return next;
    });
  }

  private resetInlineCommentState() {
    this.commentThreadRequestIds.clear();
    this.commentReplyRequestIds.clear();
    this.expandedCommentThreadIds.set(new Set());
    this.openCommentComposerIds.set(new Set());
    this.loadingCommentThreadIds.set(new Set());
    this.commentThreads.set({});
    this.commentThreadErrors.set({});
    this.commentReplyErrors.set({});
    this.commentReplyDrafts.set({});
    this.submittingCommentReplyIds.set(new Set());
  }

  // ------------------------------------------------------------------
  // Sugestões de conexão (estado vazio)
  // ------------------------------------------------------------------
  private async loadSuggestedConnections() {
    this.loadingSuggestions.set(true);
    try {
      const res = await this.dashboardService.getSuggestedConnections(6);
      this.suggestedConnections.set(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingSuggestions.set(false);
    }
  }

  suggestionAvatar(item: SuggestedConnection) {
    if (item.avatarUrl) return item.avatarUrl;
    return appwrite.avatars.getInitials({
      name: item.gamertag,
      width: 80,
      height: 80,
      background: '3e63dd',
    });
  }

  async followSuggestion(item: SuggestedConnection) {
    const myProfileId = this.profile?.$id;
    if (!myProfileId || this.followingIds().has(item.$id)) return;

    this.followingIds.update((set) => new Set(set).add(item.$id));
    try {
      await this.connectionsService.followOrUnfollow(item.$id, myProfileId);
      this.suggestedConnections.update((list) =>
        list.filter((c) => c.$id !== item.$id),
      );
      this.notification.show({
        message: `Você seguiu ${item.gamertag}!`,
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      this.followingIds.update((set) => {
        const next = new Set(set);
        next.delete(item.$id);
        return next;
      });
      this.notification.show({
        message: 'Não foi possível seguir agora.',
        type: 'error',
      });
    }
  }
}
