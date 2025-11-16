import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
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
  private auth = inject(AuthService);
  private userStore = inject(UserStore);
  private profile = inject(UserProfileService)

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

  private gamertagAsyncValidator = (control: AbstractControl) => {
    return of(control.value).pipe(
      distinctUntilChanged(),
      switchMap(value => value ? this.profile.isValidGamertag(control.value) : of(false)),
      map(isValid => (isValid ? null : { gamertagTaken: true })),
      catchError(() => of({ gamertagCheckFailed: true }))
    )
  }

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    gamertag: new FormControl('',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
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
      const user = await this.auth.register(email, password, name)
      await this.profile.createProfile(user.$id, gamertag)
      await this.userStore.refresh()
      await this.router.navigate(['/'])
    } catch (e) {
      this.form.setErrors({ submitFailed: true })
    } finally {
      this.isSubmitting.set(false)
    }
  }

  get gamertag() { return this.form.controls.gamertag }
}
