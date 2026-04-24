import { Injectable } from '@angular/core';
import { ZEntry, ZEntryRow } from './zEntries.types';
import { appwrite, Query } from '../appwrite/appwrite.client';

const Z_ENTRIES_TABLE_ID = 'z_entries';
const Z_ENTRIES_READ_TABLE_ID = 'z_entries_read';

@Injectable({ providedIn: 'root' })
export class ZEntriesRepository {
  constructor() {}

  async createLog(
    userFingerprint: string,
    gameId: string,
    current: ZEntryRow | null,
    opts?: {
      status?: ZEntryRow['status'] | null;
      liked?: boolean;
      hyped?: boolean;
    },
  ) {
    const liked =
      'liked' in (opts ?? {}) ? opts!.liked : (current?.liked ?? false);
    const hyped =
      'hyped' in (opts ?? {}) ? opts!.hyped : (current?.hyped ?? false);
    const status = opts?.status
      ? opts.status === current?.status
        ? null
        : opts.status
      : current?.status || null;

    const data: ZEntry = {
      gameId,
      ownerFingerprint: userFingerprint,
      status,
      liked,
      hyped,
    };

    if (current) {
      const {
        $id,
        $sequence,
        $tableId,
        $databaseId,
        $createdAt,
        $updatedAt,
        $permissions,
        status: _s,
        liked: _l,
        hyped: _h,
        ...cleanCurrent
      } = current;
      Object.assign(data, cleanCurrent);
    }

    return await appwrite.databases.createRow<ZEntryRow>({
      databaseId: 'app',
      tableId: Z_ENTRIES_TABLE_ID,
      rowId: 'unique()',
      data,
    });
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
      Query.select(['$id', 'status', 'gameId']),
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
