import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiProfileCard } from '../../../../shared/ui/profile-card';
import { GameRow } from '../../../games/game.types';
import { GenresCacheService } from '../../../games/genres-cache.service';
import { SeoService } from '../../../seo/seo.service';
import { ZStatsService } from '../../../zStats/zStats.service';
import { SearchController } from '../../search.controller';

function buildYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear; y >= 1970; y--) {
    years.push(String(y));
  }
  return years;
}

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [UiGameCard, UiLoading, NgClass, UiProfileCard],
  templateUrl: './search.html',
})
export class SearchPage {
  readonly minSearchLength = 3;
  readonly years = buildYearOptions();

  private searchController = inject(SearchController);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zStatsService = inject(ZStatsService);
  private seo = inject(SeoService);
  private genresCache = inject(GenresCacheService);

  readonly genres = this.genresCache.options;

  query = signal<string>('');
  genre = signal<string>('');
  year = signal<string>('');
  view = signal<string>('');
  searchType = signal<'games' | 'players'>('games');
  popularGames = signal<GameRow[]>([]);

  normalizedQuery = computed(() => this.query().trim());

  hasActiveFilters = computed(() => !!this.genre() || !!this.year());
  isHypedUpcomingView = computed(() => this.view() === 'hyped-upcoming');

  canSearch = computed(
    () =>
      this.isHypedUpcomingView() ||
      this.normalizedQuery().length >= this.minSearchLength ||
      this.hasActiveFilters(),
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
    await this.genresCache.ensureLoaded();

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
      this.genre.set(params['genre'] ?? '');
      this.year.set(params['year'] ?? '');
      this.view.set(params['view'] ?? '');

      if (this.isHypedUpcomingView()) {
        this.searchType.set('games');
      }

      const q = this.normalizedQuery();
      const filters = {
        genre: this.genre() || undefined,
        year: this.year() || undefined,
        view: this.isHypedUpcomingView()
          ? ('hyped-upcoming' as const)
          : undefined,
      };
      const hasFilters = !!filters.genre || !!filters.year;
      const hasSpecialView = filters.view === 'hyped-upcoming';

      if (q.length < this.minSearchLength && !hasFilters && !hasSpecialView) {
        this.searchController.reset();
        return;
      }

      this.searchController.search(q, filters);
    });
  }

  setSearchType(type: 'games' | 'players') {
    if (this.isHypedUpcomingView() && type === 'players') {
      return;
    }

    this.searchType.set(type);
  }

  onFilterChange(type: 'genre' | 'year', value: string) {
    const params: Record<string, string> = {};

    const q = this.query();
    if (q) params['q'] = q;

    const newGenre = type === 'genre' ? value : this.genre();
    const newYear = type === 'year' ? value : this.year();
    const view = this.view();

    if (newGenre) params['genre'] = newGenre;
    if (newYear) params['year'] = newYear;
    if (view) params['view'] = view;

    this.router.navigate(['/buscar'], { queryParams: params });
  }

  clearFilters() {
    const params: Record<string, string> = {};
    const q = this.query();
    const view = this.view();
    if (q) params['q'] = q;
    if (view) params['view'] = view;

    this.router.navigate(['/buscar'], { queryParams: params });
  }
}
