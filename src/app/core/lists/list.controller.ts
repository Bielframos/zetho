import { computed, Injectable, signal } from '@angular/core';
import { AppwriteException } from 'appwrite';
import { debounceTime, Subject } from 'rxjs';

import { ActivatedRoute } from '@angular/router';
import { AppError, GameRow, ZereiListItemRow, ZereiListRow } from '../../types';
import { ListService } from '../lists/list.service';
import { ProfileStore } from '../userProfiles/profile.store';

export type ZereiListItemRowExpanded = Omit<ZereiListItemRow, 'game'> & {
  game: GameRow;
};

type ReorderOp = {
  item: ZereiListItemRow;
  prevOrderKey?: string;
  nextOrderKey?: string;
};

const PAGE_SIZE = 50;

@Injectable({ providedIn: 'root' })
export class ListController {
  private systemSlug: string | null = null;
  private generation = 0;
  usePersonal() {
    this.systemSlug = null;
    this.cancelLoad();
    this.reset();
    this.list.set(null);
    this.loading.set(false);
  }
  cancelLoad() {
    this.generation++;
    this.reorderOps.set([]);
  }
  async loadSystem(slug: string, loadMore = false) {
    this.systemSlug = slug;
    const generation = ++this.generation;
    this.loading.set(true);
    if (!loadMore) {
      this.reset();
      this.list.set(null);
      this.currentPage.set(1);
    }
    try {
      const list = await this.listService.getSystemList(slug);
      if (generation !== this.generation) return;
      const offset = loadMore ? this.items().length : 0;
      const items = await this.listService.getItems({
        listId: list.$id,
        offset,
        limit: 50,
      });
      if (generation !== this.generation) return;
      this.list.set(list);
      const rows = items.rows as unknown as ZereiListItemRowExpanded[];
      this.items.set(loadMore ? [...this.items(), ...rows] : rows);
      this.totalItems.set(items.total);
      this.hasMore.set(this.items().length < items.total);
    } catch (error) {
      if (generation !== this.generation) return;
      this.list.set(null);
      this.error.set({
        message: 'Não foi possível carregar a lista.',
        code: String(error).includes('404') ? 404 : 503,
        type: 'list_unavailable',
      });
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  // O valor do slug é fornecido pelo componente pai (ListPage)
  slug$ = new Subject<string>();

  list = signal<ZereiListRow | null>(null);
  items = signal<ZereiListItemRowExpanded[]>([]);

  totalItems = signal(0);
  currentPage = signal(1);
  offset = computed(() => (this.currentPage() - 1) * PAGE_SIZE);
  pageCount = computed(() => Math.ceil(this.totalItems() / PAGE_SIZE));
  hasMore = signal(false);

  loading = signal(false);
  error = signal<AppError | undefined>(undefined);

  private reorder$ = new Subject<void>();
  private reorderOps = signal<ReorderOp[]>([]);

  constructor(
    private profileStore: ProfileStore,
    private listService: ListService,
  ) {
    this.slug$.subscribe((slug) => {
      if (slug) {
        this.reset();
        void this.load({ slug });
      }
    });

    this.reorder$.pipe(debounceTime(500)).subscribe(() => this.persistOrder());
  }

  /* =======================
     Carregamento
     ======================= */

  async load({
    slug,
    loadMore = false,
  }: {
    slug?: string;
    loadMore?: boolean;
  }) {
    if (this.systemSlug) return this.loadSystem(this.systemSlug, loadMore);
    const generation = this.generation;
    try {
      if (this.loading()) return;
      this.loading.set(true);

      const profile = this.profileStore.current();
      if (!profile) return;

      const effectiveSlug = slug ?? this.list()?.slug ?? profile.gamertag;
      if (!effectiveSlug) {
        this.error.set({
          message: 'Slug da lista não encontrado.',
          code: 400,
          type: 'bad_request',
        });
        return;
      }

      if (!loadMore) {
        this.reset();
        this.currentPage.set(1);
      } else {
        this.currentPage.update((p) => p + 1);
      }

      const list =
        this.list()?.slug !== effectiveSlug
          ? (
              await this.listService.getLists({
                userFingerprint: profile.fingerprint,
                bySlug: effectiveSlug,
              })
            ).rows[0]
          : this.list();

      if (generation !== this.generation) return;
      if (!list) {
        this.error.set({
          message: 'Lista não encontrada.',
          code: 404,
          type: 'not_found',
        });
        return;
      }

      this.list.set(list);

      const items = await this.listService.getItems({
        listId: list.$id,
        offset: this.offset(),
      });

      if (generation !== this.generation) return;
      const rows = items.rows as unknown as ZereiListItemRowExpanded[];

      if (loadMore) {
        this.items.update((state) => [...state, ...rows]);
      } else {
        this.items.set(rows);
      }

      const loaded = this.items().length;
      this.totalItems.set(items.total);
      this.hasMore.set(loaded < items.total);
    } catch (e) {
      if (generation !== this.generation) return;
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /* =======================
     Reordenação
     ======================= */

  notifyReorder(op: ReorderOp) {
    this.reorderOps.update((state) => [...state, op]);
    this.reorder$.next();
  }

  private async persistOrder() {
    const generation = this.generation;
    try {
      if (this.reorderOps().length === 0) return;

      const { reorderedRows, updatedList } =
        await this.listService.reorderItems(this.reorderOps());

      if (generation !== this.generation) return;
      const orderMap = new Map(
        reorderedRows
          .filter((row) => row.$tableId === 'list_items')
          .map((row) => [row.$id, row.orderKey]),
      );

      this.items.update((state) =>
        state.map((item) =>
          orderMap.has(item.$id)
            ? { ...item, orderKey: orderMap.get(item.$id)! }
            : item,
        ),
      );

      if (updatedList) {
        if (generation !== this.generation) return;
        this.list.set(updatedList);
      }

      this.reorderOps.set([]);
    } catch (e) {
      console.error(e);
    }
  }

  /* =======================
     Itens
     ======================= */

  async removeItem(item: ZereiListItemRowExpanded) {
    const generation = this.generation;
    try {
      const list = this.list();
      if (!list) return;

      const updatedList = await this.listService.removeItem(
        list.$id,
        item.$id,
        item.game?.$id,
        list.latestAdditions,
      );

      if (generation !== this.generation) return;
      this.items.update((state) => state.filter((i) => i.$id !== item.$id));

      if (generation !== this.generation) return;
      this.list.set(updatedList);
    } catch (e) {
      if (generation !== this.generation) return;
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    }
  }

  /* =======================
     Lista
     ======================= */

  async updateList(params: {
    title?: string;
    description?: string;
    isPublic?: boolean;
  }) {
    const generation = this.generation;
    try {
      const list = this.list();
      if (!list) return;

      const updatedList = await this.listService.updateList({
        listId: list.$id,
        ...params,
      });

      if (generation !== this.generation) return;
      this.list.set(updatedList);
    } catch (e) {
      if (generation !== this.generation) return;
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    }
  }

  async setCoverImage(gameCoverUrl?: string) {
    const generation = this.generation;
    try {
      const list = this.list();
      if (!list || !gameCoverUrl) return;

      const current = list.coverImageUrls ? [...list.coverImageUrls] : [];
      const coverImageUrls = current.filter((url) => url !== gameCoverUrl);
      coverImageUrls.push(gameCoverUrl);

      const updatedList = await this.listService.updateList({
        listId: list.$id,
        coverImageUrls: coverImageUrls.slice(-3),
      });

      if (generation !== this.generation) return;
      this.list.set(updatedList);
    } catch (e) {
      if (generation !== this.generation) return;
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    }
  }

  async deleteList() {
    const generation = this.generation;
    try {
      const list = this.list();
      if (!list) return;

      await this.listService.deleteList(list.$id);
      if (generation !== this.generation) return;
      this.list.set(null);
      this.reset();
    } catch (e) {
      if (generation !== this.generation) return;
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    }
  }

  /* =======================
     Helpers
     ======================= */

  private reset() {
    this.items.set([]);
    this.totalItems.set(0);
    this.currentPage.set(1);
    this.hasMore.set(false);
    this.error.set(undefined);
  }
}
