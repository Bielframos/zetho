import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UiLoading } from '../../../../shared/ui/loading';
import { AuthService } from '../../auth.service';
import { AuthStore } from '../../auth.store';

@Component({
  selector: 'app-verification-page',
  standalone: true,
  imports: [UiLoading, RouterLink],
  templateUrl: './verification.html',
  host: {
    class: 'h-full',
  },
})
export class VerificationPage {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);

  loading = signal(true);
  verified = signal(false);
  error = signal('');

  userId = this.route.snapshot.queryParams['userId'] as string;
  secret = this.route.snapshot.queryParams['secret'] as string;
  expire = this.route.snapshot.queryParams['expire'] as string;

  constructor() {
    if (!this.userId || !this.secret) {
      this.error.set(
        'Não conseguimos localizar dados importantes para validar sua verificação, retorne para a página do seu perfil e tente verificar novamente.',
      );
      this.loading.set(false);
      return;
    }

    if (new Date(Date.now()) > new Date(this.expire)) {
      this.error.set(
        'O tempo para efetuar sua verificação expirou. Retorne para a página do seu perfil e solicite um novo e-mail de verificação.',
      );
      this.loading.set(false);
      return;
    }

    this.authService
      .verifyEmail(this.userId, this.secret)
      .then(() => {
        this.verified.set(true);
        this.authStore.refresh();
        this.loading.set(false);
      })
      .catch((e) => {
        console.error(e);
        this.loading.set(false);
        this.error.set(
          'Erro desconhecido, retorne para a página do seu perfil e tente a verificação novamente.',
        );
      });
  }
}
