import { Injectable } from '@angular/core';
import slugify from 'slugify';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { between } from '../modules/lexorank';
import { GameRow, ZereiListItemRow, ZereiListRow } from '../types';

const LIST_TABLE_ID = 'lists';
const LIST_ITEM_TABLE_ID = 'list_items';

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
    async getLists({ userFingerprint, ...props }: GetListsInput) {
        let queries = [
            Query.equal('ownerFingerprint', userFingerprint),
            Query.limit(props.bySlug ? 1 : props.limit || 12),
            Query.offset(props.offset || 0),
        ];

        if (props.bySlug) queries.push(Query.equal('slug', props.bySlug));
        if (props.onlyPublicOnes) queries.push(Query.equal('isPublic', true));

        const lists = await appwrite.databases.listRows<ZereiListRow>({
            databaseId: 'app',
            tableId: LIST_TABLE_ID,
            queries,
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

    async updateList({
        listId,
        title,
        description,
        isPublic,
    }: {
        listId: string;
        title?: string;
        description?: string;
        isPublic?: boolean;
    }) {
        const updatedList = await appwrite.databases.updateRow<ZereiListRow>({
            databaseId: 'app',
            tableId: LIST_TABLE_ID,
            rowId: listId,
            data: { title, description, isPublic }
        });

        return updatedList
    }

    async addToList({ list, game }: { list: ZereiListRow; game: GameRow }) {
        // Faz o parse dos últimos itens adicionados a lista alvo
        const latestAdditions: LastAdditionItem[] = JSON.parse(
            JSON.stringify(list.latestAdditions) || '[]',
        ).map((item: string) => JSON.parse(item));

        const lastOrderKey = list.lastOrderKey;
        const newOrderKey = between({ prev: lastOrderKey });

        // Registra o item no banco
        const newItem = await appwrite.databases.createRow<ZereiListItemRow>({
            databaseId: 'app',
            tableId: LIST_ITEM_TABLE_ID,
            rowId: 'unique()',
            data: {
                list: list.$id,
                game: game.$id,
                orderKey: newOrderKey,
            },
        });

        // Cria o estado atualizado das últimas adições na lista
        latestAdditions.unshift({
            orderKey: newItem.orderKey,
            gameId: game.$id,
            gameName: game.name,
            gameCoverUrl: game.coverUrl,
        });
        const updatedLatestAdditions = latestAdditions.slice(0, 3);

        // Persiste no banco o estado das últimas adições e incremeta a contagem de itens
        const [updatedList, _] = await Promise.all([
            appwrite.databases.updateRow<ZereiListRow>({
                databaseId: 'app',
                tableId: LIST_TABLE_ID,
                rowId: list.$id,
                data: {
                    latestAdditions: updatedLatestAdditions.map((item) =>
                        JSON.stringify(item),
                    ),
                    lastOrderKey: newOrderKey,
                },
            }),
            appwrite.databases.incrementRowColumn({
                databaseId: 'app',
                tableId: LIST_TABLE_ID,
                rowId: list.$id,
                column: 'itemCount',
                value: 1,
            }),
        ]);

        return { updatedList, newItem };
    }

    async getItems({ listId, limit, offset }: GetListItemInput) {
        const items = await appwrite.databases.listRows<ZereiListItemRow>({
            databaseId: 'app',
            tableId: LIST_ITEM_TABLE_ID,
            queries: [
                Query.equal('list', listId),
                Query.orderAsc('orderKey'),
                Query.select(['*', 'game.*']),
                Query.limit(limit || 50),
                Query.offset(offset || 0),
            ],
        });

        return items;
    }

    async removeItem(id: string) {
        return await appwrite.databases.deleteRow({
            databaseId: 'app',
            tableId: LIST_ITEM_TABLE_ID,
            rowId: id,
        });
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

                return appwrite.databases.updateRow<ZereiListItemRow>({
                    databaseId: 'app',
                    tableId: LIST_ITEM_TABLE_ID,
                    rowId: op.item.$id,
                    data: { orderKey: newOrderKey },
                });
            }),
        );

        const updatedList =
            listId && lastOrderKey
                ? await appwrite.databases.updateRow<ZereiListRow>({
                    databaseId: 'app',
                    tableId: LIST_TABLE_ID,
                    rowId: listId,
                    data: { lastOrderKey },
                })
                : undefined;

        return { reorderedRows, updatedList };
    }
}
