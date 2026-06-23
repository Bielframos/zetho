import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiInput } from '../../../../shared/ui/input/input';
import { UiLoading } from '../../../../shared/ui/loading';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-recovery-pass-page',
  imports: [UiInput, FormsModule, RouterLink, UiLoading],
  templateUrl: './recovery.html',
  host: {
    class: 'h-full',
  },
})
export class RecoveryPage {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  result = signal<{ success?: boolean; error?: boolean; message?: string }>({});
  isLoading = signal(false);

  async createRecovery(form: NgForm) {
    if (form.invalid) {
      this.result.set({
        error: true,
        message: 'Informar o e-mail é obrigatório.',
      });
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authService.createRecoveryPass(this.email);
      this.result.set({
        success: true,
        message: 'Confira sua caixa de e-mail.',
      });
    } catch (e: any) {
      if (e.code === 404)
        this.result.set({
          error: true,
          message: 'Verifique se o e-mail informado está correto.',
        });
      else
        this.result.set({
          error: true,
          message: 'Ocorreu um erro ao solicitar a recuperação da senha.',
        });
    }
    this.isLoading.set(false);
  }
}
