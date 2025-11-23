import { Component, inject, signal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { UserStore } from "../../core/auth/user.store";
import { UiInput } from "../../shared/ui/atoms/input/input";
import { AuthService } from "../../core/auth/auth.service";

@Component({
    selector: 'app-profile-page',
    imports: [UiInput, ReactiveFormsModule],
    templateUrl: './profile.html'
})
export class Profile {
    private authService = inject(AuthService)
    userStore = inject(UserStore)
    user = this.userStore.user()
    profile = this.userStore.profile()

    name = new FormControl(this.user?.name ?? '', { nonNullable: true })
    gamertag = new FormControl(this.profile?.gamertag ?? '', { nonNullable: true })
    email = new FormControl(this.user?.email ?? '', { nonNullable: true })
    newPassword = new FormControl('', { nonNullable: true })

    // Estado reativo da página
    mailVerification = signal<{ sended?: boolean, error?: boolean }>({})

    async requestMailVerification() {
        try {
            await this.authService.createEmailVerification()
            this.mailVerification.set({ sended: true })
        } catch (e) {
            console.error(e)
            this.mailVerification.set({ error: true })
        }
    }

    constructor() {
        console.log(this.user)
    }
}