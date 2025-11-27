import { Injectable, computed, signal } from '@angular/core';
import { GameRow, ZEntryRow } from '../types';
import { GameService } from '../services/games.service';
import { ZEntryService } from '../services/zEntries.service';
import { UserStore } from '../auth/user.store';

@Injectable({ providedIn: 'root' })
export class DashboardController {
    constructor(
        private gameService: GameService,
        private zEntryService: ZEntryService,
        private userStore: UserStore
    ) { }

    create(pageSize: number = 12) {
        const user = this.userStore.user();

        const _initialized = signal(false);
        const _status = signal<Exclude<ZEntryRow['status'], null | undefined>>('completed');
        const _games = signal<GameRow[]>([]);
        const _entries = signal<ZEntryRow[]>([]);
        const _offset = signal(0);
        const _total = signal(0);
        const _hasMore = signal(true);
        const _initialLoading = signal(false);
        const _loadingMore = signal(false);
        const _errors = signal<Record<string, any>>({});

        const init = (status?: Exclude<ZEntryRow['status'], null | undefined>) => {
            _games.set([]);
            _entries.set([]);
            _offset.set(0);
            _total.set(0);
            _hasMore.set(true);

            _initialLoading.set(true);
            _loadingMore.set(false);
            _initialized.set(true);

            if (status) _status.set(status);

            void loadMore();
        };

        const loadMore = async () => {
            if (!user) {
                _errors.update(s => ({ ...s, auth: 'Usuário não autenticado.' }));
                return;
            }
            if (_loadingMore()) return;

            _loadingMore.set(true);

            try {
                const entries = await this.zEntryService.getUserEntries(
                    _status(),
                    { pageSize, offset: _offset() }
                );

                _entries.update(prev => [...prev, ...entries.rows]);
                _total.set(entries.total);

                const ids = entries.rows.map(e => e.gameId).filter(Boolean);
                if (ids.length > 0) {
                    const games = await this.gameService.getGames(ids, { pageSize, summarized: true });
                    if (games) {
                        _games.update(prev => [...prev, ...games]);
                    }
                }

                const newOffset = _offset() + pageSize;
                _offset.set(newOffset);
                _hasMore.set(newOffset < entries.total);

            } catch (e) {
                _errors.update(prev => ({ ...prev, loadMore: e }));
            } finally {
                _initialLoading.set(false);
                _loadingMore.set(false);
            }
        };

        return {
            isInitialized: computed(() => _initialized()),
            games: computed(() => _games()),
            entries: computed(() => _entries()),
            total: computed(() => _total()),
            loading: computed(() => _initialLoading()),
            loadingMore: computed(() => _loadingMore()),
            errors: computed(() => _errors()),
            hasMore: computed(() => _hasMore()),
            init,
            loadMore
        };
    }
}
