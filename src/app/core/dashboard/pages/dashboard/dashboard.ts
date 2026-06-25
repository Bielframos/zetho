import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { GameRow } from '../../../../types';
import { AuthStore } from '../../../auth/auth.store';
import { GameService } from '../../../games/games.service';
import { UpperCasePipe } from '@angular/common';
import {
  DashboardFeedItem,
  DashboardService,
  ListSocialState,
  TrendingListItem,
} from '../../dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RelativeTimePipe, UiGameCard, UiLoading, UpperCasePipe],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  authStore = inject(AuthStore);
  gameService = inject(GameService);
  dashboardService = inject(DashboardService);

  upcomingHypedGames = signal<GameRow[]>([]);
  loadingUpcomingHyped = signal(false);

  feed = signal<DashboardFeedItem[]>([]);
  loadingFeed = signal(false);
  feedPage = signal(1);
  hasMoreFeed = signal(false);
  loadingMoreFeed = signal(false);

  trendingLists = signal<TrendingListItem[]>([]);
  loadingTrendingLists = signal(false);
  updatingListIds = signal<Set<string>>(new Set());

  get profile() {
    return this.authStore.profile();
  }

  constructor() {
    void this.loadUpcomingHypedGames();
    void this.loadFeed();
    void this.loadTrendingLists();
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
}
