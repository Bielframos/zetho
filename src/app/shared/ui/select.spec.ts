import { TestBed } from '@angular/core/testing';
import { UiSelect } from './select';

describe('UiSelect', () => {
  function setup(disabled = false) {
    const fixture = TestBed.createComponent(UiSelect);
    fixture.componentRef.setInput('label', 'Conclusão');
    fixture.componentRef.setInput('options', [
      { value: '', label: 'Não informado' },
      { value: 'main', label: 'Campanha' },
    ]);
    fixture.componentRef.setInput('disabled', disabled);
    fixture.detectChanges();
    return fixture;
  }
  it('selects with the keyboard and exposes the selected value accessibly', () => {
    const fixture = setup();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    for (const key of ['Enter', 'ArrowDown', 'Enter']) {
      button.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      );
      fixture.detectChanges();
    }
    expect(fixture.componentInstance.value()).toBe('main');
    expect(button.textContent).toContain('Campanha');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
  it('dismisses with Escape without changing the saved selection', () => {
    const fixture = setup();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.click();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
    expect(fixture.nativeElement.querySelector('[role=listbox]')).toBeNull();
  });
  it('does not open or change a disabled selection', () => {
    const fixture = setup(true);
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.click();
    expect(button.disabled).toBeTrue();
    expect(fixture.componentInstance.open()).toBeFalse();
  });
  it('filters by platform abbreviation and selects the filtered option', () => {
    const fixture = setup();
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('options', [
      { value: 'ps3', label: 'PlayStation 3', searchText: 'PS3', logo: '/icons/platforms/playstation.svg' },
      { value: 'pc', label: 'PC' },
    ]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const search: HTMLInputElement = fixture.nativeElement.querySelector('input');
    search.value = 'ps3';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role=option]').length).toBe(1);
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('ps3');
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('PlayStation 3');
  });

});
