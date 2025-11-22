import { Injectable } from "@angular/core";
import { appwrite, Query } from "../appwrite/appwrite.client";

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

    /**
     * Verifica a disponibilidade de uma gamertag
     * @param gamertagToCheck 
     * @returns 
     */
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

    async getProfileCount() {
        const response = await appwrite.datababases.listRows({
            databaseId: 'app',
            tableId: TABLE_ID,
            queries: [Query.select(['$id']), Query.limit(1)]
        })

        return response.total
    }
}