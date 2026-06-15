import { Injectable } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { ZEntryRow } from '../../types';
import { ZEntriesRepository } from './zEntries.repository';

@Injectable({ providedIn: 'root' })
export class ZEntryService {
  constructor(
    private repository: ZEntriesRepository,
    private analytics: Analytics,
  ) {}
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
      const analyticsAction =
        'status' in opts ? 'status' : 'hyped' in opts ? 'hyped' : 'liked';

      logEvent(this.analytics, 'user_game_entry_interaction', {
        action: analyticsAction,
        game_id: gameId,
      });
    } catch (e) {
      console.warn('analytics log failed', e);
    }

    return ZEntryLog;
  }

  async getZEntryCount() {
    return this.repository.countEntries();
  }
}
