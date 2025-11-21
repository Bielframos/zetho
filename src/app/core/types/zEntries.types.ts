import { StoredList, StoredRow } from "../appwrite/appwrite.types"

type ZEntry = {
    userId: string,
    gameId: string,
    liked?: boolean,
    status?: 'completed' | 'backlog' | 'dropped' | 'playing' | 'wishlist' | null,
    startedAt?: string,
    finishedAt?: string,
    replays?: number,
    prevState?: string,

}

type ZEntryRow = StoredRow<ZEntry>
type ZEntryList = StoredList<ZEntryRow>

export type { ZEntry, ZEntryList, ZEntryRow }
