import { Component, effect, inject, signal, viewChild } from '@angular/core';
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
  /** Angular `Router` usado para navegação quando não autenticado */
  private readonly router: Router = inject(Router);

  /** Serviço de autenticação para ações do usuário (verificação de e-mail, etc.) */
  private readonly authService: AuthService = inject(AuthService);

  /** Serviço para validações assíncronas relacionadas ao perfil */
  private readonly userProfileService: UserProfileService =
    inject(UserProfileService);

  /** Estado centralizado de autenticação e perfil do usuário */
  authStore: AuthStore = inject(AuthStore);

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

  /** Controle do formulário do e-mail do usuário. */
  email = new FormControl<string>(this.authStore.user()?.email ?? '', {
    nonNullable: true,
    validators: [
      Validators.required,
      changedValidator(this.authStore.user()?.email),
    ],
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

  constructor() {
    // Redireciona para a landing se o usuário não estiver autenticado
    effect(() => {
      if (!this.authStore.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });
  }
}
