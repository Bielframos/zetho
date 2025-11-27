import { StoredList, StoredRow } from "../appwrite/appwrite.types"
import { UserProfileRow } from "./userProfile.types"

type Comment = {
    gameId: string,
    userProfile: UserProfileRow | string,
    content: string,
    parentId?: string,
    upvotes?: number,
    downvotes?: number
}

type CommentRow = StoredRow<Comment>
type CommentList = StoredList<CommentRow>

export type { Comment, CommentList, CommentRow }

