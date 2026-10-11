import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { ProfileStore } from '../userProfiles/profile.store';
import { UserProfileService } from '../userProfiles/userProfile.service';
import { profileResolver } from './profile.resolver';

function context() {
  const set = jasmine.createSpy('set');
  const requests = new Map<string, (value: any) => void>();
  const injector = Injector.create({ providers: [
    { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
    { provide: AuthStore, useValue: { profile: () => null } },
    { provide: ProfileStore, useValue: { set } },
    { provide: UserProfileService, useValue: { getProfileByGamertag: (name: string) => new Promise(resolve => requests.set(name, resolve)) } },
  ] });
  const resolve = (name: string) => runInInjectionContext(injector, () => profileResolver({ paramMap: convertToParamMap({ gamertag: name }) } as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  return { set, requests, resolve };
}

describe('Profile resolver concurrency', () => {
  it('isolates concurrent SSR injectors and ignores stale results only within the same profile store', async () => {
    const a = context(); const b = context();
    const firstA = a.resolve('Old');
    const nextA = a.resolve('New');
    const firstB = b.resolve('Independent');
    a.requests.get('New')!({ gamertag: 'New' }); await nextA;
    b.requests.get('Independent')!({ gamertag: 'Independent' }); await firstB;
    a.requests.get('Old')!({ gamertag: 'Old' }); await firstA;
    expect(a.set.calls.mostRecent().args[0]).toEqual({ gamertag: 'New' });
    expect(b.set.calls.mostRecent().args[0]).toEqual({ gamertag: 'Independent' });
  });
});
