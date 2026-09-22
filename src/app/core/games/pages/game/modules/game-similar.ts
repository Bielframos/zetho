import { Component, input } from '@angular/core';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { GameWithEntry } from '../../../../../types';

@Component({
  selector: 'ui-game-similar',
  standalone: true,
  imports: [UiGameCard],
  template: `
    <ul class="grid grid-cols-3 gap-px">
      @for (game of games(); track game.$id) {
        <li>
          <ui-game-card
            [game]="game"
            transitionScope="similar"
            [entryStatus]="game.zEntry?.status"
          ></ui-game-card>
        </li>
      }
    </ul>
  `,
})
export class UiGameSimilar {
  games = input<GameWithEntry[]>([]);
}
