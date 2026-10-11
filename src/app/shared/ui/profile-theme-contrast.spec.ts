import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileThemeContrast, profileForeground, profileReadableBackground } from './profile-theme-contrast';
@Component({ imports: [ProfileThemeContrast], template: '<section class="profile-theme-card" [class.has-theme]="!!background() || !!palette()" [profileThemeBackground]="background()" [profileThemePalette]="palette()"><button class="profile-theme-chip">Perfil</button></section><div class="outside" style="color:var(--gray-12)">App</div>' })
class Host { background = signal<string | null>('#112244'); palette = signal<{primaryColor?: string; secondaryColor?: string; tertiaryColor?: string} | null>(null); }
describe('Profile theme color context', () => {
  afterEach(() => document.documentElement.removeAttribute('data-color-mode'));
  it('uses contrasting foreground independently from interface mode', () => {
    expect(profileForeground('#112244')).toBe('#ffffff');
    expect(profileForeground('#fff4cc')).toBe('#000000');
    expect(profileForeground('#fff')).toBe('#000000');
    expect(profileReadableBackground('white')).toBe('#101113');
    expect(profileReadableBackground('#ffff')).toBe('#101113');
  });
  it('preserves historical text and transparent controls across global modes without adding surfaces', () => {
    const fixture = TestBed.createComponent(Host); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement.querySelector('section');
    for (const mode of ['light', 'dark']) {
      document.documentElement.setAttribute('data-color-mode', mode);
      expect(getComputedStyle(element).color).toBe('rgb(237, 238, 240)');
      expect(getComputedStyle(element.querySelector('button')!).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(element.style.getPropertyValue('--profile-readable-surface')).toBe('');
      expect(element.style.getPropertyValue('--gray-3')).toBe('');
    }
    fixture.componentInstance.background.set('#fff4cc'); fixture.detectChanges();
    expect(getComputedStyle(element).color).toBe('rgb(0, 0, 0)');
    expect(element.style.getPropertyValue('--focus-ring')).toBe('var(--gray-12)');
  });
  it('cleans the local palette after theme removal and keeps it for image-only themes', () => {
    const fixture = TestBed.createComponent(Host); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement.querySelector('section');
    fixture.componentInstance.background.set('#fff4cc'); fixture.detectChanges();
    fixture.componentInstance.background.set(null); fixture.componentInstance.palette.set({}); fixture.detectChanges();
    expect(element.classList.contains('color-mode-fixed-dark')).toBeTrue();
    expect(element.style.getPropertyValue('--gray-12')).toBe('');
    for (const mode of ['light', 'dark']) {
      document.documentElement.setAttribute('data-color-mode', mode);
      expect(getComputedStyle(element).backgroundColor).toBe('rgb(16, 17, 19)');
    }
    fixture.componentInstance.palette.set(null); fixture.detectChanges();
    expect(element.classList.contains('color-mode-fixed-dark')).toBeFalse();
    expect(element.style.color).toBe(''); expect(element.style.getPropertyValue('--focus-ring')).toBe('');
    document.documentElement.setAttribute('data-color-mode', 'light');
    expect(getComputedStyle(element).getPropertyValue('--gray-12')).toBe(getComputedStyle(fixture.nativeElement.querySelector('.outside')).getPropertyValue('--gray-12'));
  });
});
