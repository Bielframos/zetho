import { Injectable } from "@angular/core";
import { appwrite } from "../appwrite/appwrite.client";
import { Query } from "appwrite";

const TABLE_ID = 'user_profiles'

@Injectable({ providedIn: 'root' })
export class UserProfileService {
    /**
     * Registra um novo perfil
     * @param userId 
     * @param gamertag 
     */
    async createProfile(userId: string, gamertag: string) {
        try {
            await appwrite.datababases.createRow({
                databaseId: 'app',
                tableId: TABLE_ID,
                rowId: 'unique()',
                data: { userId, gamertag }
            })
        } catch (error) {
            console.error('Erro ao registrar perfil:', error)
            throw error
        }
    }

    async isValidGamertag(gamertagToCheck: string) {
        try {
            const response = await appwrite.datababases.listRows({
                databaseId: 'app',
                tableId: TABLE_ID,
                queries: [Query.equal('gamertag', gamertagToCheck)]
            })

            if (response.total === 0) return true
            else return false
        } catch (error) {
            throw error
        }
    }
}