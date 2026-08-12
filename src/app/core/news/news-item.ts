import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NewsSummary } from './news.types';

@Component({
  selector: 'app-news-item',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="group px-4 py-4">
      <div class="flex gap-3">
        <span
          class="pt-0.5 text-xs tabular-nums text-gray-10"
          aria-hidden="true"
          >{{ index() }}</span
        >
        <div class="min-w-0 flex-1">
          <a
            [routerLink]="['/noticias', news().slug]"
            class="text-base font-medium leading-snug text-gray-12 hover:text-blue-11 hover:underline"
          >
            {{ news().title }}
          </a>
          @if (news().subtitle) {
            <p class="mt-1 text-sm leading-6 text-gray-11">
              {{ news().subtitle }}
            </p>
          }
          <div
            class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-10"
          >
            <span>{{ formatDate(news().$createdAt) }}</span>
            @if (news().author?.name) {
              <span>por {{ news().author?.name }}</span>
            }
            @for (tag of news().tags.slice(0, 3); track tag) {
              <span class="text-blue-11">#{{ tag }}</span>
            }
          </div>
        </div>
      </div>
    </article>
  `,
})
export class NewsItemComponent {
  news = input.required<NewsSummary>();
  index = input<number | null>(null);

  formatDate(value: string) {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
