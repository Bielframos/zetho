import { Component, EventEmitter, input, Output } from '@angular/core';
import { AppStartingRating } from '../../../../../shared/ui/star-rating/star-rating';
import { GameRow } from '../../../game.types';

@Component({
  selector: 'ui-game-rating',
  standalone: true,
  imports: [AppStartingRating],
  template: `
    <div
      class="p-6 bg-gray-2 animate-fade-in-slide rounded-2xl mt-4 flex gap-4 justify-between items-end"
      style="animation-delay: 300ms"
    >
      <div class="flex gap-4 items-end" [class.animate-pulse]="loading() || !game()">
        @if (game()) {
          <h3 class="text-6xl max-w-xl">{{ game()?.ratingAvg ?? '0.0' }}</h3>
          <div>
            <span class="text-sm text-gray-11"
              >{{ game()?.ratingCount ?? 0 }} Avaliações</span
            >
            <div class="-ml-2 mt-1"><app-star-rating [value]="game()?.ratingAvg ?? 0" [readonly]="true"></app-star-rating></div>
          </div>
        } @else {
          <h3 class="text-6xl max-w-xl text-gray-11">...</h3>
          <div>
            <span class="text-sm text-gray-11">Carregando nota...</span>
            <div class="-ml-2 mt-1"><app-star-rating [value]="0" [readonly]="true"></app-star-rating></div>
          </div>
        }
      </div>
      <button class="text-blue-11 hover:underline hover:text-blue-9 cursor-pointer"
        [disabled]="loading() || !game()"
        (click)="viewReviews.emit()"
        >Ver avaliações</button
      >
    </div>
  `,
})
export class UiGameRating {
  game = input.required<GameRow | null>();
  loading = input<boolean>(false);
  @Output() viewReviews = new EventEmitter<void>();
}
