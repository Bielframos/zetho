import { Injectable } from "@angular/core";
import slugify from 'slugify'
import { appwrite, Query } from "../appwrite/appwrite.client";
import { GameRow } from "../types";

const GAMES_TABLE_ID = 'games'

@Injectable({ providedIn: 'root' })
export class GameService {
    async searchGame(
        query: string,
        opts: { pageSize?: number, offset?: number }) {
        try {
            const slug = slugify(query, { lower: true })

            const bySlug = await appwrite.datababases.listRows<GameRow>({
                databaseId: 'app',
                tableId: GAMES_TABLE_ID,
                queries: [
                    Query.equal('slug', slug),
                    Query.select(['name', 'slug', 'coverUrl', 'releaseYear']),
                    Query.limit(opts.pageSize || 12),
                    Query.offset(opts.offset || 0),
                ],
            });

            if (bySlug.total > 0) {
                return bySlug;
            }

            const games = await appwrite.datababases.listRows<GameRow>({
                databaseId: 'app',
                tableId: GAMES_TABLE_ID,
                queries: [
                    Query.contains('name', query),
                    Query.select(['$id', 'name', 'slug', 'coverUrl', 'releaseYear']),
                    Query.limit(opts.pageSize || 12),
                    Query.offset(opts.offset || 0)
                ]
            })

            return games
        } catch (error) { throw error }
    }

    async getGame(slug: string) {
        try {
            const games = await appwrite.datababases.listRows<GameRow>({
                databaseId: 'app',
                tableId: GAMES_TABLE_ID,
                queries: [
                    Query.equal('slug', slug),
                    Query.limit(1),

                ]
            })

            if (games.total < 1) return null
            return games.rows[0]
        } catch (error) { throw error }

    }
}