import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../core/auth/user.store';
import { UserProfileService } from '../../core/services/userProfile.service';
import { UiInput } from '../../shared/ui/atoms/input/input';
import { gamertagAsyncValidator, gamertagFormatValidator, nameValidator } from '../../core/modules/validators';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [UiInput, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  host: {
    class: 'h-full'
  }
})
export class Register {
  private router = inject(Router);
  private userStore = inject(UserStore);
  private profileService = inject(UserProfileService)

  isSubmitting = signal(false)

  private passwordMatch: ValidatorFn = (group) => {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (pass && confirm && pass !== confirm) {
      group.get('confirmPassword')?.setErrors({ passwordsMismatch: true });
      return { passwordsMismatch: true };
    }
    return null;
  };

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, nameValidator] }),
    gamertag: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        gamertagFormatValidator
      ],
      asyncValidators: [gamertagAsyncValidator(this.profileService)],
      updateOn: 'blur'
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    confirmPassword: new FormControl('', { validators: [Validators.required] })
  }, { validators: [this.passwordMatch] })

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return
    }

    this.isSubmitting.set(true)

    try {
      const { email, password, name, gamertag } = this.form.getRawValue()
      await this.userStore.register(email, password, name, gamertag)
      await this.router.navigate(['/'])
    } catch (e) {
      this.form.setErrors({ submitFailed: true })
    } finally {
      this.isSubmitting.set(false)
    }
  }

  get gamertag() { return this.form.controls.gamertag }
}
