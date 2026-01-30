import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
import {
  GameRow,
  ZereiList,
  ZereiListItemRow,
  ZereiListRow,
} from '../../types';

const LIST_TABLE_ID = 'lists';
const LIST_ITEM_TABLE_ID = 'list_items';

@Injectable({ providedIn: 'root' })
export class ListsRepository {
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

  createList(data: ZereiList) {
    return appwrite.databases.createRow<ZereiListRow>({
      databaseId: 'app',
      tableId: LIST_TABLE_ID,
      rowId: 'unique()',
      data,
    });
  }

  updateList(listId: string, data: Partial<ZereiListRow>) {
    return appwrite.databases.updateRow<ZereiListRow>({
      databaseId: 'app',
      tableId: LIST_TABLE_ID,
      rowId: listId,
      data,
    });
  }

  deleteList(listId: string) {
    return appwrite.databases.deleteRow({
      databaseId: 'app',
      tableId: LIST_TABLE_ID,
      rowId: listId,
    });
  }

  incrementItemCount(listId: string, value: number) {
    return appwrite.databases.incrementRowColumn<ZereiListRow>({
      databaseId: 'app',
      tableId: LIST_TABLE_ID,
      rowId: listId,
      column: 'itemCount',
      value,
    });
  }

  /* =======================
     Items
     ======================= */

  createItem(data: { listId: string; gameId: string; orderKey: string }) {
    return appwrite.databases.createRow<ZereiListItemRow>({
      databaseId: 'app',
      tableId: LIST_ITEM_TABLE_ID,
      rowId: 'unique()',
      data: {
        list: data.listId,
        game: data.gameId,
        orderKey: data.orderKey,
      },
    });
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

  updateItemOrder(itemId: string, orderKey: string) {
    return appwrite.databases.updateRow<ZereiListItemRow>({
      databaseId: 'app',
      tableId: LIST_ITEM_TABLE_ID,
      rowId: itemId,
      data: { orderKey },
    });
  }

  deleteItem(itemId: string) {
    return appwrite.databases.deleteRow({
      databaseId: 'app',
      tableId: LIST_ITEM_TABLE_ID,
      rowId: itemId,
    });
  }
}
