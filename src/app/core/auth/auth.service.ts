import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { appwrite } from '../../shared/infra/appwrite/appwrite.client';
import { SocialApi } from '../../shared/infra/social-api';
import { UserProfileRow } from '../userProfiles/userProfile.types';
import { UserProfileService } from '../userProfiles/userProfile.service';
import type {
  InviteBonusResponse,
  InviteCodeResponse,
} from '../userProfiles/userProfile.types';
import { safeLocalStorage } from '../../utils/platform-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private userProfService: UserProfileService,
    private socialApi: SocialApi,
  ) {}

  /**
   * Método de registro para novos usuários
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
      try {
        await appwrite.account.create({
          userId: 'unique()',
          name,
          email,
          password,
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 409) throw error;
        // A failed profile step may leave an account behind. Authenticate it
        // before resuming; never infer identity from the duplicate email alone.
      }
      let user = await this.getLoggedInUser();
      if (!user) {
        await this.login(email, password);
        user = await this.getLoggedInUser();
      }
      if (!user || user.email.toLowerCase() !== email.trim().toLowerCase())
        throw {
          message: 'Entre na conta correspondente para concluir o registro.',
          code: 401,
        };
      return {
        user,
        profile: await this.completeRegistration(gamertag, inviteCode),
      };
    } catch (error) {
      throw error;
    }
  }

  async completeRegistration(
    gamertag: string,
    inviteCode?: string,
  ): Promise<UserProfileRow> {
    const res = await fetch(new URL('profile', environment.zethoApiEndpoint), {
      headers: {
        Authorization: `Bearer ${await this.createJWT()}`,
        'x-appwrite-session': safeLocalStorage.getItem('cookieFallback') ?? '',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        gamertag,
        ...(inviteCode ? { inviteCode } : {}),
      }),
    });

    if (!res.ok)
      throw { message: 'Ocorreu um erro ao fazer o registro.', code: 500 };

    return (await res.json()) as UserProfileRow;
  }

  async deleteAccount(profileId: string) {
    await this.socialApi.request('profile/me/deletion', 'POST');
    await appwrite.account.updateStatus();
  }

  /**
   * Método de login com e-mail e senha
   * @param email
   * @param password
   */
  async login(email: string, password: string) {
    try {
      return await appwrite.account.createEmailPasswordSession({
        email,
        password,
      });
    } catch (error) {
      if ((error as { type?: string }).type !== 'user_session_already_exists')
        throw error;
      const current = await this.getLoggedInUser();
      if (
        !current ||
        current.email.toLowerCase() !== email.trim().toLowerCase()
      )
        throw error;
      return current;
    }
  }

  /**
   * Método de logout para encerrar a sessão do usuário
   * @returns
   */
  async logout() {
    return await appwrite.account.deleteSession({ sessionId: 'current' });
  }

  /**
   * Método para gerar um JWT válido do usuário logado
   * @returns
   */
  async createJWT() {
    const token = await appwrite.account.createJWT();
    return token.jwt;
  }

  /**
   * Método para obter os dados do usuário atual
   * @returns
   */
  async getLoggedInUser() {
    try {
      return await appwrite.account.get();
    } catch {
      return null;
    }
  }

  /**
   * Método para atualizar o e-mail do usuário
   */
  async updateEmail(newEmail: string, password: string) {
    return await appwrite.account.updateEmail({ email: newEmail, password });
  }

  async getInviteBonus(): Promise<InviteBonusResponse> {
    const res = await fetch(
      new URL('profile/me/bonus', environment.zethoApiEndpoint),
      {
        headers: {
          Authorization: `Bearer ${await this.createJWT()}`,
          'x-appwrite-session':
            safeLocalStorage.getItem('cookieFallback') ?? '',
        },
      },
    );
    if (!res.ok) throw new Error('Erro ao buscar bônus de convite.');
    return res.json() as Promise<InviteBonusResponse>;
  }

  async generateInviteCode(profileId: string): Promise<InviteCodeResponse> {
    const res = await fetch(
      new URL(`profile/${profileId}/invite-code`, environment.zethoApiEndpoint),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.createJWT()}`,
          'x-appwrite-session':
            safeLocalStorage.getItem('cookieFallback') ?? '',
        },
      },
    );
    if (!res.ok) throw new Error('Erro ao gerar código de convite.');
    return res.json() as Promise<InviteCodeResponse>;
  }

  /**
   * Método para gerar uma verificação de e-mail
   */
  async createEmailVerification() {
    await appwrite.account.createEmailVerification({
      url: new URL('/verificacao', environment.appUrl).toString(),
    });
  }

  /**
   * Método que confirma a verificação do e-mail
   * @param userId
   * @param secret
   */
  async verifyEmail(userId: string, secret: string) {
    await appwrite.account.updateEmailVerification({ userId, secret });
  }

  /**
   * Inicia um fluxo de recuperação de senha
   * @param email
   */
  async createRecoveryPass(email: string) {
    await appwrite.account.createRecovery({
      email,
      url: new URL('/redefinir-senha', environment.appUrl).toString(),
    });
  }

  /**
   * Encerra o fluxo de recuperação de senha
   * @param userId
   * @param secret
   * @param password
   */
  async recoveryPass(userId: string, secret: string, password: string) {
    await appwrite.account.updateRecovery({ userId, secret, password });
  }

  /**
   * Atualiza a foto de perfil de um usuário
   * @param profileId
   * @param file
   * @returns
   */
  async updateProfilePic(profileId: string, file: File) {
    const currentPic = await appwrite.storage
      .getFile({
        bucketId: 'profile-pics',
        fileId: profileId,
      })
      .catch(() => null);

    if (currentPic) {
      await appwrite.storage.deleteFile({
        bucketId: 'profile-pics',
        fileId: profileId,
      });
    }

    const uploadedFile = await appwrite.storage.createFile({
      bucketId: 'profile-pics',
      fileId: profileId,
      file,
    });

    const avatarUrl = appwrite.storage.getFileView({
      bucketId: 'profile-pics',
      fileId: uploadedFile.$id,
    });

    const updatedProfile = await this.userProfService.updateProfile(profileId, {
      avatarUrl: `${avatarUrl}&t=${Date.now()}`,
    });

    return updatedProfile;
  }
}
