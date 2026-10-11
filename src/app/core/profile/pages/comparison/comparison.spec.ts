import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { App } from '../../../../app';
import { AuthStore } from '../../../auth/auth.store';
import { SeoService } from '../../../system/seo/seo.service';
import { ZEntryService } from '../../../zEntries/zEntries.service';
import { ProfileComparisonPage } from './comparison';
import { ComparisonRow, ComparisonService } from './comparison.service';

const game: ComparisonRow = {
  game: { id: 'g', name: 'Game', slug: 'game', coverUrl: null },
  me: { status: null, rating: null },
  other: { status: 'completed', rating: 4 },
  difference: null,
};

describe('Profile comparison FAB visibility', () => {
  it('tracks resolved profile, route, pending navigation and authentication', () => {
    let path = '/player/Peer/listas';
    let pending = false;
    let authenticated = true;
    let mine = false;
    let profile: any = { gamertag: 'Peer' };
    const context = {
      currentPath: () => path,
      profileNavigationPending: () => pending,
      authStore: { isAuthenticated: () => authenticated },
      profileStore: { current: () => profile, itsMe: () => mine },
    } as unknown as App;
    const visible = () => App.prototype.comparisonProfile.call(context);
    expect(visible()?.gamertag).toBe('Peer');
    pending = true;
    expect(visible()).toBeNull();
    pending = false;
    path = '/player/Next';
    expect(visible()).toBeNull();
    profile = { gamertag: 'Next' };
    expect(visible()?.gamertag).toBe('Next');
    path = '/player/Next/comparar';
    expect(visible()).toBeNull();
    path = '/feed';
    expect(visible()).toBeNull();
    path = '/player/Next';
    authenticated = false;
    expect(visible()).toBeNull();
    authenticated = true;
    mine = true;
    expect(visible()).toBeNull();
    mine = false;
    profile = null;
    expect(visible()).toBeNull();
  });
});

describe('Comparison page', () => {
  const profile = signal<any>({
    $id: 'me',
    gamertag: 'Me',
    fingerprint: 'own',
  });
  const authenticated = signal(true);
  const load = jasmine.createSpy('load');
  const getEntry = jasmine.createSpy('getEntry');
  const createEntryLog = jasmine.createSpy('createEntryLog');
  beforeEach(() => {
    authenticated.set(true);
    profile.set({ $id: 'me', gamertag: 'Me', fingerprint: 'own' });
    load.calls.reset();
    getEntry.calls.reset();
    createEntryLog.calls.reset();
    load.and.resolveTo({
      me: { id: 'me', gamertag: 'Me' },
      other: { id: 'peer', gamertag: 'Peer' },
      rows: [game],
      total: 1,
      offset: 0,
      limit: 20,
    });
    getEntry.and.resolveTo(null);
    createEntryLog.and.resolveTo({});
    TestBed.configureTestingModule({
      imports: [ProfileComparisonPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ gamertag: 'Peer' })),
            queryParamMap: of(convertToParamMap({ view: 'discoveries' })),
          },
        },
        {
          provide: AuthStore,
          useValue: { profile, isAuthenticated: authenticated },
        },
        { provide: ComparisonService, useValue: { load } },
        { provide: ZEntryService, useValue: { getEntry, createEntryLog } },
        { provide: SeoService, useValue: { apply: () => {} } },
      ],
    });
  });
  it('renders missing rating as Sem nota and adds wishlist only once through existing entry service', async () => {
    const fixture = TestBed.createComponent(ProfileComparisonPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sem nota');
    await fixture.componentInstance.addToWishlist(game);
    await fixture.componentInstance.addToWishlist(game);
    expect(createEntryLog).toHaveBeenCalledOnceWith('own', 'g', null, {
      status: 'wishlist',
    });
    expect(fixture.componentInstance.wishlisted().has('g')).toBeTrue();
  });
  it('does not overwrite a game added from another page and clears private results on logout', async () => {
    getEntry.and.resolveTo({ status: 'playing' });
    const fixture = TestBed.createComponent(ProfileComparisonPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.componentInstance.addToWishlist(game);
    expect(createEntryLog).not.toHaveBeenCalled();
    authenticated.set(false);
    profile.set(null);
    fixture.detectChanges();
    expect(fixture.componentInstance.result()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('Entre');
  });
  it('shows an error for inaccessible data and ignores responses after logout', async () => {
    let resolve!: (value: any) => void;
    load.and.returnValue(new Promise((done) => (resolve = done)));
    const fixture = TestBed.createComponent(ProfileComparisonPage);
    fixture.detectChanges();
    authenticated.set(false);
    fixture.detectChanges();
    resolve({ rows: [game] });
    await fixture.whenStable();
    expect(fixture.componentInstance.result()).toBeNull();
  });
});
