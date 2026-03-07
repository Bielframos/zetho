import { computed, effect, Injectable, signal } from '@angular/core';
import type { ProfileWithConnection, UserProfileRow } from '../../types';
import { appwrite } from '../appwrite/appwrite.client';
import { AuthStore } from '../auth/auth.store';
import { ConnectionsService } from '../connections/connections.service';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  constructor(
    private authStore: AuthStore,
    private connectionsService: ConnectionsService,
  ) {
    // Sempre que o perfil atual ou o perfil do usuário logado mudarem, verificamos a conexão entre eles
    effect(() => {
      const myProfile = this.authStore.profile();
      const currentProfile = this._current();

      if (myProfile && currentProfile && myProfile.$id !== currentProfile.$id) {
        this.connectionsService
          .getConnection(currentProfile.$id, myProfile.$id)
          .then((connection) => {
            this._current.update((profile) => {
              if (!profile) return profile;
              return { ...profile, connection };
            });
          });
      }
    });
  }

  private _loading = signal(false);
  private _current = signal<UserProfileRow | ProfileWithConnection | null>(
    null,
  );

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

  async followOrUnfollow() {
    const target = this.current()?.$id;
    const follower = this.authStore.profile()?.$id;

    if (!target || !follower) {
      throw new Error('Perfil ou usuário não encontrado.');
    }

    if (target === follower) {
      throw new Error('Você não pode seguir a si mesmo.');
    }

    await this.connectionsService.followOrUnfollow(target, follower);
  }
}
