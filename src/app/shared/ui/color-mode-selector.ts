import { Component, inject } from '@angular/core';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';

@Component({
  selector: 'ui-color-mode-selector',
  template: `
    <fieldset class="my-3 rounded-lg border border-line px-3 pb-3 text-content">
      <legend class="px-1 text-xs text-content-muted">Aparência</legend>
      <div class="mt-1 grid grid-cols-3 gap-1">
        @for (option of options; track option.value) {
          <button type="button" class="min-h-11 cursor-pointer rounded-md px-2 text-xs text-content-muted hover:bg-surface-hover aria-pressed:hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            [class.bg-accent]="store.preference() === option.value" [class.text-on-accent]="store.preference() === option.value"
            [attr.aria-pressed]="store.preference() === option.value" (click)="store.select(option.value)">{{ option.label }}</button>
        }
      </div>
    </fieldset>
  `,
})
export class ColorModeSelector {
  readonly store = inject(ColorModeStore);
  readonly options = [{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'system', label: 'Sistema' }] as const;
}
