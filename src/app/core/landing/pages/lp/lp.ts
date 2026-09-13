import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { ZEntryService } from '../../../zEntries/zEntries.service';
import { UserProfileService } from '../../../userProfiles/userProfile.service';
import { ZStatsService } from '../../../zStats/zStats.service';
import { GameRow } from '../../../games/game.types';
import { AppSearchInput } from '../../../../shared/app/search-input/search-input';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, UiLoading, UiGameCard, AppSearchInput],
  templateUrl: './lp.html',
})
export class LandingPage {
  platformStats = signal<{ zEntryCount: number; profileCount: number } | null>(
    null,
  );
  trendingGames = signal<GameRow[]>([]);

  onSearch(query: string) {
    void this.router.navigate(['/buscar'], { queryParams: { q: query } });
  }

  constructor(
    private router: Router,
    private authStore: AuthStore,
    private zEntryService: ZEntryService,
    private userProfileService: UserProfileService,
    private zStatsService: ZStatsService,
  ) {
    // Lido no construtor, `isAuthenticated()` reflete o estado antes de a
    // sessão ser restaurada — o usuário logado ficaria preso na landing. Com o
    // effect, o redirecionamento acontece quando o sinal de fato mudar.
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        void this.router.navigateByUrl('/dashboard');
      }
    });

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
