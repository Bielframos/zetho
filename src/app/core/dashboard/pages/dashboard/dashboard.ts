import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppUserLists } from '../../../../shared/app/user-lists/user-lists';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { GameRow } from '../../../../types';
import { AuthStore } from '../../../auth/auth.store';
import { GameService } from '../../../games/games.service';
import { ListsController } from '../../../lists/lists.controller';
import { UpperCasePipe } from '@angular/common';
import { DashboardService, CommunityHighlight } from '../../dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    RelativeTimePipe,
    AppUserLists,
    UiGameCard,
    UiLoading,
    UpperCasePipe,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  authStore = inject(AuthStore);
  controller = inject(ListsController);
  gameService = inject(GameService);
  dashboardService = inject(DashboardService);

  upcomingHypedGames = signal<GameRow[]>([]);
  loadingUpcomingHyped = signal(false);

  highlights = signal<CommunityHighlight[]>([]);
  loadingHighlights = signal(false);
  highlightsPage = signal(1);
  hasMoreHighlights = signal(false);
  loadingMoreHighlights = signal(false);

  get profile() {
    return this.authStore.profile();
  }

  constructor() {
    void this.controller.loadLists({
      ownerFingerprint: this.profile!.fingerprint,
    });

    void this.loadUpcomingHypedGames();
    void this.loadHighlights();
  }

  private async loadHighlights() {
    this.loadingHighlights.set(true);
    try {
      const res = await this.dashboardService.getCommunityHighlights(1, 12);
      this.highlights.set(res.items);
      this.hasMoreHighlights.set(res.hasMore);
      this.highlightsPage.set(1);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingHighlights.set(false);
    }
  }

  async loadMoreHighlights() {
    if (this.loadingMoreHighlights() || !this.hasMoreHighlights()) return;

    this.loadingMoreHighlights.set(true);
    const nextPage = this.highlightsPage() + 1;

    try {
      const res = await this.dashboardService.getCommunityHighlights(
        nextPage,
        12,
      );
      this.highlights.update((prev) => [...prev, ...res.items]);
      this.hasMoreHighlights.set(res.hasMore);
      this.highlightsPage.set(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingMoreHighlights.set(false);
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
}
