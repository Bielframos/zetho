import { Injectable } from '@angular/core'
import { appwrite, Query } from '../appwrite/appwrite.client'
import { ZEntryRow } from '../types'

const Z_ENTRIES_TABLE_ID = 'z_entries'

@Injectable({ providedIn: 'root' })
export class ZEntryService {
    async getEntry(userId: string, gameId: string) {
        const zEntry = await appwrite.datababases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            queries: [
                Query.equal('userId', userId),
                Query.equal('game', gameId),
                Query.select(['$id', 'status'])
            ],
            total: false
        })

        if (zEntry.rows.length > 0) return zEntry.rows[0]
        else return null
    }
}