import { computed, effect, Injectable, signal, untracked } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { ProfileWithConnection, UserProfileRow } from '../../types';
import { appwrite } from '../../shared/infra/appwrite/appwrite.client';
import { AuthStore } from '../auth/auth.store';
import { FollowStore } from '../connections/follow.store';
import { ProfileTheme } from '../themes/themes.types';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  constructor(
    private authStore: AuthStore,
    private follows: FollowStore,
  ) {
    effect(() => {
      const target = this._current()?.$id;
      this.authStore.user(); this.follows.ownerId();
      if (target) untracked(() => { void this.follows.ensure(target); });
    });

    effect(() => {
      const currentProfile = this._current();

      if (currentProfile?.activeThemeId) {
        appwrite.databases
          .getRow<any>({
            databaseId: 'app',
            tableId: 'profile_themes',
            rowId: currentProfile.activeThemeId,
          })
          .then((theme) => {
            if (this._current()?.$id === currentProfile.$id) {
              this._activeTheme.set(theme as ProfileTheme);
            }
          })
          .catch(() => {
            this._activeTheme.set(null);
          });
      } else {
        this._activeTheme.set(null);
      }
    });
  }

  private _loading = signal(false);
  private _current = signal<UserProfileRow | null>(null);
  private _activeTheme = signal<ProfileTheme | null>(null);

  readonly isLoading = computed(() => this._loading());
  readonly activeTheme = computed(() => {
    if (this.itsMe()) {
      return this.authStore.activeTheme();
    }
    return this._activeTheme();
  });
  readonly current = computed<UserProfileRow | ProfileWithConnection | null>(
    () => {
      const profile = this._current();
      const state = profile ? this.follows.state(profile.$id) : null;
      if (!profile) return null;
      if (!state?.known) return profile;
      return { ...profile, connection: state.connection };
    },
  );
  readonly profile$ = toObservable(this.current);

  readonly avatarUrl = computed(() => {
    if (!this.current()?.avatarUrl) {
      return appwrite.avatars.getInitials({
        name: this.current()?.gamertag,
        width: 64,
        height: 64,
        background: '3e63dd',
      });
    }

    return this.current()?.avatarUrl!;
  });

  readonly itsMe = computed(
    () => this.authStore.profile()?.$id === this._current()?.$id,
  );

  set = (profile: UserProfileRow | null) => {
    this._current.set(profile);
  };

}
