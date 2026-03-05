import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { appwrite } from '../../../appwrite/appwrite.client';
import { GameRow } from '../../../games/game.types';
import { SeoService } from '../../../seo/seo.service';
import { UserProfileRow } from '../../../userProfiles/userProfile.types';
import { ZStatsService } from '../../../zStats/zStats.service';
import { SearchController } from '../../search.controller';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [UiGameCard, UiLoading, NgClass, RouterLink],
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
  controller = signal<ReturnType<SearchController['create']> | null>(null);
  popularGames = signal<GameRow[]>([]);

  normalizedQuery = computed(() => this.query().trim());
  canSearch = computed(
    () => this.normalizedQuery().length >= this.minSearchLength,
  );

  activeSearch = computed(() => {
    const controller = this.controller();
    if (!controller) return null;

    return this.searchType() === 'games'
      ? controller.games
      : controller.players;
  });

  gameResults = computed(() => this.controller()?.games.results() ?? []);
  playerResults = computed(() => this.controller()?.players.results() ?? []);

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
      const q = this.normalizedQuery();

      if (q.length < this.minSearchLength) {
        this.controller.set(null);
        return;
      }

      const controller = this.searchController.create(q);
      this.controller.set(controller);
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
    });
  }

  setSearchType(type: 'games' | 'players') {
    this.searchType.set(type);
  }

  playerAvatar(profile: UserProfileRow) {
    if (profile.avatarUrl) return profile.avatarUrl;

    return appwrite.avatars.getInitials({
      name: profile.gamertag,
      width: 80,
      height: 80,
      background: '3e63dd',
    });
  }
}
