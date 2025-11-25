import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { UserStore } from '../../core/auth/user.store';
import { ShortNumberPipe } from '../../core/modules/pipes';
import { ZEntry } from '../../core/types';
import { ZereiService } from '../../core/zerei/zerei.service';
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";

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

    async handleZEntry(status: ZEntry['status']) {
        const game = this.pageState.game()
        const existingZEntry = this.pageState.zEntry()

        if (game) {
            const newStatus = status === this.pageState.zEntry()?.status ? null : status
            const zEntry = await this.zerei.createZEntry({ zEntryId: existingZEntry?.$id, gameId: game.$id, status: newStatus, prev: this.pageState.zEntry() })
            if (zEntry) this.pageState.updateZEntry(zEntry)
        }
    }

    async handleLike() {
        const game = this.pageState.game()
        if (game) {
            const zEntry = await this.zerei.likeAGame(game.$id, this.pageState.zEntry())
            if (zEntry) this.pageState.updateZEntry(zEntry)
        }
    }

    constructor() {
        effect(async () => {
            const slug = this.slug();
            if (!slug) return;

            await this.pageState.fetch(slug)
        });
    }
}
