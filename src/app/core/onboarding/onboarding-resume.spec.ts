import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { safeLocalStorage } from '../../utils/platform-storage';
import { OnboardingResume } from './onboarding-resume';

describe('Onboarding resume invitation', () => {
  it('shows saved progress only for its owner and links to onboarding', async () => {
    const profile = signal({ fingerprint: 'owner-a' });
    spyOn(safeLocalStorage, 'getItem').and.callFake((key) =>
      key === 'zetho:onboarding:v2:owner-a'
        ? JSON.stringify({ step: 2, games: [] })
        : null,
    );
    TestBed.configureTestingModule({
      imports: [OnboardingResume],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { profile } },
      ],
    });
    const fixture = TestBed.createComponent(OnboardingResume);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a')?.getAttribute('href')).toBe(
      '/comecar',
    );

    profile.set({ fingerprint: 'owner-b' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('aside')).toBeNull();
  });
});
