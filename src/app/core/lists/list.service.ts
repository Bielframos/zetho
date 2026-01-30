import { Injectable } from '@angular/core';
import slugify from 'slugify';
import { Query } from '../appwrite/appwrite.client';
import { GameRow, ZereiListItemRow, ZereiListRow } from '../../types';
import { between } from '../../utils/lexorank';
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

export type LastAdditionItem = {
  orderKey: string;
  gameId: string;
  gameName: string;
  gameCoverUrl: string;
};

@Injectable({ providedIn: 'root' })
export class ListService {
  constructor(private repository: ListsRepository) {}

  /* =======================
     Lists
     ======================= */

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
    const slug = slugify(input.title, { lower: true });

    return this.repository.createList({
      ownerFingerprint: input.ownerFingerprint,
      title: input.title,
      description: input.description,
      isPublic: input.isPublic,
      slug,
      itemCount: 0,
      latestAdditions: [],
    });
  }

  async updateList(params: {
    listId: string;
    title?: string;
    description?: string;
    isPublic?: boolean;
  }) {
    return this.repository.updateList(params.listId, {
      title: params.title,
      description: params.description,
      isPublic: params.isPublic,
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
    const newOrderKey = between({ prev: list.lastOrderKey });

    /**
     * 2. Cria item
     */
    const newItem = await this.repository.createItem({
      listId: list.$id,
      gameId: game.$id,
      orderKey: newOrderKey,
    });

    /**
     * 3. Atualiza latestAdditions (regra de domínio)
     */
    const latestAdditions = this.buildLatestAdditions(list.latestAdditions, {
      orderKey: newItem.orderKey,
      gameId: game.$id,
      gameName: game.name,
      gameCoverUrl: game.coverUrl,
    });

    /**
     * 4. Persiste estado agregado
     */
    const [updatedList] = await Promise.all([
      this.repository.updateList(list.$id, {
        latestAdditions,
        lastOrderKey: newOrderKey,
      }),
      this.repository.incrementItemCount(list.$id, 1),
    ]);

    return { updatedList, newItem };
  }

  async removeItem(listId: string, itemId: string) {
    const [_, updatedList] = await Promise.all([
      this.repository.deleteItem(itemId),
      this.repository.incrementItemCount(listId, -1),
    ]);

    return updatedList;
  }

  async reorderItems(
    reorderOps: {
      item: ZereiListItemRow;
      prevOrderKey?: string;
      nextOrderKey?: string;
    }[],
  ) {
    let lastOrderKey: string | null = null;
    let listId: string | null = null;

    const reorderedRows = await Promise.all(
      reorderOps.map((op) => {
        const newOrderKey = between({
          prev: op.prevOrderKey,
          next: op.nextOrderKey,
        });

        if (!op.nextOrderKey) {
          lastOrderKey = newOrderKey;
          listId = op.item.list;
        }

        return this.repository.updateItemOrder(op.item.$id, newOrderKey);
      }),
    );

    const updatedList =
      listId && lastOrderKey
        ? await this.repository.updateList(listId, {
            lastOrderKey,
          })
        : undefined;

    return { reorderedRows, updatedList };
  }

  /* =======================
     Helpers de domínio
     ======================= */

  private buildLatestAdditions(
    current: string[] | undefined,
    newItem: LastAdditionItem,
  ): string[] {
    const parsed: LastAdditionItem[] = (current ?? []).map((item) =>
      JSON.parse(item),
    );

    parsed.unshift(newItem);

    return parsed
      .slice(0, 3)
      .reverse()
      .map((item) => JSON.stringify(item));
  }
}
