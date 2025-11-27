import { Injectable, signal, computed } from '@angular/core';
import { GameRow } from '../types';
import { GameService } from '../services/games.service';

@Injectable({ providedIn: 'root' })
export class GameSearchController {
    constructor(private gameService: GameService) { }

    create(query: string, pageSize: number = 12) {
        const _results = signal<GameRow[]>([]);
        const _total = signal(0);
        const _page = signal(0);
        const _pageCount = signal(0);
        const _loading = signal(false);

        const loadPage = async (pageNumber: number) => {
            _loading.set(true);

            try {
                const offset = (pageNumber - 1) * pageSize;
                const games = await this.gameService.searchGame(query, { pageSize, offset });

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
            reload: () => loadPage(_page())
        };
    }
}
