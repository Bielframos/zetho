import { NavigationStart, Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { ZEntriesController } from '../../../core/zEntries/zEntries.controller';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../../../core/auth/auth.store';
import { ZEntryService } from '../../../core/zEntries/zEntries.service';
import { GameWithEntry, ZEntryRow } from '../../../types';
import {
  GameQuickEntryStore,
  isQuickEntryAvailable,
} from './game-quick-entry.store';

describe('GameQuickEntryStore', () => {
  const game = {
    $id: 'game',
    releaseDate: '2020-01-01',
    releaseYear: '2020',
  } as GameWithEntry;
  const entry = {
    $id: 'entry',
    gameId: 'game',
    ownerFingerprint: 'viewer',
    status: 'backlog',
    liked: true,
    hyped: true,
    replays: 2,
  } as ZEntryRow;
  let events: Subject<NavigationStart>;
  let store: GameQuickEntryStore;
  let getEntry: jasmine.Spy;
  let createEntryLog: jasmine.Spy;
  let profile: ReturnType<typeof signal<{ fingerprint: string }>>;
  beforeEach(() => {
    events = new Subject<NavigationStart>();
    profile = signal({ fingerprint: 'viewer' });
    getEntry = jasmine.createSpy().and.resolveTo(null);
    createEntryLog = jasmine
      .createSpy()
      .and.callFake(async (_owner, _game, current, opts) => ({
        ...current,
        ...opts,
      }));
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events } },
        {
          provide: AuthStore,
          useValue: { isAuthenticated: () => true, profile },
        },
        { provide: ZEntryService, useValue: { getEntry, createEntryLog } },
      ],
    });
    store = TestBed.inject(GameQuickEntryStore);
  });
  it('reuses owned preloaded entries and known null without a request', async () => {
    expect(await store.load({ ...game, zEntry: entry })).toBe(entry);
    expect(
      await store.load({ ...game, $id: 'empty', zEntry: null }),
    ).toBeNull();
    expect(getEntry).not.toHaveBeenCalled();
  });
  it('loads missing entries and deduplicates requests', async () => {
    getEntry.and.resolveTo(entry);
    const results = await Promise.all([store.load(game), store.load(game)]);
    expect(results).toEqual([entry, entry]);
    expect(getEntry).toHaveBeenCalledOnceWith('viewer', 'game');
  });
  it('never reuses another owner entry or another viewers cache', async () => {
    await store.load({
      ...game,
      zEntry: { ...entry, ownerFingerprint: 'other' },
    });
    expect(getEntry).toHaveBeenCalledOnceWith('viewer', 'game');
    profile.set({ fingerprint: 'next' });
    expect(store.statusFor('game')).toBeUndefined();
    await store.load(game);
    expect(getEntry).toHaveBeenCalledWith('next', 'game');
  });
  it('preserves attributes and selecting the current status is a no-op', async () => {
    await store.load({ ...game, zEntry: entry });
    await store.save(game, entry, 'backlog');
    expect(createEntryLog).not.toHaveBeenCalled();
    const result = await store.save(game, entry, 'completed');
    expect(createEntryLog).toHaveBeenCalledOnceWith('viewer', 'game', entry, {
      status: 'completed',
    });
    expect(result.liked).toBeTrue();
    expect(result.hyped).toBeTrue();
    expect(result.replays).toBe(2);
    expect(store.statusFor('game')?.entry?.status).toBe('completed');
  });
  it('rolls back only the failed game and deduplicates saves', async () => {
    let reject!: (reason: Error) => void;
    createEntryLog.and.returnValue(
      new Promise((_resolve, rejectPromise) => {
        reject = rejectPromise;
      }),
    );
    await store.load({ ...game, zEntry: entry });
    await store.load({ ...game, $id: 'unrelated', zEntry: null });
    const first = store.save(game, entry, 'completed');
    const second = store.save(game, entry, 'completed');
    await Promise.resolve();
    expect(store.statusFor('game')?.entry?.status).toBe('completed');
    reject(new Error('offline'));
    await Promise.all([
      expectAsync(first).toBeRejectedWithError('offline'),
      expectAsync(second).toBeRejectedWithError('offline'),
    ]);
    expect(createEntryLog).toHaveBeenCalledTimes(1);
    expect(store.statusFor('game')?.entry).toBe(entry);
    expect(store.statusFor('unrelated')).toEqual({ entry: null });
  });
  it('blocks progress for unknown and future release dates', async () => {
    expect(
      isQuickEntryAvailable({
        ...game,
        releaseYear: null,
      } as unknown as GameWithEntry),
    ).toBeFalse();
    const future = { ...game, rawReleaseDate: '2999-01-01' };
    await expectAsync(
      store.save(future, null, 'playing'),
    ).toBeRejectedWithError('progress_not_available_for_unreleased_game');
    expect(createEntryLog).not.toHaveBeenCalled();
  });
  it('invalidates on navigation and accepts refreshed preload', async () => {
    await store.load({ ...game, zEntry: entry });
    events.next(new NavigationStart(1, '/game'));
    expect(store.statusFor('game')).toBeUndefined();
    const refreshed = { ...entry, status: 'completed' } as ZEntryRow;
    expect(await store.load({ ...game, zEntry: refreshed })).toBe(refreshed);
  });
  it('does not restore an old load after navigation', async () => {
    let resolve!: (entry: ZEntryRow) => void;
    getEntry.and.returnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const loading = store.load(game);
    events.next(new NavigationStart(1, '/game'));
    await store.load({ ...game, zEntry: null });
    resolve(entry);
    await loading;
    expect(store.statusFor('game')).toEqual({ entry: null });
  });
  it('does not restore an old write after navigation', async () => {
    let resolve!: (entry: ZEntryRow) => void;
    createEntryLog.and.returnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    await store.load({ ...game, zEntry: entry });
    const saving = store.save(game, entry, 'playing');
    await Promise.resolve();
    events.next(new NavigationStart(1, '/game'));
    resolve({ ...entry, status: 'playing' });
    await saving;
    expect(store.statusFor('game')).toBeUndefined();
  });
  it('does not parse localized dates as American dates', () => {
    expect(
      isQuickEntryAvailable({ ...game, releaseDate: '01/12/2999' }),
    ).toBeTrue();
    expect(
      isQuickEntryAvailable({
        ...game,
        releaseDate: '01/12/2999',
        rawReleaseDate: '2999-12-01',
      }),
    ).toBeFalse();
  });
  it('permits a released game with omitted date but rejects a known future year', () => {
    expect(
      isQuickEntryAvailable({
        ...game,
        releaseDate: undefined,
      } as unknown as GameWithEntry),
    ).toBeTrue();
    expect(
      isQuickEntryAvailable({
        ...game,
        releaseDate: undefined,
        releaseYear: '2999',
      } as unknown as GameWithEntry),
    ).toBeFalse();
    expect(
      isQuickEntryAvailable({
        ...game,
        releaseDate: null,
      } as unknown as GameWithEntry),
    ).toBeFalse();
  });

  it('reuses the own-profile entry without forwarding the expanded game to persistence', async () => {
    const controller = new ZEntriesController(
      {
        getUserEntries: async () => ({
          rows: [{ ...entry, game, groupKey: '2026' }],
          total: 1,
        }),
      } as any,
      { profile$: EMPTY, current: () => ({ fingerprint: 'viewer' }) } as any,
      { queryParams: EMPTY } as any,
    );
    await controller.loadEntries();
    const cover = controller.entries()[0].game;
    const loaded = await store.load(cover);
    expect(loaded).toEqual(entry);
    expect(getEntry).not.toHaveBeenCalled();
    await store.save(cover, loaded, 'completed');
    const persisted = createEntryLog.calls.mostRecent().args[2];
    expect(persisted.liked).toBeTrue();
    expect(persisted.hyped).toBeTrue();
    expect('game' in persisted).toBeFalse();
  });
});
