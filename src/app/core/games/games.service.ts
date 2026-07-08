import { inject, Injectable } from '@angular/core';
import type { GameRow, ZEntryRow } from '../../types';
import type { GameWithEntry, GameMedia, GameHero } from './game.types';
import type { SearchFilters } from '../search/search.controller';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameStore } from './game.store';
import { GameRepository } from './games.repository';
import { GenresCacheService } from './genres-cache.service';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';

@Injectable({ providedIn: 'root' })
export class GameService {
  private zEntryService = inject(ZEntryService);
  private gameStore = inject(GameStore);
  private genresCache = inject(GenresCacheService);
  private repository = inject(GameRepository);
  private authStore = inject(AuthStore);

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

  private buildSearchParams(
    params: Record<string, string | number | undefined>,
  ) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      searchParams.append(key, String(value));
    }

    return searchParams;
  }

  private async fetchSearchApi<T>(
    path: string,
    params: Record<string, string | number | undefined>,
  ) {
    const queryString = this.buildSearchParams(params).toString();
    const url = new URL(
      `${path}${queryString ? `?${queryString}` : ''}`,
      environment.zethoApiEndpoint,
    );
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return (await response.json()) as T;
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

    const parsedGenreId = filters?.genre
      ? (this.genresCache.getGenreIdFromSlug(filters.genre) ?? undefined)
      : undefined;

    if (filters?.genre && !parsedGenreId) {
      return { total: 0, rows: [] };
    }

    const page = Math.max(1, Math.floor(offset / pageSize) + 1);

    const response = await this.fetchSearchApi<{
      total: number;
      page: number;
      pageCount: number;
      pageSize: number;
      results: GameRow[];
    }>('games/search', {
      q: query || undefined,
      genre: parsedGenreId,
      year: filters?.year,
      page,
      pageSize,
      fingerprint: opts?.fingerprint,
    });

    const rows = await this.appendZEntries(response.results, opts?.fingerprint);

    return {
      total: response.total,
      rows,
      page: response.page,
      pageCount: response.pageCount,
      pageSize: response.pageSize,
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
    const pageSize = opts?.pageSize ?? 12;
    const page = Math.max(1, Math.floor((opts?.offset ?? 0) / pageSize) + 1);

    const response = await this.fetchSearchApi<{
      total: number;
      page: number;
      pageCount: number;
      pageSize: number;
      results: GameRow[];
    }>('games/hyped-upcoming', {
      page,
      pageSize,
      fingerprint: opts?.fingerprint,
    });

    const rows = await this.appendZEntries(response.results, opts?.fingerprint);

    return {
      total: response.total,
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

  async toggleNotifications(gameId: string, active: boolean) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await this.authStore.getJwt()}`,
    };
    const fallbackCookie = localStorage.getItem('cookieFallback');

    if (fallbackCookie) {
      headers['x-appwrite-session'] = fallbackCookie;
    }

    const response = await fetch(
      new URL(
        `games/${gameId}/notifications/toggle`,
        environment.zethoApiEndpoint,
      ),
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ active }),
      },
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success === false) {
      throw new Error(
        payload?.message || 'Não foi possível atualizar as notificações.',
      );
    }

    return payload as { success: boolean; message?: string };
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
