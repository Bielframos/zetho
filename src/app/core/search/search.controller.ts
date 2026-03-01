import { computed, Injectable, signal } from '@angular/core';
import { GameRow, GameWithEntry } from '../../types';
import { AuthStore } from '../auth/auth.store';
import { GameService } from '../games/games.service';

@Injectable({ providedIn: 'root' })
export class SearchController {
  constructor(
    private gameService: GameService,
    private authStore: AuthStore,
  ) {}

  create(query: string, pageSize: number = 12) {
    const _results = signal<GameWithEntry[]>([]);
    const _total = signal(0);
    const _page = signal(0);
    const _pageCount = signal(0);
    const _loading = signal(false);

    const loadPage = async (pageNumber: number) => {
      _loading.set(true);

      try {
        const offset = (pageNumber - 1) * pageSize;
        const games = await this.gameService.searchGame(query, {
          pageSize,
          offset,
          fingerprint: this.authStore.profile()?.fingerprint,
        });

        _results.set(games.rows);
        _total.set(games.total);
        _page.set(pageNumber);
        _pageCount.set(Math.max(1, Math.ceil(games.total / pageSize)));
      } finally {
        _loading.set(false);
      }
    };

    const nextPage = () => {
      const page = _page();
      if (page < _pageCount()) loadPage(page + 1);
    };

    const prevPage = () => {
      const page = _page();
      if (page > 1) loadPage(page - 1);
    };

    const goToPage = async (page: number) => {
      const safe = Math.min(Math.max(page, 1), _pageCount());
      await loadPage(safe);
    };

    void loadPage(1);

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
  }
}
