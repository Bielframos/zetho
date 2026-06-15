import { computed, inject, Injectable, signal } from '@angular/core';
import { GameRepository } from './games.repository';
import { GameGenre, GameGenreOption, normalizeGameGenres } from './utils';

type CachedGenre = {
  id: string;
  slug: string;
  name: string;
};

@Injectable({ providedIn: 'root' })
export class GenresCacheService {
  private repository = inject(GameRepository);

  private optionsSignal = signal<GameGenreOption[]>([]);
  readonly options = computed(() => this.optionsSignal());

  private byId = new Map<string, CachedGenre>();
  private bySlug = new Map<string, CachedGenre>();
  private loadPromise: Promise<void> | null = null;
  private loaded = false;

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

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
      })
      .finally(() => {
        this.loadPromise = null;
      });

    return this.loadPromise;
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
