import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ShortNumberPipe } from '../../core/modules/pipes';
import { ZereiService } from '../../core/zerei/zerei.service';
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { UserStore } from '../../core/auth/user.store';

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [UiGameCard, ShortNumberPipe, RouterLink],
    templateUrl: './game.html'
})
export class Game {
    private zerei = inject(ZereiService);
    private route = inject(ActivatedRoute);
    userStore = inject(UserStore);
    pageState = this.zerei.createGamePageState()

    // Converte params da rota em signal
    slug = toSignal(
        this.route.paramMap.pipe(map(params => params.get('slug'))),
        { initialValue: null }
    );

    constructor() {
        effect(async () => {
            const slug = this.slug();
            if (!slug) return;

            await this.pageState.fetch(slug)
        });
    }
}
