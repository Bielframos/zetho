import { inject, Injectable } from '@angular/core';
import type { GameRow, ZEntryRow } from '../../types';
import type { GameWithEntry } from './game.types';
import type { SearchFilters } from '../search/search.controller';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameStore } from './game.store';
import { GameRepository } from './games.repository';
import { rankAndMerge } from './games.utils';
import { extractKeywords } from '../search/search.helpers';
import { GenresCacheService } from './genres-cache.service';

@Injectable({ providedIn: 'root' })
export class GameService {
  private repository = inject(GameRepository);
  private zEntryService = inject(ZEntryService);
  private gameStore = inject(GameStore);
  private genresCache = inject(GenresCacheService);

  private appendGenres(game: GameRow): GameRow {
    return {
      ...game,
      genres: this.genresCache.normalizeGameGenres(game.genres),
    };
  }

  private appendGenresList(games: GameRow[]): GameRow[] {
    return games.map((game) => this.appendGenres(game));
  }

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
    opts: {
      pageSize?: number;
      offset?: number;
      fingerprint?: string;
      filters?: SearchFilters;
    },
  ) {
    const pageSize = opts?.pageSize ?? 12;
    const offset = opts?.offset ?? 0;
    const filters = opts?.filters;

    await this.genresCache.ensureLoaded();

    const parsedFilters: {
      genreId?: string;
      year?: string;
    } = {};

    if (filters?.year) {
      parsedFilters.year = filters.year;
    }

    if (filters?.genre) {
      const genreId = this.genresCache.getGenreIdFromSlug(filters.genre);

      if (!genreId) {
        return { total: 0, rows: [] };
      }

      parsedFilters.genreId = genreId;
    }

    const keywords = query ? extractKeywords(query) : [];

    const exact =
      offset === 0 && query ? await this.repository.find(query) : null;

    const matches = await this.repository.findBySearchCriteria(keywords, {
      pageSize,
      offset,
      excludeSlug: exact?.rows[0]?.slug,
      filters: parsedFilters,
    });

    if (!query) {
      const rows = await this.appendZEntries(matches.rows, opts?.fingerprint);
      return { total: matches.total, rows };
    }

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

    const shouldAttachGenres = !opts?.summarized;

    if (shouldAttachGenres) {
      await this.genresCache.ensureLoaded();
    }

    const fields = opts?.summarized
      ? ['\$id', 'name', 'slug', 'releaseYear', 'coverUrl']
      : ['*', 'involvedCompanies.name', 'involvedCompanies.slug'];

    const games = await this.repository.findByIds(ids, {
      fields,
      pageSize: opts?.pageSize,
      offset: opts?.offset,
    });

    const rows = shouldAttachGenres ? this.appendGenresList(games) : games;

    return this.appendZEntries(rows, opts?.fingerprint);
  }

  async getGame(slug: string) {
    let fields = [
      '*',
      'involvedCompanies.name',
      'involvedCompanies.slug',
      'zStats.*',
    ];

    const game = await this.repository.findBySlug(slug, fields);

    if (game) {
      await this.genresCache.ensureLoaded();
    }

    const result = game ? this.appendGenres(game) : null;

    this.gameStore.setGame(result);

    return result;
  }

  async loadGamePage(
    slug: string,
    context: {
      userId?: string;
      fingerprint?: string;
    },
  ) {
    await this.genresCache.ensureLoaded();

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
