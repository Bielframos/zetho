import { computed, Injectable, signal, Signal } from "@angular/core";
import { type AppwriteException } from "../appwrite/appwrite.client";
import { GameRow, ZEntryRow } from "../types";
import { GameService } from "./games.service";
import { ZEntryService } from "./zEntries.service";
import { UserStore } from "../auth/user.store";

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
        private userStore: UserStore
    ) { }

    /**
     * Função para montar o estado da página individual de um jogo
     * @param slug 
     * @returns 
     */
    createGamePageState() {
        const gameService = this.gameService
        const zEntryService = this.zEntryService
        const user = this.userStore.user()

        const _game = signal<GameRow | null>(null)
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
                        const zEntry = await zEntryService.getEntry(user.$id, game.$id)
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
                        const similarGames = await gameService.getGames(game.similarGames, { summarized: true })
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

    async createZEntry(gameId: string, status: ZEntryRow['status'], prev: ZEntryRow | null) {
        const user = this.userStore.user()
        if (!user) alert('Só usuários logados podem criar ou atualizar seus registros.')

        try {
            return await this.zEntryService.createEntry(user!.$id, gameId, status, prev)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    async likeAGame(gameId: string, prev: ZEntryRow | null) {
        const user = this.userStore.user()
        if (!user) alert('Só usuários logados podem curtir um jogo.')

        try {
            return await this.zEntryService.likeAGame(user!.$id, gameId, prev)
        } catch (e) {
            console.error(e)
            return null
        }
    }
}