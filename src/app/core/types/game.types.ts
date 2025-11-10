import { StoredList, StoredRow } from "../appwrite/appwrite.types"

type Game = {
    name: string,
    slug: string,
    coverUrl: string,
    releaseYear: string,
    summary: string,
    externalReference: string,
    gameType: string | any
}

type GameRow = StoredRow<Game>
type GameList = StoredList<GameRow>

export type { Game, GameRow, GameList }