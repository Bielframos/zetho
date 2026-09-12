import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface UiSegmentOption<T extends string | number = string> {
  id: T;
  label: string;
  disabled?: boolean;
}

/** Compact single-choice switcher; each page owns the selected content. */
@Component({
  selector: 'ui-segmented-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div role="group" [attr.aria-label]="label()" class="flex border border-gray-6 p-1">
      @for (option of options(); track option.id) {
        <button
          type="button"
          class="h-6 min-w-0 flex-1 cursor-pointer whitespace-nowrap px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-6 disabled:pointer-events-none disabled:text-gray-10"
          [class.bg-gray-3]="value() === option.id"
          [class.text-gray-12]="value() === option.id"
          [class.hover:bg-gray-4]="value() === option.id"
          [class.text-gray-11]="value() !== option.id"
          [class.hover:bg-gray-3]="value() !== option.id"
          [attr.aria-pressed]="value() === option.id"
          [disabled]="option.disabled ?? false"
          (click)="valueChange.emit(option.id)"
        >{{ option.label }}</button>
      }
    </div>
  `,
})
export class UiSegmentedControl<T extends string | number> {
  readonly label = input.required<string>();
  readonly options = input.required<readonly UiSegmentOption<T>[]>();
  readonly value = input.required<T>();
  readonly valueChange = output<T>();
}
