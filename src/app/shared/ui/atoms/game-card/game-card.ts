import { booleanAttribute, Component, computed, inject, input } from "@angular/core";
import { GameRow } from "../../../../core/types";
import { NgTemplateOutlet } from "@angular/common";
import { RouterLink } from "@angular/router";
import { GameStore } from "../../../../core/stores/game.store";

@Component({
    selector: 'ui-game-card',
    standalone: true,
    templateUrl: './game-card.html',
    styleUrl: './game-card.css',
    imports: [NgTemplateOutlet, RouterLink]
})
export class UiGameCard {
    private gameStore = inject(GameStore)
    game = input<GameRow | null>(null)
    width = input<number>()
    readonlyMode = input(false, { transform: booleanAttribute })

    updateGame() {
        if (this.game()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.gameStore.setGame(this.game()!)
        }
    }
}