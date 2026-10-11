import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileThemeContrast, profileForeground, profileReadableBackground } from './profile-theme-contrast';
@Component({ imports: [ProfileThemeContrast], template: '<section [profileThemeBackground]="background()" [profileThemePalette]="palette()">Perfil</section>' })
class Host { background = signal<string | null>('#112244'); palette = signal<{primaryColor?: string; secondaryColor?: string; tertiaryColor?: string} | null>(null); }
describe('Profile theme color context', () => {
  it('uses contrasting foreground independently from interface mode', () => {
    expect(profileForeground('#112244')).toBe('#ffffff');
    expect(profileForeground('#fff4cc')).toBe('#000000');
    expect(profileForeground('#fff')).toBe('#000000');
    expect(profileReadableBackground('white')).toBe('#101113');
    expect(profileReadableBackground('#ffff')).toBe('#101113');
  });
  it('updates inherited text/surfaces and removes local styles when theme is removed', () => {
    const fixture = TestBed.createComponent(Host); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement.querySelector('section');
    expect(element.style.color).toBe('rgb(255, 255, 255)');
    fixture.componentInstance.background.set('#fff4cc'); fixture.detectChanges();
    expect(element.style.color).toBe('rgb(0, 0, 0)');
    expect(element.style.getPropertyValue('--focus-ring')).toBe('#000000');
    expect(element.style.getPropertyValue('--gray-3')).not.toBe('#fff4cc');
    expect(element.style.getPropertyValue('--profile-readable-surface')).toBe('#fff4cc');
    fixture.componentInstance.background.set(null); fixture.detectChanges();
    expect(element.style.color).toBe('');
    expect(element.style.getPropertyValue('--gray-3')).toBe('');
  });
  it('keeps equipped accent colors and their contrasting foregrounds across palette changes', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.palette.set({ primaryColor: '#ffff00', secondaryColor: '#00ffff', tertiaryColor: '#220044' });
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement.querySelector('section');
    expect(element.style.getPropertyValue('--profile-accent-surface')).toBe('#ffff00');
    expect(element.style.getPropertyValue('--profile-accent-content')).toBe('#000000');
    expect(element.style.getPropertyValue('--profile-badge-content')).toBe('#ffffff');
    fixture.componentInstance.palette.set({ primaryColor: '#000044' }); fixture.detectChanges();
    expect(element.style.getPropertyValue('--profile-accent-content')).toBe('#ffffff');
    fixture.componentInstance.background.set(null); fixture.componentInstance.palette.set(null); fixture.detectChanges();
    expect(element.style.getPropertyValue('--profile-accent-surface')).toBe('');
    expect(element.style.getPropertyValue('--profile-border-color')).toBe('');
  });

});
