import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { safeLocalStorage } from '../../utils/platform-storage';
import { AuthStore } from '../auth/auth.store';
import {
  ColorModeStore,
  type ColorPreference,
  isSpecialAppearance,
} from '../system/color-mode/color-mode.store';
import { ThemesService } from './themes.service';
import type { SpecialTheme } from './themes.types';

const selectionKey = (account: string) => `zetho.special-theme:${account}`;

@Injectable({ providedIn: 'root' })
export class SpecialThemesStore {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(ThemesService);
  private readonly modes = inject(ColorModeStore);
  private readonly account = computed(() => this.auth.user()?.$id ?? null);

  private readonly state = signal<{
    account: string;
    themes: SpecialTheme[];
  } | null>(null);
  private readonly active = signal<{ account: string; id: string } | null>(
    null,
  );
  private readonly refresh = signal(0);
  private readonly loadingAccount = signal<string | null>(null);
  private readonly failedAccount = signal<string | null>(null);
  private sessionAccount: string | null = null;
  private session = 0;

  readonly owned = computed(() => {
    const current = this.state();
    return current?.account === this.account() ? (current?.themes ?? []) : [];
  });
  readonly available = computed(() =>
    this.owned().filter((theme) => isSpecialAppearance(theme.appearance)),
  );
  readonly loading = computed(
    () => !!this.account() && this.loadingAccount() === this.account(),
  );
  readonly failed = computed(
    () => !!this.account() && this.failedAccount() === this.account(),
  );
  readonly selectedId = computed(() => {
    const active = this.active();
    return this.modes.special() && active?.account === this.account()
      ? (active?.id ?? null)
      : null;
  });

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    effect((onCleanup) => {
      const account = this.account();
      this.refresh();
      const controller = new AbortController();
      onCleanup(() => controller.abort());
      if (this.sessionAccount !== account) {
        this.sessionAccount = account;
        this.session++;
        this.state.set(null);
        this.active.set(null);
        this.modes.setSpecial(null);
      }
      this.failedAccount.set(null);
      this.loadingAccount.set(account);
      if (account)
        untracked(
          () => void this.load(account, this.session, controller.signal),
        );
    });
  }

  retry() {
    this.refresh.update((version) => version + 1);
  }

  async claim(id: string) {
    const account = this.account();
    if (!account) return;
    const session = this.session;
    const theme = await this.api.claimSpecialTheme(id);
    if (account !== this.account() || session !== this.session) return;
    this.remember(account, [theme]);
  }

  select(id: string) {
    const account = this.account();
    const theme = this.available().find((item) => item.id === id);
    if (!account || !theme || !isSpecialAppearance(theme.appearance)) return;
    safeLocalStorage.setItem(selectionKey(account), theme.id);
    this.active.set({ account, id });
    this.modes.setSpecial(theme.appearance);
  }

  selectStandard(preference: ColorPreference) {
    const account = this.account();
    if (account) safeLocalStorage.removeItem(selectionKey(account));
    this.active.set(null);
    this.modes.select(preference);
  }

  private async load(account: string, session: number, signal: AbortSignal) {
    try {
      const themes = await this.api.listOwnedSpecialThemes(signal);
      if (
        signal.aborted ||
        account !== this.account() ||
        session !== this.session
      )
        return;
      this.remember(account, themes);
      const saved = safeLocalStorage.getItem(selectionKey(account));
      if (saved) this.select(saved);
    } catch {
      if (!signal.aborted && account === this.account())
        this.failedAccount.set(account);
    } finally {
      if (!signal.aborted && account === this.account())
        this.loadingAccount.set(null);
    }
  }

  private remember(account: string, themes: SpecialTheme[]) {
    this.state.update((current) => {
      const owned = new Map(
        current?.account === account
          ? current.themes.map((theme) => [theme.id, theme])
          : [],
      );
      for (const theme of themes) owned.set(theme.id, theme);
      return {
        account,
        themes: [...owned.values()].sort((a, b) =>
          a.name.localeCompare(b.name, 'pt-BR'),
        ),
      };
    });
  }
}
