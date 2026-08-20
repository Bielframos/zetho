import { Injectable } from '@angular/core';
import { UserProfileRow } from '../../types';
import { appwrite, Query } from '../../shared/infra/appwrite/appwrite.client';
import { ConnectionRow } from './connections.types';

const DATABASE_ID = 'app';
const CONNECTIONS_TABLE_ID = 'connections';
const USER_PROFILES_TABLE_ID = 'user_profiles';

@Injectable({ providedIn: 'root' })
export class ConnectionsRepository {
  async findUnique(
    profileId: string,
    followerId: string,
  ): Promise<ConnectionRow | null> {
    const connections = await appwrite.databases.listRows<ConnectionRow>({
      databaseId: DATABASE_ID,
      tableId: CONNECTIONS_TABLE_ID,
      queries: [
        Query.equal('requesterProfileId', followerId),
        Query.equal('targetProfileId', profileId),
      ],
    });

    return connections.total > 0 ? connections.rows[0] : null;
  }

  async getFollowers(
    profileId: string,
    opts: { pageSize?: number; offset?: number } = { pageSize: 12, offset: 0 },
  ): Promise<{ rows: UserProfileRow[]; total: number }> {
    const connections = await appwrite.databases.listRows<ConnectionRow>({
      databaseId: DATABASE_ID,
      tableId: CONNECTIONS_TABLE_ID,
      queries: [
        Query.equal('targetProfileId', profileId),
        Query.limit(opts.pageSize || 12),
        Query.offset(opts.offset || 0),
      ],
    });

    if (connections.total === 0) {
      return { rows: [], total: 0 };
    }

    const requesterIds = connections.rows.map((c) => c.requesterProfileId);
    const profiles = await appwrite.databases.listRows<UserProfileRow>({
      databaseId: DATABASE_ID,
      tableId: USER_PROFILES_TABLE_ID,
      queries: [
        Query.select(['$id', 'gamertag', 'avatarUrl', 'fingerprint']),
        Query.equal('$id', requesterIds),
      ],
    });

    return { rows: profiles.rows, total: connections.total };
  }

  async getFollowing(
    profileId: string,
    opts: { pageSize?: number; offset?: number } = { pageSize: 12, offset: 0 },
  ): Promise<{ rows: UserProfileRow[]; total: number }> {
    const connections = await appwrite.databases.listRows<ConnectionRow>({
      databaseId: DATABASE_ID,
      tableId: CONNECTIONS_TABLE_ID,
      queries: [
        Query.equal('requesterProfileId', profileId),
        Query.limit(opts.pageSize || 12),
        Query.offset(opts.offset || 0),
      ],
    });

    if (connections.total === 0) {
      return { rows: [], total: 0 };
    }

    const targetIds = connections.rows.map((c) => c.targetProfileId);
    const profiles = await appwrite.databases.listRows<UserProfileRow>({
      databaseId: DATABASE_ID,
      tableId: USER_PROFILES_TABLE_ID,
      queries: [
        Query.select(['$id', 'gamertag', 'avatarUrl', 'fingerprint']),
        Query.equal('$id', targetIds),
      ],
    });

    return { rows: profiles.rows, total: connections.total };
  }

  async create(profileId: string, followerId: string): Promise<ConnectionRow> {
    return await appwrite.databases.createRow({
      databaseId: DATABASE_ID,
      tableId: CONNECTIONS_TABLE_ID,
      rowId: 'unique()',
      data: {
        requesterProfileId: followerId,
        targetProfileId: profileId,
      },
    });
  }

  async delete(connectionId: string) {
    await appwrite.databases.deleteRow({
      databaseId: DATABASE_ID,
      tableId: CONNECTIONS_TABLE_ID,
      rowId: connectionId,
    });
  }
}
