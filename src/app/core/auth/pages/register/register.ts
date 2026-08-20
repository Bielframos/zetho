import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiInput } from '../../../../shared/ui/input/input';
import { UiLoading } from '../../../../shared/ui/loading';
import { AuthStore } from '../../auth.store';
import { UserProfileService } from '../../../userProfiles/userProfile.service';
import { appwrite } from '../../../../shared/infra/appwrite/appwrite.client';
import { environment } from '../../../../../environments/environment';

interface InviterPreview {
  gamertag: string;
  avatarUrl: string | null;
  totalsCompleted: number;
}
import {
  gamertagAsyncValidator,
  gamertagFormatValidator,
  nameValidator,
} from '../../../../utils/validators';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [UiInput, ReactiveFormsModule, RouterLink, UiLoading],
  templateUrl: './register.html',
  host: {
    class: 'flex min-h-full w-full',
  },
})
export class RegisterPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authStore = inject(AuthStore);
  private profileService = inject(UserProfileService);

  isSubmitting = signal(false);
  inviter = signal<InviterPreview | null>(null);

  constructor() {
    const code = this.route.snapshot.queryParamMap.get('invite');
    if (code) {
      this.form.controls.inviteCode.setValue(code);
      void this.loadInviter(code);
    }
  }

  private async loadInviter(code: string) {
    try {
      const url = new URL(
        `profile/invite/${encodeURIComponent(code)}`,
        environment.zethoApiEndpoint,
      );
      const response = await fetch(url.toString());
      if (!response.ok) return;
      const data = (await response.json()) as InviterPreview | null;
      if (data?.gamertag) this.inviter.set(data);
    } catch {
      // silencioso — o convite ainda funciona sem o preview
    }
  }

  inviterAvatar(person: InviterPreview) {
    if (person.avatarUrl) return person.avatarUrl;
    return appwrite.avatars.getInitials({
      name: person.gamertag,
      width: 96,
      height: 96,
      background: '3e63dd',
    });
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
      await this.router.navigate(['/comecar']);
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
