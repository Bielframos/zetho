import { computed, Injectable, signal, Signal } from '@angular/core';
import { GameWithEntry, UserProfileRow } from '../../types';
import { AuthStore } from '../auth/auth.store';
import { GameService } from '../games/games.service';
import { UserProfileService } from '../userProfiles/userProfile.service';

export type SearchFilters = {
  genre?: string;
  year?: string;
};

type SearchKind = 'games' | 'players';

type SearchState<T> = {
  results: T[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  loading: boolean;
  initialized: boolean;
};

type SearchResultView<T> = {
  results: Signal<T[]>;
  total: Signal<number>;
  page: Signal<number>;
  pageCount: Signal<number>;
  pageSize: number;
  loading: Signal<boolean>;
  initialized: Signal<boolean>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => Promise<void>;
  reload: () => Promise<void>;
};

const DEFAULT_PAGE_SIZE = 12;

@Injectable({ providedIn: 'root' })
export class SearchController {
  query = signal('');
  filters = signal<SearchFilters>({});

  private gamesState = signal<SearchState<GameWithEntry>>(
    this.createEmptyState<GameWithEntry>(DEFAULT_PAGE_SIZE),
  );
  private playersState = signal<SearchState<UserProfileRow>>(
    this.createEmptyState<UserProfileRow>(DEFAULT_PAGE_SIZE),
  );

  private gamesRequestVersion = 0;
  private playersRequestVersion = 0;

  games: SearchResultView<GameWithEntry> = {
    results: computed(() => this.gamesState().results),
    total: computed(() => this.gamesState().total),
    page: computed(() => this.gamesState().page),
    pageCount: computed(() => this.gamesState().pageCount),
    pageSize: DEFAULT_PAGE_SIZE,
    loading: computed(() => this.gamesState().loading),
    initialized: computed(() => this.gamesState().initialized),
    nextPage: () => this.nextPage('games'),
    prevPage: () => this.prevPage('games'),
    goToPage: (page: number) => this.goToPage('games', page),
    reload: () => this.reload('games'),
  };

  players: SearchResultView<UserProfileRow> = {
    results: computed(() => this.playersState().results),
    total: computed(() => this.playersState().total),
    page: computed(() => this.playersState().page),
    pageCount: computed(() => this.playersState().pageCount),
    pageSize: DEFAULT_PAGE_SIZE,
    loading: computed(() => this.playersState().loading),
    initialized: computed(() => this.playersState().initialized),
    nextPage: () => this.nextPage('players'),
    prevPage: () => this.prevPage('players'),
    goToPage: (page: number) => this.goToPage('players', page),
    reload: () => this.reload('players'),
  };

  constructor(
    private gameService: GameService,
    private profileService: UserProfileService,
    private authStore: AuthStore,
  ) {}

  search(
    query: string,
    filters: SearchFilters = {},
    pageSize: number = DEFAULT_PAGE_SIZE,
  ) {
    const normalizedQuery = query.trim();
    const hasFilters = !!filters.genre || !!filters.year;

    if (!normalizedQuery && !hasFilters) {
      this.reset(pageSize);
      return;
    }

    this.query.set(normalizedQuery);
    this.filters.set(filters);

    this.gamesState.set({
      ...this.createEmptyState<GameWithEntry>(pageSize),
      loading: true,
      initialized: true,
    });

    this.playersState.set({
      ...this.createEmptyState<UserProfileRow>(pageSize),
      loading: true,
      initialized: true,
    });

    void Promise.all([this.loadGamesPage(1), this.loadPlayersPage(1)]);
  }

  reset(pageSize: number = DEFAULT_PAGE_SIZE) {
    this.query.set('');
    this.filters.set({});

    // Invalidates in-flight requests.
    this.gamesRequestVersion += 1;
    this.playersRequestVersion += 1;

    this.gamesState.set(this.createEmptyState<GameWithEntry>(pageSize));
    this.playersState.set(this.createEmptyState<UserProfileRow>(pageSize));
  }

  nextPage(kind: SearchKind) {
    const state = this.stateByKind(kind)();

    if (state.page < state.pageCount) {
      void this.goToPage(kind, state.page + 1);
    }
  }

  prevPage(kind: SearchKind) {
    const state = this.stateByKind(kind)();

    if (state.page > 1) {
      void this.goToPage(kind, state.page - 1);
    }
  }

  async goToPage(kind: SearchKind, page: number) {
    const state = this.stateByKind(kind)();
    const safePage = Math.min(Math.max(page, 1), Math.max(1, state.pageCount));

    if (kind === 'games') {
      await this.loadGamesPage(safePage);
      return;
    }

    await this.loadPlayersPage(safePage);
  }

  async reload(kind: SearchKind) {
    await this.goToPage(kind, this.stateByKind(kind)().page);
  }

  private createEmptyState<T>(pageSize: number): SearchState<T> {
    return {
      results: [],
      total: 0,
      page: 1,
      pageCount: 1,
      pageSize,
      loading: false,
      initialized: false,
    };
  }

  private stateByKind(kind: SearchKind) {
    return kind === 'games' ? this.gamesState : this.playersState;
  }

  private async loadGamesPage(pageNumber: number) {
    const currentVersion = ++this.gamesRequestVersion;
    const safePage = Math.max(1, pageNumber);
    const query = this.query();

    this.gamesState.update((state) => ({
      ...state,
      page: safePage,
      loading: true,
      initialized: true,
    }));

    const filters = this.filters();
    const hasFilters = !!filters.genre || !!filters.year;

    if (!query && !hasFilters) {
      if (currentVersion === this.gamesRequestVersion) {
        this.gamesState.set(
          this.createEmptyState<GameWithEntry>(this.gamesState().pageSize),
        );
      }
      return;
    }

    try {
      const pageSize = this.gamesState().pageSize;
      const offset = (safePage - 1) * pageSize;
      const response = await this.gameService.searchGame(query, {
        pageSize,
        offset,
        fingerprint: this.authStore.profile()?.fingerprint,
        filters,
      });

      if (
        currentVersion !== this.gamesRequestVersion ||
        query !== this.query()
      ) {
        return;
      }

      this.gamesState.update((state) => ({
        ...state,
        results: response.rows,
        total: response.total,
        page: safePage,
        pageCount: Math.max(1, Math.ceil(response.total / state.pageSize)),
      }));
    } catch {
      if (currentVersion !== this.gamesRequestVersion) return;

      this.gamesState.update((state) => ({
        ...state,
        results: [],
        total: 0,
        page: safePage,
        pageCount: 1,
      }));
    } finally {
      if (currentVersion === this.gamesRequestVersion) {
        this.gamesState.update((state) => ({ ...state, loading: false }));
      }
    }
  }

  private async loadPlayersPage(pageNumber: number) {
    const currentVersion = ++this.playersRequestVersion;
    const safePage = Math.max(1, pageNumber);
    const query = this.query();

    this.playersState.update((state) => ({
      ...state,
      page: safePage,
      loading: true,
      initialized: true,
    }));

    if (!query) {
      if (currentVersion === this.playersRequestVersion) {
        this.playersState.set(
          this.createEmptyState<UserProfileRow>(this.playersState().pageSize),
        );
      }
      return;
    }

    try {
      const pageSize = this.playersState().pageSize;
      const offset = (safePage - 1) * pageSize;
      const response = await this.profileService.searchProfile(query, {
        pageSize,
        offset,
      });

      if (
        currentVersion !== this.playersRequestVersion ||
        query !== this.query()
      ) {
        return;
      }

      this.playersState.update((state) => ({
        ...state,
        results: response.rows,
        total: response.total,
        page: safePage,
        pageCount: Math.max(1, Math.ceil(response.total / state.pageSize)),
      }));
    } catch {
      if (currentVersion !== this.playersRequestVersion) return;

      this.playersState.update((state) => ({
        ...state,
        results: [],
        total: 0,
        page: safePage,
        pageCount: 1,
      }));
    } finally {
      if (currentVersion === this.playersRequestVersion) {
        this.playersState.update((state) => ({ ...state, loading: false }));
      }
    }
  }
}
