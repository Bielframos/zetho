import { Component, inject, signal } from '@angular/core';
import { AuthStore } from '../../../../auth/auth.store';
import { NotificationStore } from '../../../../notifications/notification.store';
import { UiLoading } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-profile-invite-card',
  standalone: true,
  imports: [UiLoading],
  template: `
    <section class="p-4">
      @if (authStore.profile()?.inviteCode; as code) {
        <div
          class="flex items-center gap-2 border border-gray-6 rounded-lg px-3 py-2"
        >
          <span class="font-mono text-gray-12 flex-1 text-sm tracking-wide">{{
            code
          }}</span>
          <button
            (click)="copyInviteCode(code)"
            class="ui-ghost-btn shrink-0"
            data-size="icon"
            [attr.title]="inviteCopied() ? 'Copiado!' : 'Copiar código'"
          >
            <i
              [class]="
                'ph text-[16px] ' +
                (inviteCopied() ? 'ph-check text-green-500' : 'ph-copy')
              "
            ></i>
          </button>
        </div>
        <p class="text-xs text-gray-10 mt-2">
          Ganhe Z-Coins sempre que seus amigos se registrarem usando seu código.
        </p>
      } @else {
        <p class="text-sm text-gray-11 mt-4 mb-3">
          Você ainda não tem um código de convite.
        </p>
        <button
          (click)="generateCode()"
          [disabled]="generatingCode()"
          class="ui-secondary-btn w-full disabled:opacity-50"
        >
          @if (generatingCode()) {
            <ui-loading [inline]="true" size="sm"></ui-loading>
            Gerando código...
          } @else {
            <i class="ph ph-magic-wand text-[16px]"></i>
            Gerar código de convite
          }
        </button>
      }
    </section>
  `,
})
export class AppProfileInviteCard {
  authStore = inject(AuthStore);
  private notification = inject(NotificationStore);

  generatingCode = signal(false);
  inviteCopied = signal(false);

  async copyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.inviteCopied.set(true);
      setTimeout(() => this.inviteCopied.set(false), 2000);
    } catch {
      this.notification.show({
        message: 'Não foi possível copiar o código.',
        type: 'error',
      });
    }
  }

  async generateCode() {
    this.generatingCode.set(true);
    try {
      await this.authStore.generateInviteCode();
    } catch {
      this.notification.show({
        message: 'Erro ao gerar código de convite.',
        type: 'error',
      });
    } finally {
      this.generatingCode.set(false);
    }
  }
}
