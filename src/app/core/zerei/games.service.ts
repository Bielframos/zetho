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
        const games = await appwrite.datababases.listRows<GameRow>({
            databaseId: 'app',
            tableId: GAMES_TABLE_ID,
            queries: [
                Query.equal('slug', slug),
                Query.limit(1),
                Query.select(['*', 'genres.name', 'genres.slug', 'involvedCompanies.name', 'involvedCompanies.slug', 'zStats.*'])
            ]
        })

        if (games.total < 1) return null
        return games.rows[0]
    }

    async getGames(ids: string[], opts?: { summarized?: boolean }) {
        if (ids.length === 0) return null

        const queries = opts?.summarized ? ['$id', 'name', 'slug', 'releaseYear'] : ['*', 'genres.name', 'genres.slug', 'involvedCompanies.name', 'involvedCompanies.slug']

        const games = await appwrite.datababases.listRows<GameRow>({
            databaseId: 'app',
            tableId: GAMES_TABLE_ID,
            queries: [
                Query.equal('$id', ids),
                Query.select(queries),
                Query.limit(8)
            ]
        })

        return games.rows
    }
}