import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameStore } from '../../../core/games/game.store';
import { GameRow } from '../../../types';

@Component({
  selector: 'ui-game-card',
  standalone: true,
  templateUrl: './game-card.html',
  styleUrl: './game-card.css',
  imports: [NgTemplateOutlet, RouterLink],
})
export class UiGameCard {
  private gameStore = inject(GameStore);

  game = input.required<GameRow>();
  width = input<number>();
  readonlyMode = input(false, { transform: booleanAttribute });

  displayGame = computed(() => this.game() || this.gameStore.currentGame());

  updateGame() {
    if (this.game()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.gameStore.setGame(this.game()!);
    }
  }
}
