import { Component, input } from '@angular/core';
import { GameRow } from '../../../types';
import { AppStartingRating } from '../../../shared/ui/star-rating/star-rating';

@Component({
  selector: 'ui-game-rating',
  standalone: true,
  imports: [AppStartingRating],
  template: `
    <div
      class="p-6 bg-blue-2 rounded-2xl mt-4 flex gap-4 justify-between items-end"
    >
      <div class="flex gap-4 items-end">
        <h3 class="text-6xl max-w-xl">{{ game()?.ratingAvg ?? '0.0' }}</h3>
        <div>
          <span class="text-sm text-gray-11"
            >{{ game()?.ratingCount ?? 0 }} Avaliações</span
          >
          <div class="-ml-2 mt-1"><app-star-rating></app-star-rating></div>
        </div>
      </div>
      <a href="" class="text-blue-11 hover:underline hover:text-blue-9"
        >Ver avaliações</a
      >
    </div>
  `,
})
export class UiGameRating {
  game = input.required<GameRow | null>();
}
