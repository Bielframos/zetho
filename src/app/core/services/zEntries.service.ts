import { Injectable } from '@angular/core'
import { Analytics, logEvent } from '@angular/fire/analytics'
import { appwrite, Query } from '../appwrite/appwrite.client'
import { ZEntryRow } from '../types'

const Z_ENTRIES_TABLE_ID = 'z_entries'
const Z_ENTRIES_READ_TABLE_ID = 'z_entries_read'

@Injectable({ providedIn: 'root' })
export class ZEntryService {
    constructor(private analytics: Analytics) { }
    async getUserEntries(userFingerprint: string, status: Exclude<ZEntryRow['status'], null | undefined>, opts?: { pageSize?: number, offset?: number }) {
        return await appwrite.databases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_READ_TABLE_ID,
            queries: [
                Query.select(['$id', 'status', 'gameId']),
                Query.equal('ownerFingerprint', userFingerprint),
                Query.equal('status', status),
                Query.orderDesc('$updatedAt'),
                Query.limit(opts?.pageSize || 12),
                Query.offset(opts?.offset || 0)
            ]
        })
    }

    async getEntry(userFingerprint: string, gameId: string) {
        const zEntries = await appwrite.databases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_READ_TABLE_ID,
            queries: [
                Query.equal('ownerFingerprint', userFingerprint),
                Query.equal('gameId', gameId),
                Query.limit(1),
            ]
        })

        return zEntries.rows[0] ?? null
    }


    async createEntry(userFingerprint: string, payload: { gameId: string, current: ZEntryRow | null, status: ZEntryRow['status'] | null }) {
        const { gameId, status, current } = payload

        // Filtra apenas os campos que devem ser persistidos
        const dataToCreate: any = {
            gameId,
            ownerFingerprint: userFingerprint,
            status
        };

        // Copia apenas campos não-sistema do registro anterior
        if (current) {
            const { $id, $sequence, $tableId, $databaseId, $createdAt, $updatedAt, $permissions, status: _, ...cleanCurrent } = current;
            Object.assign(dataToCreate, cleanCurrent);
        }

        const result = await appwrite.databases.createRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: 'unique()',
            data: dataToCreate
        });

        try {
            logEvent(this.analytics, 'user_game_entry_interaction', { action: status, game_id: gameId })
        } catch (e) {
            // não falha a operação principal por conta do analytics
            console.warn('analytics log failed', e)
        }

        return result
    }

    async likeAGame(userFingerprint: string, payload: { gameId: string, current: ZEntryRow | null }) {
        const { gameId, current } = payload

        const liked = current ? !current.liked : true;

        // Filtra apenas os campos que devem ser persistidos
        const dataToCreate: any = {
            gameId,
            ownerFingerprint: userFingerprint,
            liked
        };

        // Copia apenas campos não-sistema do registro anterior
        if (current) {
            const { $id, $sequence, $tableId, $databaseId, $createdAt, $updatedAt, $permissions, liked: _, ...cleanCurrent } = current;
            Object.assign(dataToCreate, cleanCurrent);
        }

        const result = await appwrite.databases.createRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: 'unique()',
            data: dataToCreate
        });

        try {
            logEvent(this.analytics, 'user_game_entry_interaction', { action: liked ? 'like' : 'unlike', game_id: gameId })
        } catch (e) {
            console.warn('analytics log failed', e)
        }

        return result
    }

    async getZEntryCount() {
        const response = await appwrite.databases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_READ_TABLE_ID,
            queries: [Query.select(['$id']), Query.limit(1)]
        });

        return response.total
    }
}