import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { GameRepository } from './games.repository';
import { GameGenre, GameGenreOption, normalizeGameGenres } from './utils';

type CachedGenre = {
  id: string;
  slug: string;
  name: string;
};

/**
 * Cache em escopo de módulo, usado só no servidor.
 *
 * O Angular SSR cria um injector por requisição, então este serviço
 * `providedIn: 'root'` é reinstanciado a cada render — o "singleton" recarregaria
 * a lista de gêneros do Appwrite em toda página de jogo. Como o catálogo de
 * gêneros muda raramente, um cache de processo com TTL elimina esse
 * round-trip do caminho de render.
 *
 * No browser não se aplica: lá o serviço é um singleton de verdade.
 */
const SERVER_CACHE_TTL_MS = 10 * 60 * 1000;
let serverGenresCache: { at: number; genres: CachedGenre[] } | null = null;

@Injectable({ providedIn: 'root' })
export class GenresCacheService {
  private repository = inject(GameRepository);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  private optionsSignal = signal<GameGenreOption[]>([]);
  readonly options = computed(() => this.optionsSignal());

  private byId = new Map<string, CachedGenre>();
  private bySlug = new Map<string, CachedGenre>();
  private loadPromise: Promise<void> | null = null;
  private loaded = false;

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    if (this.isServer && serverGenresCache) {
      const isFresh = Date.now() - serverGenresCache.at < SERVER_CACHE_TTL_MS;
      if (isFresh) {
        this.apply(serverGenresCache.genres);
        return;
      }
    }

    this.loadPromise = this.repository
      .findAllGenres()
      .then((result) => {
        const genres = result.rows
          .map((row): CachedGenre | null => {
            const id = row.$id.trim();
            const slug = row.slug?.trim();
            const translatedName = row.namePt?.trim() || row.name?.trim();

            if (!id || !slug || !translatedName) return null;

            return {
              id,
              slug,
              name: translatedName,
            };
          })
          .filter((genre): genre is CachedGenre => !!genre)
          .sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
          );

        if (this.isServer) {
          serverGenresCache = { at: Date.now(), genres };
        }

        this.apply(genres);
      })
      .catch((error) => {
        // Gêneros são enfeite de página, não conteúdo. No SSR, uma falha aqui
        // não pode derrubar o render — degrada para lista vazia.
        if (!this.isServer) throw error;
        console.error('Falha ao carregar gêneros no servidor:', error);
      })
      .finally(() => {
        this.loadPromise = null;
      });

    return this.loadPromise;
  }

  private apply(genres: CachedGenre[]) {
    this.byId = new Map(genres.map((genre) => [genre.id, genre]));
    this.bySlug = new Map(genres.map((genre) => [genre.slug, genre]));
    this.optionsSignal.set(
      genres.map((genre) => ({
        id: genre.id,
        slug: genre.slug,
        label: genre.name,
      })),
    );
    this.loaded = true;
  }

  getGenreIdFromSlug(slug: string): string | null {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) return null;

    return this.bySlug.get(normalizedSlug)?.id ?? null;
  }

  normalizeGameGenres(genres: unknown): GameGenre[] {
    return normalizeGameGenres(genres, {
      byId: (id) => this.byId.get(id),
      bySlug: (slug) => this.bySlug.get(slug),
    });
  }
}
