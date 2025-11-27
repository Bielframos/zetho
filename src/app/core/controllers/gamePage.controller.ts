import { Injectable, signal, computed } from '@angular/core';
import { GameRow, ZEntryRow } from '../types';
import { GameService } from '../services/games.service';
import { ZEntryService } from '../services/zEntries.service';
import { GameStore } from '../stores/game.store';
import { UserStore } from '../auth/user.store';

@Injectable({ providedIn: 'root' })
export class GamePageController {
    constructor(
        private gameService: GameService,
        private zEntryService: ZEntryService,
        private gameStore: GameStore,
        private userStore: UserStore
    ) { }

    create() {
        const user = this.userStore.user();

        const _game = signal<GameRow | null>(this.gameStore.currentGame());
        const _similarGames = signal<GameRow[] | null>(null);
        const _zEntry = signal<ZEntryRow | null>(null);
        const _errors = signal<Record<string, any>>({});
        const _loading = signal(false);

        const fetch = async (slug: string) => {
            try {
                _loading.set(true);
                let game = await this.gameService.getGame(slug);
                if (!game) throw { message: 'Game not found', code: 404 };
                game.releaseDate = new Date(game.releaseDate).toLocaleDateString('pt-br');
                _game.set(game);
            } catch (e) {
                _errors.update(state => ({ ...state, game: e }));
            } finally {
                _loading.set(false);
            }

            const game = _game();
            if (!game) return;

            if (user) {
                try {
                    const zEntry = await this.zEntryService.getEntry(game.$id);
                    _zEntry.set(zEntry);
                } catch (e) {
                    _errors.update(s => ({ ...s, zEntry: e }));
                }
            }

            if (game.similarGames?.length > 0) {
                try {
                    const similar = await this.gameService.getGames(
                        game.similarGames,
                        { summarized: true, pageSize: 8 }
                    );
                    _similarGames.set(similar);
                } catch (e) {
                    _errors.update(s => ({ ...s, similarGames: e }));
                }
            }
        };

        return {
            game: computed(() => _game()),
            similarGames: computed(() => _similarGames()),
            zEntry: computed(() => _zEntry()),
            updateZEntry: (entry: ZEntryRow) => _zEntry.set(entry),
            loading: computed(() => _loading()),
            errors: computed(() => _errors()),
            fetch
        };
    }
}
