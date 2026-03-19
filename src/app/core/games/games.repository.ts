import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { GameRow } from './game.types';
import slugify from 'slugify';
import { normalize } from '../search/search.helpers';
import { StoredRow } from '../appwrite/appwrite.types';

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

  async find(query: string) {
    return await appwrite.databases.listRows<GameRow>({
      databaseId: DATABASE_ID,
      tableId: GAMES_TABLE_ID,
      queries: [
        Query.equal('slug', slugify(normalize(query))),
        Query.select(['$id', 'name', 'slug', 'coverUrl', 'releaseYear']),
        Query.limit(1),
      ],
    });
  }

  async findBySearchCriteria(
    keywords: string[],
    opts: {
      pageSize: number;
      offset: number;
      excludeSlug?: string;
      filters?: { genreId?: string; year?: string };
    } = {
      pageSize: 12,
      offset: 0,
    },
  ) {
    let limit = opts.pageSize;

    let queries: string[] = [
      Query.select(['$id', 'name', 'slug', 'coverUrl', 'releaseYear']),
      Query.limit(limit),
      Query.offset(opts.offset),
    ];

    const filterConditions: string[] = [];

    if (keywords.length > 0) {
      filterConditions.push(...keywords.map((k) => Query.contains('name', k)));
    }

    if (opts.filters?.genreId) {
      filterConditions.push(Query.contains('genres', opts.filters.genreId));
    }

    if (opts.filters?.year) {
      filterConditions.push(Query.equal('releaseYear', opts.filters.year));
    }

    if (opts.excludeSlug) {
      queries.unshift(
        Query.and([
          ...filterConditions,
          Query.notEqual('slug', normalize(opts.excludeSlug)),
        ]),
      );
      limit = limit - 1;
    } else if (filterConditions.length > 1) {
      queries.unshift(Query.and(filterConditions));
    } else if (filterConditions.length === 1) {
      queries.unshift(filterConditions[0]);
    }

    return await appwrite.databases.listRows<GameRow>({
      databaseId: DATABASE_ID,
      tableId: GAMES_TABLE_ID,
      queries,
    });
  }

  async findBySlug(slug: string, fields: string[]): Promise<GameRow | null> {
    const result = await appwrite.databases.listRows<GameRow>({
      databaseId: DATABASE_ID,
      tableId: GAMES_TABLE_ID,
      queries: [
        Query.equal('slug', slug),
        Query.limit(1),
        Query.select(fields),
      ],
    });

    if (result.total < 1) return null;

    return result.rows[0];
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
}
