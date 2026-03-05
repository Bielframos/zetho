import { computed, Injectable, signal, Signal } from '@angular/core';
import { GameWithEntry, UserProfileRow } from '../../types';
import { AuthStore } from '../auth/auth.store';
import { GameService } from '../games/games.service';
import { UserProfileService } from '../userProfiles/userProfile.service';

type SearchResultState<T> = {
  results: Signal<T[]>;
  total: Signal<number>;
  page: Signal<number>;
  pageCount: Signal<number>;
  pageSize: number;
  loading: Signal<boolean>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => Promise<void>;
  reload: () => Promise<void>;
};

type SearchResponse<T> = {
  rows: T[];
  total: number;
};

@Injectable({ providedIn: 'root' })
export class SearchController {
  constructor(
    private gameService: GameService,
    private profileService: UserProfileService,
    private authStore: AuthStore,
  ) {}

  create(query: string, pageSize: number = 12) {
    const createState = <T>(
      request: (opts: {
        pageSize: number;
        offset: number;
      }) => Promise<SearchResponse<T>>,
    ): SearchResultState<T> => {
      const _results = signal<T[]>([]);
      const _total = signal(0);
      const _page = signal(1);
      const _pageCount = signal(1);
      const _loading = signal(false);
      let requestVersion = 0;

      const loadPage = async (pageNumber: number) => {
        const currentVersion = ++requestVersion;
        _loading.set(true);

        try {
          const safePage = Math.max(1, pageNumber);
          const offset = (safePage - 1) * pageSize;
          const response = await request({ pageSize, offset });

          if (currentVersion !== requestVersion) return;

          _results.set(response.rows);
          _total.set(response.total);
          _page.set(safePage);
          _pageCount.set(Math.max(1, Math.ceil(response.total / pageSize)));
        } finally {
          if (currentVersion === requestVersion) {
            _loading.set(false);
          }
        }
      };

      const nextPage = () => {
        const page = _page();
        if (page < _pageCount()) {
          void loadPage(page + 1);
        }
      };

      const prevPage = () => {
        const page = _page();
        if (page > 1) {
          void loadPage(page - 1);
        }
      };

      const goToPage = async (page: number) => {
        const safe = Math.min(Math.max(page, 1), Math.max(1, _pageCount()));
        await loadPage(safe);
      };

      return {
        results: computed(() => _results()),
        total: computed(() => _total()),
        page: computed(() => _page()),
        pageCount: computed(() => _pageCount()),
        pageSize,
        loading: computed(() => _loading()),
        nextPage,
        prevPage,
        goToPage,
        reload: () => loadPage(_page()),
      };
    };

    const games = createState<GameWithEntry>((opts) =>
      this.gameService.searchGame(query, {
        ...opts,
        fingerprint: this.authStore.profile()?.fingerprint,
      }),
    );

    const players = createState<UserProfileRow>((opts) =>
      this.profileService.searchProfile(query, opts),
    );

    void Promise.all([games.goToPage(1), players.goToPage(1)]);

    return {
      games,
      players,
    };
  }
}
