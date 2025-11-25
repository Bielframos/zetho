import { Injectable } from "@angular/core";
import { appwrite, Query } from "../appwrite/appwrite.client";
import { UserProfile, UserProfileRow } from "../types";

const TABLE_ID = 'user_profiles'

@Injectable({ providedIn: 'root' })
export class UserProfileService {
    /**
     * Obtem o perfil de um usuário
     * @param userId 
     * @returns 
     */
    async getProfile(userId: string) {
        const response = await appwrite.databases.listRows<UserProfileRow>({
            databaseId: 'app',
            tableId: TABLE_ID,
            queries: [Query.equal('userId', userId), Query.limit(1)],
        })

        if (response.total === 0) return null
        return response.rows[0]
    }

    /**
     * Registra um novo perfil
     * @param userId 
     * @param gamertag 
     */
    async createProfile(userId: string, gamertag: string) {
        try {
            await appwrite.databases.createRow({
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
            const response = await appwrite.databases.listRows({
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

    async updateProfile(profileId: string, newProfile: Partial<UserProfile>) {
        return await appwrite.databases.updateRow<UserProfileRow>({
            databaseId: 'app',
            tableId: TABLE_ID,
            rowId: profileId,
            data: newProfile
        })
    }

    /**
     * Obtém o total de perfis no Zerei
     * @returns 
     */
    async getProfileCount() {
        const response = await appwrite.databases.listRows({
            databaseId: 'app',
            tableId: TABLE_ID,
            queries: [Query.select(['$id']), Query.limit(1)]
        })

        return response.total
    }
}