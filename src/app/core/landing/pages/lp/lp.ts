import { Component, effect, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { ZStatsService } from '../../../zStats/zStats.service';
import { GameRow } from '../../../games/game.types';
import { AppSearchInput } from '../../../../shared/app/search-input/search-input';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiSkeleton } from '../../../../shared/ui/skeleton';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, UiGameCard, UiSkeleton, AppSearchInput],
  templateUrl: './lp.html',
})
export class LandingPage {
  trendingGames = signal<GameRow[]>([]);
  loadingGames = signal(true);
  readonly previewEntries = [
    { label: 'Jogando', status: 'playing', icon: 'ph-game-controller' },
    { label: 'Zerei', status: 'completed', icon: 'ph-check-circle' },
    { label: 'Na biblioteca', status: 'backlog', icon: 'ph-books' },
  ] as const;

  onSearch(query: string) {
    void this.router.navigate(['/buscar'], { queryParams: { q: query } });
  }

  constructor(
    private router: Router,
    private authStore: AuthStore,
    private zStatsService: ZStatsService,
  ) {
    // A sessão pode ser restaurada depois da primeira renderização.
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        void this.router.navigateByUrl('/feed');
      }
    });
    void this.loadPreview();
  }

  private async loadPreview() {
    try {
      this.trendingGames.set(
        (await this.zStatsService.getTrendingGames({ total: 3 })).slice(0, 3),
      );
    } catch {
      // A estante ilustrativa permanece disponível sem o catálogo.
    } finally {
      this.loadingGames.set(false);
    }
  }
}
