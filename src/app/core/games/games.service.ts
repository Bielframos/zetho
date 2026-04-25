import { inject, Injectable } from '@angular/core';
import type { GameRow, ZEntryRow } from '../../types';
import type { GameWithEntry, GameMedia, GameHero } from './game.types';
import type { SearchFilters } from '../search/search.controller';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameStore } from './game.store';
import { GameRepository } from './games.repository';
import { rankAndMerge } from './games.utils';
import { extractKeywords } from '../search/search.helpers';
import { GenresCacheService } from './genres-cache.service';
import { environment } from '../../../environments/environment';

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

  async getUpcomingHypedGames(opts?: {
    pageSize?: number;
    offset?: number;
    fingerprint?: string;
  }) {
    const result = await this.repository.findUpcomingByHypes({
      pageSize: opts?.pageSize,
      offset: opts?.offset,
    });

    const rows = await this.appendZEntries(result.rows, opts?.fingerprint);

    return {
      total: result.total,
      rows,
    };
  }

  private async getGameFromApi(slug: string): Promise<GameRow | null> {
    const response = await fetch(
      new URL(
        `games/${slug}?select=*,involvedCompanies.name,involvedCompanies.slug,zStats.*`,
        environment.zethoApiEndpoint,
      ),
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as GameRow;
  }

  async getGameMedias(slug: string): Promise<GameMedia[]> {
    try {
      const response = await fetch(
        new URL(`games/${slug}/medias`, environment.zethoApiEndpoint),
      );
      if (!response.ok) return [];
      return (await response.json()) as GameMedia[];
    } catch {
      return [];
    }
  }

  async getGameHero(slug: string): Promise<GameHero | null> {
    try {
      const response = await fetch(
        new URL(`games/${slug}/hero`, environment.zethoApiEndpoint),
      );
      if (!response.ok) return null;
      return (await response.json()) as GameHero;
    } catch {
      return null;
    }
  }

  async getGame(slug: string) {
    await this.genresCache.ensureLoaded();

    const game = await this.getGameFromApi(slug);

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
    const result: {
      game: GameRow;
      zEntry: ZEntryRow | null;
      similarGames: GameRow[];
      medias: GameMedia[];
      heroImage: GameHero | null;
    } = {
      game: null as any,
      zEntry: null,
      similarGames: [],
      medias: [],
      heroImage: null,
    };

    const game = await this.getGame(slug);

    if (!game) throw Error('game_not_found');

    result.game = {
      ...game,
      rawReleaseDate: game.releaseDate,
      releaseDate: new Date(game.releaseDate).toLocaleDateString('pt-br'),
    };

    const zEntryPromise =
      context.userId && context.fingerprint
        ? this.zEntryService
            .getEntry(context.fingerprint, game.$id)
            .catch(() => null)
        : Promise.resolve(null);

    const similarGamesPromise =
      game.similarGames?.length > 0
        ? this.getGames(game.similarGames, {
            summarized: true,
            pageSize: 6,
            fingerprint: context.fingerprint,
          })
        : Promise.resolve([]);

    const [zEntry, similarGames, medias, heroImage] = await Promise.all([
      zEntryPromise,
      similarGamesPromise,
      this.getGameMedias(slug),
      this.getGameHero(slug),
    ]);

    result.zEntry = zEntry;
    result.similarGames = similarGames;
    result.medias = medias;
    result.heroImage = heroImage;

    return result;
  }
}
