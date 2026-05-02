import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { GameRow } from './game.types';
import { StoredRow } from '../appwrite/appwrite.types';
import { normalize } from '../search/search.helpers';

const DATABASE_ID = 'app';
const GAMES_TABLE_ID = 'games';
const GENRES_TABLE_ID = 'genres';

type GenreCache = {
  name: string;
  slug: string;
  namePt?: string | null;
};

type GenreCacheRow = StoredRow<GenreCache>;

@Injectable({ providedIn: 'root' })
export class GameRepository {
  constructor() {}

  async findAllGenres() {
    return await appwrite.databases.listRows<GenreCacheRow>({
      databaseId: DATABASE_ID,
      tableId: GENRES_TABLE_ID,
      queries: [
        Query.select(['$id', 'name', 'namePt', 'slug']),
        Query.orderAsc('name'),
        Query.limit(5000),
      ],
    });
  }

  async findByIds(
    ids: string[],
    opts: {
      fields: string[];
      pageSize?: number;
      offset?: number;
      orderByCreatedAtDesc?: boolean;
    },
  ): Promise<GameRow[]> {
    if (ids.length === 0) return [];

    const queries = [Query.equal('$id', ids), Query.select(opts.fields)];

    if (opts.orderByCreatedAtDesc) {
      queries.push(Query.orderDesc('$createdAt'));
    }

    if (typeof opts.pageSize === 'number') {
      queries.push(Query.limit(opts.pageSize));
    }

    if (typeof opts.offset === 'number') {
      queries.push(Query.offset(opts.offset));
    }

    const result = await appwrite.databases.listRows<GameRow>({
      databaseId: DATABASE_ID,
      tableId: GAMES_TABLE_ID,
      queries,
    });

    return result.rows;
  }

  async searchGames(
    query: string,
    opts: {
      pageSize?: number;
      offset?: number;
      genreId?: string;
      year?: string;
    } = {},
  ): Promise<{ rows: GameRow[]; total: number }> {
    const pageSize = opts.pageSize ?? 12;
    const offset = opts.offset ?? 0;
    const normalized = normalize(query);

    const queries: string[] = [
      Query.limit(pageSize),
      Query.offset(offset),
      Query.orderAsc('name'),
    ];

    if (normalized) {
      queries.push(
        Query.or([
          Query.contains('name', normalized),
          Query.contains('slug', normalized),
        ]),
      );
    }

    if (opts.genreId) {
      queries.push(Query.equal('genres', opts.genreId));
    }

    if (opts.year) {
      queries.push(Query.equal('releaseYear', opts.year));
    }

    const result = await appwrite.databases.listRows<GameRow>({
      databaseId: DATABASE_ID,
      tableId: GAMES_TABLE_ID,
      queries,
    });

    return { rows: result.rows, total: result.total };
  }
}
