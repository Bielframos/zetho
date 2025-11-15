import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { UserStore } from "../../core/auth/user.store";
import { appwrite } from "../../core/appwrite/appwrite.client";


export const adminGuard: CanMatchFn = async () => {
    const userStore = inject(UserStore);
    const router = inject(Router);

    const user = userStore.user()

    if (user) {
        const listOfTeams = await appwrite.teams.list()
        const isAdmin = listOfTeams.teams.some((team) => team.$id === 'zerei')
        if (isAdmin) return true
    }

    router.parseUrl('/')
    return false
}