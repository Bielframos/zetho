import { computed, Injectable, signal } from '@angular/core';
import { AppwriteException } from 'appwrite';
import {
    CreateListInput,
    ListService
} from '../services/list.service';
import { AppError, ZereiListRow } from '../types';

@Injectable({ providedIn: 'root' })
export class ListsController {
    lists = signal<ZereiListRow[]>([]);

    total = signal(0)
    currentPage = signal(0)
    offset = computed(() => this.currentPage() * 12);
    pageCount = computed(() => Math.ceil(this.total() / 12));

    loading = signal<boolean>(false);
    hasMore = signal<boolean>(false);

    awaitingCreation = signal<boolean>(false)
    error = signal<AppError | undefined>(undefined);

    constructor(
        private listService: ListService,
    ) { }

    async loadLists({ ownerFingerprint, loadMore }: { ownerFingerprint: string, loadMore?: boolean }) {
        try {
            if (this.loading()) return;
            this.loading.set(true);

            if (loadMore) {
                this.currentPage.update((p) => p + 1);
            }

            const lists = await this.listService.getLists({
                userFingerprint: ownerFingerprint,
                offset: this.offset(),
            });

            if (loadMore) {
                this.lists.update(state => [...state, ...lists.rows]);
            } else {
                this.lists.set(lists.rows);
            }

            const loaded = this.lists().length;
            this.hasMore.set(loaded < lists.total);

            this.total.set(lists.total);
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

    async createList(props: CreateListInput) {
        try {
            this.awaitingCreation.set(true)
            const newList = await this.listService.createList(props)
            this.lists.update(state => [newList, ...state])
        } catch (e) {
            const error = e as AppwriteException;
            console.error(e);

            this.error.set({
                message: error.message,
                code: error.code,
                type: error.type,
            });
        } finally {
            this.awaitingCreation.set(false)
        }
    }
}
