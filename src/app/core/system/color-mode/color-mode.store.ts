import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { safeLocalStorage } from '../../../utils/platform-storage';
import '../../../../../public/color-mode.js';

const specialAppearances = ['tropical-6'] as const;
export type SpecialAppearance = (typeof specialAppearances)[number];
export type ColorPreference = 'light' | 'dark' | 'system';
export type ColorMode = Exclude<ColorPreference, 'system'> | SpecialAppearance;

export function isSpecialAppearance(value: string): value is SpecialAppearance {
  return specialAppearances.some((appearance) => appearance === value);
}
export const colorModeContract = (globalThis as unknown as { ZethoColorMode: {
  key: string;
  normalize(value: unknown): ColorPreference;
  resolve(preference: ColorPreference, dark: boolean): ColorMode;
  apply(document: Document, mode: ColorMode): void;
} }).ZethoColorMode;

@Injectable({ providedIn: 'root' })
export class ColorModeStore {
  private document = inject(DOCUMENT);
  private platform = inject(PLATFORM_ID);
  private destroy = inject(DestroyRef);
  private media?: MediaQueryList;
  private readonly specialSelection = signal<SpecialAppearance | null>(null);
  readonly special = this.specialSelection.asReadonly();
  readonly preference = signal<ColorPreference>('system');
  readonly effective = signal<ColorMode>('dark');

  constructor() {
    // Preserve SSR/initial hydration markup. Pre-paint script already chose CSS.
    afterNextRender(() => this.initialize());
  }

  initialize() {
    if (!isPlatformBrowser(this.platform) || this.media) return;
    const window = this.document.defaultView;
    if (!window) return;
    this.media = window.matchMedia('(prefers-color-scheme: dark)');
    this.preference.set(colorModeContract.normalize(safeLocalStorage.getItem(colorModeContract.key)));
    this.apply();
    const changed = () => { if (this.preference() === 'system') this.apply(); };
    const stored = (event: StorageEvent) => {
      if (event.storageArea) {
        try { if (event.storageArea !== window.localStorage) return; } catch { return; }
      }
      if (event.key !== colorModeContract.key && event.key !== null) return;
      this.preference.set(colorModeContract.normalize(event.newValue));
      this.apply();
    };
    this.media.addEventListener('change', changed);
    window.addEventListener('storage', stored);
    this.destroy.onDestroy(() => {
      this.media?.removeEventListener('change', changed);
      window.removeEventListener('storage', stored);
    });
  }

  select(preference: ColorPreference) {
    this.specialSelection.set(null);
    this.preference.set(colorModeContract.normalize(preference));
    safeLocalStorage.setItem(colorModeContract.key, this.preference());
    this.apply();
  }

  setSpecial(appearance: SpecialAppearance | null) {
    this.specialSelection.set(appearance);
    this.apply();
  }

  private apply() {
    if (!isPlatformBrowser(this.platform)) return;
    const mode = this.special() ?? colorModeContract.resolve(this.preference(), this.media?.matches ?? true);
    this.effective.set(mode);
    colorModeContract.apply(this.document, mode);
  }
}
