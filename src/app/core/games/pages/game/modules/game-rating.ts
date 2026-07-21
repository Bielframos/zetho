import { Component, EventEmitter, input, Output } from '@angular/core';
import { GameRow } from '../../../game.types';

@Component({
  selector: 'ui-game-rating',
  standalone: true,
  template: `
    <button
      type="button"
      class="flex cursor-pointer items-center gap-1.5 rounded-lg text-gray-12 transition-colors hover:text-blue-11 disabled:pointer-events-none disabled:text-gray-10 animate-fade-in-slide"
      [class.animate-pulse]="loading() || !game()"
      [disabled]="loading() || !game()"
      (click)="viewReviews.emit()"
      [attr.aria-label]="
        'Nota ' + (game()?.ratingAvg ?? '0.0') + ' de 5. Ver avaliações'
      "
    >
      <i class="ph-fill ph-star text-amber-300"></i>
      <span class="text-lg leading-none tabular-nums">
        {{ game()?.ratingAvg ?? '0.0' }}
      </span>
    </button>
  `,
})
export class UiGameRating {
  game = input.required<GameRow | null>();
  loading = input<boolean>(false);
  @Output() viewReviews = new EventEmitter<void>();
}
