import { Injectable, signal } from '@angular/core';
import { AppwriteException } from 'appwrite';
import { UserStore } from '../auth/user.store';
import {
    CreateListInput,
    GetListsInput,
    ListService,
} from '../services/list.service';
import { AppError, ZereiListRow } from '../types';

@Injectable({ providedIn: 'root' })
export class ListsController {
    lists = signal<ZereiListRow[]>([]);
    loading = signal<boolean>(false);
    awaitingCreation = signal<boolean>(false)
    hasMore = signal<boolean>(false);
    error = signal<AppError | undefined>(undefined);

    constructor(
        private userStore: UserStore,
        private listService: ListService,
    ) { }

    async loadLists({ userFingerprint, limit, offset }: GetListsInput) {
        try {
            this.loading.set(true);
            const lists = await this.listService.getLists({
                userFingerprint,
                limit,
                offset,
            });
            this.lists.set(lists.rows);
            this.hasMore.set((offset || 0) < lists.total);
        } catch (e) {
            const error = e as AppwriteException;
            console.error(e);
            this.error.set({
                message: error.message,
                code: error.code,
                type: error.type,
            });
        } finally {
            this.loading.set(true);
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
