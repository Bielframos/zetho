import { computed, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, distinctUntilChanged, filter, map } from 'rxjs';
import { ZEntryService } from './zEntries.service';
import { ProfileStore } from '../userProfiles/profile.store';
import { EntryGrouping, ProfileEntry, ZEntryRow } from './zEntries.types';

const GROUPINGS: EntryGrouping[] = [
  'release-year',
  'alphabetical',
  'none',
];
const STATUSES = [
  'completed',
  'backlog',
  'dropped',
  'playing',
  'wishlist',
] as const;
type EntryStatus = (typeof STATUSES)[number];

@Injectable({ providedIn: 'root' })
export class ZEntriesController {
  pageSize = 32;
  private generation = 0;

  status = signal<EntryStatus>('completed');
  grouping = signal<EntryGrouping>('none');
  entries = signal<ProfileEntry[]>([]);
  offset = signal(0);
  total = signal(0);
  hasMore = signal(true);
  initialLoading = signal(false);
  loaded = signal(false);
  loadingMore = signal(false);
  errors = signal<Record<string, unknown>>({});
  groups = computed(() => {
    const groups = new Map<string, ProfileEntry[]>();
    for (const entry of this.entries()) {
      const key = this.grouping() === 'none' ? 'all' : entry.groupKey;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return [...groups].map(([key, entries]) => ({
      key,
      entries,
      label: this.groupLabel(key),
    }));
  });

  constructor(
    private zEntryService: ZEntryService,
    private profileStore: ProfileStore,
    private route: ActivatedRoute,
  ) {
    const profile$ = this.profileStore.profile$.pipe(
      filter((profile) => !!profile),
    );
    const options$ = this.route.queryParams.pipe(
      map((params) => ({
        status: STATUSES.includes(params['t'])
          ? (params['t'] as EntryStatus)
          : ('completed' as const),
        group: GROUPINGS.includes(params['group'])
          ? (params['group'] as EntryGrouping)
          : ('none' as const),
      })),
    );
    combineLatest([profile$, options$])
      .pipe(
        distinctUntilChanged(
          ([previous, a], [next, b]) =>
            previous?.$id === next?.$id &&
            a.status === b.status &&
            a.group === b.group,
        ),
      )
      .subscribe(([, options]) => {
        this.status.set(options.status);
        this.grouping.set(options.group);
        this.resetState();
        void this.loadEntries();
      });
  }

  groupLabel(key: string): string {
    if (this.grouping() === 'none') return '';
    if (this.grouping() === 'alphabetical') return key;
    if (key === 'unknown') return 'Ano não informado';
    return key;
  }

  loadEntries = async () => {
    const profile = this.profileStore.current();
    if (!profile || this.loadingMore() || !this.hasMore()) return;
    const generation = this.generation;
    const offset = this.offset();
    this.errors.set({});
    this.loadingMore.set(true);
    try {
      const page = await this.zEntryService.getUserEntries(
        profile.fingerprint,
        this.status(),
        {
          pageSize: this.pageSize,
          offset,
          group: this.grouping(),
        },
      );
      if (generation !== this.generation) return;
      const rows = page.rows.map(({ game, groupKey, ...entry }) => ({
        ...entry,
        groupKey,
        game: { ...game, zEntry: entry as ZEntryRow },
      }));
      this.entries.update((previous) => [...previous, ...rows]);
      this.total.set(page.total);
      this.loaded.set(true);
      this.offset.set(offset + page.rows.length);
      this.hasMore.set(page.rows.length > 0 && this.offset() < page.total);
    } catch (error) {
      if (generation === this.generation) this.errors.set({ loadMore: error });
    } finally {
      if (generation === this.generation) {
        this.initialLoading.set(false);
        this.loadingMore.set(false);
      }
    }
  };

  resetState = () => {
    this.generation++;
    this.loaded.set(false);
    this.entries.set([]);
    this.offset.set(0);
    this.total.set(0);
    this.hasMore.set(true);
    this.errors.set({});
    this.initialLoading.set(true);
    this.loadingMore.set(false);
  };
}
