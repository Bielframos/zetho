import { Injectable } from '@angular/core'
import { appwrite, ID, Query } from '../appwrite/appwrite.client'
import { UserStore } from '../auth/user.store'
import { ZEntry, ZEntryRow } from '../types'

const Z_ENTRIES_TABLE_ID = 'z_entries'

@Injectable({ providedIn: 'root' })
export class ZEntryService {
    constructor(private userStore: UserStore) { }

    async getUserStats() {
        const profile = this.userStore.profile()
        if (!profile) return {}

        const statusToGet: ZEntryRow['status'][] = ['completed', 'backlog', 'playing', 'dropped', 'wishlist']

        function createRequest(status: ZEntryRow['status']) {
            return appwrite.databases.listRows({
                databaseId: 'app',
                tableId: 'z_entries',
                queries: [Query.select(['$id']), Query.equal('ownerFingerprint', profile!.fingerprint), Query.equal('status', status!), Query.limit(1)]
            })
        }

        const [completed, backlog, playing, dropped, wishlist] = await Promise.all(statusToGet.map(status => createRequest(status)))

        return {
            completedCount: completed.total,
            backlogCount: backlog.total,
            playingCount: playing.total,
            droppedCount: dropped.total,
            wishlistCount: wishlist.total
        }
    }

    async getUserEntries(status: Exclude<ZEntryRow['status'], null | undefined>, opts?: { pageSize?: number, offset?: number }) {
        const profile = this.userStore.profile()
        if (!profile) return { total: 0, rows: [] }

        return await appwrite.databases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            queries: [
                Query.select(['$id', 'status', 'gameId']),
                Query.equal('ownerFingerprint', profile!.fingerprint),
                Query.equal('status', status),
                Query.orderDesc('$updatedAt'),
                Query.limit(opts?.pageSize || 12),
                Query.offset(opts?.offset || 0)
            ]
        })
    }

    async getEntry(gameId: string) {
        const profile = this.userStore.profile()
        if (!profile) return null

        const zEntries = await appwrite.databases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            queries: [Query.equal('ownerFingerprint', profile.fingerprint), Query.equal('gameId', gameId)]
        })

        if (zEntries.total > 0) return zEntries.rows[0]
        else return null
    }

    async createEntry(payload: { zEntryId?: string, gameId: string, status: ZEntry['status'] | null, prev: ZEntryRow | null }) {
        const profile = this.userStore.profile()
        if (!profile) return null

        const { zEntryId, gameId, status, prev } = payload

        const prevState = JSON.stringify({
            status: prev?.status ?? null,
            liked: prev?.liked ?? null
        });

        return await appwrite.databases.upsertRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: zEntryId || ID.unique(),
            data: {
                gameId,
                status,
                prevState,
                ownerFingerprint: profile!.fingerprint
            }
        });
    }

    async likeAGame(gameId: string, prev: ZEntryRow | null) {
        const profile = this.userStore.profile()
        if (!profile) return

        const prevState = JSON.stringify({
            status: prev?.status ?? null,
            liked: prev?.liked ?? null
        });

        const liked = prev ? !prev.liked : true;

        return await appwrite.databases.upsertRow<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            rowId: `${profile!.fingerprint}_${gameId}`,
            data: {
                gameId,
                liked,
                prevState,
                ownerFingerprint: profile!.fingerprint
            }
        });
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