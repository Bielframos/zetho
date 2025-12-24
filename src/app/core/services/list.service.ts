import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { ZereiListRow } from '../types';
import slugify from 'slugify'

const LIST_TABLE_ID = 'lists';
const LIST_ITEM_TABLE_ID = 'list_items';

export type GetListsInput = {
    userFingerprint: string;
    limit?: number;
    offset?: number;
};

export type CreateListInput = {
    ownerFingerprint: string;
    title: string;
    description?: string;
    isPublic?: boolean
};

@Injectable({ providedIn: 'root' })
export class ListService {
    async getLists({ userFingerprint, ...props }: GetListsInput) {
        const lists = await appwrite.databases.listRows<ZereiListRow>({
            databaseId: 'app',
            tableId: LIST_TABLE_ID,
            queries: [
                Query.equal('ownerFingerprint', userFingerprint),
                Query.limit(props.limit || 12),
                Query.offset(props.offset || 0),
            ],
        });

        return lists;
    }

    async createList(data: CreateListInput) {
        const newList = await appwrite.databases.createRow<ZereiListRow>({
            databaseId: 'app',
            tableId: LIST_TABLE_ID,
            rowId: 'unique()',
            data: { ...data, slug: slugify(data.title, { lower: true }) },
        });

        return newList;
    }
}
