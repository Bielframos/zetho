import { booleanAttribute, Component, input } from "@angular/core";
import { GameRow } from "../../../../core/types";
import { NgTemplateOutlet } from "@angular/common";

@Component({
    selector: 'ui-game-card',
    standalone: true,
    templateUrl: './game-card.html',
    imports: [NgTemplateOutlet]
})
export class UiGameCard {
    game = input.required<GameRow>()
    width = input<number>()
    readonlyMode = input(false, { transform: booleanAttribute })
}