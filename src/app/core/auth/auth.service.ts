import { Injectable } from '@angular/core';
import { appwrite, ID } from '../appwrite/appwrite.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Método de registro para novos usuários
   * @param email
   * @param password
   * @param name
   * @param gamertag
   */
  async register(email: string, password: string, name: string) {
    try {
      const user = await appwrite.account.create({
        userId: ID.unique(),
        email,
        password,
        name,
      });
      await appwrite.account.createEmailPasswordSession({ email, password });
      return user
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
    try {
      await appwrite.account.createEmailPasswordSession({ email, password });
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
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
}
