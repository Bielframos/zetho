import { computed, inject, Injectable, signal } from '@angular/core';
import { appwrite } from '../appwrite/appwrite.client';
import { AuthStore } from '../auth/auth.store';
import { UserProfileRow } from '../../types';
import { UserProfileService } from './userProfile.service';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private authStore = inject(AuthStore);
  private profileService = inject(UserProfileService);

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

  async update(gamertag: string) {
    const myProfile = this.authStore.profile();

    if (myProfile!.gamertag === gamertag) {
      this._current.set(myProfile);
      return;
    }

    try {
      this._loading.set(true);
      const profile = await this.profileService.getProfileByGamertag(gamertag);

      this._current.set(profile);
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar o perfil');
    } finally {
      this._loading.set(false);
    }
  }

  set = this._current.set;
}
