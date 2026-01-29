import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { UserProfile, UserProfileRow } from '../types';

const TABLE_ID = 'user_profiles';
const DATABASE_ID = 'app';

@Injectable({ providedIn: 'root' })
export class UserProfileRepository {
  async findByUserId(userId: string): Promise<UserProfileRow | null> {
    const response = await appwrite.databases.listRows<UserProfileRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('userId', userId), Query.limit(1)],
    });

    return response.total === 0 ? null : response.rows[0];
  }

  async findByGamertag(gamertag: string): Promise<UserProfileRow | null> {
    const response = await appwrite.databases.listRows<UserProfileRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('gamertag', gamertag), Query.limit(1)],
    });

    return response.total === 0 ? null : response.rows[0];
  }

  async create(userId: string, gamertag: string): Promise<void> {
    await appwrite.databases.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: 'unique()',
      data: { userId, gamertag },
    });
  }

  async existsByGamertag(gamertag: string): Promise<boolean> {
    const response = await appwrite.databases.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      queries: [Query.equal('gamertag', gamertag), Query.limit(1)],
    });

    return response.total > 0;
  }

  async update(
    profileId: string,
    data: Partial<UserProfile>,
  ): Promise<UserProfileRow> {
    return appwrite.databases.updateRow<UserProfileRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: profileId,
      data,
    });
  }

  async count(): Promise<number> {
    const response = await appwrite.databases.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      queries: [Query.select(['$id']), Query.limit(1)],
    });

    return response.total;
  }
}
