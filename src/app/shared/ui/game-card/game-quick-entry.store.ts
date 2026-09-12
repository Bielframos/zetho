import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { ZEntryService } from '../../../core/zEntries/zEntries.service';
import { GameRow, GameWithEntry, ZEntryRow } from '../../../types';

export type QuickEntryStatus = 'completed' | 'backlog' | 'playing' | 'dropped';

/** Match the game page's availability rule, accepting raw API dates too. */
export function isQuickEntryAvailable(game: GameRow): boolean {
  // undefined can mean a compact projection; null is an explicit unknown release.
  if (game.releaseDate === null || game.releaseYear === null) return false;
  if (Number(game.releaseYear) > new Date().getFullYear()) return false;
  const raw =
    game.rawReleaseDate ||
    (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(game.releaseDate ?? '')
      ? game.releaseDate
      : '');
  if (!raw) return true;
  const released = new Date(raw);
  if (Number.isNaN(released.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return released.getTime() <= today.getTime();
}

@Injectable({ providedIn: 'root' })
export class GameQuickEntryStore {
  private readonly auth = inject(AuthStore);
  private readonly service = inject(ZEntryService);
  private readonly entries = signal(
    new Map<string, { entry: ZEntryRow | null }>(),
  );
  private readonly loads = new Map<string, Promise<ZEntryRow | null>>();
  private readonly saves = new Map<string, Promise<ZEntryRow>>();
  private version = 0;
  readonly eligible = computed(
    () => this.auth.isAuthenticated() && !!this.auth.profile()?.fingerprint,
  );

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.version++;
          this.entries.set(new Map());
          this.loads.clear();
          // Keep writes in flight deduplicated; old completions cannot restore stale cache.
        }
      });
  }

  canUpdate(game: GameRow): boolean {
    return this.eligible() && isQuickEntryAvailable(game);
  }

  statusFor(gameId: string): { entry: ZEntryRow | null } | undefined {
    if (!this.eligible()) return undefined;
    return this.entries().get(
      this.key(this.auth.profile()!.fingerprint, gameId),
    );
  }

  async load(game: GameRow | GameWithEntry): Promise<ZEntryRow | null> {
    const fingerprint = this.viewer();
    const key = this.key(fingerprint, game.$id);
    const version = this.version;
    const saving = this.saves.get(key);
    if (saving) {
      const entry = await saving;
      this.set(key, entry, version);
      return entry;
    }
    const cached = this.entries().get(key);
    if (cached) return cached.entry;
    const pending = this.loads.get(key);
    if (pending) return pending;
    const preload = (game as GameWithEntry).zEntry;
    if (
      preload === null ||
      (preload?.ownerFingerprint === fingerprint && preload.gameId === game.$id)
    ) {
      this.set(key, preload);
      return preload;
    }
    const request = this.service
      .getEntry(fingerprint, game.$id)
      .then((entry) => {
        const owned =
          entry?.ownerFingerprint === fingerprint && entry.gameId === game.$id
            ? entry
            : null;
        this.set(key, owned, version);
        return owned;
      })
      .finally(() => {
        if (this.loads.get(key) === request) this.loads.delete(key);
      });
    this.loads.set(key, request);
    return request;
  }

  async save(
    game: GameRow | GameWithEntry,
    current: ZEntryRow | null,
    status: QuickEntryStatus,
  ): Promise<ZEntryRow> {
    const fingerprint = this.viewer();
    if (!isQuickEntryAvailable(game))
      throw new Error('progress_not_available_for_unreleased_game');
    const key = this.key(fingerprint, game.$id);
    const pending = this.saves.get(key);
    if (pending) return pending;
    const version = this.version;
    // Resolve through the cache when possible so stale overlays cannot toggle an active status.
    const known = this.entries().get(key);
    const owned =
      current?.ownerFingerprint === fingerprint && current.gameId === game.$id
        ? current
        : null;
    const previousEntry = known
      ? Promise.resolve(known.entry)
      : owned
        ? Promise.resolve(owned)
        : this.load(game);
    const request = previousEntry
      .then(async (previous) => {
        if (previous?.status === status) return previous;
        const optimistic = {
          ...previous,
          gameId: game.$id,
          ownerFingerprint: fingerprint,
          status,
        } as ZEntryRow;
        this.set(key, optimistic, version);
        try {
          const result = await this.service.createEntryLog(
            fingerprint,
            game.$id,
            previous,
            { status },
          );
          const updated = { ...previous, ...result } as ZEntryRow;
          this.set(key, updated, version);
          return updated;
        } catch (error) {
          this.set(key, previous, version);
          throw error;
        }
      })
      .finally(() => this.saves.delete(key));
    this.saves.set(key, request);
    return request;
  }

  private viewer(): string {
    if (!this.eligible()) throw new Error('auth_required');
    return this.auth.profile()!.fingerprint;
  }

  private key(fingerprint: string, gameId: string): string {
    return JSON.stringify([fingerprint, gameId]);
  }

  private set(
    key: string,
    entry: ZEntryRow | null,
    version = this.version,
  ): void {
    if (version !== this.version) return;
    this.entries.update((entries) => new Map(entries).set(key, { entry }));
  }
}
