import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { GameRow } from './game.types';
import slugify from 'slugify';
import { normalize } from '../search/search.helpers';

const DATABASE_ID = 'app';
const GAMES_TABLE_ID = 'games';

@Injectable({ providedIn: 'root' })
export class GameRepository {
  constructor() {}

  async findExactBySlug(query: string) {
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

  async findByKeywords(
    keywords: string[],
    opts: { pageSize: number; offset: number; excludeSlug?: string } = {
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

    const containsQueries = keywords.map((k) => Query.contains('name', k));

    if (opts.excludeSlug) {
      queries.unshift(
        Query.and([
          ...containsQueries,
          Query.notEqual('slug', normalize(opts.excludeSlug)),
        ]),
      );
      limit = limit - 1;
    } else {
      queries.unshift(...containsQueries);
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
