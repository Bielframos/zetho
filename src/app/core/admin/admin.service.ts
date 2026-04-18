import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import {
  AdminAddGameResponse,
  AdminApiError,
  AdminAuditAllResponse,
  AdminAuditOneResponse,
  AdminProfilesResponse,
} from './admin.types';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private authStore = inject(AuthStore);

  private async request<T>(path: string, init: RequestInit = {}) {
    const jwt = await this.authStore.getJwt();

    const response = await fetch(new URL(path, environment.zethoApiEndpoint), {
      ...init,
      headers: {
        Authorization: `Bearer ${jwt}`,
        'x-appwrite-session': localStorage.getItem('cookieFallback') ?? '',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      let message = 'Ocorreu um erro ao processar a requisição.';

      try {
        const payload = await response.json();
        message = payload?.message ?? message;
      } catch {}

      throw {
        message,
        status: response.status,
      } as AdminApiError;
    }

    return (await response.json()) as T;
  }

  async addGameByIgdbId(id: number) {
    return this.request<AdminAddGameResponse>(`igdb/games/${id}`, {
      method: 'POST',
    });
  }

  async listProfiles(page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    return this.request<AdminProfilesResponse>(`profile?${params.toString()}`);
  }

  async auditAllProfiles(fix = false) {
    const params = new URLSearchParams();
    if (fix) params.set('fix', '1');

    const queryString = params.toString();
    const path = queryString ? `profile/audit?${queryString}` : 'profile/audit';

    return this.request<AdminAuditAllResponse>(path);
  }

  async auditProfile(profileId: string, fix = false) {
    const params = new URLSearchParams();
    if (fix) params.set('fix', '1');

    const queryString = params.toString();
    const path = queryString
      ? `profile/${profileId}/audit?${queryString}`
      : `profile/${profileId}/audit`;

    return this.request<AdminAuditOneResponse>(path);
  }
}
