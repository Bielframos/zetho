import { NgClass } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Input,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInput),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiInput implements ControlValueAccessor {
  // Input
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() name = '';
  @Input() id = '';
  @Input() placeholder = '';
  @Input({ transform: booleanAttribute }) required = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() icon = '';
  @Input() variant: 'primary' | 'secondary' = 'primary';

  // Valor interno do input
  value = '';

  // Métodos padrão do ControlValueAccessor
  onChange = (value: any) => {};
  onTouched = () => {};

  // Método chamado pelo Angular para atualizar o valor no template
  writeValue(value: any): void {
    this.value = value || '';
  }

  // Registra o callback de mudança
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // Registra o callback de “toque”
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Quando o input muda
  handleChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  // Quando o input perde o foco
  handleBlur() {
    this.onTouched();
  }
}
