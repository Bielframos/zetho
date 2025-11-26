import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { UserStore } from '../../core/auth/user.store';
import { ShortNumberPipe } from '../../core/modules/pipes';
import { ZEntry } from '../../core/types';
import { ZereiService } from '../../core/zerei/zerei.service';
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [UiGameCard, ShortNumberPipe, RouterLink],
    templateUrl: './game.html'
})
export class Game {
    private title = inject(Title)
    private zerei = inject(ZereiService);
    private route = inject(ActivatedRoute);
    userStore = inject(UserStore);
    pageState = this.zerei.createGamePageState()

    // Evita spam de likes
    private isLiking = signal(false);

    slug = toSignal(
        this.route.paramMap.pipe(map(params => params.get('slug'))),
        { initialValue: null }
    );

    async handleZEntry(status: ZEntry['status']) {
        const game = this.pageState.game()
        const existingZEntry = this.pageState.zEntry()

        if (game) {
            const newStatus = status === this.pageState.zEntry()?.status ? null : status
            const zEntry = await this.zerei.createZEntry({
                zEntryId: existingZEntry?.$id,
                gameId: game.$id,
                status: newStatus,
                prev: this.pageState.zEntry()
            })
            if (zEntry) this.pageState.updateZEntry(zEntry)
        }
    }

    async handleLike() {
        const game = this.pageState.game()
        const existingZEntry = this.pageState.zEntry()

        if (this.isLiking()) return;
        this.isLiking.set(true);

        try {
            if (game) {
                const zEntry = await this.zerei.likeAGame({
                    zEntryId: existingZEntry?.$id,
                    gameId: game.$id,
                    prev: this.pageState.zEntry()
                });

                if (zEntry) this.pageState.updateZEntry(zEntry)
            }
        } finally {
            this.isLiking.set(false);
        }
    }

    constructor() {
        effect(() => {
            const slug = this.slug();
            if (!slug) return;

            this.pageState.fetch(slug)
        });

        effect(() => {
            const game = this.pageState.game()
            this.title.setTitle(`${game?.name} — Zerei`)
        })
    }
}
