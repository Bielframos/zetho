import { computed, Injectable, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, Subject } from 'rxjs';
import { AppwriteException } from 'appwrite';

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
    this.profileStore.profile$
      .pipe(
        filter((profile) => profile !== null && profile !== undefined),
        distinctUntilChanged(
          (prev, next) =>
            prev.$id === next.$id && prev.gamertag === next.gamertag,
        ),
      )
      .subscribe((profile) => {
        this.reset();
        void this.load({ slug: profile.gamertag });
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
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } finally {
      this.loading.set(false);
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
    try {
      if (this.reorderOps().length === 0) return;

      const { reorderedRows, updatedList } =
        await this.listService.reorderItems(this.reorderOps());

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
    try {
      const list = this.list();
      if (!list) return;

      const updatedList = await this.listService.removeItem(list.$id, item.$id);

      this.items.update((state) => state.filter((i) => i.$id !== item.$id));

      this.list.set(updatedList);
    } catch (e) {
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
    try {
      const list = this.list();
      if (!list) return;

      const updatedList = await this.listService.updateList({
        listId: list.$id,
        ...params,
      });

      this.list.set(updatedList);
    } catch (e) {
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
    try {
      const list = this.list();
      if (!list) return;

      await this.listService.deleteList(list.$id);

      this.list.set(null);
      this.reset();
    } catch (e) {
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
