import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize, map, tap } from 'rxjs/operators';
import { ShortNumberPipe } from '../../core/modules/pipes';
import { GameRow } from '../../core/types';
import { ZereiService } from '../../core/zerei/zerei.service';
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [UiGameCard, ShortNumberPipe],
    templateUrl: './game.html'
})
export class Game {
    private zerei = inject(ZereiService);
    private route = inject(ActivatedRoute);

    loading = signal(false);
    loadingSimilarGames = signal(false);
    game = signal<GameRow | null>(null);
    similarGames = signal<GameRow[] | null>(null)

    // Converte params da rota em signal
    slug = toSignal(
        this.route.paramMap.pipe(map(params => params.get('slug'))),
        { initialValue: null }
    );

    constructor() {
        effect(async () => {
            const slug = this.slug();
            if (!slug) return;

            this.loading.set(true);

            const { success, game } = await this.zerei.getGame(slug);

            if (!success || !game) {
                this.game.set(null);
                this.loading.set(false);
                return;
            }

            this.game.set(game)
            this.loading.set(false);

            if (game.similarGames.length > 0) {
                this.loadingSimilarGames.set(true)
                const data = await this.zerei.getGames(game.similarGames)
                if (data.games && data.games.length > 0) {
                    this.similarGames.set(data.games)
                }
                this.loadingSimilarGames.set(false)
            }

            console.log(this.game())
        });
    }
}
