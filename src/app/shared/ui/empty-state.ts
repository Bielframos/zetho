import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    <div
      class="flex flex-col items-center justify-center text-center px-4 py-12"
      [class.border]="dashed()"
      [class.border-dashed]="dashed()"
      [class.border-gray-6]="dashed()"
      [class.rounded-lg]="dashed()"
    >
      @if (icon()) {
        <i [class]="icon()" class="text-[36px] text-gray-10 mb-3" aria-hidden="true"></i>
      }

      @switch (headingLevel()) {
        @case ('h1') {
          <h1 class="text-xl md:text-2xl font-medium text-gray-12 max-w-lg">{{ title() }}</h1>
        }
        @case ('h2') {
          <h2 class="text-xl md:text-2xl font-medium text-gray-12 max-w-lg">{{ title() }}</h2>
        }
        @case ('h3') {
          <h3 class="text-xl md:text-2xl font-medium text-gray-12 max-w-lg">{{ title() }}</h3>
        }
        @case ('p') {
          <p class="text-xl md:text-2xl font-medium text-gray-12 max-w-lg">{{ title() }}</p>
        }
        @default {
          <h2 class="text-xl md:text-2xl font-medium text-gray-12 max-w-lg">{{ title() }}</h2>
        }
      }

      @if (description()) {
        <p class="text-sm text-gray-11 max-w-md mt-2 leading-relaxed">
          {{ description() }}
        </p>
      }

      @if (actionLabel()) {
        @if (actionLink(); as link) {
          <a
            [routerLink]="link"
            class="ui-primary-btn mt-6"
            (click)="action.emit()"
          >
            {{ actionLabel() }}
          </a>
        } @else {
          <button
            type="button"
            class="ui-primary-btn mt-6"
            (click)="action.emit()"
          >
            {{ actionLabel() }}
          </button>
        }
      }

      <ng-content />
    </div>
  `,
})
export class UiEmptyState {
  readonly icon = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly actionLabel = input<string>();
  readonly actionLink = input<string | any[]>();
  readonly headingLevel = input<'h1' | 'h2' | 'h3' | 'p'>('h2');
  readonly dashed = input<boolean>(false);

  readonly action = output<void>();
}
