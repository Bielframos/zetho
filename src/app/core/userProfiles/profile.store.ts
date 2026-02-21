import { computed, inject, Injectable, signal } from '@angular/core';
import { UserProfileRow } from '../../types';
import { appwrite } from '../appwrite/appwrite.client';
import { AuthStore } from '../auth/auth.store';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private authStore = inject(AuthStore);

  private _loading = signal(false);
  private _current = signal<UserProfileRow | null>(null);

  readonly isLoading = computed(() => this._loading());
  readonly current = computed(() => this._current());

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

  set = this._current.set;
}
