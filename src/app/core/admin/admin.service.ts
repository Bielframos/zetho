import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import {
  AdminAddGameResponse,
  AdminActivateRaffleResponse,
  AdminAddKeysResponse,
  AdminApiError,
  AdminAuditAllResponse,
  AdminAuditOneResponse,
  AdminCreateRaffleBody,
  AdminCreateRaffleWithKeysBody,
  AdminProfilesResponse,
  AdminRaffleListResponse,
  AdminRaffleResponse,
} from './admin.types';
import { safeLocalStorage } from '../../utils/platform-storage';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private authStore = inject(AuthStore);

  private async request<T>(path: string, init: RequestInit = {}) {
    const jwt = await this.authStore.getJwt();

    const response = await fetch(new URL(path, environment.zethoApiEndpoint), {
      ...init,
      headers: {
        Authorization: `Bearer ${jwt}`,
        'x-appwrite-session': safeLocalStorage.getItem('cookieFallback') ?? '',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      let message = 'Ocorreu um erro ao processar a requisição.';

      try {
        const payload = await response.json();

        if (Array.isArray(payload.message)) {
          message = payload.message.join(', ');
        }
      } catch {}

      throw {
        message,
        status: response.status,
      } as AdminApiError;
    }

    return (await response.json()) as T;
  }

  async addGameByIgdbId(id: number) {
    return this.request<AdminAddGameResponse>(`igdb/games/${id}?force=true`, {
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

  // --- Sorteios ---

  async listRaffles(
    params: { active?: boolean; gameId?: string; limit?: number } = {},
  ) {
    const query = new URLSearchParams();
    if (params.active !== undefined) query.set('active', String(params.active));
    if (params.gameId) query.set('gameId', params.gameId);
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return this.request<AdminRaffleListResponse>(
      `raffles${qs ? `?${qs}` : ''}`,
    );
  }

  async createRaffle(body: AdminCreateRaffleBody) {
    return this.request<AdminRaffleResponse>('raffles', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        basicProbability: body.basicProbability
          ? parseInt(String(body.basicProbability))
          : undefined,
        ticketPrice: body.ticketPrice
          ? parseInt(String(body.ticketPrice))
          : undefined,
      }),
    });
  }

  async createRaffleWithKeys(body: AdminCreateRaffleWithKeysBody) {
    return this.request<AdminRaffleResponse>('raffles/with-keys', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        basicProbability: body.basicProbability
          ? parseInt(String(body.basicProbability))
          : undefined,
        ticketPrice: body.ticketPrice
          ? parseInt(String(body.ticketPrice))
          : undefined,
      }),
    });
  }

  async activateRaffle(raffleId: string) {
    return this.request<AdminActivateRaffleResponse>(
      `raffles/${raffleId}/activate`,
      { method: 'PATCH' },
    );
  }

  async addKeysToRaffle(
    raffleId: string,
    keys: Array<{ key: string; platform: string }>,
  ) {
    return this.request<AdminAddKeysResponse>(`raffles/${raffleId}/keys`, {
      method: 'POST',
      body: JSON.stringify({ keys }),
    });
  }
}
