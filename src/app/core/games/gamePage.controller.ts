import { Injectable, signal } from '@angular/core';
import { UserStore } from '../auth/user.store';
import { GameRow, ZEntryRow } from '../types';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameService } from './games.service';

@Injectable({ providedIn: 'root' })
export class GameController {
    game = signal<GameRow | null>(null);
    similarGames = signal<GameRow[] | null>(null);
    zEntry = signal<ZEntryRow | null>(null);
    errors = signal<Record<string, any>>({});
    loading = signal(false);
    updating = signal(false);

    constructor(
        private gameService: GameService,
        private zEntryService: ZEntryService,
        private userStore: UserStore,
    ) { }

    async loadPage(slug: string) {
        try {
            // Limpar estado anterior para evitar flickering
            this.game.set(null);
            this.similarGames.set(null);
            this.zEntry.set(null);
            this.errors.set({});
            this.loading.set(true);

            const user = this.userStore.user();
            const profile = this.userStore.profile();

            const data = await this.gameService.loadGamePage(slug, {
                userId: user?.$id,
                fingerprint: profile?.fingerprint,
            });

            this.game.set(data.game);
            this.zEntry.set(data.zEntry);
            this.similarGames.set(data.similarGames);
        } catch (e) {
            this.errors.update((state) => ({ ...state, page: e }));
        } finally {
            this.loading.set(false);
        }
    }

    async handleEntry({ action, value }:
        | { action: 'updateStatus'; value: ZEntryRow['status'] }
        | { action: 'like'; value: boolean }) {
        const game = this.game();
        const zEntry = this.zEntry();

        if (!game) return;
        if (this.updating()) return;

        try {
            this.updating.set(true);

            const profile = this.userStore.profile();

            const updated = await this.zEntryService.createEntryLog(
                profile!.fingerprint,
                game.$id,
                zEntry,
                action === 'updateStatus' ? { status: value } : { liked: value }
            );

            this.zEntry.set(updated);
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
        } finally {
            this.updating.set(false);
        }
    }
}
