import { Injectable, signal } from '@angular/core';
import { UserStore } from '../auth/user.store';
import { GameService } from './games.service';
import { ZEntryService } from '../services/zEntries.service';
import { GameStore } from './game.store';
import { GameRow, ZEntryRow } from '../types';

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
        private gameStore: GameStore,
        private userStore: UserStore,
    ) {
        this.game.set(this.gameStore.currentGame());
    }

    async loadPage(slug: string) {
        try {
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

    async updateStatus(status: ZEntryRow['status']) {
        const game = this.game();
        const zEntry = this.zEntry();

        if (!game) return;
        if (this.updating()) return;

        if (!this.userStore.isAuthenticated()) {
            alert('Só usuários logados podem criar ou atualizar seus registros.');
            return;
        }

        try {
            this.updating.set(true);

            const profile = this.userStore.profile();
            const newStatus = status === zEntry?.status ? null : status;

            const updated = await this.zEntryService.createEntry(
                profile!.fingerprint,
                {
                    gameId: game.$id,
                    current: zEntry,
                    status: newStatus,
                },
            );

            this.zEntry.set(updated);
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
        } finally {
            this.updating.set(false);
        }
    }

    async like() {
        const game = this.game();
        const existing = this.zEntry();

        if (!game) return;
        if (this.updating()) return;

        if (!this.userStore.isAuthenticated()) {
            alert('Só usuários logados podem curtir um jogo.');
            return;
        }

        try {
            this.updating.set(true);
            const profile = this.userStore.profile();

            const updated = await this.zEntryService.likeAGame(profile!.fingerprint, {
                gameId: game.$id,
                current: existing,
            });

            if (updated) this.zEntry.set(updated);
        } catch (err) {
            console.error('Erro ao curtir jogo:', err);
        } finally {
            this.updating.set(false);
        }
    }
}
