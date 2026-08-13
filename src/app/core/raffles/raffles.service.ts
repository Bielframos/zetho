import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import {
  BuyTicketsResponse,
  RaffleEntriesResponse,
  RaffleItem,
  RaffleListParams,
  RaffleListResponse,
  RaffleMyKeysResponse,
} from './raffle.types';
import { safeLocalStorage } from '../../utils/platform-storage';

@Injectable({ providedIn: 'root' })
export class RafflesService {
  private authStore = inject(AuthStore);

  currentRaffle = signal<RaffleItem | null>(null);

  private async request<T>(
    path: string,
    init: RequestInit = {},
    opts: { auth?: boolean } = { auth: true },
  ): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    headers.set('Content-Type', 'application/json');

    if (opts.auth !== false) {
      const jwt = await this.authStore.getJwt();
      headers.set('Authorization', `Bearer ${jwt}`);
      headers.set(
        'x-appwrite-session',
        safeLocalStorage.getItem('cookieFallback') ?? '',
      );
    }

    const response = await fetch(new URL(path, environment.zethoApiEndpoint), {
      ...init,
      headers,
    });

    if (!response.ok) {
      let message = 'Ocorreu um erro ao processar a requisição.';
      try {
        const payload = await response.json();
        message = payload?.message ?? message;
      } catch {}
      const error = new Error(message) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();

    return data as T;
  }

  async listRaffles(params: RaffleListParams = {}) {
    const query = new URLSearchParams();
    if (params.active !== undefined) query.set('active', String(params.active));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.gameId) query.set('gameId', params.gameId);

    const qs = query.toString();
    return this.request<RaffleListResponse>(
      `raffles${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
      { auth: false },
    );
  }

  async loadRaffleById(raffleId: string): Promise<void> {
    if (this.currentRaffle()?.$id === raffleId) return;

    const response = await this.listRaffles({ limit: 50 });
    const found = response.raffles.find((r) => r.$id === raffleId);
    if (found) this.currentRaffle.set(found);
  }

  async buyTickets(raffleId: string, ticketCount: number) {
    return this.request<BuyTicketsResponse>(`raffles/${raffleId}/tickets`, {
      method: 'POST',
      body: JSON.stringify({ ticketCount }),
    });
  }

  async getMyKeys() {
    return this.request<RaffleMyKeysResponse>('raffles/my-keys', {
      method: 'GET',
    });
  }

  async getEntries(raffleId: string) {
    return this.request<RaffleEntriesResponse>(`raffles/${raffleId}/entries`, {
      method: 'GET',
    });
  }
}
