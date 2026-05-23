import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import { NotificationStore } from '../notifications/notification.store';
import type { ZEntryRow } from '../../types';
import {
  WeeklyZCoinLeaderboardResponse,
  ZCoinReason,
  ZCoinRewardPreview,
  ZCoinTransactionResponse,
} from './zcoins.types';

const REWARD_TABLE = {
  daily_login: 5,
  engaged: 1,
  finished_game: 6,
  playing_game: 4,
  add_game_to_library: 2,
} as const satisfies Record<ZCoinReason, number>;

@Injectable({ providedIn: 'root' })
export class ZCoinsService {
  constructor(
    private authStore: AuthStore,
    private notification: NotificationStore,
  ) {}

  async applyInput(reason: ZCoinReason) {
    const profile = this.authStore.profile();

    if (!profile?.userId) {
      return null;
    }

    try {
      const result = await this.request<ZCoinTransactionResponse>(
        'zcoins/input',
        {
          method: 'POST',
          body: JSON.stringify({ userId: profile.userId, reason }),
        },
      );

      this.authStore.setZcoinBalance(result.balance);
      this.notification.show({
        message: this.buildGainMessage(result.amount, reason),
        type: 'success',
        iconUrl: '/z-coin.webp',
      });

      return result;
    } catch (error: any) {
      if (error?.status === 409 && reason === 'daily_login') {
        return null;
      }

      throw error;
    }
  }

  async applyOutput(reason: ZCoinReason) {
    const profile = this.authStore.profile();

    if (!profile?.userId) {
      return null;
    }

    const result = await this.request<ZCoinTransactionResponse>(
      'zcoins/output',
      {
        method: 'POST',
        body: JSON.stringify({ userId: profile.userId, reason }),
      },
    );

    this.authStore.setZcoinBalance(result.balance);
    this.notification.show({
      message: `-${Math.abs(result.amount)} zcoins gastos.`,
      type: 'info',
      iconUrl: '/z-coin.webp',
    });

    return result;
  }

  async recordDailyLogin() {
    try {
      return await this.applyInput('daily_login');
    } catch (error: any) {
      if (error?.status === 409) {
        return null;
      }

      console.error('Falha ao registrar daily_login em zcoins', error);
      return null;
    }
  }

  async getWeeklyLeaderboard(limit = 20) {
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    return this.request<WeeklyZCoinLeaderboardResponse>(
      `zcoins/leaderboard/weekly?limit=${safeLimit}`,
      { method: 'GET' },
      { auth: false },
    );
  }

  previewGameEntryReward(params: {
    action: 'updateStatus' | 'like' | 'hype';
    value:
      | boolean
      | 'completed'
      | 'backlog'
      | 'dropped'
      | 'playing'
      | 'wishlist'
      | null
      | undefined;
    currentEntry?: ZEntryRow | null;
  }): ZCoinRewardPreview | null {
    if (
      params.action === 'hype' ||
      (params.action === 'updateStatus' && params.value === 'wishlist')
    ) {
      return null;
    }

    if (params.action === 'like') {
      const likedEver =
        params.currentEntry?.likedEver ?? params.currentEntry?.likeEver ?? false;
      const nowLiked = Boolean(params.value);
      if (!likedEver && nowLiked) {
        return {
          amount: REWARD_TABLE.engaged,
          reason: 'engaged',
          label: 'por curtir um jogo',
        };
      }
      return null;
    }

    const rank = (status: ZEntryRow['status'] | null | undefined) => {
      if (status === 'completed') return 3;
      if (status === 'playing') return 2;
      if (status === 'backlog') return 1;
      return 0;
    };

    const nextRank = rank(params.value as ZEntryRow['status']);
    const previousRank = rank(
      params.currentEntry?.maxStatusReached ?? params.currentEntry?.status,
    );

    if (nextRank <= previousRank) {
      return null;
    }

    if (params.value === 'completed') {
      return {
        amount: REWARD_TABLE.finished_game,
        reason: 'finished_game',
        label: 'por zerar um jogo',
      };
    }

    if (params.value === 'playing') {
      return {
        amount: REWARD_TABLE.playing_game,
        reason: 'playing_game',
        label: 'por marcar um jogo como jogando',
      };
    }

    if (params.value === 'backlog') {
      return {
        amount: REWARD_TABLE.add_game_to_library,
        reason: 'add_game_to_library',
        label: 'por adicionar um jogo ao backlog',
      };
    }

    return null;
  }

  applyOptimisticReward(reward: ZCoinRewardPreview) {
    this.authStore.adjustZcoinBalance(reward.amount);

    this.notification.show({
      message: `+${reward.amount} Z-Coins ${reward.label}.`,
      type: 'success',
      iconUrl: '/z-coin.webp',
    });

    return () => this.authStore.adjustZcoinBalance(-reward.amount);
  }

  private buildGainMessage(amount: number, reason: ZCoinReason) {
    const suffix =
      reason === 'daily_login'
        ? 'pelo login diário'
        : reason === 'engaged'
          ? 'por engajamento'
          : reason === 'finished_game'
            ? 'por zerar um jogo'
            : reason === 'playing_game'
              ? 'por marcar um jogo como jogando'
              : 'por adicionar um jogo ao backlog';

    return `+${amount} zcoins ${suffix}.`;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    opts: { auth?: boolean } = { auth: true },
  ) {
    const headers = new Headers(init.headers ?? {});
    headers.set('Content-Type', 'application/json');

    if (opts.auth !== false) {
      const jwt = await this.authStore.getJwt();
      headers.set('Authorization', `Bearer ${jwt}`);
      headers.set(
        'x-appwrite-session',
        localStorage.getItem('cookieFallback') ?? '',
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

    return (await response.json()) as T;
  }
}
