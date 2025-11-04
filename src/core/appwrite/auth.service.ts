import { Injectable } from '@angular/core';
import { appwrite } from './appwrite.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Método de registro para novos usuários
   * @param email
   * @param password
   * @param name
   * @param gamertag
   */
  async register(email: string, password: string, name: string, gamertag: string) {}

  /**
   * Método de login com e-mail e senha
   * @param email
   * @param password
   */
  async login(email: string, password: string) {}

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
  async me() {
    try {
      return await appwrite.account.get();
    } catch {
      return null;
    }
  }
}
