import { Injectable } from '@angular/core';
import { Query } from '../../shared/infra/appwrite/appwrite.client';
import { GameRow, ZereiListItemRow, ZereiListRow } from '../../types';
import { generateOrderKey } from '../../utils/lexorank';
import { ListsRepository } from './lists.repository';

const DEFAULT_LIST_LIMIT = 12;
const DEFAULT_ITEM_LIMIT = 50;

export type GetListsInput = {
  userFingerprint: string;
  bySlug?: string;
  onlyPublicOnes?: boolean;
  limit?: number;
  offset?: number;
};

export type CreateListInput = {
  ownerType?: 'user' | 'system';
  ownerFingerprint: string;
  title: string;
  description?: string;
  isPublic?: boolean;
};

export type GetListItemInput = {
  listId: string;
  limit?: number;
  offset?: number;
};

@Injectable({ providedIn: 'root' })
export class ListService {
  constructor(private repository: ListsRepository) {}

  /* =======================
     Lists
     ======================= */

  getSystemList(slug: string) {
    return this.repository.systemList(slug);
  }

  async getLists({
    userFingerprint,
    bySlug,
    onlyPublicOnes,
    limit = DEFAULT_LIST_LIMIT,
    offset = 0,
  }: GetListsInput) {
    const queries = [
      Query.equal('ownerFingerprint', userFingerprint),
      Query.limit(bySlug ? 1 : limit),
      Query.offset(offset),
    ];

    if (bySlug) queries.push(Query.equal('slug', bySlug));
    if (onlyPublicOnes) queries.push(Query.equal('isPublic', true));

    return this.repository.listLists(queries);
  }

  async createList(input: CreateListInput) {
    return this.repository.createList({
      ownerType: input.ownerType,
      title: input.title,
      description: input.description,
      isPublic: input.isPublic,
    });
  }

  async updateList(params: {
    listId: string;
    title?: string;
    description?: string;
    isPublic?: boolean;
    coverImageUrls?: string[];
  }) {
    return this.repository.updateList(params.listId, {
      title: params.title,
      description: params.description,
      isPublic: params.isPublic,
      coverImageUrls: params.coverImageUrls,
    });
  }

  async deleteList(listId: string) {
    await this.repository.deleteList(listId);
  }

  /* =======================
     Items
     ======================= */

  async getItems({ listId, limit, offset }: GetListItemInput) {
    return this.repository.listItems(
      listId,
      limit ?? DEFAULT_ITEM_LIMIT,
      offset ?? 0,
    );
  }

  async addToList({ list, game }: { list: ZereiListRow; game: GameRow }) {
    /**
     * 1. Calcula nova posição (regra de domínio)
     */
    const newOrderKey = generateOrderKey({ prev: list.lastOrderKey });

    return this.repository.createItem({
      listId: list.$id,
      gameId: game.$id,
      orderKey: newOrderKey,
    });
  }

  async removeItem(
    listId: string,
    itemId: string,
    gameId?: string,
    currentLatestAdditions?: string[],
  ) {
    return this.repository.deleteItem(listId, itemId);
  }

  async reorderItems(
    reorderOps: {
      item: ZereiListItemRow;
      prevOrderKey?: string;
      nextOrderKey?: string;
    }[],
  ) {
    const reorderedRows: ZereiListItemRow[] = [];
    let listId: string | undefined;

    for (const op of reorderOps) {
      const newOrderKey = generateOrderKey({
        prev: op.prevOrderKey,
        next: op.nextOrderKey,
      });
      listId = op.item.list;
      reorderedRows.push(
        await this.repository.updateItemOrder(
          op.item.list,
          op.item.$id,
          newOrderKey,
        ),
      );
    }

    const updatedList = listId ? await this.repository.byId(listId) : undefined;

    return { reorderedRows, updatedList };
  }
}
