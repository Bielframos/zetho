import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../../auth/user.store';
import { ZEntryService } from '../../../zEntries/zEntries.service';
import { UserProfileService } from '../../../userProfiles/userProfile.service';
import { ZStatsService } from '../../../zStats/zStats.service';
import { GameRow } from '../../../games/game.types';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, UiLoading, UiGameCard],
  templateUrl: './lp.html',
})
export class LandingPage {
  platformStats = signal<{ zEntryCount: number; profileCount: number } | null>(
    null,
  );
  trendingGames = signal<GameRow[]>([]);

  constructor(
    private router: Router,
    private userStore: UserStore,
    private zEntryService: ZEntryService,
    private userProfileService: UserProfileService,
    private zStatsService: ZStatsService,
  ) {
    if (this.userStore.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
    }

    (async () => {
      try {
        const [zEntryCount, profileCount] = await Promise.all([
          this.zEntryService.getZEntryCount(),
          this.userProfileService.getProfileCount(),
        ]);

        this.platformStats.set({ zEntryCount, profileCount });
      } catch (e) {
        console.error(e);
      }

      try {
        const trending = await this.zStatsService.getTrendingGames();
        this.trendingGames.set(trending);
      } catch (e) {
        console.error(e);
      }
    })();
  }
}
