import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../shared/infra/social-api';
import { appwrite, Query } from '../../shared/infra/appwrite/appwrite.client';
import {
  ZereiListItemRow,
  ZereiListRow,
} from '../../types';

const LIST_TABLE_ID = 'lists';
const LIST_ITEM_TABLE_ID = 'list_items';

@Injectable({ providedIn: 'root' })
export class ListsRepository {
  private readonly api = inject(SocialApi);

  /* =======================
     Lists
     ======================= */

  listLists(queries: any[]) {
    return appwrite.databases.listRows<ZereiListRow>({
      databaseId: 'app',
      tableId: LIST_TABLE_ID,
      queries,
    });
  }

  createList(data: { title: string; description?: string; isPublic?: boolean }) {
    return this.api.request<ZereiListRow>('social/lists', 'POST', data);
  }

  updateList(listId: string, data: Partial<ZereiListRow>) {
    const { title, description, isPublic, coverImageUrls } = data;
    return this.api.request<ZereiListRow>(`social/lists/${encodeURIComponent(listId)}`, 'PATCH', { title, description, isPublic, coverImageUrls });
  }

  deleteList(listId: string) {
    return this.api.request<void>(`social/lists/${encodeURIComponent(listId)}`, 'DELETE');
  }

  createItem(data: { listId: string; gameId: string; orderKey: string }) {
    return this.api.request<{ updatedList: ZereiListRow; newItem: ZereiListItemRow }>(`social/lists/${encodeURIComponent(data.listId)}/items`, 'POST', { gameId: data.gameId, orderKey: data.orderKey });
  }

  listItems(listId: string, limit = 50, offset = 0) {
    return appwrite.databases.listRows<ZereiListItemRow>({
      databaseId: 'app',
      tableId: LIST_ITEM_TABLE_ID,
      queries: [
        Query.equal('list', listId),
        Query.orderAsc('orderKey'),
        Query.select(['*', 'game.*']),
        Query.limit(limit),
        Query.offset(offset),
      ],
    });
  }

  updateItemOrder(listId: string, itemId: string, orderKey: string) {
    return this.api.request<ZereiListItemRow>(`social/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`, 'PATCH', { orderKey });
  }

  deleteItem(listId: string, itemId: string) {
    return this.api.request<ZereiListRow>(`social/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`, 'DELETE');
  }
}
