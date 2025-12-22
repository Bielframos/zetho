import { Injectable, signal } from '@angular/core';
import { AppError, ZereiList } from '../types';
import { ListService } from '../services/list.service';
import { UserStore } from '../auth/user.store';
import { AppwriteException } from 'appwrite';

@Injectable({ providedIn: 'root' })
export class ListsController {
    lists = signal<ZereiList[]>([]);
    loading = signal<boolean>(false);
    hasMore = signal<boolean>(false);
    error = signal<AppError | undefined>(undefined)

    constructor(
        private userStore: UserStore,
        private listService: ListService,
    ) { }

    async loadLists({
        userFingerprint,
        limit,
        offset,
    }: {
        userFingerprint: string;
        limit?: number;
        offset?: number;
    }) {
        try {
            this.loading.set(true)
            const lists = await this.listService.getLists({ userFingerprint, limit, offset })
            this.lists.set(lists.rows)
            this.hasMore.set((offset || 0) < lists.total)

            console.log(lists)

        } catch (e) {
            const error = e as AppwriteException
            console.error(e)
            this.error.set({ message: error.message, code: error.code, type: error.type })
        }
    }
}
