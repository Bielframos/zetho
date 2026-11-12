import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShortNumberPipe } from '../../utils/pipes';
import { ParsedZereiListRow } from '../../core/lists/lists.controller';

@Component({
  selector: 'ui-list-card',
  standalone: true,
  host: { class: 'block' },
  template: `
    <li>
      <a
        [routerLink]="
          link() ?? ['/player', ownerGamertag(), 'listas', list().slug]
        "
        class="flex min-w-0 items-center gap-4 px-4 py-4 hover:bg-gray-3 transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <div class="flex shrink-0 -space-x-10 sm:-space-x-14">
          @for (cover of covers(); track $index) {
            <img
              [src]="cover.url"
              [alt]="cover.alt"
              class="w-16 sm:w-24 aspect-3/4 object-cover rounded drop-shadow-lg"
            />
          } @empty {
            <div
              class="background-pattern w-16 sm:w-24 aspect-3/4 rounded-lg border border-dashed border-gray-6 flex items-center justify-center"
            >
              <i class="ph ph-plus-circle text-[24px]"></i>
            </div>
          }
        </div>

        <div class="flex min-w-0 flex-1 gap-4 items-center">
          <div class="flex-1 min-w-0">
            <span class="block truncate text-gray-12">{{ list().title }}</span>
            @if (showStatus()) {
              <span
                class="mt-2 inline-flex rounded-full px-2 py-1 text-xs"
                [class]="
                  list().status === 'published'
                    ? 'bg-blue-3 text-blue-11'
                    : 'bg-gray-3 text-gray-11'
                "
              >
                {{
                  list().status === 'draft'
                    ? 'Rascunho'
                    : list().status === 'archived'
                      ? 'Arquivada'
                      : 'Publicada'
                }}
              </span>
            }
            @if (list().itemCount === 0) {
              <span class="mt-1 block text-gray-11 font-light"
                >Essa lista está vazia</span
              >
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
  link = input<string[]>();
  showStatus = input(false);
  list = input.required<ParsedZereiListRow>();

  covers = computed(() => {
    const list = this.list();
    if (list.coverImageUrls && list.coverImageUrls.length > 0) {
      return list.coverImageUrls.slice(0, 3).map((url) => ({
        url,
        alt: `${list.title} cover`,
      }));
    }
    return (list.parsedLatestAdditions ?? []).slice(0, 3).map((item) => ({
      url: item.gameCoverUrl,
      alt: `${item.gameName} cover`,
    }));
  });
}
