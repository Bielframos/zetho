import { Component, computed, input } from '@angular/core';
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
        class="flex flex-row items-end gap-6 px-4 hover:bg-gray-3 transition-colors"
      >
        <div class="flex -space-x-14">
          @for (cover of covers(); track $index) {
            <img
              [src]="cover.url"
              [alt]="cover.alt"
              class="w-24 h-auto drop-shadow-lg"
            />
          } @empty {
            <div
              class="background-pattern w-24 aspect-3/4 rounded-lg border border-dashed border-gray-6 flex items-center justify-center"
            >
              <i class="ph ph-plus-circle text-[24px]"></i>
            </div>
          }
        </div>

        <div class="flex flex-1 max-md:w-full gap-4 items-center py-4">
          <div class="flex-1 min-w-0">
            <span class="block truncate text-gray-12">{{ list().title }}</span>
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

  covers = computed(() => {
    const list = this.list();
    if (list.coverImageUrls && list.coverImageUrls.length > 0) {
      return list.coverImageUrls.map((url) => ({
        url,
        alt: `${list.title} cover`,
      }));
    }
    return (list.parsedLatestAdditions ?? []).map((item) => ({
      url: item.gameCoverUrl,
      alt: `${item.gameName} cover`,
    }));
  });
}
