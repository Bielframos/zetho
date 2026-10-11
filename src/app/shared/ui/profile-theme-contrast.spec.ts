import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileThemeContrast, profileForeground, profileReadableBackground } from './profile-theme-contrast';
@Component({ imports: [ProfileThemeContrast], template: '<section [profileThemeBackground]="background()">Perfil</section>' })
class Host { background = signal<string | null>('#112244'); }
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
    expect(element.style.getPropertyValue('--gray-3')).toBe('#fff4cc');
    fixture.componentInstance.background.set(null); fixture.detectChanges();
    expect(element.style.color).toBe('');
    expect(element.style.getPropertyValue('--gray-3')).toBe('');
  });
});
