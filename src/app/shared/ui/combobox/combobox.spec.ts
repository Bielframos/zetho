import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { UiCombobox, UiComboboxOption } from './combobox';

describe('UiCombobox', () => {
  it('consumes Escape only while its dropdown is open, preserving a parent dialog', () => {
    const fixture = create(async () => []);
    fixture.componentInstance.isOpen.set(true);
    const firstEscape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    fixture.componentInstance.onKeydown(firstEscape);
    expect(firstEscape.defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.isOpen()).toBeFalse();

    const secondEscape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    fixture.componentInstance.onKeydown(secondEscape);
    expect(secondEscape.defaultPrevented).toBeFalse();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UiCombobox] });
  });

  function create(
    search: (query: string) => Promise<UiComboboxOption[]>,
    multiple = false,
  ) {
    const fixture = TestBed.createComponent(UiCombobox);
    fixture.componentRef.setInput('search', search);
    fixture.componentRef.setInput('debounceMs', 20);
    fixture.componentRef.setInput('multiple', multiple);
    fixture.detectChanges();
    return fixture;
  }

  it('debounces searches and renders the spinner inside the field', fakeAsync(() => {
    let resolve!: (value: UiComboboxOption[]) => void;
    const search = jasmine
      .createSpy('search')
      .and.returnValue(
        new Promise<UiComboboxOption[]>((done) => (resolve = done)),
      );
    const fixture = create(search);
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'zel';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(19);
    expect(search).not.toHaveBeenCalled();
    tick(1);
    fixture.detectChanges();
    expect(search).toHaveBeenCalledOnceWith('zel');
    expect(
      fixture.nativeElement.querySelector('.ph-spinner.animate-spin'),
    ).not.toBeNull();
    expect(input.getAttribute('aria-busy')).toBe('true');

    resolve([{ id: '1', label: 'Zelda' }]);
    flushMicrotasks();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Zelda');
  }));

  it('ignores a stale concurrent response', fakeAsync(() => {
    const resolvers = new Map<string, (value: UiComboboxOption[]) => void>();
    const fixture = create(
      (query) =>
        new Promise<UiComboboxOption[]>((resolve) =>
          resolvers.set(query, resolve),
        ),
    );
    const component = fixture.componentInstance;
    const event = (value: string) =>
      ({ target: { value } }) as unknown as Event;

    component.onInput(event('first'));
    tick(20);
    component.onInput(event('second'));
    tick(20);
    resolvers.get('second')?.([{ id: '2', label: 'Second' }]);
    flushMicrotasks();
    resolvers.get('first')?.([{ id: '1', label: 'First' }]);
    flushMicrotasks();

    expect(component.results()).toEqual([{ id: '2', label: 'Second' }]);
  }));

  it('supports keyboard selection and multiple values', () => {
    const fixture = create(async () => [], true);
    const component = fixture.componentInstance;
    component.results.set([
      { id: '1', label: 'One' },
      { id: '2', label: 'Two' },
    ]);
    component.isOpen.set(true);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.selectedOptions()).toEqual([{ id: '1', label: 'One' }]);
    component.selectOption({ id: '2', label: 'Two' });
    expect(component.selectedOptions().map((option) => option.id)).toEqual([
      '1',
      '2',
    ]);
  });
});
