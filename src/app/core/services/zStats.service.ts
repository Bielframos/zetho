import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { GameRow, ZStatsRow } from '../../types';

const Z_STATS_TABLE_ID = 'z_entry_count';

@Injectable({ providedIn: 'root' })
export class ZStatsService {
  async getTrendingGames(params: { total: number } = { total: 5 }) {
    const response = await appwrite.databases.listRows<ZStatsRow>({
      databaseId: 'app',
      tableId: Z_STATS_TABLE_ID,
      queries: [
        Query.select([
          'game.$id',
          'game.name',
          'game.coverUrl',
          'game.slug',
          'game.releaseYear',
        ]),
        Query.orderDesc('likes'),
        Query.orderDesc('$createdAt'),
        Query.limit(params.total),
      ],
    });

    const trendingGames: GameRow[] = response.rows.map(
      (zStat) => zStat.game as GameRow,
    );

    return trendingGames;
  }
}
