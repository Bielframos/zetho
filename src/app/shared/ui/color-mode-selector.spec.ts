import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  ColorModeStore,
  type ColorPreference,
  type SpecialAppearance,
} from '../../core/system/color-mode/color-mode.store';
import { SpecialThemesStore } from '../../core/themes/special-themes.store';
import type { SpecialTheme } from '../../core/themes/themes.types';
import { ColorModeSelector } from './color-mode-selector';

describe('ColorModeSelector', () => {
  let fixture: ComponentFixture<ColorModeSelector>;
  const preference = signal<ColorPreference>('system');
  const special = signal<SpecialAppearance | null>(null);
  const available = signal<SpecialTheme[]>([]);
  const selectedId = signal<string | null>(null);
  const selectStandard = jasmine
    .createSpy('selectStandard')
    .and.callFake((value) => preference.set(value));
  const select = jasmine
    .createSpy('select')
    .and.callFake((id) => selectedId.set(id));

  beforeEach(async () => {
    preference.set('system');
    special.set(null);
    available.set([]);
    selectedId.set(null);
    selectStandard.calls.reset();
    select.calls.reset();
    await TestBed.configureTestingModule({
      imports: [ColorModeSelector],
      providers: [
        provideRouter([]),
        { provide: ColorModeStore, useValue: { preference, special } },
        {
          provide: SpecialThemesStore,
          useValue: {
            available,
            selectedId,
            select,
            selectStandard,
            loading: () => false,
            failed: () => false,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ColorModeSelector);
    fixture.detectChanges();
  });

  it('shows three standard controls and a fourth control for special themes', () => {
    const controls = Array.from(
      fixture.nativeElement.querySelectorAll('button, summary'),
    ) as HTMLElement[];
    expect(
      controls.map((control) => control.getAttribute('aria-label')),
    ).toEqual(['Claro', 'Escuro', 'Sistema', 'Temas especiais']);
    expect(
      controls.every((control) => control.classList.contains('size-11')),
    ).toBeTrue();
    expect(controls[2].getAttribute('aria-pressed')).toBe('true');
    controls[1].click();
    fixture.detectChanges();
    expect(selectStandard).toHaveBeenCalledOnceWith('dark');
    expect(controls[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('offers the campaign before ownership and selects Tropical 6 after ownership', () => {
    const menu: HTMLDetailsElement =
      fixture.nativeElement.querySelector('details');
    menu.open = true;
    expect(menu.querySelector('button')).toBeNull();
    expect(menu.querySelector('a')?.getAttribute('href')).toBe(
      '/temas/tropical-6',
    );
    expect(menu.querySelector('a .ph-tree-palm')).not.toBeNull();

    available.set([
      { id: 'tropical-6', name: 'Tropical 6', appearance: 'tropical-6' },
    ]);
    fixture.detectChanges();
    const option = menu.querySelector('button')!;
    expect(option.getAttribute('aria-label')).toBe('Tropical 6');
    expect(option.querySelector('.ph-tree-palm')).not.toBeNull();
    expect(menu.querySelector('a')).toBeNull();
    option.click();
    fixture.detectChanges();
    expect(select).toHaveBeenCalledOnceWith('tropical-6');
    expect(menu.open).toBeFalse();
    expect(menu.querySelector('button[aria-label="Tropical 6"]')).toBeNull();
    expect(menu.querySelector('summary .ph-tree-palm')).not.toBeNull();
  });
});
