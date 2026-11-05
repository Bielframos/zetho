import { Component, forwardRef, input } from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckbox),
      multi: true,
    },
  ],
  template: `
    <label
      [htmlFor]="name()"
      class="group flex items-start gap-2.5 cursor-pointer outline-none select-none"
    >
      <div
        class="shrink-0 flex items-center justify-center w-5 h-5 mt-0.5 rounded-sm bg-blue-1/60 border border-line-strong transition-colors duration-150 group-has-checked:bg-blue-9 group-has-checked:border-blue-9 outline-none"
      >
        <i
          class="ph ph-check text-white text-xs font-bold hidden group-has-checked:block"
        ></i>
      </div>

      <span class="flex flex-col gap-0.5 text-content">
        <span class="text-sm font-medium leading-5 text-gray-12">{{ label() }}</span>
        @if (description()) {
          <span class="text-xs leading-relaxed text-gray-11">{{ description() }}</span>
        }
      </span>

      <input
        [id]="name()"
        [name]="name()"
        type="checkbox"
        class="sr-only"
        [checked]="value"
        (change)="onToggle($event)"
      />
    </label>
  `,
})
export class UiCheckbox {
  name = input.required<string>();
  label = input.required<string>();
  description = input('');

  // Reactive form
  value = false;

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  writeValue(value: boolean): void {
    this.value = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onToggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.value = checked;
    this.onChange(checked);
    this.onTouched();
  }
}
