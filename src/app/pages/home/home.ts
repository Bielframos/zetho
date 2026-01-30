import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../core/auth/user.store';
import { GameRow } from '../../types';
import { ZEntryService } from '../../core/zEntries/zEntries.service';
import { UserProfileService } from '../../core/userProfiles/userProfile.service';
import { ZStatsService } from '../../core/zStats/zStats.service';
import { UiGameCard } from '../../shared/ui/atoms/game-card/game-card';
import { UiLoading } from '../../shared/ui/molecules/loading';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, UiLoading, UiGameCard],
  templateUrl: './home.html',
})
export class Home {
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
