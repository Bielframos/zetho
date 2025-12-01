import { computed, inject, Injectable, signal } from "@angular/core";
import { UserProfileRow } from "../types";
import { appwrite } from "../appwrite/appwrite.client";
import { UserStore } from "../auth/user.store";
import { UserProfileService } from "../services/userProfile.service";

@Injectable({ providedIn: 'root' })
export class ProfileStore {
    private userStore = inject(UserStore)
    private profileService = inject(UserProfileService)

    private _loading = signal(false)
    private _current = signal<UserProfileRow | null>(null)

    readonly isLoading = computed(() => this._loading())
    readonly current = computed(() => this._current())
    readonly avatarUrl = computed(() => appwrite.avatars.getInitials({ name: this.current()?.gamertag, width: 64, height: 64, background: '3e63dd' }))

    async update(gamertag: string) {
        const myProfile = this.userStore.profile()

        if (myProfile!.gamertag === gamertag) {
            this._current.set(myProfile)
            return
        }

        try {
            this._loading.set(true)
            const profile = await this.profileService.getProfile().byGamertag(gamertag)
            this._current.set(profile)
        } catch (e) {
            console.error(e)
            alert('Erro ao carregar o perfil')
        } finally {
            this._loading.set(false)
        }
    }

    set = this._current.set
}