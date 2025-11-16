import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { GameRow } from '../../core/types';
import { ZereiService } from '../../core/zerei/zerei.service';
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [UiGameCard],
    templateUrl: './game.html'
})
export class Game {
    private zerei = inject(ZereiService);
    private route = inject(ActivatedRoute);

    loading = signal(false);
    game = signal<GameRow | null>(null);

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

            console.log(this.game())
        });
    }
}
