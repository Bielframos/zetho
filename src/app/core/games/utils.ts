export type GameGenreOption = {
  id: string;
  label: string;
  slug: string;
};

export type GameGenre = {
  id: string;
  name: string;
  slug: string;
};

type ResolvedGenre = {
  id: string;
  name: string;
  slug: string;
};

type GenreResolver = {
  byId: (id: string) => ResolvedGenre | undefined;
  bySlug: (slug: string) => ResolvedGenre | undefined;
};

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function slugFromName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function resolveGenreByValue(
  value: string,
  resolver: GenreResolver,
): ResolvedGenre | null {
  return resolver.byId(value) ?? resolver.bySlug(value) ?? null;
}

export function normalizeGameGenres(
  genres: unknown,
  resolver: GenreResolver,
): GameGenre[] {
  if (!Array.isArray(genres)) return [];

  const uniqueGenres = new Map<string, GameGenre>();

  for (const genre of genres) {
    let resolved: ResolvedGenre | null = null;

    if (typeof genre === 'string') {
      const raw = asString(genre);
      if (raw) {
        resolved = resolveGenreByValue(raw, resolver);
      }
    }

    if (!resolved && genre && typeof genre === 'object') {
      const data = genre as {
        $id?: unknown;
        id?: unknown;
        slug?: unknown;
        name?: unknown;
        namePt?: unknown;
      };

      const id = asString(data.$id) ?? asString(data.id);
      const slug = asString(data.slug);

      if (id) {
        resolved = resolver.byId(id) ?? null;
      }

      if (!resolved && slug) {
        resolved = resolver.bySlug(slug) ?? null;
      }

      if (!resolved && slug) {
        const translatedName = asString(data.namePt) ?? asString(data.name);

        if (translatedName) {
          resolved = {
            id: id ?? slug,
            slug,
            name: translatedName,
          };
        }
      }

      if (!resolved) {
        const translatedName = asString(data.namePt) ?? asString(data.name);

        if (translatedName) {
          const fallbackSlug = slugFromName(translatedName);
          if (fallbackSlug) {
            resolved = {
              id: id ?? fallbackSlug,
              slug: slug ?? fallbackSlug,
              name: translatedName,
            };
          }
        }
      }
    }

    if (!resolved) continue;

    uniqueGenres.set(resolved.id, {
      id: resolved.id,
      slug: resolved.slug,
      name: resolved.name,
    });
  }

  return Array.from(uniqueGenres.values());
}
