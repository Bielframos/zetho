// TODO: Estilizar o componente adequadamente
import { Component, forwardRef, input, signal } from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'ui-toggle',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiToggle),
      multi: true,
    },
  ],
  template: `
    <div class="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="isChecked()"
        [class.bg-blue-9]="isChecked()"
        [class.bg-gray-8]="!isChecked()"
        class="relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-9"
        (click)="onToggle()"
      >
        <span
          [class.translate-x-7]="isChecked()"
          class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 flex items-center justify-center"
        >
          @if (isChecked()) {
            <i class="ph ph-check text-blue-9 text-sm"></i>
          } @else {
            <i class="ph ph-x text-gray-8 text-sm"></i>
          }
        </span>
      </button>

      @if (label()) {
        <label class="text-white cursor-pointer select-none">
          {{ label() }}
        </label>
      }
    </div>
  `,
})
export class UiToggle {
  label = input<string>();
  isChecked = signal(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  onToggle(): void {
    this.isChecked.update((state) => !state);
    this.onChange(this.isChecked());
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.isChecked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(): void {
    // Implement if needed
  }
}
