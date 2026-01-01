import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParsedZereiListRow } from '../../../core/controllers/lists.controller';
import { ShortNumberPipe } from '../../../core/modules/pipes';

@Component({
  selector: 'ui-list-card',
  standalone: true,
  template: `
    <li class="flex flex-col md:flex-row items-center gap-6 p-4 border-b border-gray-6">
      <div class="flex md:-space-x-14 max-md:mx-auto max-md:gap-2">
        @for (lastAddition of list().parsedLatestAdditions; track $index) {
          <img
            [src]="lastAddition.gameCoverUrl"
            [alt]="lastAddition.gameName + ' cover'"
            class="w-24 h-auto rounded-xl drop-shadow-lg drop-shadow-blue-2"
          />
        } @empty {
          <div>
            <div
            class="background-pattern w-24 aspect-3/4 rounded-lg border border-dashed border-gray-6 flex items-center justify-center md:hidden scale-75 -rotate-6"
          >
            <i class="ph ph-game-controller text-[24px]"></i>
          </div>

          <a
            routerLink="/buscar"
            class="background-pattern w-24 aspect-3/4 rounded-lg border border-dashed border-gray-6 flex items-center justify-center"
          >
            <i class="ph ph-plus-circle text-[24px]"></i>
          </a>

           <div
            class="background-pattern w-24 aspect-3/4 rounded-lg border border-dashed border-gray-6 flex items-center justify-center md:hidden scale-75 rotate-6"
          >
            <i class="ph ph-game-controller text-[24px]"></i>
          </div>
          </div>
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

        <a
          [routerLink]="['/player', ownerGamertag(), 'listas', list().slug]"
          class="ui-secondary-btn"
          data-size="icon"
        >
          <i class="ph ph-arrow-right"></i>
        </a>
      </div>
    </li>
  `,
  imports: [RouterLink, ShortNumberPipe],
})
export class UiListCard {
  ownerGamertag = input.required<string>();
  list = input.required<ParsedZereiListRow>();
}
