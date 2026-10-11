import { Component, inject } from '@angular/core';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';

@Component({
  selector: 'ui-color-mode-selector',
  template: `
    <fieldset class="my-3 flex justify-center text-content">
      <legend class="sr-only">Aparência</legend>
      <div class="inline-flex gap-1 rounded-lg border border-line p-1">
        @for (option of options; track option.value) {
          <button type="button" class="flex size-11 cursor-pointer items-center justify-center rounded-md text-xl text-content-muted hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            [class.bg-surface-raised]="store.preference() === option.value" [class.text-link]="store.preference() === option.value"
            [attr.aria-label]="option.label" [title]="option.label"
            [attr.aria-pressed]="store.preference() === option.value" (click)="store.select(option.value)">
            <i aria-hidden="true" [class]="option.icon"></i>
          </button>
        }
      </div>
    </fieldset>
  `,
})
export class ColorModeSelector {
  readonly store = inject(ColorModeStore);
  readonly options = [{ value: 'light', label: 'Claro', icon: 'ph ph-sun' }, { value: 'dark', label: 'Escuro', icon: 'ph ph-moon' }, { value: 'system', label: 'Sistema', icon: 'ph ph-monitor' }] as const;
}
