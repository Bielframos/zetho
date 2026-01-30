import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShortNumberPipe } from '../../utils/pipes';
import { ParsedZereiListRow } from '../../core/lists/lists.controller';

@Component({
  selector: 'ui-list-card',
  standalone: true,
  template: `
    <li>
      <a
        [routerLink]="['/player', ownerGamertag(), 'listas', list().slug]"
        class="flex flex-row items-end gap-6 p-4 bg-blue-2 rounded-2xl hover:bg-blue-3 transition-colors"
      >
        <div class="flex -space-x-14">
          @for (lastAddition of list().parsedLatestAdditions; track $index) {
            <img
              [src]="lastAddition.gameCoverUrl"
              [alt]="lastAddition.gameName + ' cover'"
              class="w-24 h-auto rounded-xl drop-shadow-lg drop-shadow-blue-2"
            />
          } @empty {
            <a
              routerLink="/buscar"
              class="background-pattern w-24 aspect-3/4 rounded-lg border border-dashed border-gray-6 flex items-center justify-center"
            >
              <i class="ph ph-plus-circle text-[24px]"></i>
            </a>
          }
        </div>

        <div class="flex flex-1 max-md:w-full gap-4 items-center">
          <div class="flex-1">
            <span>{{ list().title }}</span>
            <br />
            @if (list().itemCount === 0) {
              <span class="text-gray-11 font-light">Essa lista está vazia</span>
            } @else {
              <span class="flex items-center gap-2 mt-1 text-gray-11"
                ><i class="ph-fill ph-game-controller text-[18px]"></i>
                {{ list().itemCount | shortNumber }}</span
              >
            }
          </div>
        </div>
      </a>
    </li>
  `,
  imports: [RouterLink, ShortNumberPipe],
})
export class UiListCard {
  ownerGamertag = input.required<string>();
  list = input.required<ParsedZereiListRow>();
}
