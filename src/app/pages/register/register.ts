import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { UserStore } from '../../core/auth/user.store';
import { UserProfileService } from '../../core/zerei/userProfile.service';
import { UiInput } from '../../shared/ui/atoms/input/input';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [UiInput, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private router = inject(Router);
  private userStore = inject(UserStore);
  private profile = inject(UserProfileService)

  isSubmitting = signal(false)

  private nameValidator(control: AbstractControl) {
    const value = control.value as string;
    if (!value) return null;
    const regex = /^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/;
    return regex.test(value) ? null : { invalidName: true };
  }

  private gamertagFormatValidator(control: AbstractControl) {
    const value = control.value as string;
    if (!value) return null;
    const regex = /^[a-zA-Z0-9_]+$/;
    return regex.test(value) ? null : { invalidGamertagFormat: true };
  }

  private gamertagAsyncValidator = (control: AbstractControl) => {
    return of(control.value).pipe(
      distinctUntilChanged(),
      switchMap(value => value ? this.profile.isValidGamertag(control.value) : of(false)),
      map(isValid => (isValid ? null : { gamertagTaken: true })),
      catchError(() => of({ gamertagCheckFailed: true }))
    )
  }

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
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, this.nameValidator] }),
    gamertag: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        this.gamertagFormatValidator
      ],
      asyncValidators: [this.gamertagAsyncValidator.bind(this)],
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
