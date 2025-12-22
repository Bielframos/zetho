import { Injectable } from '@angular/core'
import { Analytics, logEvent } from '@angular/fire/analytics'
import { appwrite, ID, Query } from '../appwrite/appwrite.client'
import { ZEntry, ZEntryRow } from '../types'

const Z_ENTRIES_TABLE_ID = 'z_entries'

@Injectable({ providedIn: 'root' })
export class ZEntryService {
    constructor(private analytics: Analytics) { }
    async getUserEntries(userFingerprint: string, status: Exclude<ZEntryRow['status'], null | undefined>, opts?: { pageSize?: number, offset?: number }) {
        return await appwrite.databases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
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
            tableId: Z_ENTRIES_TABLE_ID,
            queries: [Query.equal('ownerFingerprint', userFingerprint), Query.equal('gameId', gameId)]
        })

        if (zEntries.total > 0) return zEntries.rows[0]
        else return null
    }

    async createEntry(userFingerprint: string, payload: { zEntryId?: string, gameId: string, status: ZEntry['status'] | null, prev: ZEntryRow | null }) {
        const { zEntryId, gameId, status, prev } = payload

        const prevState = JSON.stringify({
            status: prev?.status ?? null,
            liked: prev?.liked ?? null
        });

        const result = await appwrite.databases.upsertRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: zEntryId || ID.unique(),
            data: {
                gameId,
                status,
                prevState,
                ownerFingerprint: userFingerprint
            }
        });

        try {
            logEvent(this.analytics, 'user_game_entry_interaction', { action: status, game_id: gameId })
        } catch (e) {
            // não falha a operação principal por conta do analytics
            console.warn('analytics log failed', e)
        }

        return result
    }

    async likeAGame(userFingerprint: string, payload: { zEntryId?: string, gameId: string, prev: ZEntryRow | null }) {
        const { zEntryId, gameId, prev } = payload

        const prevState = JSON.stringify({
            status: prev?.status ?? null,
            liked: prev?.liked ?? null
        });

        const liked = prev ? !prev.liked : true;

        const result = await appwrite.databases.upsertRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: zEntryId || ID.unique(),
            data: {
                gameId,
                liked,
                prevState,
                ownerFingerprint: userFingerprint
            }
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
            tableId: Z_ENTRIES_TABLE_ID,
            queries: [Query.select(['$id']), Query.limit(1)]
        });

        return response.total
    }
}