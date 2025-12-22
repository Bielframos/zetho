import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { ZereiListRow } from '../types';

const LIST_TABLE_ID = 'lists';
const LIST_ITEM_TABLE_ID = 'list_items';

@Injectable({ providedIn: 'root' })
export class ListService {
    async getLists({
        userFingerprint,
        ...props
    }: {
        userFingerprint: string;
        limit?: number;
        offset?: number;
    }) {
        const lists = await appwrite.databases.listRows<ZereiListRow>({
            databaseId: 'app',
            tableId: LIST_TABLE_ID,
            queries: [
                Query.equal('ownerFingerprint', userFingerprint),
                Query.limit(props.limit || 12),
                Query.offset(props.offset || 0),
            ],
        });

        return lists
    }
}
