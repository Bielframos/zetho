import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../auth/auth.store';
import { ColorModeStore } from '../system/color-mode/color-mode.store';
import { safeLocalStorage } from '../../utils/platform-storage';
import { SpecialThemesStore } from './special-themes.store';
import { ThemesService } from './themes.service';

const tropical = {
  id: 'tropical-6',
  name: 'Tropical 6',
  appearance: 'tropical-6',
};
const account = (id: string) => ({ $id: id });

describe('SpecialThemesStore', () => {
  const user = signal<{ $id: string } | null>(null);
  const special = signal<string | null>(null);
  const select = jasmine
    .createSpy('select')
    .and.callFake(() => special.set(null));
  const list = jasmine.createSpy('listOwnedSpecialThemes');
  const claim = jasmine.createSpy('claimSpecialTheme');
  let store: SpecialThemesStore;

  beforeEach(() => {
    user.set(null);
    special.set(null);
    list.calls.reset();
    claim.calls.reset();
    select.calls.reset();
    const saved = new Map<string, string>();
    spyOn(safeLocalStorage, 'getItem').and.callFake(
      (key) => saved.get(key) ?? null,
    );
    spyOn(safeLocalStorage, 'setItem').and.callFake((key, value) => {
      saved.set(key, value);
    });
    spyOn(safeLocalStorage, 'removeItem').and.callFake((key) => {
      saved.delete(key);
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { user } },
        {
          provide: ColorModeStore,
          useValue: {
            special,
            setSpecial: (value: string | null) => special.set(value),
            select,
          },
        },
        {
          provide: ThemesService,
          useValue: { listOwnedSpecialThemes: list, claimSpecialTheme: claim },
        },
      ],
    });
    store = TestBed.inject(SpecialThemesStore);
    TestBed.tick();
  });

  async function signIn(id: string) {
    user.set(account(id));
    TestBed.tick();
    await Promise.resolve();
  }

  it('only restores the appearance for the signed-in owner, and releases it on account switch', async () => {
    list.and.callFake(() =>
      Promise.resolve(user()?.$id === 'owner' ? [tropical] : []),
    );
    safeLocalStorage.setItem('zetho.special-theme:owner', tropical.id);
    safeLocalStorage.setItem('zetho.special-theme:other', tropical.id);
    expect(list).not.toHaveBeenCalled();
    await signIn('owner');
    expect(store.selectedId()).toBe(tropical.id);
    await signIn('other');
    expect(store.available()).toEqual([]);
    expect(store.selectedId()).toBeNull();
    expect(special()).toBeNull();
    await signIn('owner');
    expect(store.selectedId()).toBe(tropical.id);
    store.selectStandard('dark');
    expect(select).toHaveBeenCalledOnceWith('dark');
    expect(safeLocalStorage.getItem('zetho.special-theme:owner')).toBeNull();
  });

  it('does not apply a claim response from an earlier session after an account switch', async () => {
    list.and.resolveTo([]);
    let finish!: (value: typeof tropical) => void;
    claim.and.callFake(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await signIn('owner');
    const pending = store.claim(tropical.id);
    await signIn('other');
    await signIn('owner');
    finish(tropical);
    await pending;
    expect(store.available()).toEqual([]);
    store.select(tropical.id);
    expect(special()).toBeNull();
  });
});
