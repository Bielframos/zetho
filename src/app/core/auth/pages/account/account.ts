import {
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UiInput } from '../../../../shared/ui/input/input';
import { UiModal } from '../../../../shared/ui/modal/modal';
import {
  changedValidator,
  gamertagAsyncValidator,
  gamertagFormatValidator,
  nameValidator,
} from '../../../../utils/validators';
import { UserProfileService } from '../../../userProfiles/userProfile.service';
import { AuthService } from '../../auth.service';
import { AuthStore } from '../../auth.store';

import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [UiInput, ReactiveFormsModule, UiModal],
  templateUrl: './account.html',
})
export class AccountPage {
  /** Angular `Router` usado para navegação quando não autenticado */
  private readonly router: Router = inject(Router);

  /** Serviço de autenticação para ações do usuário (verificação de e-mail, etc.) */
  private readonly authService: AuthService = inject(AuthService);

  /** Serviço para validações assíncronas relacionadas ao perfil */
  private readonly userProfileService: UserProfileService =
    inject(UserProfileService);

  /** Estado centralizado de autenticação e perfil do usuário */
  authStore: AuthStore = inject(AuthStore);

  /** Estado da exibição da caixa de dialogo de verificação de identidade */
  dialogType = signal<'email' | 'profileDeletion'>('email');

  dialogState = computed(() => {
    if (this.dialogType() === 'email')
      return {
        title: 'Verificação de identidade',
        actionLabel: 'Alterar e-mail',
        destructive: false,
        action: (event: any) => this.changeEmail(event),
      };
    else
      return {
        title: 'Realmente deseja excluir sua conta?',
        actionLabel: 'Excluir minha conta',
        destructive: true,
        action: (event: any) => this.deleteProfile(event),
      };
  });

  dialogIsOpen = signal(false);

  openDialog(type: 'email' | 'profileDeletion') {
    this.dialogIsOpen.set(true);
    this.dialogType.set(type);
  }

  /** Retorna validadores para o campo `name`. Inclui verificação de mudança. */
  private getNameValidators() {
    return [
      Validators.required,
      nameValidator,
      changedValidator(this.authStore.user()?.name),
    ];
  }

  /** Retorna validadores para o campo `gamertag`. */
  private getGamertagValidators() {
    return [
      Validators.required,
      Validators.minLength(3),
      changedValidator(this.authStore.profile()?.gamertag),
      gamertagFormatValidator,
    ];
  }

  /** Referência ao input de arquivo de avatar (template `#profilePicInput`) */
  profilePicInput: any = viewChild('profilePicInput');

  /** URL temporária do avatar selecionado (DataURL ou null) */
  profilePicUrl = signal<string | ArrayBuffer | null>(
    this.authStore.avatarUrl(),
  );

  /** Estado local do arquivo da foto de perfil */
  profilePicFile = signal<File | null>(null);

  /**
   * Lida com a seleção de arquivo para imagem de perfil.
   * Converte o arquivo em DataURL e atualiza `profilePicUrl`.
   */
  onSelectProfilePic(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    this.profilePicFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.profilePicUrl.set(reader.result);
    reader.readAsDataURL(file);
  }

  /**
   * Lida com a atualização da foto do perfil
   */
  saveProfilePic() {
    const file = this.profilePicFile();
    if (file == null) return;
    this.authStore.updateProfilePic(file);

    // Limpa o estado local
    this.profilePicFile.set(null);
  }

  /** Controle do formulário do nome (não-nulo). */
  name = new FormControl<string>(this.authStore.user()?.name ?? '', {
    nonNullable: true,
    validators: this.getNameValidators(),
  });

  /** Controle do formulário da gamertag com validador assíncrono. */
  gamertag = new FormControl<string>(this.authStore.profile()?.gamertag ?? '', {
    nonNullable: true,
    validators: this.getGamertagValidators(),
    asyncValidators: [gamertagAsyncValidator(this.userProfileService)],
    updateOn: 'blur',
  });

  /** Controle do formulário da bio de um usuário */
  bio = new FormControl(this.authStore.profile()?.bio ?? '', {
    nonNullable: true,
    validators: [
      Validators.minLength(3),
      Validators.maxLength(350),
      changedValidator(this.authStore.profile()?.bio || ''),
    ],
  });

  private bioValue = toSignal(this.bio.valueChanges, {
    initialValue: '',
  });

  readonly bioCharsCount = computed(() => {
    return this.bioValue().length;
  });

  /** Controle do formulário do e-mail do usuário. */
  email = new FormControl<string>(this.authStore.user()?.email ?? '', {
    nonNullable: true,
    validators: [
      Validators.required,
      changedValidator(this.authStore.user()?.email),
    ],
  });

  /** Controle do modal de confirmação de identidade do usuário. */
  password = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  // Estado reativo da página para rastrear envio de verificação de email
  mailVerification = signal<{ sended?: boolean; error?: boolean }>({});

  /**
   * Solicita o envio de e-mail de verificação e atualiza o estado local.
   */
  async requestMailVerification() {
    try {
      await this.authService.createEmailVerification();
      this.mailVerification.set({ sended: true });
    } catch (e) {
      console.error(e);
      this.mailVerification.set({ error: true });
    }
  }

  /**
   * Atualiza o nome do usuário no `AuthStore` e refaz a validação local.
   */
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

  /**
   * Atualiza a gamertag do usuário e revalida o controle.
   */
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

  /**
   * Atualiza a bio do usuário
   */
  async updateBio() {
    try {
      await this.authStore.updateProfile({ bio: this.bio.value });
      this.bio.setValidators(this.bio.validator);
      this.bio.updateValueAndValidity();
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao atualizar a sua bio.');
    }
  }

  /**
   * Altera o e-mail de um usuário
   */
  async changeEmail(event: any) {
    try {
      await this.authStore.updateEmail(this.email.value, this.password.value);
      event.close();
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao atualizar o seu e-mail.');
    }
  }

  /**
   * Exclue a conta de um usuário
   */
  async deleteProfile(event: any) {
    try {
      await this.authStore.delete();
      event.close();
    } catch (e) {
      console.error(e);
      alert('Ocorreu um erro ao excluir sua conta.');
    }
  }

  constructor() {
    // Redireciona para a landing se o usuário não estiver autenticado
    effect(() => {
      if (!this.authStore.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });
  }
}
