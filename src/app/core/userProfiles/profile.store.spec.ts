import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProfileStore } from './profile.store';
import { AuthStore } from '../auth/auth.store';
import { FollowStore } from '../connections/follow.store';
import { appwrite } from '../../shared/infra/appwrite/appwrite.client';

describe('ProfileStore theme requests', () => {
  let store: ProfileStore;
  const pending: { resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];
  beforeEach(() => {
    pending.length = 0;
    spyOn(appwrite.databases, 'getRow').and.callFake(() => new Promise<any>((resolve, reject) => pending.push({ resolve, reject })));
    TestBed.configureTestingModule({ providers: [
      { provide: AuthStore, useValue: { user: signal(null), profile: signal(null), activeTheme: signal(null) } },
      { provide: FollowStore, useValue: { ownerId: signal(null), ensure: async () => {}, state: () => null } },
    ] });
    store = TestBed.inject(ProfileStore);
  });
  const set = (id: string, theme: string | null) => { store.set({ $id: id, activeThemeId: theme } as any); TestBed.flushEffects(); };
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
  it('clears previous artwork immediately and ignores failures from an earlier profile', async () => {
    set('A', 'one'); pending[0].resolve({ $id: 'one' }); await settle();
    expect(store.activeTheme()?.$id).toBe('one');
    set('B', 'two'); expect(store.activeTheme()).toBeNull();
    set('C', 'three'); pending[2].resolve({ $id: 'three' }); await settle();
    pending[1].reject(new Error('old request')); await settle();
    expect(store.activeTheme()?.$id).toBe('three');
  });
  it('ignores late results after changing equipment on the same profile or removing its theme', async () => {
    set('A', 'one'); set('A', 'two');
    pending[1].resolve({ $id: 'two' }); await settle();
    pending[0].resolve({ $id: 'one' }); await settle();
    expect(store.activeTheme()?.$id).toBe('two');
    set('A', 'three'); set('A', null);
    pending[2].resolve({ $id: 'three' }); await settle();
    expect(store.activeTheme()).toBeNull();
  });
});
