import { Injectable } from '@angular/core'
import { appwrite } from '../appwrite/appwrite.client'
import { ZEntry, ZEntryRow } from '../types'

const Z_ENTRIES_TABLE_ID = 'z_entries'

@Injectable({ providedIn: 'root' })
export class ZEntryService {
    async getEntry(userId: string, gameId: string) {
        const zEntry = await appwrite.datababases.getRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: `${userId}_${gameId}`
        }).catch((e) => {
            if (e.code === 404) return null
            else throw e
        })

        return zEntry
    }

    async createEntry(userId: string, gameId: string, status: ZEntry['status'], prev: ZEntryRow | null) {
        const prevState = JSON.stringify({
            status: prev?.status ?? null,
            liked: prev?.liked ?? null
        });

        return await appwrite.datababases.upsertRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: `${userId}_${gameId}`,
            data: {
                userId,
                gameId,
                status,
                prevState
            }
        });
    }

    async likeAGame(userId: string, gameId: string, prev: ZEntryRow | null) {
        const prevState = JSON.stringify({
            status: prev?.status ?? null,
            liked: prev?.liked ?? null
        });

        const liked = prev ? !prev.liked : true;

        return await appwrite.datababases.upsertRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: `${userId}_${gameId}`,
            data: {
                userId,
                gameId,
                liked,
                prevState
            }
        });
    }
}