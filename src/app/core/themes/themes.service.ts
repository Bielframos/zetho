import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import { ProfileTheme, CreateThemePayload } from './themes.types';
import { safeLocalStorage } from '../../utils/platform-storage';

@Injectable({ providedIn: 'root' })
export class ThemesService {
  private authStore = inject(AuthStore);

  private async request<T>(path: string, init: RequestInit = {}) {
    const jwt = await this.authStore.getJwt();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${jwt}`,
      'x-appwrite-session': safeLocalStorage.getItem('cookieFallback') ?? '',
    };

    if (init.body && typeof init.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(new URL(path, environment.zethoApiEndpoint), {
      ...init,
      headers: {
        ...headers,
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message || 'Erro ao processar requisição';
      throw { message, status: response.status };
    }

    return (await response.json()) as T;
  }

  async listThemes() {
    const themes = await this.request<ProfileTheme[]>('themes');
    console.log(themes)
    return themes;
  }

  async buyTheme(id: string) {
    return this.request<{ success: boolean; themeId: string }>(
      `themes/buy/${id}`,
      {
        method: 'POST',
      },
    );
  }

  async equipTheme(id: string) {
    return this.request<{ success: boolean; activeThemeId: string | null }>(
      `themes/equip/${id}`,
      {
        method: 'POST',
      },
    );
  }

  async unequipTheme() {
    return this.request<{ success: boolean }>(`themes/equip`, {
      method: 'DELETE',
    });
  }

  async createAdminTheme(payload: CreateThemePayload, file?: File | null) {
    if (!file) {
      return this.request<ProfileTheme>('admin/themes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const body = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null && value !== '') {
        body.append(key, String(value));
      }
    }
    body.append('backgroundImage', file);

    return this.request<ProfileTheme>('admin/themes', {
      method: 'POST',
      body,
    });
  }
}
