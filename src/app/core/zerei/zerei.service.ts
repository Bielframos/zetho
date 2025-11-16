import { computed, Injectable, signal, Signal } from "@angular/core";
import { GameRow } from "../types";
import { GameService } from "./games.service";
import { IgdbService } from "../igdb/igdb.service";
import { AppwriteException } from "appwrite";

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
    constructor(private gameService: GameService, private igdbService: IgdbService) { }

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
     * Método para buscar um único jogo com base no slug
     * @param slug 
     * @returns 
     */
    async getGame(slug: string) {
        try {
            const game = await this.gameService.getGame(slug)
            return { success: true, game, error: null }
        } catch (e) {
            const error = e as AppwriteException
            return { success: false, game: null, error }

        }
    }

    async syncGame(ids: number[]) {
        try {
            const syncExecution = await this.igdbService.syncGames(ids)
            if (syncExecution.responseStatusCode === 200) return { success: true }
            else return { success: false }
        } catch (e) {
            console.error(e)
            return { success: false }
        }
    }

    async createZEntry() { }

    async updateZEntry() { }

    async updateProfile() { }

    async deleteProfile() { }
}