import { StoredList, StoredRow } from "../appwrite/appwrite.types"

type Game = {
    name: string,
    slug: string,
    coverUrl: string,
    releaseYear: string,
    releaseDate: string,
    summary: string,
    externalReference: number,
    gameType: string | any,
    genres: string | any,
    involvedCompanies: string | any,
    syncedAt: string
}

type GameRow = StoredRow<Game>
type GameList = StoredList<GameRow>

export type { Game, GameRow, GameList }