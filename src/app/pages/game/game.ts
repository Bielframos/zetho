import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { UserStore } from '../../core/auth/user.store';
import { GamePageController } from '../../core/controllers/gamePage.controller';
import { UiGameCard } from '../../shared/ui/atoms/game-card/game-card';
import { UiGameHeader } from "./modules/game-header";
import { UiGameStats } from "./modules/game-stats";
import { UiZEntryActions } from './modules/z-entry-actions';
import { UiGameLobby } from "./modules/game-lobby";
import { UiGameActions } from "./modules/game-actions";
import { UiGameRating } from "./modules/game-rating";

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [UiGameCard, UiZEntryActions, RouterLink, UiGameHeader, UiGameStats, UiGameLobby, UiGameActions, UiGameRating],
    templateUrl: './game.html'
})
export class Game {
    /* ---------------------------------------------------------
     * INJEÇÕES DE DEPENDÊNCIA
     * --------------------------------------------------------- */
    private title = inject(Title);
    private route = inject(ActivatedRoute);
    controller = inject(GamePageController)
    userStore = inject(UserStore);

    // Slug vindo da rota
    slug = toSignal(
        this.route.paramMap.pipe(map(params => params.get('slug'))),
        { initialValue: null }
    );

    /* ---------------------------------------------------------
     * CICLO DE VIDA VIA SIGNAL EFFECTS
     * --------------------------------------------------------- */
    constructor() {
        // Atualiza o estado quando o slug mudar
        effect(() => {
            const slug = this.slug();
            if (slug) this.controller.init(slug);
        });

        // Atualiza o título da página quando o jogo carregar
        effect(() => {
            const game = this.controller.game();
            if (game) this.title.setTitle(`${game.name} — Zerei`);
        });
    }
}
