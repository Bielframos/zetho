import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { ConnectionRow } from './connections.types';

const DATABASE_ID = 'app';
const CONNECTIONS_TABLE_ID = 'connections';

@Injectable({ providedIn: 'root' })
export class ConnectionsRepository {
  constructor() {}

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
