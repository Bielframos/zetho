import { Injectable } from "@angular/core";
import { appwrite, Query } from "../appwrite/appwrite.client";
import { GameRow } from "../types";

const GAMES_TABLE_ID = 'games'

function normalize(text: string) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function extractKeywords(query: string) {
    return normalize(query)
        .split(/\s+/)
        .filter(w => w.length > 1);
}

function scoreResult(game: GameRow, query: string, keywords: string[]) {
    const name = normalize(game.name);
    const slug = normalize(game.slug);
    const q = normalize(query);

    let score = 0;

    if (name === q) score += 100;
    if (keywords.every(k => slug.includes(k))) score += 60;
    if (name.startsWith(q)) score += 50;
    if (keywords.every(k => name.includes(k))) score += 40;
    if (name.includes(q)) score += 30;
    keywords.forEach(k => {
        if (name.includes(k)) score += 10;
    });

    score += Math.max(0, 10 - name.length / 20);
    return score;
}

@Injectable({ providedIn: 'root' })
export class GameService {
    async searchGame(query: string, opts: { pageSize?: number, offset?: number }) {
        const pageSize = opts.pageSize ?? 12;
        const offset = opts.offset ?? 0;

        const keywords = extractKeywords(query);

        const andQueries = keywords.map(k => Query.contains('name', k));
        const strongMatches = await appwrite.databases.listRows<GameRow>({
            databaseId: 'app',
            tableId: GAMES_TABLE_ID,
            queries: [
                ...andQueries,
                Query.select(['$id', 'name', 'slug', 'coverUrl', 'releaseYear']),
                Query.limit(pageSize),
                Query.offset(offset)
            ]
        });

        let results: GameRow[] = [];

        if (strongMatches.total > 0) {
            results = strongMatches.rows;
        } else {
            const orMatches = await appwrite.databases.listRows<GameRow>({
                databaseId: 'app',
                tableId: GAMES_TABLE_ID,
                queries: [
                    Query.or(keywords.map(k => Query.contains('name', k))),
                    Query.select(['$id', 'name', 'slug', 'coverUrl', 'releaseYear']),
                    Query.limit(pageSize),
                    Query.offset(offset)
                ]
            });

            if (orMatches.total > 0) {
                results = orMatches.rows;
            } else {
                const fallback = await appwrite.databases.listRows<GameRow>({
                    databaseId: 'app',
                    tableId: GAMES_TABLE_ID,
                    queries: [
                        Query.search('name', query),
                        Query.select(['$id', 'name', 'slug', 'coverUrl', 'releaseYear']),
                        Query.limit(pageSize),
                        Query.offset(offset)
                    ]
                });

                results = fallback.rows;
            }
        }

        const ranked = results
            .map(game => ({
                ...game,
                _score: scoreResult(game, query, keywords)
            }))
            .sort((a, b) => b._score - a._score);

        return {
            total: ranked.length,
            rows: ranked
        };
    }


    async getGame(slug: string) {
        const games = await appwrite.databases.listRows<GameRow>({
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

    async getGames(ids: string[], opts?: { onlyIds?: string, summarized?: boolean, pageSize?: number, offset?: number }) {
        if (ids.length === 0) return null

        const queries = opts?.onlyIds ? ['$id'] :
            opts?.summarized ? ['$id', 'name', 'slug', 'releaseYear', 'coverUrl'] :
                ['*', 'genres.name', 'genres.slug', 'involvedCompanies.name', 'involvedCompanies.slug']

        const games = await appwrite.databases.listRows<GameRow>({
            databaseId: 'app',
            tableId: GAMES_TABLE_ID,
            queries: [
                Query.equal('$id', ids),
                Query.select(queries),
                Query.limit(opts?.pageSize || 12),
                Query.offset(opts?.offset || 0)
            ]
        })

        return games.rows
    }

    // TODO: Implementar solução para obter contagem real do total de jogos na plataforma
    async getGamesCount() {
    }
}