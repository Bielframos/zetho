import { computed, effect, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { ProfileWithConnection, UserProfileRow } from '../../types';
import { appwrite } from '../appwrite/appwrite.client';
import { AuthStore } from '../auth/auth.store';
import { ConnectionsService } from '../connections/connections.service';
import type { ConnectionRow } from '../connections/connections.types';
import { ProfileTheme } from '../themes/themes.types';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  constructor(
    private authStore: AuthStore,
    private connectionsService: ConnectionsService,
  ) {
    // Sempre que o perfil atual ou o perfil do usuário logado mudarem, verificamos a conexão entre eles.
    // _connection é um sinal separado para evitar que a atualização da conexão re-dispare o effect.
    effect(() => {
      const myProfile = this.authStore.profile();
      const currentProfile = this._current();

      this._connection.set(undefined);

      if (myProfile && currentProfile && myProfile.$id !== currentProfile.$id) {
        const targetProfileId = currentProfile.$id;

        this.connectionsService
          .getConnection(targetProfileId, myProfile.$id)
          .then((connection) => {
            // Ignora resultado se o perfil foi trocado enquanto a requisição estava em andamento
            if (this._current()?.$id === targetProfileId) {
              this._connection.set(connection);
            }
          });
      }
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
  private _connection = signal<ConnectionRow | null | undefined>(undefined);
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
      const connection = this._connection();
      if (!profile) return null;
      if (connection === undefined) return profile;
      return { ...profile, connection };
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
    this._connection.set(undefined);
    this._current.set(profile);
  };

  async followOrUnfollow() {
    const target = this._current()?.$id;
    const follower = this.authStore.profile()?.$id;

    if (!target || !follower) {
      throw new Error('Perfil ou usuário não encontrado.');
    }

    if (target === follower) {
      throw new Error('Você não pode seguir a si mesmo.');
    }

    await this.connectionsService.followOrUnfollow(target, follower);

    // Atualiza o estado da conexão após seguir/deixar de seguir
    const connection = await this.connectionsService.getConnection(
      target,
      follower,
    );
    this._connection.set(connection);
  }
}
