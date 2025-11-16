import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { GameRow } from '../../core/types';
import { ZereiService } from '../../core/zerei/zerei.service';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [RouterLink],
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

            // 2) Se não estiver sincronizado, faz sync + refetch
            if (!game.syncedAt) {
                await this.zerei.syncGame([game.externalReference]);
                const { game: updated } = await this.zerei.getGame(slug);
                this.game.set(updated);
            } else {
                this.game.set(game);
            }

            this.loading.set(false);
        });
    }
}
