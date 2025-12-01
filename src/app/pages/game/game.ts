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
import { UiGameUserActions } from './modules/game-user-actions';
import { UiGameLobby } from "./modules/game-lobby";

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [UiGameCard, UiGameUserActions, RouterLink, UiGameHeader, UiGameStats, UiGameLobby],
    templateUrl: './game.html'
})
export class Game {
    /* ---------------------------------------------------------
     * INJEÇÕES DE DEPENDÊNCIA
     * --------------------------------------------------------- */
    private title = inject(Title);
    private gameController = inject(GamePageController)
    private route = inject(ActivatedRoute);
    userStore = inject(UserStore);

    /* ---------------------------------------------------------
     * ESTADO
     * --------------------------------------------------------- */
    pageState = this.gameController.create();

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
            if (slug) this.pageState.fetch(slug);
        });

        // Atualiza o título da página quando o jogo carregar
        effect(() => {
            const game = this.pageState.game();
            if (game) this.title.setTitle(`${game.name} — Zerei`);
        });
    }
}
