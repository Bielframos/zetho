import { Injectable, signal } from '@angular/core';
import { UserStore } from '../auth/user.store';
import { GameService } from '../services/games.service';
import { ZEntryService } from '../services/zEntries.service';
import { GameStore } from '../stores/game.store';
import { GameRow, ZEntryRow } from '../types';

@Injectable({ providedIn: 'root' })
export class GamePageController {
    game = signal<GameRow | null>(null);
    similarGames = signal<GameRow[] | null>(null);
    zEntry = signal<ZEntryRow | null>(null);
    errors = signal<Record<string, any>>({});
    loading = signal(false);

    constructor(
        private gameService: GameService,
        private zEntryService: ZEntryService,
        private gameStore: GameStore,
        private userStore: UserStore
    ) {
        this.game.set(this.gameStore.currentGame())
    }

    async init(slug: string) {
        const user = this.userStore.user();
        const profile = this.userStore.profile();


        try {
            this.loading.set(true);
            let game = await this.gameService.getGame(slug);
            if (!game) throw { message: 'Game not found', code: 404 };
            game.releaseDate = new Date(game.releaseDate).toLocaleDateString('pt-br');
            this.game.set(game);
        } catch (e) {
            this.errors.update(state => ({ ...state, game: e }));
        } finally {
            this.loading.set(false);
        }

        const game = this.game();
        if (!game) return;

        if (user) {
            try {
                const zEntry = await this.zEntryService.getEntry(profile!.fingerprint, game.$id);
                this.zEntry.set(zEntry);
            } catch (e) {
                this.errors.update(s => ({ ...s, zEntry: e }));
            }
        }

        if (game.similarGames?.length > 0) {
            try {
                const similar = await this.gameService.getGames(
                    game.similarGames,
                    { summarized: true, pageSize: 8 }
                );
                this.similarGames.set(similar);
            } catch (e) {
                this.errors.update(s => ({ ...s, similarGames: e }));
            }

        }
    }

    async updateStatus(status: ZEntryRow['status']) {
        const game = this.game()
        const zEntry = this.zEntry()

        if (!game) return;


        if (!this.userStore.isAuthenticated()) {
            alert('Só usuários logados podem criar ou atualizar seus registros.')
            return
        }

        const profile = this.userStore.profile()
        const newStatus = status === zEntry?.status ? null : status;

        const updated = await this.zEntryService.createEntry(profile!.fingerprint, {
            zEntryId: zEntry?.$id,
            gameId: game.$id,
            status: newStatus,
            prev: zEntry,
        });

        this.zEntry.set(updated)
    }

    async like() {
        const game = this.game()
        const existing = this.zEntry();

        if (!game) return;

        if (!this.userStore.isAuthenticated()) {
            alert('Só usuários logados podem curtir um jogo.')
            return
        }

        const profile = this.userStore.profile()

        const updated = await this.zEntryService.likeAGame(profile!.fingerprint, {
            zEntryId: existing?.$id,
            gameId: game.$id,
            prev: existing,
        });

        if (updated) this.zEntry.set(updated);
    }
}

