import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiInput } from '../../../../shared/ui/input/input';
import { AuthStore } from '../../auth.store';
import { UserProfileService } from '../../../userProfiles/userProfile.service';
import {
  gamertagAsyncValidator,
  gamertagFormatValidator,
  nameValidator,
} from '../../../../utils/validators';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [UiInput, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  host: {
    class: 'h-full',
  },
})
export class RegisterPage {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private profileService = inject(UserProfileService);

  isSubmitting = signal(false);

  private passwordMatch: ValidatorFn = (group) => {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (pass && confirm && pass !== confirm) {
      group.get('confirmPassword')?.setErrors({ passwordsMismatch: true });
      return { passwordsMismatch: true };
    }
    return null;
  };

  form = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, nameValidator],
      }),
      gamertag: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          gamertagFormatValidator,
        ],
        asyncValidators: [gamertagAsyncValidator(this.profileService)],
        updateOn: 'blur',
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        validators: [Validators.required],
      }),
      inviteCode: new FormControl('', {
        nonNullable: true,
      }),
    },
    { validators: [this.passwordMatch] },
  );

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { email, password, name, gamertag, inviteCode } =
        this.form.getRawValue();
      await this.authStore.register(
        email,
        password,
        name,
        gamertag,
        inviteCode || undefined,
      );
      await this.router.navigate(['/']);
    } catch (e) {
      this.form.setErrors({ submitFailed: true });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  get gamertag() {
    return this.form.controls.gamertag;
  }
}
