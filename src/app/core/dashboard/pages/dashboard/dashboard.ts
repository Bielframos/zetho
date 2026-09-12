import { FeedReviewContent } from '../../../ratings/components/feed-review-content';
import { FeedReviewVotes } from '../../../ratings/components/feed-review-votes';
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
import { NotificationStore } from '../../../system/notifications/notification.store';
import { appwrite } from '../../../../shared/infra/appwrite/appwrite.client';

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
    FeedReviewContent,
    FeedReviewVotes,
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

  feed = signal<DashboardFeedItem[]>([]);
  activeFeedScope = signal<FeedScope>('connections');
  loadingFeed = signal(false);
  feedPage = signal(1);
  hasMoreFeed = signal(false);
  loadingMoreFeed = signal(false);
  updatingCommentVoteIds = signal<Set<string>>(new Set());
  updatingEntryLikeIds = signal<Set<string>>(new Set());
  selectedEntry = signal<DashboardFeedItem | null>(null);
  selectedComment = signal<DashboardFeedItem | null>(null);
  expandedCommentIds = signal<Set<string>>(new Set());

  suggestedConnections = signal<SuggestedConnection[]>([]);
  loadingSuggestions = signal(false);
  followingIds = signal<Set<string>>(new Set());

  // Sentinela observada para o carregamento infinito.
  private sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;
  private feedRequestId = 0;

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

  updateReviewVoteCount(reviewId: string, voteCount: number) {
    this.feed.update((items) =>
      items.map((item) =>
        item.type === 'rating' && item.$id === reviewId
          ? { ...item, voteCount }
          : item,
      ),
    );
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
    this.selectedComment.set(null);
    this.expandedCommentIds.set(new Set());
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

  latestCovers(list: { title?: string; coverImageUrls?: string[]; latestAdditions?: string[] }) {
    if (list.coverImageUrls && list.coverImageUrls.length > 0) {
      return list.coverImageUrls.slice(0, 3).map((url) => ({ gameCoverUrl: url, gameName: list.title ?? '' }));
    }
    return (list.latestAdditions ?? [])
      .map((item) => {
        try {
          return JSON.parse(item) as { gameName: string; gameCoverUrl: string };
        } catch {
          return null;
        }
      })
      .filter((item): item is { gameName: string; gameCoverUrl: string } => item !== null)
      .slice(0, 3);
  }

  listLink(list: { userProfile?: { gamertag: string } | null; slug?: string }) {
    const gamertag = list.userProfile?.gamertag;
    return gamertag && list.slug
      ? ['/player', gamertag, 'listas', list.slug]
      : null;
  }

  // ------------------------------------------------------------------
  // Comment text expand/collapse (just truncation)
  // ------------------------------------------------------------------
  isCommentExpanded(commentId: string) {
    return this.expandedCommentIds().has(commentId);
  }

  toggleCommentExpand(commentId: string) {
    this.expandedCommentIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }

  commentReplyCount(item: DashboardFeedItem) {
    return (item as DashboardFeedItem & { replyCount?: number }).replyCount ?? 0;
  }

  // ------------------------------------------------------------------
  // Comment drawer (for comment-type feed items)
  // ------------------------------------------------------------------
  openCommentDrawer(item: DashboardFeedItem) {
    this.selectedComment.set(item);
  }

  updateCommentReplyCount(commentId: string, delta: number) {
    this.feed.update((items) =>
      items.map((item) =>
        item.type === 'comment' && item.$id === commentId
          ? {
              ...item,
              replyCount: Math.max(
                0,
                ((item as any).replyCount ?? 0) + delta,
              ),
            }
          : item,
      ),
    );
    const selected =
      this.feed().find((item) => item.$id === commentId) ?? null;
    this.selectedComment.set(selected);
  }

  // ------------------------------------------------------------------
  // Comment votes
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // Entry likes & comments drawer
  // ------------------------------------------------------------------
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
