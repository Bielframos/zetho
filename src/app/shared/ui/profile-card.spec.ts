import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { FounderDirectory } from './founder-badge';
import { UiProfileCard } from './profile-card';

describe('Profile card avatar', () => {
  it('falls back locally on image failure and tries a changed avatar URL', () => {
    TestBed.configureTestingModule({ imports: [UiProfileCard], providers: [provideRouter([]), { provide: FounderDirectory, useValue: { numbers: signal(new Map()), load: async () => {} } }] });
    const fixture = TestBed.createComponent(UiProfileCard);
    fixture.componentRef.setInput('profile', { gamertag: 'Player', avatarUrl: '/avatar.png' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-hidden="true"]').textContent.trim()).toBe('P');
    fixture.componentRef.setInput('profile', { gamertag: 'Player', avatarUrl: '/new-avatar.png' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('/new-avatar.png');
  });
});
