import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UiInput } from '../../shared/ui/input/input';

@Component({
  selector: 'app-reset-pass-page',
  standalone: true,
  imports: [UiInput, FormsModule, RouterLink],
  templateUrl: './reset-pass.html',
  host: {
    class: 'h-full',
  },
})
export class ResetPass {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  isLoading = signal(false);
  reseted = signal(false);
  error = signal('');
  resetResult = signal<{
    success?: boolean;
    error?: boolean;
    message?: string;
  }>({});

  newPassword = '';
  confirmNewPassword = '';

  userId = this.route.snapshot.queryParams['userId'] as string;
  secret = this.route.snapshot.queryParams['secret'] as string;
  expire = this.route.snapshot.queryParams['expire'] as string;

  async resetPassword(form: NgForm) {
    if (form.invalid) {
      return this.resetResult.set({
        error: true,
        message: 'Preencha todos os campos.',
      });
    } else if (this.newPassword !== this.confirmNewPassword) {
      return this.resetResult.set({
        error: true,
        message: 'As senhas precisam ser iguais.',
      });
    } else if (this.newPassword.length < 8) {
      return this.resetResult.set({
        error: true,
        message: 'Informe uma senha com no mínimo 8 caracteres.',
      });
    }

    try {
      await this.authService.recoveryPass(
        this.userId,
        this.secret,
        this.newPassword,
      );
      this.reseted.set(true);
    } catch (e) {
      return this.resetResult.set({
        error: true,
        message: 'Ocorreu um erro ao resetar sua senha.',
      });
    }
  }

  constructor() {
    if (!this.userId || !this.secret) {
      this.error.set(
        'Não conseguimos localizar dados importantes para prosseguir com a redefinição sua senha, solicite um novo e-mail de recuperação.',
      );
      this.isLoading.set(false);
      return;
    }

    if (new Date(Date.now()) > new Date(this.expire)) {
      this.error.set(
        'O tempo para resetar sua senha expirou. Solicite um novo e-mail de recuperação.',
      );
      this.isLoading.set(false);
      return;
    }
  }
}
