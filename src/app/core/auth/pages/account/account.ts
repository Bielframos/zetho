import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UiInput } from '../../../../shared/ui/input/input';
import { AuthService } from '../../auth.service';
import { UserProfileService } from '../../../userProfiles/userProfile.service';
import { AuthStore } from '../../auth.store';
import {
  changedValidator,
  gamertagAsyncValidator,
  gamertagFormatValidator,
  nameValidator,
} from '../../../../utils/validators';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [UiInput, ReactiveFormsModule],
  templateUrl: './account.html',
})
export class AccountPage {
  private router = inject(Router);
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  authStore = inject(AuthStore);

  private getNameValidators() {
    return [
      Validators.required,
      nameValidator,
      changedValidator(this.authStore.user()?.name),
    ];
  }
  private getGamertagValidators() {
    return [
      Validators.required,
      Validators.minLength(3),
      changedValidator(this.authStore.profile()?.gamertag),
      gamertagFormatValidator,
    ];
  }

  name = new FormControl(this.authStore.user()?.name ?? '', {
    nonNullable: true,
    validators: this.getNameValidators(),
  });
  gamertag = new FormControl(this.authStore.profile()?.gamertag ?? '', {
    nonNullable: true,
    validators: this.getGamertagValidators(),
    asyncValidators: [gamertagAsyncValidator(this.userProfileService)],
    updateOn: 'blur',
  });
  email = new FormControl(this.authStore.user()?.email ?? '', {
    nonNullable: true,
    validators: [
      Validators.required,
      changedValidator(this.authStore.user()?.email),
    ],
  });

  // Estado reativo da página
  mailVerification = signal<{ sended?: boolean; error?: boolean }>({});

  async requestMailVerification() {
    try {
      await this.authService.createEmailVerification();
      this.mailVerification.set({ sended: true });
    } catch (e) {
      console.error(e);
      this.mailVerification.set({ error: true });
    }
  }

  async updateName() {
    try {
      await this.authStore.updateName(this.name.value);
      this.name.setValidators(this.getNameValidators());
      this.name.updateValueAndValidity();
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao atualizar o seu nome.');
    }
  }

  async updateGamertag() {
    try {
      await this.authStore.updateGamertag(this.gamertag.value);
      this.gamertag.setValidators(this.getGamertagValidators());
      this.gamertag.updateValueAndValidity();
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao atualizar a sua gamertag.');
    }
  }

  constructor() {
    effect(() => {
      if (!this.authStore.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });
  }
}
