import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppUserLists } from '../../../../shared/app/user-lists/user-lists';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { ShortNumberPipe } from '../../../../utils/pipes';
import { GameRow } from '../../../../types';
import { AuthStore } from '../../../auth/auth.store';
import { GameService } from '../../../games/games.service';
import { ListsController } from '../../../lists/lists.controller';
import { DASHBOARD_ENTRIES } from '../../dashboard.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ShortNumberPipe, AppUserLists, UiGameCard, UiLoading],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  authStore = inject(AuthStore);
  controller = inject(ListsController);
  gameService = inject(GameService);
  upcomingHypedGames = signal<GameRow[]>([]);
  loadingUpcomingHyped = signal(false);

  get profile() {
    return this.authStore.profile();
  }
  entries = DASHBOARD_ENTRIES;

  constructor() {
    void this.controller.loadLists({
      ownerFingerprint: this.profile!.fingerprint,
    });

    void this.loadUpcomingHypedGames();
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
