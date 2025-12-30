import { Injectable } from '@angular/core';
import slugify from 'slugify';
import { appwrite, Query } from '../appwrite/appwrite.client';
import { between } from '../modules/lexorank';
import { GameRow, ZereiListItemRow, ZereiListRow } from '../types';

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
    isPublic?: boolean;
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

    async addToList({ list, game }: { list: ZereiListRow; game: GameRow }) {
        // Faz o parse dos últimos itens adicionados a lista alvo
        const latestAdditions: LastAdditionItem[] = JSON.parse(
            JSON.stringify(list.latestAdditions) || '[]',
        ).map((item: string) => JSON.parse(item));
        const lastAdditions = latestAdditions[0];

        // Registra o item no banco
        const newItem = await appwrite.databases.createRow<ZereiListItemRow>({
            databaseId: 'app',
            tableId: LIST_ITEM_TABLE_ID,
            rowId: 'unique()',
            data: {
                list: list.$id,
                game: game.$id,
                orderKey: between({ prev: lastAdditions?.orderKey }),
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
}
