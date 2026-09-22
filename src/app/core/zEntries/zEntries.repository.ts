import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../shared/infra/social-api';
import { ZEntryRow } from './zEntries.types';
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
      pageSize?: number;
      offset?: number;
    },
  ) {
    const queries = [
      Query.select(['*']),
      Query.equal('ownerFingerprint', userFingerprint),
      Query.orderDesc('$updatedAt'),
      Query.limit(opts?.pageSize || 12),
      Query.offset(opts?.offset || 0),
    ];

    if (opts?.status) queries.push(Query.equal('status', opts.status));

    return await appwrite.databases.listRows<ZEntryRow>({
      databaseId: 'app',
      tableId: Z_ENTRIES_READ_TABLE_ID,
      queries,
    });
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
