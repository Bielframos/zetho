import { StoredList, StoredRow } from "../appwrite/appwrite.types"
import { GameRow } from "./game.types"

type ZEntry = {
    userId: string,
    game: GameRow,
    status: 'completed' | 'backlog' | 'dropped' | 'playing',
    startedAt?: string,
    finishedAt?: string,
    replays?: number,
    review?: string

}

type ZEntryRow = StoredRow<ZEntry>
type ZEntryList = StoredList<ZEntryRow>

export type { ZEntry, ZEntryRow, ZEntryList }