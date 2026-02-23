import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { SearchController } from '../../search.controller';
import { ZStatsService } from '../../../zStats/zStats.service';
import { GameRow } from '../../../games/game.types';
import { SeoService } from '../../../seo/seo.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [UiGameCard, UiLoading],
  templateUrl: './search.html',
})
export class SearchPage {
  private searchController = inject(SearchController);
  private route = inject(ActivatedRoute);
  private zStatsService = inject(ZStatsService);
  private seo = inject(SeoService);

  query = signal<string>('');
  searchGame = signal<ReturnType<SearchController['create']> | null>(null);
  popularGames = signal<GameRow[]>([]);

  constructor() {
    this.seo.apply({
      title: 'Buscar jogos — Zetho',
      description:
        'Busque jogos por nome, descubra títulos populares e encontre rapidamente o game que você procura no Zetho.',
      canonical: '/buscar',
      robots: 'noindex,follow',
      ogType: 'website',
    });

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
