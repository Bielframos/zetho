import { Component, effect, inject, signal } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { UserStore } from "../../core/auth/user.store";
import { UiInput } from "../../shared/ui/atoms/input/input";
import { AuthService } from "../../core/auth/auth.service";
import { Router } from "@angular/router";
import { UserProfileService } from "../../core/services/userProfile.service";
import { changedValidator, gamertagAsyncValidator, gamertagFormatValidator, nameValidator } from "../../utils/validators";

@Component({
    selector: 'app-account',
    standalone: true,
    imports: [UiInput, ReactiveFormsModule],
    templateUrl: './account.html'
})
export class Account {
    private router = inject(Router)
    private authService = inject(AuthService)
    private userProfileService = inject(UserProfileService)
    userStore = inject(UserStore)

    private getNameValidators() {
        return [Validators.required, nameValidator, changedValidator(this.userStore.user()?.name)]
    }
    private getGamertagValidators() {
        return [
            Validators.required,
            Validators.minLength(3),
            changedValidator(this.userStore.profile()?.gamertag),
            gamertagFormatValidator,
        ]
    }

    name = new FormControl(this.userStore.user()?.name ?? '', { nonNullable: true, validators: this.getNameValidators() })
    gamertag = new FormControl(this.userStore.profile()?.gamertag ?? '', {
        nonNullable: true,
        validators: this.getGamertagValidators(),
        asyncValidators: [gamertagAsyncValidator(this.userProfileService)],
        updateOn: 'blur'
    })
    email = new FormControl(this.userStore.user()?.email ?? '', { nonNullable: true, validators: [Validators.required, changedValidator(this.userStore.user()?.email)] })

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

    async updateName() {
        try {
            await this.userStore.updateName(this.name.value)
            this.name.setValidators(this.getNameValidators())
            this.name.updateValueAndValidity()
        } catch (e) {
            console.error(e)
            alert('Ocorreu um erro ao atualizar o seu nome.')
        }
    }

    async updateGamertag() {
        try {
            await this.userStore.updateGamertag(this.gamertag.value)
            this.gamertag.setValidators(this.getGamertagValidators())
            this.gamertag.updateValueAndValidity()
        } catch (e) {
            console.error(e)
            alert('Ocorreu um erro ao atualizar a sua gamertag.')
        }
    }

    constructor() {
        effect(() => {
            if (!this.userStore.isAuthenticated()) {
                this.router.navigate(['/']);
            }
        })
    }
}