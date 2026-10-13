import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';
import { ColorModeSelector } from './color-mode-selector';

describe('ColorModeSelector', () => {
  let fixture: ComponentFixture<ColorModeSelector>;
  const preference = signal<'light' | 'dark' | 'system'>('system');
  const select = jasmine
    .createSpy('select')
    .and.callFake((value) => preference.set(value));

  beforeEach(async () => {
    preference.set('system');
    select.calls.reset();
    await TestBed.configureTestingModule({
      imports: [ColorModeSelector],
      providers: [
        {
          provide: ColorModeStore,
          useValue: { preference, select },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ColorModeSelector);
    fixture.detectChanges();
  });

  it('renders three accessible 16px icons with touch-sized controls', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Claro',
      'Escuro',
      'Sistema',
    ]);
    expect(
      buttons.every((button) => button.classList.contains('size-11')),
    ).toBeTrue();
    expect(
      buttons.every((button) =>
        button.querySelector('i')?.classList.contains('text-[16px]'),
      ),
    ).toBeTrue();
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('selects a mode and exposes the updated pressed state', () => {
    const dark = fixture.nativeElement.querySelector(
      '[aria-label="Escuro"]',
    ) as HTMLButtonElement;
    dark.click();
    fixture.detectChanges();
    expect(select).toHaveBeenCalledOnceWith('dark');
    expect(dark.getAttribute('aria-pressed')).toBe('true');
  });
});
