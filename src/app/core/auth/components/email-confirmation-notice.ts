import {
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../auth.store';
import { EmailConfirmation } from '../email-confirmation';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-email-confirmation-notice',
  standalone: true,
  imports: [RouterLink],
  host: {
    '[style.display]': "visible() ? 'block' : 'none'",
    '(window:focus)': 'check()',
    '(document:visibilitychange)': 'onVisibilityChange()',
  },
  template: `
    @if (auth.user(); as user) {
      @if (!user.emailVerification) {
        <section
          class="border-b border-gray-6 bg-blue-2 px-4 py-4"
          aria-label="Confirmação do e-mail"
        >
          <header class="flex items-start justify-between gap-3">
            <h2 class="min-w-0 text-sm font-medium">Confirmação do e-mail</h2>
          </header>
          <p class="mt-2 break-words text-sm leading-6 text-gray-11">
            @if (delivery()?.status === 'sent') {
              Enviamos um link para <strong>{{ user.email }}</strong
              >. Confira também a caixa de spam.
            } @else {
              Confirme <strong>{{ user.email }}</strong> para concluir a
              verificação da sua conta.
            }
            Se sua conta fizer parte da edição&nbsp;<span
              class="inline-flex items-center gap-1 align-middle whitespace-nowrap"
            >
              @if (!imageFailed()) {
                <img
                  [src]="founderImageUrl"
                  alt=""
                  width="20"
                  height="20"
                  class="h-5 w-5 object-contain"
                  (error)="imageFailed.set(true)"
                />
              } @else {
                <i class="ph-fill ph-seal-check" aria-hidden="true"></i>
              }
              Fundador</span
            >, a confirmação libera sua insígnia e seu número.
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            @if (!user.emailVerification) {
              <button
                type="button"
                class="ui-secondary-btn"
                [disabled]="delivery()?.coolingDown"
                (click)="confirmation.send(user)"
              >
                {{
                  delivery()?.status === 'sending'
                    ? 'Enviando…'
                    : delivery()?.coolingDown
                      ? 'Aguarde 1 minuto para reenviar'
                      : 'Reenviar e-mail'
                }}
              </button>
            }
            <a
              routerLink="/minha-conta"
              fragment="account-email"
              class="ui-ghost-btn"
              >Alterar e-mail</a
            >
          </div>
          @if (!user.emailVerification && delivery()?.status === 'error') {
            <p role="alert" class="mt-3 text-sm text-danger">
              Não foi possível enviar o e-mail. Seu cadastro está salvo. Aguarde
              um minuto e tente novamente.
            </p>
          } @else if (
            !user.emailVerification && delivery()?.status === 'sent'
          ) {
            <p role="status" class="mt-3 text-xs text-success">
              Link de confirmação enviado.
            </p>
          }
        </section>
      } @else if (confirmedUser() === user.$id) {
        <section
          class="border-b border-gray-6 px-4 py-4"
          aria-label="E-mail confirmado"
        >
          <header class="flex items-start justify-between gap-3">
            <p role="status" class="text-sm text-success">E-mail confirmado!</p>
            <span
              class="inline-flex shrink-0 items-center gap-1 rounded-full border border-success-line bg-success-bg px-2 py-0.5 text-xs text-success"
            >
              <i class="ph ph-check-circle" aria-hidden="true"></i> Confirmado
            </span>
          </header>
          <a routerLink="/fundador" class="ui-secondary-btn mt-3"
            >Ver meu reconhecimento</a
          >
        </section>
      }
    }
  `,
})
export class EmailConfirmationNotice {
  readonly founderImageUrl = new URL(
    'achievements/founder-badge/image',
    environment.zethoApiEndpoint,
  ).toString();
  readonly imageFailed = signal(false);
  readonly auth = inject(AuthStore);
  readonly confirmation = inject(EmailConfirmation);
  readonly delivery = computed(() =>
    this.confirmation.forAccount(this.auth.user()),
  );
  readonly confirmedUser = signal<string | null>(null);
  readonly visible = computed(() => {
    const user = this.auth.user();
    return (
      !!user && (!user.emailVerification || this.confirmedUser() === user.$id)
    );
  });
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
