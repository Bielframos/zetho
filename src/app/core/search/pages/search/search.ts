import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiProfileCard } from '../../../../shared/ui/profile-card';
import { GameRow } from '../../../games/game.types';
import { SeoService } from '../../../seo/seo.service';
import { ZStatsService } from '../../../zStats/zStats.service';
import { SearchController } from '../../search.controller';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [UiGameCard, UiLoading, NgClass, UiProfileCard],
  templateUrl: './search.html',
})
export class SearchPage {
  readonly minSearchLength = 3;

  private searchController = inject(SearchController);
  private route = inject(ActivatedRoute);
  private zStatsService = inject(ZStatsService);
  private seo = inject(SeoService);

  query = signal<string>('');
  searchType = signal<'games' | 'players'>('games');
  popularGames = signal<GameRow[]>([]);

  normalizedQuery = computed(() => this.query().trim());

  canSearch = computed(
    () => this.normalizedQuery().length >= this.minSearchLength,
  );

  activeSearch = computed(() => {
    return this.searchType() === 'games'
      ? this.searchController.games
      : this.searchController.players;
  });

  gameResults = computed(() => this.searchController.games.results());
  playerResults = computed(() => this.searchController.players.results());

  constructor() {
    this.seo.apply({
      title: 'Buscar jogos — Zetho',
      description:
        'Busque jogos por nome, descubra títulos populares e encontre rapidamente o game que você procura no Zetho.',
      canonical: '/buscar',
      robots: 'noindex,follow',
      ogType: 'website',
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
      this.query.set(params['q'] ?? '');
      const q = this.normalizedQuery();

      if (q.length < this.minSearchLength) {
        this.searchController.reset();
        return;
      }

      this.searchController.search(q);
    });
  }

  setSearchType(type: 'games' | 'players') {
    this.searchType.set(type);
  }
}
