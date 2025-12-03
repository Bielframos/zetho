import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { appwrite, ExecutionMethod } from '../appwrite/appwrite.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Método de registro para novos usuários
   * @param email
   * @param password
   * @param name
   * @param gamertag
   */
  async register(email: string, password: string, name: string, gamertag: string) {
    try {
      const execution = await appwrite.functions.createExecution({
        functionId: 'users-core',
        xpath: '/register',
        method: ExecutionMethod.POST,
        body: JSON.stringify({ email, name, gamertag, password }),
      });

      let body: any;

      try {
        body = JSON.parse(execution.responseBody || '{}');
      } catch (e) {
        throw { message: 'Invalid JSON returned by server.', code: 500 };
      }

      // Se a function retornou um código 4xx ou 5xx, trate como erro
      if (execution.responseStatusCode >= 400 || body.error) {
        throw { message: body.message || 'Registration failed.', code: execution.responseStatusCode };
      }

      // Profile retornado pelo backend
      const profile = body.profile;
      if (!profile) {
        throw { message: 'Missing profile in server response.', code: 500 };
      }

      // Cria sessão automaticamente
      await appwrite.account.createEmailPasswordSession({ email, password });
      const user = await appwrite.account.get()

      return { user, profile };

    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }


  /**
   * Método de login com e-mail e senha
   * @param email
   * @param password
   */
  async login(email: string, password: string) {
    return await appwrite.account.createEmailPasswordSession({ email, password });
  }

  /**
   * Método de logout para encerrar a sessão do usuário
   * @returns
   */
  async logout() {
    return await appwrite.account.deleteSession({ sessionId: 'current' });
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
   * Método para gerar uma verificação de e-mail
   */
  async createEmailVerification() {
    await appwrite.account.createEmailVerification({ url: new URL('/verificacao', environment.appUrl).toString() })
  }

  /**
   * Método que confirma a verificação do e-mail
   * @param userId 
   * @param secret 
   */
  async verifyEmail(userId: string, secret: string) {
    await appwrite.account.updateEmailVerification({ userId, secret })
  }

  async createRecoveryPass(email: string) {
    await appwrite.account.createRecovery({ email, url: new URL('/redefinir-senha', environment.appUrl).toString() })
  }

  async recoveryPass(userId: string, secret: string, password: string) {
    await appwrite.account.updateRecovery({ userId, secret, password })
  }
}
