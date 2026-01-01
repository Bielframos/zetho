import { computed, Injectable, signal } from '@angular/core';
import { AppError, GameRow, ZereiListItemRow, ZereiListRow } from '../types';
import { ListService } from '../services/list.service';
import { ProfileStore } from '../stores/profile.store';
import { AppwriteException } from 'appwrite';
import { debounceTime, Subject } from 'rxjs';

type ZereiListItemRowExpanded = Omit<ZereiListItemRow, 'game'> & {
    game: GameRow;
};

type ReorderOp = {
    item: ZereiListItemRow;
    prevOrderKey?: string;
    nextOrderKey?: string;
};

@Injectable({ providedIn: 'root' })
export class ListItemsController {
    list = signal<ZereiListRow | null>(null);
    items = signal<ZereiListItemRowExpanded[]>([]);
    totalItems = signal(0);
    currentPage = signal(0);
    offset = computed(() => Math.ceil(this.currentPage() * 50));
    pageCount = computed(() => Math.ceil(this.totalItems() / 50));
    loading = signal(true);
    hasMore = signal(false);
    error = signal<AppError | undefined>(undefined);

    private reorder$ = new Subject<void>();
    private reorderOps = signal<ReorderOp[]>([]);

    constructor(
        private profileStore: ProfileStore,
        private listService: ListService,
    ) {
        this.reorder$.pipe(debounceTime(500)).subscribe(async () => {
            await this.persitOrder();
        });
    }

    async load({ slug, loadMore }: { slug?: string; loadMore?: boolean }) {
        try {
            this.loading.set(true);
            const profile = this.profileStore.current();

            if (!profile) return;

            if (loadMore) {
                this.currentPage.update((p) => p + 1);
            } else {
                this.reset();
            }

            const list =
                this.list()?.slug !== slug
                    ? (
                        await this.listService.getLists({
                            userFingerprint: profile.fingerprint,
                            bySlug: slug || this.list()?.slug,
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
                listId: this.list()!.$id,
                offset: this.offset(),
            });

            const rows = items.rows as unknown as ZereiListItemRowExpanded[];

            if (loadMore) {
                this.items.update((state) => [...state, ...rows]);
            } else {
                this.items.set(rows);
            }

            const loaded = this.items().length;
            this.hasMore.set(loaded < items.total);
            this.totalItems.set(items.total);
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

    notifyReorder(op: ReorderOp) {
        this.reorderOps.update((state) => [...state, op]);
        this.reorder$.next();
    }

    private async persitOrder() {
        try {
            const { reorderedRows, updatedList } = await this.listService.reorderItems(this.reorderOps());


            const map = new Map(
                reorderedRows
                    .filter((item) => item.$tableId === 'list_items')
                    .map((item) => [item.$id, item.orderKey]),
            );

            this.items.update((state) =>
                state.map((item) =>
                    map.has(item.$id) ? { ...item, orderKey: map.get(item.$id)! } : item,
                ),
            );

            if (updatedList) {
                this.list.set(updatedList)
            }

            this.reorderOps.set([]);
        } catch (e) {
            console.error(e);
        }
    }

    private reset() {
        this.totalItems.set(0);
        this.currentPage.set(0);
        this.loading.set(true);
        this.hasMore.set(false);
        this.error.set(undefined);
    }
}
