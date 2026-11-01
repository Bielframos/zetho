import { AuthStore } from '../auth/auth.store';
import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../shared/infra/social-api';
import { appwrite, Query } from '../../shared/infra/appwrite/appwrite.client';
import { ZereiListItemRow, ZereiListRow } from '../../types';

const LIST_TABLE_ID = 'lists';
const LIST_ITEM_TABLE_ID = 'list_items';

@Injectable({ providedIn: 'root' })
export class ListsRepository {
  private readonly api = inject(SocialApi);
  private readonly auth = inject(AuthStore);
  async read<T>(path: string): Promise<T> {
    await this.auth.ready;
    return this.auth.isAuthenticated()
      ? this.api.request<T>(path, 'GET')
      : this.api.requestPublic<T>(path);
  }
  byId(id: string) {
    return this.read<ZereiListRow>(`lists/by-id/${encodeURIComponent(id)}`);
  }
  systemList(slug: string) {
    return this.read<ZereiListRow>(`lists/detail/${encodeURIComponent(slug)}`);
  }

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

  createList(data: {
    ownerType?: 'user' | 'system';
    title: string;
    description?: string;
    isPublic?: boolean;
  }) {
    return this.api.request<ZereiListRow>('social/lists', 'POST', data);
  }

  updateList(listId: string, data: Partial<ZereiListRow>) {
    const { title, description, isPublic, coverImageUrls } = data;
    return this.api.request<ZereiListRow>(
      `social/lists/${encodeURIComponent(listId)}`,
      'PATCH',
      { title, description, isPublic, coverImageUrls },
    );
  }

  deleteList(listId: string) {
    return this.api.request<void>(
      `social/lists/${encodeURIComponent(listId)}`,
      'DELETE',
    );
  }

  createItem(data: { listId: string; gameId: string; orderKey: string }) {
    return this.api.request<{
      updatedList: ZereiListRow;
      newItem: ZereiListItemRow;
    }>(`social/lists/${encodeURIComponent(data.listId)}/items`, 'POST', {
      gameId: data.gameId,
      orderKey: data.orderKey,
    });
  }

  listItems(listId: string, limit = 50, offset = 0) {
    return this.read<{ rows: ZereiListItemRow[]; total: number }>(
      `lists/${encodeURIComponent(listId)}/items?limit=${limit}&offset=${offset}`,
    );
  }

  updateItemOrder(listId: string, itemId: string, orderKey: string) {
    return this.api.request<ZereiListItemRow>(
      `social/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
      'PATCH',
      { orderKey },
    );
  }

  deleteItem(listId: string, itemId: string) {
    return this.api.request<ZereiListRow>(
      `social/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
      'DELETE',
    );
  }
}
