import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { GameplaySessionsService } from '../../gameplay-sessions.service';
import { GameplaySession } from '../../gameplay-sessions.types';

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="group p-4 transition-colors hover:bg-gray-2/60">
      <div class="flex gap-4">
        <button
          type="button"
          (click)="clickDetail.emit(session())"
          class="background-pattern relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded border border-gray-6 focus:ring-2 focus:ring-focus-ring"
          [attr.aria-label]="'Ver detalhes de ' + session().title"
        >
          @if (session().gameCoverUrl) {
            <img
              [src]="session().gameCoverUrl"
              [alt]="session().gameName"
              class="h-full w-full object-cover"
            />
          } @else {
            <span class="flex h-full items-center justify-center text-gray-10">
              <i class="ph ph-game-controller text-2xl"></i>
            </span>
          }
        </button>

        <div class="min-w-0 flex-1">
          <header class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="flex items-center gap-2 text-xs text-gray-10">
                <span class="text-blue-11">{{ session().gameName }}</span>
                <span aria-hidden="true">•</span>
                <span>
                  <i
                    class="ph"
                    [class.ph-lock-key]="session().privacy === 'closed'"
                    [class.ph-globe]="session().privacy === 'public'"
                  ></i>
                  {{ session().privacy === 'closed' ? 'Privada' : 'Pública' }}
                </span>
              </p>
              <button
                type="button"
                (click)="clickDetail.emit(session())"
                class="mt-1 line-clamp-2 text-left text-lg font-medium text-gray-12 hover:text-blue-11 hover:underline"
              >
                {{ session().title }}
              </button>
            </div>
            @if (isHost()) {
              <span
                class="shrink-0 rounded-full bg-blue-3 px-2 py-0.5 text-xs text-blue-11"
                >Sua Jogatina</span
              >
            } @else if (statusLabel()) {
              <span
                class="shrink-0 rounded-full bg-gray-3 px-2 py-0.5 text-xs text-gray-11"
                >{{ statusLabel() }}</span
              >
            }
          </header>

          @if (session().host; as host) {
            <div class="mt-2 flex items-center gap-2">
              @if (host.avatarUrl) {
                <img
                  [src]="host.avatarUrl"
                  [alt]="'Avatar de ' + host.gamertag"
                  class="h-6 w-6 rounded-full object-cover"
                />
              } @else {
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-9 text-xs text-white"
                  >{{ host.gamertag.charAt(0).toUpperCase() }}</span
                >
              }
              <span class="text-xs text-gray-11"
                >por
                <strong class="text-gray-12">@{{ host.gamertag }}</strong></span
              >
            </div>
          }

          @if (session().description) {
            <p class="mt-3 line-clamp-2 text-sm text-gray-11">
              {{ session().description }}
            </p>
          }
          <div class="mt-3 flex flex-wrap gap-4 text-xs text-gray-11">
            <span
              ><i class="ph ph-calendar-blank text-blue-11"></i>
              {{ formattedDate() }}</span
            >
            <span
              ><i class="ph ph-clock text-blue-11"></i>
              {{ formattedTime() }}</span
            >
            <span
              ><i class="ph ph-users-three text-blue-11"></i>
              {{ session().confirmedCount }}/{{ session().maxPlayers }}</span
            >
          </div>
        </div>
      </div>

      <footer
        class="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-6 pt-3"
      >
        <button
          type="button"
          (click)="clickDetail.emit(session())"
          class="ui-ghost-btn"
          data-size="sm"
        >
          Ver detalhes
        </button>
        @if (!isHost()) {
          @switch (session().myParticipantStatus) {
            @case ('pending') {
              <span class="self-center text-xs text-gray-11"
                >Solicitação pendente</span
              >
            }
            @case ('invited') {
              <button
                type="button"
                class="ui-secondary-btn"
                data-size="sm"
                [disabled]="loading('invitation:decline')"
                (click)="respond.emit('decline')"
              >
                @if (loading('invitation:decline')) {
                  <i class="ph ph-spinner animate-spin" aria-hidden="true"></i>
                }
                Recusar
              </button>
              <button
                type="button"
                class="ui-primary-btn"
                data-size="sm"
                [disabled]="loading('invitation:accept') || isFull()"
                (click)="respond.emit('accept')"
              >
                @if (loading('invitation:accept')) {
                  <i class="ph ph-spinner animate-spin" aria-hidden="true"></i>
                }
                Aceitar
              </button>
            }
            @case ('confirmed') {
              <button
                type="button"
                class="ui-secondary-btn"
                data-size="sm"
                [disabled]="loading('leave')"
                (click)="leave.emit()"
              >
                @if (loading('leave')) {
                  <i class="ph ph-spinner animate-spin" aria-hidden="true"></i>
                }
                Sair
              </button>
            }
            @case ('rejected') {
              <span class="self-center text-xs text-gray-11"
                >Solicitação recusada</span
              >
            }
            @case ('removed') {
              <span class="self-center text-xs text-gray-11"
                >Você foi removido</span
              >
            }
            @case ('cancelled') {
              <span class="self-center text-xs text-gray-11"
                >Convite cancelado</span
              >
            }
            @default {
              @if (session().privacy === 'public') {
                <button
                  type="button"
                  class="ui-primary-btn"
                  data-size="sm"
                  [disabled]="loading('join')"
                  (click)="requestJoin.emit()"
                >
                  @if (loading('join')) {
                    <i
                      class="ph ph-spinner animate-spin"
                      aria-hidden="true"
                    ></i>
                  } @else {
                    <i class="ph ph-user-plus"></i>
                  }
                  Solicitar entrada
                </button>
              }
            }
          }
        }
      </footer>
    </article>
  `,
})
export class SessionCardComponent {
  private sessionsService = inject(GameplaySessionsService);
  session = input.required<GameplaySession>();
  currentProfileId = input<string>();
  clickDetail = output<GameplaySession>();
  requestJoin = output<void>();
  respond = output<'accept' | 'decline'>();
  leave = output<void>();

  readonly isHost = computed(
    () => this.session().hostProfileId === this.currentProfileId(),
  );
  readonly isFull = computed(
    () => this.session().confirmedCount >= this.session().maxPlayers,
  );
  readonly statusLabel = computed(() => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      invited: 'Convidado',
      confirmed: 'Confirmado',
      rejected: 'Recusado',
      removed: 'Removido',
      cancelled: 'Cancelado',
    };
    return labels[this.session().myParticipantStatus ?? ''] ?? '';
  });

  loading(prefix: string): boolean {
    return this.sessionsService.isActionLoading(
      `${prefix}:${this.session().$id}`,
    );
  }

  formattedDate(): string {
    return new Date(this.session().scheduledAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formattedTime(): string {
    return new Date(this.session().scheduledAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
