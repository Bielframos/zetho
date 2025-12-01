import { Injectable, Signal } from "@angular/core";
import { Analytics, logEvent } from "@angular/fire/analytics";
import { UserStore } from "../auth/user.store";
import { GameRow, ZEntryRow } from "../types";
import { UserProfileService } from "./userProfile.service";
import { ZEntryService } from "./zEntries.service";
import { ZStatsService } from "./zStats.service";

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
        private zEntryService: ZEntryService,
        private zStatsService: ZStatsService,
        private userProfileService: UserProfileService,
        private userStore: UserStore,
        private analytics: Analytics
    ) { }

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
            const newZEntry = await this.zEntryService.createEntry({ zEntryId, gameId, status, prev })
            logEvent(this.analytics, 'user_game_entry_interaction', { action: status, game_id: gameId })
            return newZEntry
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
}