import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiGameCard } from '../../shared/ui/game-card/game-card';
import { UiLoading } from '../../shared/ui/loading';
import { GameRow } from '../../types';
import { ZStatsService } from '../../core/zStats/zStats.service';
import { GameSearchController } from '../../core/games/gameSearch.controller';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [UiGameCard, UiLoading],
  templateUrl: './search.html',
})
export class Search {
  private searchController = inject(GameSearchController);
  private route = inject(ActivatedRoute);
  private zStatsService = inject(ZStatsService);

  query = signal<string>('');
  searchGame = signal<ReturnType<GameSearchController['create']> | null>(null);
  popularGames = signal<GameRow[]>([]);

  constructor() {
    effect(() => {
      const q = this.query();

      if (!q) {
        this.searchGame.set(null);
        return;
      }

      const controller = this.searchController.create(q);
      this.searchGame.set(controller);
    });
  }

  async ngOnInit() {
    const popularGames = sessionStorage.getItem('popularGames');

    if (!popularGames) {
      const games = await this.zStatsService.getTrendingGames({ total: 8 });
      sessionStorage.setItem('popularGames', JSON.stringify(games));
      this.popularGames.set(games);
    } else {
      this.popularGames.set(JSON.parse(popularGames));
    }

    this.route.queryParams.subscribe((params) => {
      if (params['q']) this.query.set(params['q']);
    });
  }
}
