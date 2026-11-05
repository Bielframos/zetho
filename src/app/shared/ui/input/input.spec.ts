import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiInput } from './input';

@Component({
  imports: [UiInput, ReactiveFormsModule],
  template: '<ui-input label="Nome" [formControl]="field" variant="secondary" />',
})
class InputForm {
  field = new FormControl<string | number | null>('');
}

describe('UiInput form values', () => {
  it('displays values loaded after the first render and later replacements', () => {
    const fixture = TestBed.createComponent(InputForm);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('');

    fixture.componentInstance.field.setValue('Jogador Teste');
    fixture.detectChanges();
    expect(input.value).toBe('Jogador Teste');

    fixture.componentInstance.field.setValue('Outro nome');
    fixture.detectChanges();
    expect(input.value).toBe('Outro nome');
  });

  it('preserves zero and clears a reset value', () => {
    const fixture = TestBed.createComponent(InputForm);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    fixture.componentInstance.field.setValue(0);
    fixture.detectChanges();
    expect(input.value).toBe('0');

    fixture.componentInstance.field.reset();
    fixture.detectChanges();
    expect(input.value).toBe('');
  });

  it('keeps typing connected to the form after a loaded value is displayed', () => {
    const fixture = TestBed.createComponent(InputForm);
    fixture.detectChanges();
    fixture.componentInstance.field.setValue('Nome carregado');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Nome editado';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.field.value).toBe('Nome editado');
    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.field.touched).toBeTrue();
  });
});
