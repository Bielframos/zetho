import { computed, inject, Injectable, signal } from '@angular/core';
import { AppwriteException, Models } from 'appwrite';
import { AuthService } from './auth.service';
import { appwrite } from '../appwrite/appwrite.client';
import { UserProfileService } from '../userProfiles/userProfile.service';
import { UserProfileRow } from '../../types';
import type {
  InviteBonusResponse,
  InviteCodeResponse,
} from '../userProfiles/userProfile.types';
import { NotificationStore } from '../notifications/notification.store';

const JWT_TTL_MS = 15 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private userProfileService = inject(UserProfileService);

  private userSignal = signal<Models.User<Models.Preferences> | null>(null);
  private profileSignal = signal<UserProfileRow | null>(null);
  private loadingSignal = signal(false);
  private cachedJwt = signal<string | null>(null);
  private jwtExpirationTime = signal<number | null>(null);
  private jwtRequestInFlight: Promise<string> | null = null;

  readonly user = computed(() => this.userSignal());
  readonly profile = computed(() => this.profileSignal());
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => {
    const labels = this.user()?.labels ?? [];
    return labels.includes('admim') || labels.includes('admin');
  });

  readonly loading = computed(() => this.loadingSignal());

  readonly avatarUrl = computed(() => {
    if (!this.profile()?.avatarUrl) {
      return appwrite.avatars.getInitials({
        name: this.profile()?.gamertag,
        width: 160,
        height: 160,
        background: '3e63dd',
      });
    }

    return this.profile()?.avatarUrl!;
  });

  adjustZcoinBalance(delta: number) {
    const current = this.profileSignal();

    if (!current) {
      return;
    }

    this.profileSignal.set({
      ...current,
      zcoinBalance: Number(current.zcoinBalance ?? 0) + delta,
    });
  }

  setZcoinBalance(balance: number) {
    const current = this.profileSignal();
    if (!current) return;
    this.profileSignal.set({ ...current, zcoinBalance: balance });
  }

  setInviteCode(code: string) {
    const current = this.profileSignal();
    if (!current) return;
    this.profileSignal.set({ ...current, inviteCode: code });
  }

  constructor(
    private authService: AuthService,
    private notification: NotificationStore,
  ) {}

  /**
   * Método para registro de novos usuários
   * @param email
   * @param password
   * @param name
   * @param gamertag
   */
  async register(
    email: string,
    password: string,
    name: string,
    gamertag: string,
    inviteCode?: string,
  ) {
    try {
      const { user, profile } = await this.authService.register(
        email,
        password,
        name,
        gamertag,
        inviteCode,
      );

      this.userSignal.set(user);
      this.profileSignal.set(profile);
    } catch (e: any) {
      alert(e.message);
    }
  }

  /**
   * Método para exclusão de uma conta
   */
  async delete() {
    try {
      await this.authService.deleteAccount(this.profile()!.$id);
      this.clear();
    } catch (e) {
      throw e;
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
      await this.getJwt();
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
      await this.getJwt(true);
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
      if (session) {
        await this.refresh();
      }
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
   * Método para obter um JWT válido do usuário logado
   */
  async getJwt(forceRefresh = false): Promise<string> {
    const currentTime = Date.now();
    const currentJwt = this.cachedJwt();
    const expiresAt = this.jwtExpirationTime();

    if (
      !forceRefresh &&
      currentJwt &&
      expiresAt !== null &&
      currentTime < expiresAt
    ) {
      return currentJwt;
    }

    if (this.jwtRequestInFlight) {
      return this.jwtRequestInFlight;
    }

    try {
      this.jwtRequestInFlight = this.authService.createJWT();
      const token = await this.jwtRequestInFlight;

      this.cachedJwt.set(token);
      this.jwtExpirationTime.set(Date.now() + JWT_TTL_MS);

      return token;
    } catch (e) {
      console.error('Erro ao gerar JWT do Appwrite', e);
      this.cachedJwt.set(null);
      this.jwtExpirationTime.set(null);
      throw e;
    } finally {
      this.jwtRequestInFlight = null;
    }
  }

  /**
   * Método para atualizar o nome do usuário
   * @param newName
   */
  async updateName(newName: string) {
    try {
      const updatedUser = await appwrite.account.updateName({ name: newName });
      this.userSignal.set(updatedUser);

      this.notification.show({
        message: 'Nome atualizado.',
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      this.notification.show({
        message: 'Ocorreu um erro ao atualizar o seu nome.',
        type: 'error',
      });
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

      this.notification.show({
        message: 'Gamertag atualizada.',
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      this.notification.show({
        message: 'Ocorreu um erro ao atualizar a sua gamertag.',
        type: 'error',
      });
      throw e;
    }
  }

  /**
   * Método para atualização do e-mail de um usuário
   * @param newEmail
   * @param password
   */
  async updateEmail(newEmail: string, password: string) {
    try {
      await this.authService.updateEmail(newEmail, password);
      this.refresh();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Método para atualizar a foto do perfil de um usuário
   * @param file
   */
  async updateProfilePic(file: File) {
    try {
      const updatedProfile = await this.authService.updateProfilePic(
        this.profile()!.$id,
        file,
      );

      this.profileSignal.set(updatedProfile);

      this.notification.show({
        message: 'Foto de perfil atualizada.',
        type: 'success',
      });
    } catch (e) {
      const error = e as AppwriteException;
      console.error(e);

      if (error.type === 'storage_invalid_file_size')
        this.notification.show({
          message: 'A imagem excede o limite de 2mb.',
          type: 'error',
        });
      else if (error.type === 'storage_file_type_unsupported')
        this.notification.show({
          message: 'O tipo de arquivo não é suportado.',
          type: 'error',
        });
      else
        this.notification.show({
          message: 'Ocorreu um erro ao atualizar a foto de perfil.',
          type: 'error',
        });
    }
  }

  /** Método genérico para atualização de informações adicionais do perfil */
  async updateProfile(profile: {
    bio?: string;
    socialXbox?: string;
    socialSteam?: string;
    socialPsn?: string;
    socialNintendo?: string;
  }) {
    try {
      const updatedProfile = await this.userProfileService.updateProfile(
        this.profile()!.$id,
        { ...profile },
      );

      this.profileSignal.set(updatedProfile);

      this.notification.show({
        message: 'Informações atualizadas.',
        type: 'success',
      });
    } catch (e) {
      console.error(e);

      this.notification.show({
        message: 'Ocorreu um erro ao atualizar o seu perfil.',
        type: 'error',
      });

      throw e;
    }
  }

  /**
   * Método para limpar o estado de autenticação
   */
  clear() {
    this.userSignal.set(null);
    this.profileSignal.set(null);
    this.cachedJwt.set(null);
    this.jwtExpirationTime.set(null);
    this.jwtRequestInFlight = null;
    sessionStorage.removeItem('user');
  }

  async getInviteBonus(): Promise<InviteBonusResponse> {
    return this.authService.getInviteBonus();
  }

  async generateInviteCode(): Promise<InviteCodeResponse> {
    const profileId = this.profile()?.$id;
    if (!profileId) throw new Error('Perfil não encontrado.');
    const result = await this.authService.generateInviteCode(profileId);
    this.setInviteCode(result.inviteCode);
    return result;
  }
}
