import { Component, input } from "@angular/core";
import { GameRow } from "../../../../core/types";

@Component({
    selector: 'ui-game-card',
    standalone: true,
    templateUrl: './game-card.html'
})
export class UiGameCard {
    game = input.required<GameRow>()
}