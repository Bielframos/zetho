import { Component, inject } from '@angular/core';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';

@Component({
  selector: 'ui-color-mode-selector',
  host: {
    class: 'inline-flex shrink-0',
  },
  template: `
    <fieldset class="flex items-center text-content">
      <legend class="sr-only">Aparência</legend>
      <div class="inline-flex items-center gap-0.5">
        @for (option of options; track option.value) {
          <button
            type="button"
            class="flex size-11 cursor-pointer items-center justify-center rounded-md p-0 text-content-muted transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring lg:size-9"
            [attr.aria-label]="option.label"
            [title]="option.label"
            [attr.aria-pressed]="store.preference() === option.value"
            (click)="store.select(option.value)"
          >
            <span
              class="flex size-6 items-center justify-center rounded-md"
              [class.bg-surface-raised]="store.preference() === option.value"
              [class.text-link]="store.preference() === option.value"
            >
              <i aria-hidden="true" [class]="option.icon + ' text-[16px]'"></i>
            </span>
          </button>
        }
      </div>
    </fieldset>
  `,
})
export class ColorModeSelector {
  readonly store = inject(ColorModeStore);
  readonly options = [
    { value: 'light', label: 'Claro', icon: 'ph ph-sun' },
    { value: 'dark', label: 'Escuro', icon: 'ph ph-moon' },
    { value: 'system', label: 'Sistema', icon: 'ph ph-monitor' },
  ] as const;
}
