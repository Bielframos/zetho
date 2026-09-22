import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../shared/infra/social-api';
import { EntryGrouping, ProfileEntriesPage, ZEntryRow } from './zEntries.types';
import { appwrite, Query } from '../../shared/infra/appwrite/appwrite.client';

const Z_ENTRIES_READ_TABLE_ID = 'z_entries_read';

@Injectable({ providedIn: 'root' })
export class ZEntriesRepository {
  private readonly api = inject(SocialApi);

  async createLog(
    userFingerprint: string,
    gameId: string,
    current: ZEntryRow | null,
    opts?: {
      status?: ZEntryRow['status'] | null;
      liked?: boolean;
      hyped?: boolean;
      playedPlatformId?: string | null;
      playedPlatform?: string | null;
      completionType?: string | null;
      playtimeMinutes?: number | null;
    },
  ) {
    const data = { gameId, ...opts };

    return this.api.request<ZEntryRow>('social/entries', 'POST', data);
  }

  async findUnique(userFingerprint: string, gameId: string) {
    const zEntries = await appwrite.databases.listRows<ZEntryRow>({
      databaseId: 'app',
      tableId: Z_ENTRIES_READ_TABLE_ID,
      queries: [
        Query.equal('ownerFingerprint', userFingerprint),
        Query.equal('gameId', gameId),
        Query.limit(1),
      ],
    });

    return zEntries.rows[0] ?? null;
  }

  async findMany(
    userFingerprint: string,
    opts?: {
      status: Exclude<ZEntryRow['status'], null | undefined>;
      group?: EntryGrouping;
      pageSize?: number;
      offset?: number;
    },
  ) {
    const params = new URLSearchParams({
      status: opts?.status ?? 'completed',
      group: opts?.group ?? 'none',
      limit: String(opts?.pageSize ?? 32),
      offset: String(opts?.offset ?? 0),
    });
    return this.api.requestPublic<ProfileEntriesPage>(
      `profile/${encodeURIComponent(userFingerprint)}/entries?${params}`,
    );
  }

  async countEntries() {
    const response = await appwrite.databases.listRows<ZEntryRow>({
      databaseId: 'app',
      tableId: Z_ENTRIES_READ_TABLE_ID,
      queries: [Query.select(['$id']), Query.limit(1)],
    });

    return response.total;
  }
}
