import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiSkeleton } from '../../../../shared/ui/skeleton';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { GameRow } from '../../../../types';
import { AuthStore } from '../../../auth/auth.store';
import { GameService } from '../../../games/games.service';
import { UpperCasePipe } from '@angular/common';
import {
  CommentVoteState,
  ConnectionsListActivityItem,
  DashboardFeedItem,
  DashboardService,
  ListSocialState,
  SuggestedConnection,
  TrendingListItem,
} from '../../dashboard.service';
import { ConnectionsService } from '../../../connections/connections.service';
import { NotificationStore } from '../../../notifications/notification.store';
import { appwrite } from '../../../appwrite/appwrite.client';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    RelativeTimePipe,
    UiGameCard,
    UiLoading,
    UiSkeleton,
    UpperCasePipe,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  authStore = inject(AuthStore);
  gameService = inject(GameService);
  dashboardService = inject(DashboardService);
  private connectionsService = inject(ConnectionsService);
  private notification = inject(NotificationStore);

  suggestedConnections = signal<SuggestedConnection[]>([]);
  loadingSuggestions = signal(false);
  followingIds = signal<Set<string>>(new Set());

  upcomingHypedGames = signal<GameRow[]>([]);
  loadingUpcomingHyped = signal(false);

  feed = signal<DashboardFeedItem[]>([]);
  loadingFeed = signal(false);
  feedPage = signal(1);
  hasMoreFeed = signal(false);
  loadingMoreFeed = signal(false);
  updatingCommentVoteIds = signal<Set<string>>(new Set());

  trendingLists = signal<TrendingListItem[]>([]);
  loadingTrendingLists = signal(false);
  updatingListIds = signal<Set<string>>(new Set());

  connectionsListActivity = signal<ConnectionsListActivityItem[]>([]);
  loadingListActivity = signal(false);
  listActivityPage = signal(1);
  hasMoreListActivity = signal(false);
  loadingMoreListActivity = signal(false);

  get profile() {
    return this.authStore.profile();
  }

  constructor() {
    void this.loadUpcomingHypedGames();
    void this.loadFeed();
    void this.loadConnectionsListActivity();
    void this.loadTrendingLists();
    void this.loadSuggestedConnections();
  }

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

  private async loadConnectionsListActivity() {
    this.loadingListActivity.set(true);
    try {
      const res = await this.dashboardService.getConnectionsListActivity(1, 12);
      this.connectionsListActivity.set(res.items);
      this.hasMoreListActivity.set(res.hasMore);
      this.listActivityPage.set(1);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingListActivity.set(false);
    }
  }

  async loadMoreListActivity() {
    if (this.loadingMoreListActivity() || !this.hasMoreListActivity()) return;

    this.loadingMoreListActivity.set(true);
    const nextPage = this.listActivityPage() + 1;

    try {
      const res = await this.dashboardService.getConnectionsListActivity(
        nextPage,
        12,
      );
      this.connectionsListActivity.update((prev) => [...prev, ...res.items]);
      this.hasMoreListActivity.set(res.hasMore);
      this.listActivityPage.set(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingMoreListActivity.set(false);
    }
  }

  private async loadFeed() {
    this.loadingFeed.set(true);
    try {
      const res = await this.dashboardService.getPersonalFeed(1, 12);
      this.feed.set(res.items);
      this.hasMoreFeed.set(res.hasMore);
      this.feedPage.set(1);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingFeed.set(false);
    }
  }

  async loadMoreFeed() {
    if (this.loadingMoreFeed() || !this.hasMoreFeed()) return;

    this.loadingMoreFeed.set(true);
    const nextPage = this.feedPage() + 1;

    try {
      const res = await this.dashboardService.getPersonalFeed(nextPage, 12);
      this.feed.update((prev) => [...prev, ...res.items]);
      this.hasMoreFeed.set(res.hasMore);
      this.feedPage.set(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingMoreFeed.set(false);
    }
  }

  private async loadTrendingLists() {
    this.loadingTrendingLists.set(true);

    try {
      const response = await this.dashboardService.getTrendingLists(12);
      this.trendingLists.set(response.items);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingTrendingLists.set(false);
    }
  }

  private async loadUpcomingHypedGames() {
    this.loadingUpcomingHyped.set(true);

    try {
      const response = await this.gameService.getUpcomingHypedGames({
        pageSize: 8,
        fingerprint: this.profile?.fingerprint,
      });

      this.upcomingHypedGames.set(response.rows);
    } finally {
      this.loadingUpcomingHyped.set(false);
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

  listLink(list: {
    userProfile?: { gamertag: string } | null;
    author?: { gamertag: string } | null;
    slug?: string;
  }) {
    const gamertag = list.userProfile?.gamertag ?? list.author?.gamertag;
    return gamertag && list.slug
      ? ['/player', gamertag, 'listas', list.slug]
      : null;
  }

  async toggleListLike(listId: string) {
    await this.toggleTrendingList(listId, 'like');
  }

  async toggleListSave(listId: string) {
    await this.toggleTrendingList(listId, 'save');
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

  private async toggleTrendingList(listId: string, action: 'like' | 'save') {
    if (this.updatingListIds().has(`${action}:${listId}`)) return;

    const previous = this.trendingLists();
    this.updatingListIds.update((ids) =>
      new Set(ids).add(`${action}:${listId}`),
    );
    this.applyOptimisticListState(listId, action);

    try {
      const state =
        action === 'like'
          ? await this.dashboardService.toggleListLike(listId)
          : await this.dashboardService.toggleListSave(listId);
      this.applyListState(listId, state);
    } catch (e) {
      console.error(e);
      this.trendingLists.set(previous);
    } finally {
      this.updatingListIds.update((ids) => {
        const next = new Set(ids);
        next.delete(`${action}:${listId}`);
        return next;
      });
    }
  }

  private applyOptimisticListState(listId: string, action: 'like' | 'save') {
    this.trendingLists.update((lists) =>
      lists.map((list) => {
        if (list.$id !== listId) return list;

        if (action === 'like') {
          const likedByMe = !list.likedByMe;
          return {
            ...list,
            likedByMe,
            likeCount: Math.max(0, list.likeCount + (likedByMe ? 1 : -1)),
          };
        }

        const savedByMe = !list.savedByMe;
        return {
          ...list,
          savedByMe,
          saveCount: Math.max(0, list.saveCount + (savedByMe ? 1 : -1)),
        };
      }),
    );
  }

  private applyListState(listId: string, state: ListSocialState) {
    this.trendingLists.update((lists) =>
      lists.map((list) =>
        list.$id === listId
          ? {
              ...list,
              likedByMe: state.likedByMe,
              savedByMe: state.savedByMe,
              likeCount: state.likeCount,
              saveCount: state.saveCount,
            }
          : list,
      ),
    );
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
}
