import { computed, Injectable, signal, Signal } from "@angular/core";
import { type AppwriteException } from "../appwrite/appwrite.client";
import { UserStore } from "../auth/user.store";
import { GameRow, ZEntryRow } from "../types";
import { GameService } from "./games.service";
import { UserProfileService } from "./userProfile.service";
import { ZEntryService } from "./zEntries.service";
import { ZStatsService } from "./zStats.service";
import { GameStore } from "./game.store";

export interface GameSearchController {
    results: Signal<GameRow[]>,
    total: Signal<number>,
    page: Signal<number>,
    pageCount: Signal<number>,
    pageSize: number,
    loading: Signal<boolean>,
    nextPage(): Promise<void>,
    prevPage(): Promise<void>,
    goToPage(page: number): Promise<void>,
    reload(): Promise<void>
}

@Injectable({ providedIn: 'root' })
export class ZereiService {
    constructor(
        private gameService: GameService,
        private zEntryService: ZEntryService,
        private zStatsService: ZStatsService,
        private userProfileService: UserProfileService,
        private gameStore: GameStore,
        private userStore: UserStore
    ) { }

    /**
     * Função para obter as estatísticas do jogador logado
     * @returns 
     */
    async getMyStats() {
        const user = this.userStore.user();

        if (!user) return null

        try {
            return await this.zEntryService.getUserStats()
        } catch (e) {
            console.error(e)
            return null
        }

    }

    /**
     * Estado da página principal, com jogos do usuário e carregamento incremental
     * @param status 
     * @param pageSize 
     * @returns 
     */
    createHomePageState(pageSize: number = 12) {
        const zEntryService = this.zEntryService;
        const gameService = this.gameService;
        const user = this.userStore.user();

        const _status = signal<Exclude<ZEntryRow['status'], null | undefined>>('completed');

        const _games = signal<GameRow[]>([]);
        const _entries = signal<ZEntryRow[]>([]);

        const _initialLoading = signal(true);
        const _loadingMore = signal(false);

        const _errors = signal<Record<string, any>>({});
        const _offset = signal(0);
        const _total = signal(0);
        const _hasMore = signal(true);

        function init(status?: Exclude<ZEntryRow['status'], null | undefined>) {
            _games.set([]);
            _entries.set([]);
            _offset.set(0);
            _total.set(0);
            _hasMore.set(true);

            _initialLoading.set(true);
            _loadingMore.set(false);

            if (status) _status.set(status);

            void loadMore();
        }

        async function loadMore() {
            if (!user) {
                _errors.update(s => ({ ...s, auth: 'Usuário não autenticado.' }));
                return;
            }

            if (_loadingMore()) return;
            _loadingMore.set(true);

            try {
                const entries = await zEntryService.getUserEntries(
                    _status(),
                    {
                        pageSize,
                        offset: _offset()
                    }
                );

                _entries.update(prev => [...prev, ...entries.rows]);
                _total.set(entries.total);

                const ids = entries.rows.map(e => e.gameId).filter(Boolean);

                if (ids.length > 0) {
                    const games = await gameService.getGames(ids, { summarized: true });
                    if (games) {
                        _games.update(prev => [...prev, ...games]);
                    }
                }

                const newOffset = _offset() + pageSize;
                _offset.set(newOffset);
                _hasMore.set(newOffset < entries.total);

            } catch (e) {
                const error = e as AppwriteException;
                _errors.update(prev => ({ ...prev, loadMore: error }));
            } finally {
                if (_initialLoading()) {
                    _initialLoading.set(false);
                }

                if (_loadingMore()) {
                    _loadingMore.set(false);
                }
            }
        }

        return {
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

    /**
     * Função para montar o estado da página individual de um jogo
     * @param slug 
     * @returns 
     */
    createGamePageState() {
        const gameService = this.gameService
        const zEntryService = this.zEntryService
        const user = this.userStore.user()

        const _game = signal<GameRow | null>(this.gameStore.currentGame())
        const _similarGames = signal<GameRow[] | null>(null)
        const _zEntry = signal<ZEntryRow | null>(null)
        const _errors = signal<Record<string, any>>({})
        const _loading = signal(false)

        async function fetch(slug: string) {
            try {
                _loading.set(true)
                let game = await gameService.getGame(slug)
                if (!game) throw { message: 'Game not found', code: 404 }
                game.releaseDate = new Date(game.releaseDate).toLocaleDateString('pt-br')
                _game.set(game)
            } catch (e) {
                const error = e as AppwriteException
                _errors.update((state => {
                    state['game'] = error
                    return state
                }))
            } finally {
                _loading.set(false)
            }

            const game = _game()

            if (game !== null) {
                if (user) {
                    try {
                        const zEntry = await zEntryService.getEntry(game.$id)
                        _zEntry.set(zEntry)
                    } catch (e) {
                        const error = e as AppwriteException
                        _errors.update(state => {
                            state['zEntry'] = error
                            return error
                        })
                    }
                }

                if (game.similarGames?.length > 0) {
                    try {
                        const similarGames = await gameService.getGames(game.similarGames, { summarized: true, pageSize: 8 })
                        _similarGames.set(similarGames)
                    } catch (e) {
                        const error = e as AppwriteException
                        _errors.update(state => {
                            state['similarGames'] = error
                            return state
                        })
                    }
                }
            }
        }

        return {
            game: computed(() => _game()),
            similarGames: computed(() => _similarGames()),
            zEntry: computed(() => _zEntry()),
            updateZEntry: (entry: ZEntryRow) => _zEntry.set(entry),
            loading: computed(() => _loading()),
            errors: computed(() => _errors()),
            fetch
        }
    }

    /**
     * Método para montar uma busca reativa de jogos
     * @param query 
     * @param pageSize 
     * @returns 
     */
    createGameSearch(query: string, pageSize: number = 12): GameSearchController {
        const gameService = this.gameService
        const _results = signal<GameRow[]>([])
        const _total = signal(0)
        const _page = signal(0)
        const _pageCount = signal(0)
        const _loading = signal(false)

        async function loadPage(pageNumber: number) {
            _loading.set(true)

            try {
                const offset = (pageNumber - 1) * pageSize
                const games = await gameService.searchGame(query, { pageSize, offset })
                _results.set(games.rows)
                _total.set(games.total)
                _page.set(pageNumber)
                _pageCount.set(Math.max(1, Math.ceil(_total() / pageSize)))
            } catch (e) {
                console.error(e)
            } finally {
                _loading.set(false)
            }
        }

        async function nextPage() {
            const current = _page()
            const pageCount = _pageCount()

            if (current >= pageCount) return
            await loadPage(current + 1)
        }

        async function prevPage() {
            const current = _page()
            if (current <= 1) return
            await loadPage(current - 1)
        }

        async function goToPage(page: number) {
            const pageCount = _pageCount()
            const safe = Math.min(Math.max(page, 1), pageCount)
            await loadPage(safe)
        }

        void loadPage(1)

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
        }
    }

    /**
     * Cria um registro Z
     * @param gameId 
     * @param status 
     * @param prev 
     * @returns 
     */
    async createZEntry(payload: { zEntryId?: string, gameId: string, status: ZEntryRow['status'] | null, prev: ZEntryRow | null }) {
        const user = this.userStore.user()
        if (!user) alert('Só usuários logados podem criar ou atualizar seus registros.')

        const { zEntryId, gameId, status, prev } = payload

        try {
            return await this.zEntryService.createEntry({ zEntryId, gameId, status, prev })
        } catch (e) {
            console.error(e)
            return null
        }
    }

    /**
     * Curte um jogo
     * @param gameId 
     * @param prev 
     * @returns 
     */
    async likeAGame(payload: { zEntryId?: string, gameId: string, prev: ZEntryRow | null }) {
        const user = this.userStore.user()
        if (!user) alert('Só usuários logados podem curtir um jogo.')

        const { zEntryId, gameId, prev } = payload

        try {
            return await this.zEntryService.likeAGame({ zEntryId, gameId, prev })
        } catch (e) {
            console.error(e)
            return null
        }
    }

    /**
     * Obtém as estatísticas de das entradas z de toda o Zerei
     * @returns 
     */
    async getPlatformStats() {
        try {
            const zEntryCount = await this.zEntryService.getZEntryCount()
            const profileCount = await this.userProfileService.getProfileCount()

            return { zEntryCount, profileCount }
        } catch (e) {
            console.error(e)
            return null
        }
    }

    /**
     * Obtém os jogos mais curtidos com base nos registros Z
     * @returns 
     */
    async getTrendingGames(): Promise<GameRow[]> {
        try {
            return await this.zStatsService.getTrendingGames()
        } catch (e) {
            console.error(e)
            return []
        }
    }
}