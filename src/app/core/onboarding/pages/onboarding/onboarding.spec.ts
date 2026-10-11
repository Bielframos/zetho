import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OnboardingPage } from './onboarding';
import { AuthStore } from '../../../auth/auth.store';
import { GameService } from '../../../games/games.service';
import { ZEntryService } from '../../../zEntries/zEntries.service';
import { RatingsService } from '../../../ratings/ratings.service';
import { DashboardService } from '../../../dashboard/dashboard.service';
import { NotificationStore } from '../../../system/notifications/notification.store';
import { GameWithEntry } from '../../../../types';

const game = {
  $id: 'g1',
  name: 'A game',
  releaseDate: '2020-01-01',
  releaseYear: '2020',
} as GameWithEntry;
const key = 'zetho:onboarding:v2:me';

describe('OnboardingPage', () => {
  let page: OnboardingPage;
  let entries: { getEntry: jasmine.Spy; createEntryLog: jasmine.Spy };
  let ratings: {
    getMyRating: jasmine.Spy;
    upsertRating: jasmine.Spy;
    deleteRating: jasmine.Spy;
  };
  let search: jasmine.Spy;
  let navigate: jasmine.Spy;
  beforeEach(() => {
    localStorage.removeItem(key);
    entries = {
      getEntry: jasmine.createSpy().and.resolveTo(null),
      createEntryLog: jasmine
        .createSpy()
        .and.callFake(async (_owner, _id, _current, opts) => ({
          ...opts,
          gameId: 'g1',
          ownerFingerprint: 'me',
        })),
    };
    ratings = {
      getMyRating: jasmine.createSpy().and.resolveTo(null),
      upsertRating: jasmine.createSpy().and.resolveTo({}),
      deleteRating: jasmine.createSpy().and.resolveTo(),
    };
    search = jasmine.createSpy().and.resolveTo({ rows: [game] });
    navigate = jasmine.createSpy().and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate } },
        {
          provide: AuthStore,
          useValue: {
            profile: signal({
              $id: 'me-profile',
              fingerprint: 'me',
              gamertag: 'player',
            }),
          },
        },
        { provide: GameService, useValue: { searchGame: search } },
        { provide: ZEntryService, useValue: entries },
        { provide: RatingsService, useValue: ratings },
        {
          provide: DashboardService,
          useValue: {
            getSuggestedConnections: jasmine
              .createSpy()
              .and.resolveTo({ items: [] }),
          },
        },
        { provide: NotificationStore, useValue: { show: jasmine.createSpy() } },
      ],
    });
    page = TestBed.runInInjectionContext(() => new OnboardingPage());
  });
  afterEach(() => {
    page.ngOnDestroy();
    localStorage.removeItem(key);
  });

  it('renders the actual saved status when dynamic options are first created', () => {
    const fixture = TestBed.createComponent(OnboardingPage);
    spyOn(fixture.componentInstance, 'ngOnInit').and.resolveTo();
    const wishlisted = {
      ...game,
      zEntry: { status: 'wishlist' },
    } as GameWithEntry;
    fixture.componentInstance.results.set([
      wishlisted,
      { ...game, $id: 'new' },
    ]);
    fixture.detectChanges();
    const result = fixture.nativeElement.querySelector(
      '#result-g1',
    ) as HTMLSelectElement;
    expect(result.value).toBe('wishlist');
    expect(result.selectedOptions[0].textContent?.trim()).toBe('Quero jogar');
    expect(
      (fixture.nativeElement.querySelector('#result-new') as HTMLSelectElement)
        .value,
    ).toBe('');
    fixture.componentInstance.marked.set(new Map([['g1', wishlisted]]));
    fixture.detectChanges();
    const saved = fixture.nativeElement.querySelector(
      '#saved-g1',
    ) as HTMLSelectElement;
    expect(saved.value).toBe('wishlist');
    fixture.destroy();
  });

  it('saves the chosen status and removes it on the server, preserving unrelated attributes', async () => {
    const existing = { status: 'playing', liked: true };
    entries.getEntry.and.resolveTo(existing);
    await page.saveStatus(game, 'completed');
    expect(entries.createEntryLog).toHaveBeenCalledWith('me', 'g1', existing, {
      status: 'completed',
    });
    expect(page.markedList()[0].zEntry?.liked).toBeTrue();
    await page.saveStatus(game, null);
    expect(entries.createEntryLog).toHaveBeenCalledWith('me', 'g1', existing, {
      status: null,
    });
    expect(page.markedCount()).toBe(0);
  });

  it('does not add a failed save to the shelf and supports retry', async () => {
    entries.createEntryLog.and.rejectWith(new Error('offline'));
    await page.saveStatus(game, 'wishlist');
    expect(page.markedCount()).toBe(0);
    expect(page.actionError()).toContain('Não foi possível');
    entries.createEntryLog.and.resolveTo({ status: 'wishlist' });
    await page.retry();
    expect(page.markedCount()).toBe(1);
  });

  it('deduplicates writes and prevents leaving while a save is pending', async () => {
    let finish!: (value: object) => void;
    entries.createEntryLog.and.returnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    const saving = page.saveStatus(game, 'playing');
    await Promise.resolve();
    await page.saveStatus(game, 'completed');
    page.goToStep(2);
    await page.leave(true);
    expect(page.step()).toBe(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(entries.createEntryLog).toHaveBeenCalledTimes(1);
    finish({ status: 'playing' });
    await saving;
  });

  it('restores only this user context and reloads authoritative entries and ratings', async () => {
    localStorage.setItem(
      'zetho:onboarding:v2:other',
      JSON.stringify({ step: 4, games: [{ $id: 'other' }] }),
    );
    localStorage.setItem(key, JSON.stringify({ step: 2, games: [game] }));
    entries.getEntry.and.resolveTo({ status: 'playing' });
    ratings.getMyRating.and.resolveTo({ rating: 4.5 });
    await page.restore();
    expect(page.step()).toBe(2);
    expect(page.ratings()['g1']).toBe(4.5);
    expect(entries.getEntry).toHaveBeenCalledOnceWith('me', 'g1');
    expect(page.markedCount()).toBe(1);
    localStorage.removeItem('zetho:onboarding:v2:other');
  });

  it('does not erase resume data after a failed restore', async () => {
    const saved = JSON.stringify({ step: 2, games: [game] });
    localStorage.setItem(key, saved);
    entries.getEntry.and.rejectWith(new Error('offline'));
    await page.restore();
    expect(page.restoreError()).toBeTrue();
    await page.leave();
    expect(localStorage.getItem(key)).toBe(saved);
  });

  it('persists an empty onboarding on configure later, and clears it only after successful completion navigation', async () => {
    await page.leave();
    expect(JSON.parse(localStorage.getItem(key)!).step).toBe(1);
    expect(navigate).toHaveBeenCalledWith(['/buscar']);
    navigate.and.resolveTo(false);
    await page.leave(true);
    expect(localStorage.getItem(key)).not.toBeNull();
    navigate.and.resolveTo(true);
    await page.leave(true);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('opens the shelf in a tab containing the selected games', async () => {
    await page.saveStatus(game, 'wishlist');
    await page.leave(true);
    expect(navigate).toHaveBeenCalledWith(['/player', 'player'], {
      queryParams: { t: 'wishlist' },
    });
    expect(page.rateableGames().length).toBe(0);
  });

  it('keeps confirmed ratings across navigation and after a failed update', async () => {
    await page.saveStatus(game, 'playing');
    await page.rateGame('g1', 4.5);
    page.goToStep(1);
    page.goToStep(2);
    expect(page.ratings()['g1']).toBe(4.5);
    ratings.upsertRating.and.rejectWith(new Error('offline'));
    await page.rateGame('g1', 2);
    expect(page.ratings()['g1']).toBe(4.5);
    await page.rateGame('g1', 0);
    expect(ratings.deleteRating).toHaveBeenCalledWith('g1');
    expect(page.ratings()['g1']).toBe(0);
  });

  it('ignores stale search responses when a newer query was typed', async () => {
    let resolve!: (value: object) => void;
    search.and.returnValue(new Promise((done) => (resolve = done)));
    const oldSearch = page.runSearch();
    page.onQueryInput('new');
    resolve({ rows: [game] });
    await oldSearch;
    expect(page.results()).toEqual([]);
  });

});
