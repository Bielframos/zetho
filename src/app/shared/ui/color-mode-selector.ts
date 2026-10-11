import { Component, inject } from '@angular/core';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';

@Component({
  selector: 'ui-color-mode-selector',
  template: `
    <fieldset class="my-2 flex justify-start text-content">
      <legend class="sr-only">Aparência</legend>
      <div class="inline-flex justify-start gap-0">
        @for (option of options; track option.value) {
          <button type="button" class="flex size-11 cursor-pointer items-center justify-center rounded-md p-0 text-content-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            [attr.aria-label]="option.label" [title]="option.label"
            [attr.aria-pressed]="store.preference() === option.value" (click)="store.select(option.value)">
            <span class="flex size-7 items-center justify-center rounded-md text-base hover:bg-surface-hover"
              [class.bg-surface-raised]="store.preference() === option.value" [class.text-link]="store.preference() === option.value">
              <i aria-hidden="true" [class]="option.icon"></i>
            </span>
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
