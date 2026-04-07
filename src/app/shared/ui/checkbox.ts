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
      class="group flex gap-2 items-center cursor-pointer"
    >
      <div
        class="flex items-center justify-center w-6 aspect-square rounded-sm bg-blue-1/60 border border-gray-6 group-has-checked:bg-blue-9"
      >
        <i
          class="ph ph-check text-white text-sm hidden group-has-checked:block"
        ></i>
      </div>

      <span class="flex flex-col gap-0.5 text-white">
        {{ label() }}
        @if (description()) {
          <span class="text-gray-11 text-sm">{{ description() }}</span>
        }
      </span>

      <input
        [id]="name()"
        [name]="name()"
        type="checkbox"
        class="hidden"
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
