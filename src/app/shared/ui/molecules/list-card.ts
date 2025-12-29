import { Component, input } from '@angular/core';
import { ZereiListRow } from '../../../core/types';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-list-card',
  standalone: true,
  template: `
    <li class="flex items-center gap-6 p-4">
      @if (list().latestAdditions?.length === 0) {
        <a
          routerLink="/buscar"
          class="background-pattern w-24 aspect-3/4 rounded-lg border border-dashed border-gray-6 flex items-center justify-center"
        >
          <i class="ph ph-plus-circle text-[24px]"></i>
        </a>
      }

      <div class="flex-1">
        <span>{{ list().title }}</span>
        <br>
        @if (list().itemCount === 0) {
          <span class="text-gray-11 font-light">Essa lista está vazia</span>
        }
      </div>

      <a
        [routerLink]="['player', ownerGamertag(), 'listas', list().slug]"
        class="ui-secondary-btn"
        data-size="icon"
      >
        <i class="ph ph-arrow-right"></i>
      </a>
    </li>
  `,
  imports: [RouterLink],
})
export class UiListCard {
  ownerGamertag = input.required<string>();
  list = input.required<ZereiListRow>();
}
