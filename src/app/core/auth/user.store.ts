import { computed, inject, Injectable, signal } from '@angular/core';
import { Models } from 'appwrite';
import { AuthService } from './auth.service';
import { appwrite } from '../appwrite/appwrite.client';
import { UserProfileService } from '../userProfiles/userProfile.service';
import { UserProfileRow } from '../../types';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private userProfileService = inject(UserProfileService);

  private userSignal = signal<Models.User<Models.Preferences> | null>(null);
  private profileSignal = signal<UserProfileRow | null>(null);
  private loadingSignal = signal(false);

  readonly user = computed(() => this.userSignal());
  readonly profile = computed(() => this.profileSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly avatarUrl = computed(() =>
    appwrite.avatars.getInitials({
      name: this.user()?.name,
      width: 64,
      height: 64,
      background: '3e63dd',
    }),
  );

  constructor(private authService: AuthService) {}

  async register(
    email: string,
    password: string,
    name: string,
    gamertag: string,
  ) {
    try {
      const { user, profile } = await this.authService.register(
        email,
        password,
        name,
        gamertag,
      );

      this.userSignal.set(user);
      this.profileSignal.set(profile);
    } catch (e: any) {
      alert(e.message);
    }
  }

  /**
   * Método para inicializar o estado de autenticação
   * @returns
   */
  async init() {
    const cached = sessionStorage.getItem('user');
    if (cached) this.userSignal.set(JSON.parse(cached));

    this.loadingSignal.set(true);

    try {
      const user = await this.authService.getLoggedInUser();
      const profile = await this.userProfileService.getProfileByUserId(
        user!.$id,
      );

      this.userSignal.set(user);
      this.profileSignal.set(profile);

      sessionStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      this.clear();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Método para atualizar o estado de autenticação
   */
  async refresh() {
    try {
      const user = await this.authService.getLoggedInUser();
      const profile = await this.userProfileService.getProfileByUserId(
        user!.$id,
      );

      this.userSignal.set(user);
      this.profileSignal.set(profile);
      sessionStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      this.clear();
    }
  }

  /**
   * Método de login com e-mail e senha
   * @param email
   * @param password
   */
  async login(email: string, password: string) {
    try {
      const session = await this.authService.login(email, password);
      if (session) await this.refresh();
    } catch (e) {
      this.clear();
      throw e;
    }
  }

  /**
   * Método de logout para encerrar a sessão do usuário
   */
  async logout() {
    try {
      await this.authService.logout();
    } catch {}
    this.clear();
  }

  /**
   * Método para atualizar o nome do usuário
   * @param newName
   */
  async updateName(newName: string) {
    try {
      const updatedUser = await appwrite.account.updateName({ name: newName });
      this.userSignal.set(updatedUser);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Método para atualizar a gamertag de um usuário
   * @param newGamertag
   */
  async updateGamertag(newGamertag: string) {
    try {
      const updatedProfile = await this.userProfileService.updateProfile(
        this.profile()!.$id,
        { gamertag: newGamertag },
      );
      this.profileSignal.set(updatedProfile);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Método para limpar o estado de autenticação
   */
  clear() {
    this.userSignal.set(null);
    sessionStorage.removeItem('user');
  }
}
