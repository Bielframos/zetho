import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { ZEntryRow } from '../../types';
import { ZEntriesRepository } from './zEntries.repository';

@Injectable({ providedIn: 'root' })
export class ZEntryService {
  private repository = inject(ZEntriesRepository);

  /**
   * Opcional de propósito: o Firebase só é provido no bootstrap do browser
   * (`app.config.browser.ts`). Injetar obrigatoriamente derruba com NG0201
   * toda rota que use este serviço no SSR — landing, página de jogo e perfil.
   */
  private analytics = inject(Analytics, { optional: true });
  async getUserEntries(
    userFingerprint: string,
    status: Exclude<ZEntryRow['status'], null | undefined>,
    opts?: { pageSize?: number; offset?: number },
  ) {
    return this.repository.findMany(userFingerprint, { status, ...opts });
  }

  async getEntry(userFingerprint: string, gameId: string) {
    return this.repository.findUnique(userFingerprint, gameId);
  }

  async createEntryLog(
    userFingerprint: string,
    gameId: string,
    current: ZEntryRow | null,
    opts:
      | { status: ZEntryRow['status'] | null }
      | { liked?: boolean }
      | { hyped?: boolean },
  ) {
    const ZEntryLog = await this.repository.createLog(
      userFingerprint,
      gameId,
      current,
      opts,
    );

    try {
      if (this.analytics) {
        const analyticsAction =
          'status' in opts ? 'status' : 'hyped' in opts ? 'hyped' : 'liked';

        logEvent(this.analytics, 'user_game_entry_interaction', {
          action: analyticsAction,
          game_id: gameId,
        });
      }
    } catch (e) {
      console.warn('analytics log failed', e);
    }

    return ZEntryLog;
  }

  async getZEntryCount() {
    return this.repository.countEntries();
  }
}
