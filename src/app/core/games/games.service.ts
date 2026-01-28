import { inject, Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { GameStore } from './game.store';
import { GameRepository } from './games.repository';
import { extractKeywords, rankAndMerge } from './games.utils';
import type { GameRow, ZEntryRow } from '../types';
import { ZEntryService } from '../services/zEntries.service';

@Injectable({ providedIn: 'root' })
export class GameService {
    private repository = inject(GameRepository);
    private zEntryService = inject(ZEntryService);
    private gameStore = inject(GameStore);

    async searchGame(
        query: string,
        opts: { pageSize?: number; offset?: number },
    ) {
        const pageSize = opts?.pageSize ?? 12;
        const offset = opts?.offset ?? 0;

        const keywords = extractKeywords(query);

        const exact =
            offset === 0 ? await this.repository.findExactBySlug(query) : null;

        const matches = await this.repository.findByKeywords(keywords, {
            pageSize,
            offset,
            excludeSlug: exact?.rows[0]?.slug,
        });

        return rankAndMerge(exact, matches, query, keywords);
    }

    async getGame(slug: string) {
        const cached = this.gameStore.currentGame();

        let fields = [
            'genres.name',
            'genres.slug',
            'involvedCompanies.name',
            'involvedCompanies.slug',
            'zStats.*',
        ];

        if (!cached) fields.push('*');
        else fields.push('releaseDate', 'summary', 'similarGames');

        const game = await this.repository.findBySlug(slug, fields);

        const merged = cached ? { ...cached, ...game } : game;

        this.gameStore.setGame(merged);

        return merged;
    }

    async getGames(
        ids: string[],
        opts?: {
            summarized?: boolean;
            pageSize?: number;
            offset?: number;
        },
    ) {
        if (!ids.length) return [];

        const fields = opts?.summarized
            ? ['\$id', 'name', 'slug', 'releaseYear', 'coverUrl']
            : [
                '*',
                'genres.name',
                'genres.slug',
                'involvedCompanies.name',
                'involvedCompanies.slug',
            ];

        const games = await this.repository.findByIds(ids, {
            fields,
            pageSize: opts?.pageSize,
            offset: opts?.offset,
        });

        return games;
    }

    async loadGamePage(
        slug: string,
        context: {
            userId?: string;
            fingerprint?: string;
        },
    ) {
        const result: {
            game: GameRow;
            zEntry: ZEntryRow | null;
            similarGames: GameRow[];
        } = {
            game: null as any,
            zEntry: null,
            similarGames: [],
        };

        const game = await this.getGame(slug);

        if (!game) throw Error('GAME_NOT_FOUND');

        result.game = {
            ...game,
            releaseDate: new Date(game.releaseDate).toLocaleDateString('pt-br'),
        };

        if (context.userId && context.fingerprint) {
            try {
                result.zEntry = await this.zEntryService.getEntry(
                    context.fingerprint,
                    game.$id,
                );
            } catch {
                result.zEntry = null;
            }
        }

        if (game.similarGames?.length > 0) {
            result.similarGames = await this.getGames(game.similarGames, {
                summarized: true,
                pageSize: 6,
            });
        }

        return result;
    }
}
