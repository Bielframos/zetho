import { StoredList, StoredRow } from "../appwrite/appwrite.types"

type ZEntry = {
    gameId: string,
    liked?: boolean,
    status?: 'completed' | 'backlog' | 'dropped' | 'playing' | 'wishlist' | null,
    startedAt?: string,
    finishedAt?: string,
    replays?: number,
    prevState?: string,
    ownerFingerprint: string

}

type ZEntryRow = StoredRow<ZEntry>
type ZEntryList = StoredList<ZEntryRow>

export type { ZEntry, ZEntryList, ZEntryRow }
