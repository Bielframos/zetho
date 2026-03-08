import { inject, Injectable } from '@angular/core';
import type { GameRow, ZEntryRow } from '../../types';
import type { GameWithEntry } from './game.types';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameStore } from './game.store';
import { GameRepository } from './games.repository';
import { rankAndMerge } from './games.utils';
import { extractKeywords } from '../search/search.helpers';

@Injectable({ providedIn: 'root' })
export class GameService {
  private repository = inject(GameRepository);
  private zEntryService = inject(ZEntryService);
  private gameStore = inject(GameStore);

  private async appendZEntries(
    games: GameRow[],
    fingerprint?: string,
  ): Promise<GameWithEntry[]> {
    if (!games.length || !fingerprint) return games as GameWithEntry[];

    const rows = await Promise.all(
      games.map(async (game) => {
        try {
          const zEntry = await this.zEntryService.getEntry(
            fingerprint,
            game.$id,
          );
          return { ...game, zEntry };
        } catch {
          return { ...game, zEntry: null };
        }
      }),
    );

    return rows;
  }

  async searchGame(
    query: string,
    opts: { pageSize?: number; offset?: number; fingerprint?: string },
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

    const result = rankAndMerge(exact, matches, query, keywords);
    const rows = await this.appendZEntries(result.rows, opts?.fingerprint);

    return {
      ...result,
      rows,
    };
  }

  async getGames(
    ids: string[],
    opts?: {
      summarized?: boolean;
      pageSize?: number;
      offset?: number;
      fingerprint?: string;
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

    return this.appendZEntries(games, opts?.fingerprint);
  }

  async getGame(slug: string) {
    let fields = [
      '*',
      'genres.name',
      'genres.slug',
      'involvedCompanies.name',
      'involvedCompanies.slug',
      'zStats.*',
    ];

    const game = await this.repository.findBySlug(slug, fields);

    this.gameStore.setGame(game);

    return game;
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

    if (!game) throw Error('game_not_found');

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
        fingerprint: context.fingerprint,
      });
    }

    return result;
  }
}
