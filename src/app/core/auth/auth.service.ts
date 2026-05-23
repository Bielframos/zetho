import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { appwrite } from '../appwrite/appwrite.client';
import { UserProfileRow } from '../userProfiles/userProfile.types';
import { UserProfileService } from '../userProfiles/userProfile.service';
import type {
  InviteBonusResponse,
  InviteCodeResponse,
} from '../userProfiles/userProfile.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private userProfService: UserProfileService) {}

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
      await appwrite.account.create({
        userId: 'unique()',
        name,
        email,
        password,
      });

      await this.login(email, password);
      const user = await this.getLoggedInUser();

      if (!user)
        throw { message: 'Ocorreu um erro ao fazer o registro.', code: 500 };

      const res = await fetch(
        new URL('profile', environment.zethoApiEndpoint),
        {
          headers: {
            Authorization: `Bearer ${await this.createJWT()}`,
            'x-appwrite-session': localStorage.getItem('cookieFallback') ?? '',
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            gamertag,
            ...(inviteCode ? { inviteCode } : {}),
          }),
        },
      );

      if (!res.ok)
        throw { message: 'Ocorreu um erro ao fazer o registro.', code: 500 };

      return {
        user,
        profile: (await res.json()) as UserProfileRow,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async deleteAccount(profileId: string) {
    await this.userProfService.updateProfile(profileId, {
      status: 'pending_deletion',
      deletedAt: new Date(Date.now()).toISOString(),
    });

    await appwrite.account.updateStatus();
  }

  /**
   * Método de login com e-mail e senha
   * @param email
   * @param password
   */
  async login(email: string, password: string) {
    return await appwrite.account.createEmailPasswordSession({
      email,
      password,
    });
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
          'x-appwrite-session': localStorage.getItem('cookieFallback') ?? '',
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
          'x-appwrite-session': localStorage.getItem('cookieFallback') ?? '',
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
