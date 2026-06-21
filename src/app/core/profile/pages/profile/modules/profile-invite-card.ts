import { Component, inject, signal } from '@angular/core';
import { AuthStore } from '../../../../auth/auth.store';
import { NotificationStore } from '../../../../notifications/notification.store';
import { UiLoading } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-profile-invite-card',
  standalone: true,
  imports: [UiLoading],
  template: `
    <section class="rounded-2xl bg-gray-2 p-4 mb-4">
      @if (authStore.profile()?.inviteCode; as code) {
        <div
          class="flex items-center gap-2 border border-gray-6 rounded-xl px-3 py-2"
        >
          <span class="font-mono text-gray-12 flex-1 text-sm tracking-wide">{{
            code
          }}</span>
          <button
            (click)="copyInviteCode(code)"
            class="h-9 w-9 rounded-lg bg-gray-4 hover:bg-gray-5 transition-colors flex items-center justify-center text-gray-12 shrink-0"
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
          class="w-full rounded-xl bg-gray-4 hover:bg-gray-5 transition-colors text-gray-12 text-sm py-2.5 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
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
