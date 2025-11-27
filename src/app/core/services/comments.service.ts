import { Injectable } from "@angular/core";
import { GameStore } from "../stores/game.store";
import { UserStore } from "../auth/user.store";
import { appwrite } from "../appwrite/appwrite.client";
import { CommentRow } from "../types";

const TABLE_ID = 'game_comments'

@Injectable({ providedIn: 'root' })
export class CommentService {
    constructor(private gameStore: GameStore, private userStore: UserStore) { }
    async createComment(content: string) {
        const profile = this.userStore.profile()
        const game = this.gameStore.currentGame()

        if (!profile || !game) return

        await appwrite.databases.createRow<CommentRow>({
            databaseId: 'app',
            tableId: TABLE_ID,
            rowId: 'unique()',
            data: {
                gameId: game.$id,
                userProfile: profile.$id,
                content
            }
        })
    }
}