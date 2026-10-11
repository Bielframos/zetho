import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ColorModeStore, colorModeContract } from './color-mode.store';
import { safeLocalStorage } from '../../../utils/platform-storage';

describe('ColorModeStore', () => {
  let media: MediaQueryList;
  let events: EventTarget;
  let saved: string | null;
  beforeEach(() => {
    saved = null;
    events = new EventTarget();
    media = { matches: false, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) } as MediaQueryList;
    spyOn(window, 'matchMedia').and.returnValue(media);
    spyOn(safeLocalStorage, 'getItem').and.callFake(() => saved);
    spyOn(safeLocalStorage, 'setItem').and.callFake((_, value) => { saved = value; });
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] });
  });
  afterEach(() => { document.documentElement.removeAttribute('data-color-mode'); });
  const create = () => { const store = TestBed.inject(ColorModeStore); store.initialize(); return store; };
  const system = (dark: boolean) => { Object.defineProperty(media, 'matches', { value: dark, configurable: true }); events.dispatchEvent(new Event('change')); };
  it('defaults invalid/missing storage to system and persists explicit precedence', () => {
    saved = 'invalid'; const store = create();
    expect(store.preference()).toBe('system'); expect(store.effective()).toBe('light');
    system(true); expect(store.effective()).toBe('dark');
    store.select('light'); expect(saved).toBe('light'); system(true); expect(store.effective()).toBe('light');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
  it('restores saved preference and syncs remote clear/removal/changes, ignoring sessionStorage', () => {
    saved = 'dark'; const store = create(); expect(store.effective()).toBe('dark');
    window.dispatchEvent(new StorageEvent('storage', { key: colorModeContract.key, newValue: 'light', storageArea: sessionStorage }));
    expect(store.preference()).toBe('dark');
    window.dispatchEvent(new StorageEvent('storage', { key: colorModeContract.key, newValue: 'light' }));
    expect(store.effective()).toBe('light');
    window.dispatchEvent(new StorageEvent('storage', { key: colorModeContract.key, newValue: null }));
    expect(store.preference()).toBe('system');
    store.select('dark'); window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(store.preference()).toBe('system');
  });
  it('keeps current selection when persistence is unavailable and cleans listeners', () => {
    (safeLocalStorage.setItem as jasmine.Spy).and.callThrough();
    (safeLocalStorage.getItem as jasmine.Spy).and.callThrough();
    spyOn(Storage.prototype, 'getItem').and.throwError('Storage blocked');
    spyOn(Storage.prototype, 'setItem').and.throwError('Quota exceeded');
    const store = create(); store.select('dark'); expect(store.effective()).toBe('dark');
    TestBed.resetTestingModule(); system(false);
    window.dispatchEvent(new StorageEvent('storage', { key: colorModeContract.key, newValue: 'light' }));
    expect(store.preference()).toBe('dark');
  });
  it('does not read browser preference during SSR or change the hydration selector initially', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const store = create();
    expect(safeLocalStorage.getItem).not.toHaveBeenCalled(); expect(store.preference()).toBe('system');
  });
  it('shares the prepaint normalizer and resolves explicit values independently of OS', () => {
    for (const value of [null, '', 'LIGHT', 'junk']) expect(colorModeContract.normalize(value)).toBe('system');
    expect(colorModeContract.resolve('light', true)).toBe('light');
    expect(colorModeContract.resolve('dark', false)).toBe('dark');
    expect(colorModeContract.resolve('system', false)).toBe('light');
  });
});
