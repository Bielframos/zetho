import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { GameRepository } from '../games/games.repository';
import { ZEntryService } from '../zEntries/zEntries.service';
import { ProfileStore } from '../userProfiles/profile.store';
import { GameRow, ZEntryRow } from '../../types';

@Injectable({ providedIn: 'root' })
export class ZEntriesController {
  pageSize = 24;

  status = signal<Exclude<ZEntryRow['status'], null | undefined>>('completed');
  games = signal<GameRow[]>([]);
  entries = signal<ZEntryRow[]>([]);
  offset = signal(0);
  total = signal(0);
  hasMore = signal(true);
  initialLoading = signal(false);
  loadingMore = signal(false);
  errors = signal<Record<string, any>>({});

  constructor(
    private gameRepo: GameRepository,
    private zEntryService: ZEntryService,
    private profileStore: ProfileStore,
    private route: ActivatedRoute,
  ) {
    const profile$ = toObservable(profileStore.current);

    profile$
      .pipe(filter((profile) => profile !== null && profile !== undefined))
      .subscribe(() => {
        this.resetState();
        this.loadEntries();
      });

    this.route.queryParams
      .pipe(
        map((params) => params['t']),
        distinctUntilChanged(),
      )
      .subscribe((t) => {
        if (t === this.status()) return;
        const status = t ?? 'completed';

        this.status.set(status);
        this.resetState();
        this.loadEntries();
      });
  }

  loadEntries = async () => {
    const profile = this.profileStore.current();

    if (!profile) {
      this.errors.update((s) => ({ ...s, auth: 'Usuário não autenticado.' }));
      return;
    }

    if (this.loadingMore()) return;

    this.loadingMore.set(true);

    try {
      const entries = await this.zEntryService.getUserEntries(
        profile.fingerprint,
        this.status(),
        { pageSize: this.pageSize, offset: this.offset() },
      );

      this.entries.update((prev) => [...prev, ...entries.rows]);
      this.total.set(entries.total);

      const ids = entries.rows.map((e) => e.gameId).filter(Boolean);
      if (ids.length > 0) {
        const games = await this.gameRepo.findByIds(ids, {
          fields: ['$id', 'name', 'slug', 'releaseYear', 'coverUrl'],
          pageSize: this.pageSize,
        });

        if (games) {
          this.games.update((prev) => [...prev, ...games]);
        }
      }

      const newOffset = this.offset() + this.pageSize;
      this.offset.set(newOffset);
      this.hasMore.set(newOffset < entries.total);
    } catch (e) {
      this.errors.update((prev) => ({ ...prev, loadMore: e }));
    } finally {
      this.initialLoading.set(false);
      this.loadingMore.set(false);
    }
  };

  resetState = () => {
    this.games.set([]);
    this.entries.set([]);
    this.offset.set(0);
    this.total.set(0);
    this.hasMore.set(true);

    this.initialLoading.set(true);
    this.loadingMore.set(false);
  };
}
