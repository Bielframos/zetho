import { Component, EventEmitter, input, Output } from '@angular/core';
import { AppStartingRating } from '../../../../../shared/ui/star-rating/star-rating';
import { GameRow } from '../../../game.types';

@Component({
  selector: 'ui-game-rating',
  standalone: true,
  imports: [AppStartingRating],
  template: `
    <div
      class="flex items-end justify-between gap-4 border-y-8 border-gray-6 px-4 py-5 animate-fade-in-slide"
      style="animation-delay: 300ms"
    >
      <div
        class="flex items-end gap-4"
        [class.animate-pulse]="loading() || !game()"
      >
        @if (game()) {
          <h3 class="max-w-xl text-6xl leading-none">
            {{ game()?.ratingAvg ?? '0.0' }}
          </h3>
          <div>
            <span class="text-sm text-gray-11"
              >{{ game()?.ratingCount ?? 0 }} Avaliações</span
            >
            <div class="-ml-2 mt-1">
              <app-star-rating
                [value]="game()?.ratingAvg ?? 0"
                [readonly]="true"
              ></app-star-rating>
            </div>
          </div>
        } @else {
          <h3 class="text-6xl max-w-xl text-gray-11">...</h3>
          <div>
            <span class="text-sm text-gray-11">Carregando nota...</span>
            <div class="-ml-2 mt-1">
              <app-star-rating [value]="0" [readonly]="true"></app-star-rating>
            </div>
          </div>
        }
      </div>
      <button
        class="cursor-pointer text-blue-11 transition-colors hover:text-blue-9 hover:underline disabled:pointer-events-none disabled:text-gray-10"
        [disabled]="loading() || !game()"
        (click)="viewReviews.emit()"
      >
        Ver avaliações
      </button>
    </div>
  `,
})
export class UiGameRating {
  game = input.required<GameRow | null>();
  loading = input<boolean>(false);
  @Output() viewReviews = new EventEmitter<void>();
}
