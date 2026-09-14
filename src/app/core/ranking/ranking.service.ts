import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import {
  ConnectionCompletedGamesLeaderboardResponse,
  WeeklyZCoinsLeaderboardResponse,
} from './ranking.types';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private authStore = inject(AuthStore);

  async getWeeklyZCoins(limit = 30): Promise<WeeklyZCoinsLeaderboardResponse> {
    const safeLimit = this.parseLimit(limit, 30);
    return this.request<WeeklyZCoinsLeaderboardResponse>(
      `ranking/zcoins/weekly?limit=${safeLimit}`,
      { method: 'GET' },
      { auth: false },
    );
  }

  async getConnectionsCompletedGames(
    limit = 50,
  ): Promise<ConnectionCompletedGamesLeaderboardResponse> {
    const safeLimit = this.parseLimit(limit, 50);
    return this.request<ConnectionCompletedGamesLeaderboardResponse>(
      `ranking/connections/completed-games?limit=${safeLimit}`,
      { method: 'GET' },
      { auth: true },
    );
  }

  private parseLimit(limit: number, fallback: number): number {
    if (!Number.isFinite(limit) || limit < 1) {
      return fallback;
    }
    return Math.min(Math.floor(limit), 100);
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    opts: { auth?: boolean } = { auth: true },
  ): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    headers.set('Content-Type', 'application/json');

    if (opts.auth !== false) {
      const jwt = await this.authStore.getJwt();
      if (jwt) {
        headers.set('Authorization', `Bearer ${jwt}`);
      }
    }

    const response = await fetch(new URL(path, environment.zethoApiEndpoint), {
      ...init,
      headers,
    });

    if (!response.ok) {
      let message = 'Ocorreu um erro ao carregar os dados do ranking.';

      try {
        const payload = await response.json();
        message = payload?.message ?? message;
      } catch {}

      const error = new Error(message) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    return (await response.json()) as T;
  }
}
