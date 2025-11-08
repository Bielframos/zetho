import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { AuthStore } from "../../core/auth/auth.store";
import { appwrite } from "../../core/appwrite/appwrite.client";


export const adminGuard: CanMatchFn = async () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    const user = authStore.user()

    if (user) {
        const listOfTeams = await appwrite.teams.list()
        const isAdmin = listOfTeams.teams.some((team) => team.$id === 'zerei')
        if (isAdmin) return true
    }

    router.parseUrl('/')
    return false
}