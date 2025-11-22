import { Injectable, QueryList } from '@angular/core'
import { appwrite, Query } from '../appwrite/appwrite.client'
import { ZEntry, ZEntryRow } from '../types'

const Z_ENTRIES_TABLE_ID = 'z_entries'

@Injectable({ providedIn: 'root' })
export class ZEntryService {
    async getUserStats() {
        const statusToGet: ZEntryRow['status'][] = ['completed', 'backlog', 'playing', 'dropped', 'wishlist']

        function createRequest(status: ZEntryRow['status']) {
            return appwrite.datababases.listRows({
                databaseId: 'app',
                tableId: 'z_entries',
                queries: [Query.select(['$id']), Query.equal('status', status!), Query.limit(1)]
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

    async getUserEntries(userId: string, status: Exclude<ZEntryRow['status'], null | undefined>, opts?: { pageSize?: number, offset?: number }) {
        return await appwrite.datababases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            queries: [
                Query.select(['$id', 'status', 'gameId']),
                Query.equal('userId', userId),
                Query.equal('status', status),
                Query.orderDesc('$updatedAt'),
                Query.limit(opts?.pageSize || 12),
                Query.offset(opts?.offset || 0)
            ]
        })
    }

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

    async createEntry(userId: string, gameId: string, status: ZEntry['status'] | null, prev: ZEntryRow | null) {
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

    async getZEntryCount() {
        const response = await appwrite.datababases.listRows<ZEntryRow>({
            databaseId: 'app',
            tableId: Z_ENTRIES_TABLE_ID,
            queries: [Query.select(['$id']), Query.limit(1)]
        });

        return response.total
    }
}