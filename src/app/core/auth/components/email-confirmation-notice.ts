import {
  Component,
  afterNextRender,
  computed,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthStore } from '../auth.store';
import { EmailConfirmation } from '../email-confirmation';

@Component({
  selector: 'app-email-confirmation-notice',
  standalone: true,
  imports: [RouterLink],
  host: {
    '(window:focus)': 'check()',
    '(document:visibilitychange)': 'onVisibilityChange()',
  },
  template: `
    @if (auth.user(); as user) {
      @if (!user.emailVerification || preview()) {
        <section
          class="border-b border-gray-6 bg-blue-2 px-4 py-4"
          aria-label="Confirmação do e-mail"
        >
          <h2 class="text-sm font-medium">Confirme seu e-mail</h2>
          @if (preview()) {
            <p class="mt-1 text-xs text-gray-11">Prévia local do aviso</p>
          }
          <p class="mt-2 break-words text-sm leading-6 text-gray-11">
            @if (delivery()?.status === 'sent') {
              Enviamos um link para <strong>{{ user.email }}</strong
              >. Confira também a caixa de spam.
            } @else {
              Confirme <strong>{{ user.email }}</strong> para concluir a
              verificação da sua conta.
            }
            Se sua conta fizer parte da edição Fundador, a confirmação libera
            sua insígnia e seu número.
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="ui-secondary-btn"
              [disabled]="user.emailVerification || delivery()?.coolingDown"
              (click)="confirmation.send(user)"
            >
              {{
                user.emailVerification
                  ? 'E-mail já confirmado'
                  : delivery()?.status === 'sending'
                    ? 'Enviando…'
                    : delivery()?.coolingDown
                      ? 'Aguarde 1 minuto para reenviar'
                      : 'Reenviar e-mail'
              }}
            </button>
            <a
              routerLink="/minha-conta"
              fragment="account-email"
              class="ui-ghost-btn"
              >Alterar e-mail</a
            >
          </div>
          @if (delivery()?.status === 'error') {
            <p role="alert" class="mt-3 text-sm text-danger">
              Não foi possível enviar o e-mail. Seu cadastro está salvo. Aguarde
              um minuto e tente novamente.
            </p>
          } @else if (delivery()?.status === 'sent') {
            <p role="status" class="mt-3 text-xs text-success">
              Link de confirmação enviado.
            </p>
          }
        </section>
      } @else if (confirmedUser() === user.$id) {
        <section
          class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-6 px-4 py-4"
          aria-label="E-mail confirmado"
        >
          <p role="status" class="text-sm text-success">E-mail confirmado!</p>
          <a routerLink="/fundador" class="ui-secondary-btn"
            >Ver meu reconhecimento</a
          >
        </section>
      }
    }
  `,
})
export class EmailConfirmationNotice {
  private readonly query = toSignal(inject(ActivatedRoute).queryParamMap);
  readonly preview = computed(
    () => isDevMode() && this.query()?.get('previewEmailConfirmation') === '1',
  );
  readonly auth = inject(AuthStore);
  readonly confirmation = inject(EmailConfirmation);
  readonly delivery = computed(() =>
    this.confirmation.forAccount(this.auth.user()),
  );
  readonly confirmedUser = signal<string | null>(null);
  private checking = false;

  constructor() {
    // Do not fetch account state during SSR or block hydration.
    afterNextRender(() => void this.check());
  }

  onVisibilityChange() {
    if (document.visibilityState === 'visible') void this.check();
  }

  async check() {
    const user = this.auth.user();
    if (!user || user.emailVerification || this.checking) return;
    this.checking = true;
    try {
      if (await this.auth.refreshEmailVerification())
        this.confirmedUser.set(user.$id);
    } finally {
      this.checking = false;
    }
  }
}
