import { NgClass } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiProfileCard } from '../../../../shared/ui/profile-card';
import { GameRow } from '../../../games/game.types';
import { GenresCacheService } from '../../../games/genres-cache.service';
import { SeoService } from '../../../system/seo/seo.service';
import { ZStatsService } from '../../../zStats/zStats.service';
import { SearchController } from '../../search.controller';
import { AuthStore } from '../../../auth/auth.store';
import { safeSessionStorage } from '../../../../utils/platform-storage';

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
  imports: [UiGameCard, UiLoading, NgClass, UiProfileCard, ReactiveFormsModule],
  templateUrl: './search.html',
})
export class SearchPage {
  readonly authStore = inject(AuthStore);
  readonly minSearchLength = 3;
  readonly years = buildYearOptions();

  private searchController = inject(SearchController);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
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
  mobileSearchControl = new FormControl('', { nonNullable: true });

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

    this.mobileSearchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.onMobileSearchChange(value));
  }

  async ngOnInit() {
    await this.genresCache.ensureLoaded();

    const popularGames = safeSessionStorage.getItem('popularGames');

    if (!popularGames) {
      const games = await this.zStatsService.getTrendingGames({ total: 8 });
      safeSessionStorage.setItem('popularGames', JSON.stringify(games));
      this.popularGames.set(games);
    } else {
      this.popularGames.set(JSON.parse(popularGames));
    }

    this.route.queryParams.subscribe((params) => {
      this.query.set(params['q'] ?? '');
      this.genre.set(params['genre'] ?? '');
      this.year.set(params['year'] ?? '');
      this.view.set(params['view'] ?? '');
      this.mobileSearchControl.setValue(this.query(), { emitEvent: false });

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

  private onMobileSearchChange(value: string) {
    const q = value.trim();

    if (q.length > 0 && q.length < this.minSearchLength) {
      return;
    }

    this.router.navigate(['/buscar'], {
      queryParams: { q: q || null },
      queryParamsHandling: 'merge',
    });
  }
}
