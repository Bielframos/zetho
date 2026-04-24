import { StoredList, StoredRow } from "../appwrite/appwrite.types"
import { GameRow } from "../games/game.types"

type ZStats = {
    game: GameRow | string,
    completedCount: number,
    backlogCount: number,
    droppedCount: number,
    playingCount: number,
    wishlistCount: number,
    likes: number,
    hypes?: number
}

type ZStatsRow = StoredRow<ZStats>
type ZStatsList = StoredList<ZStatsRow>

export type { ZStats, ZStatsRow, ZStatsList }