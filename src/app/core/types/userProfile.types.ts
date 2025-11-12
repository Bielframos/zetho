import { StoredList, StoredRow } from "../appwrite/appwrite.types"

type UserProfile = {
    userId: string,
    gamertag: string,
    avatarUrl?: string,
    bio?: string,
    totalsCompleted: number,
    totalsBacklog: number,
    totalsDropped: number,
    totalsPlaying: number
}

type UserProfileRow = StoredRow<UserProfile>
type UserProfileList = StoredList<UserProfileRow>

export type { UserProfile, UserProfileRow, UserProfileList }