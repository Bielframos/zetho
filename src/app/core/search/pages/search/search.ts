import { DOCUMENT } from '@angular/common';
import {
  UiSegmentedControl,
  UiSegmentOption,
} from '../../../../shared/ui/segmented-control';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiProfileCard } from '../../../../shared/ui/profile-card';
import { GameService } from '../../../games/games.service';
import {
  UiCombobox,
  UiComboboxOption,
} from '../../../../shared/ui/combobox/combobox';
import { UiSidebar } from '../../../../shared/ui/sidebar';
import { GenresCacheService } from '../../../games/genres-cache.service';
import { SeoService } from '../../../system/seo/seo.service';
import { SearchController } from '../../search.controller';
import { AuthStore } from '../../../auth/auth.store';

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
  imports: [
    UiGameCard,
    UiLoading,
    UiSegmentedControl,
    UiProfileCard,
    ReactiveFormsModule,
    UiCombobox,
    UiSidebar,
  ],
  templateUrl: './search.html',
})
export class SearchPage {
  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly authStore = inject(AuthStore);
  readonly minSearchLength = 3;
  readonly years = buildYearOptions();

  private searchController = inject(SearchController);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private gamesService = inject(GameService);
  private seo = inject(SeoService);
  private genresCache = inject(GenresCacheService);

  readonly genres = this.genresCache.options;

  query = signal<string>('');
  genre = signal<string>('');
  year = signal<string>('');
  view = signal<string>('');
  searchType = signal<'games' | 'players'>('games');
  readonly searchOptions = computed<UiSegmentOption<'games' | 'players'>[]>(
    () => [
      { id: 'games', label: 'Jogos' },
      { id: 'players', label: 'Perfis', disabled: this.isHypedUpcomingView() },
    ],
  );
  developer = signal('');
  selectedDeveloper = signal<UiComboboxOption[]>([]);
  filtersOpen = signal(false);
  readonly searchCompanies = async (
    query: string,
  ): Promise<UiComboboxOption[]> =>
    (await this.gamesService.searchCompanies(query)).map((company) => ({
      id: company.$id,
      label: company.name,
    }));
  mobileSearchControl = new FormControl('', { nonNullable: true });
  initialSearchControl = new FormControl('', { nonNullable: true });
  readonly initialSearchForm = new FormGroup({
    query: this.initialSearchControl,
  });

  normalizedQuery = computed(() => this.query().trim());

  hasActiveFilters = computed(
    () => !!this.genre() || !!this.year() || !!this.developer(),
  );
  isHypedUpcomingView = computed(() => this.view() === 'hyped-upcoming');

  readonly showInitialSearch = computed(
    () =>
      !this.normalizedQuery() &&
      (this.searchType() === 'players' ||
        (!this.hasActiveFilters() && !this.isHypedUpcomingView())),
  );

  canSearch = computed(
    () =>
      this.normalizedQuery().length >= this.minSearchLength ||
      (this.searchType() === 'games' &&
        (this.isHypedUpcomingView() || this.hasActiveFilters())),
  );

  activeSearch = computed(() => {
    return this.searchType() === 'games'
      ? this.searchController.games
      : this.searchController.players;
  });

  gameResults = computed(() => this.searchController.games.results());
  playerResults = computed(() => this.searchController.players.results());

  constructor() {
    const document = inject(DOCUMENT);
    afterRenderEffect((onCleanup) => {
      const input = this.searchInput()?.nativeElement;
      const controller = new AbortController();
      const focus = () => {
        const modal = document.querySelector('dialog[open]');
        if (modal)
          modal.addEventListener('close', focus, {
            once: true,
            signal: controller.signal,
          });
        else input?.focus();
      };
      focus();
      onCleanup(() => controller.abort());
    });
    this.seo.apply({
      title: 'Buscar jogos — Zetho',
      description:
        'Busque jogos por nome, filtre por gênero, ano ou desenvolvedora e encontre rapidamente o game que você procura no Zetho.',
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

  ngOnInit() {
    void this.genresCache.ensureLoaded();

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.query.set(params['q'] ?? '');
        this.genre.set(params['genre'] ?? '');
        this.year.set(params['year'] ?? '');
        this.developer.set(params['developer'] ?? '');
        this.selectedDeveloper.set(
          this.developer()
            ? [
                {
                  id: this.developer(),
                  label:
                    params['developerName'] || 'Desenvolvedora selecionada',
                },
              ]
            : [],
        );
        this.view.set(params['view'] ?? '');
        this.mobileSearchControl.setValue(this.query(), { emitEvent: false });

        if (this.isHypedUpcomingView()) {
          this.searchType.set('games');
        }

        const q = this.normalizedQuery();
        const filters = {
          genre: this.genre() || undefined,
          year: this.year() || undefined,
          developer: this.developer() || undefined,
          view: this.isHypedUpcomingView()
            ? ('hyped-upcoming' as const)
            : undefined,
        };
        const hasFilters =
          !!filters.genre || !!filters.year || !!filters.developer;
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
    this.router.navigate(['/buscar'], {
      queryParams: { [type]: value || null },
      queryParamsHandling: 'merge',
    });
  }

  onDeveloperChange(options: UiComboboxOption[]) {
    this.selectedDeveloper.set(options);
    this.router.navigate(['/buscar'], {
      queryParams: {
        developer: options[0]?.id || null,
        developerName: options[0]?.label || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearFilters() {
    this.router.navigate(['/buscar'], {
      queryParams: {
        genre: null,
        year: null,
        developer: null,
        developerName: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  submitInitialSearch() {
    const query = this.initialSearchControl.value.trim();
    if (query.length < this.minSearchLength) return;
    this.onMobileSearchChange(query);
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
