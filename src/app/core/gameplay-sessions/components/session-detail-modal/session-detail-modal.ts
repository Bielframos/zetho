import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  UiCombobox,
  UiComboboxOption,
  UiComboboxSearch,
} from '../../../../shared/ui/combobox/combobox';
import { UiModal } from '../../../../shared/ui/modal/modal';
import { ConnectionsService } from '../../../connections/connections.service';
import { NotificationStore } from '../../../notifications/notification.store';
import { GameplaySessionsService } from '../../gameplay-sessions.service';
import {
  GameplaySession,
  ParticipantAction,
  SessionParticipant,
} from '../../gameplay-sessions.types';

@Component({
  selector: 'app-session-detail-modal',
  standalone: true,
  imports: [CommonModule, UiModal, UiCombobox],
  template: `
    <ui-modal
      [(isOpen)]="isOpen"
      [title]="session()?.title || 'Detalhes da Jogatina'"
      [showCloseButton]="true"
      [showFooter]="false"
    >
      @if (loading()) {
        <div
          class="flex min-h-60 items-center justify-center gap-2 text-sm text-gray-11"
          aria-live="polite"
        >
          <i class="ph ph-spinner animate-spin text-blue-11"></i>
          Carregando detalhes da Jogatina...
        </div>
      } @else if (session(); as sess) {
        <div class="py-4">
          <section class="flex gap-4 border-b border-gray-6 pb-4">
            <div
              class="background-pattern h-28 w-20 shrink-0 overflow-hidden rounded border border-gray-6"
            >
              @if (sess.gameCoverUrl) {
                <img
                  [src]="sess.gameCoverUrl"
                  [alt]="sess.gameName"
                  class="h-full w-full object-cover"
                />
              } @else {
                <span
                  class="flex h-full items-center justify-center text-gray-10"
                >
                  <i class="ph ph-game-controller text-3xl"></i>
                </span>
              }
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-blue-11">{{ sess.gameName }}</p>
              @if (sess.host; as host) {
                <div class="mt-3 flex items-center gap-2">
                  @if (host.avatarUrl) {
                    <img
                      [src]="host.avatarUrl"
                      [alt]="'Avatar de ' + host.gamertag"
                      class="h-7 w-7 rounded-full object-cover"
                    />
                  } @else {
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-9 text-xs text-white"
                      >{{ host.gamertag.charAt(0).toUpperCase() }}</span
                    >
                  }
                  <span class="text-xs text-gray-11">
                    Organizada por
                    <strong class="text-gray-12">@{{ host.gamertag }}</strong>
                  </span>
                </div>
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
                  {{ sess.confirmedCount }} de {{ sess.maxPlayers }}</span
                >
              </div>
            </div>
          </section>

          <section class="border-b border-gray-6 py-4">
            <p class="text-sm leading-6 text-gray-11">
              {{ sess.description || 'Nenhuma descrição informada.' }}
            </p>
            @if (sess.tags?.length) {
              <div class="mt-3 flex flex-wrap gap-2">
                @for (tag of sess.tags; track tag) {
                  <span
                    class="rounded-full bg-gray-3 px-2 py-1 text-xs text-gray-11"
                  >
                    {{ tag }}
                  </span>
                }
              </div>
            }
          </section>

          @if (isHost()) {
            <section class="border-b border-gray-6 py-4">
              <h3 class="mb-3 text-sm font-medium text-gray-12">
                Convidar conexões
              </h3>
              <ui-combobox
                placeholder="Buscar por gamertag"
                emptyText="Nenhuma conexão disponível."
                [multiple]="true"
                [search]="searchConnections"
                [(selectedOptions)]="selectedConnections"
              />
              <div class="mt-3 flex justify-end">
                <button
                  type="button"
                  class="ui-primary-btn min-w-36"
                  [disabled]="
                    !selectedConnections().length ||
                    sessionsService.isActionLoading('invite:' + sess.$id)
                  "
                  (click)="inviteConnections()"
                >
                  @if (sessionsService.isActionLoading('invite:' + sess.$id)) {
                    <i
                      class="ph ph-spinner animate-spin"
                      aria-hidden="true"
                    ></i>
                    Enviando
                  } @else {
                    <i class="ph ph-paper-plane-tilt"></i>
                    Enviar convites
                  }
                </button>
              </div>
            </section>

            <section class="border-b border-gray-6 py-4">
              <h3 class="text-sm font-medium text-gray-12">
                Solicitações pendentes ({{ pendingRequests().length }})
              </h3>
              <ul class="mt-2 divide-y divide-gray-6">
                @for (participant of pendingRequests(); track participant.$id) {
                  <li class="flex items-center justify-between gap-3 py-3">
                    <ng-container
                      [ngTemplateOutlet]="profile"
                      [ngTemplateOutletContext]="{ participant: participant }"
                    />
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="ui-secondary-btn"
                        data-size="sm"
                        [disabled]="actionLoading('reject', participant)"
                        (click)="manage(participant, 'reject')"
                      >
                        @if (actionLoading('reject', participant)) {
                          <i class="ph ph-spinner animate-spin"></i>
                        }
                        Rejeitar
                      </button>
                      <button
                        type="button"
                        class="ui-primary-btn"
                        data-size="sm"
                        [disabled]="
                          actionLoading('approve', participant) || isFull()
                        "
                        (click)="manage(participant, 'approve')"
                      >
                        @if (actionLoading('approve', participant)) {
                          <i class="ph ph-spinner animate-spin"></i>
                        }
                        Aprovar
                      </button>
                    </div>
                  </li>
                } @empty {
                  <li class="py-3 text-sm text-gray-10">
                    Nenhuma solicitação.
                  </li>
                }
              </ul>
            </section>

            <section class="border-b border-gray-6 py-4">
              <h3 class="text-sm font-medium text-gray-12">
                Convites enviados ({{ invitations().length }})
              </h3>
              <ul class="mt-2 divide-y divide-gray-6">
                @for (participant of invitations(); track participant.$id) {
                  <li class="flex items-center justify-between gap-3 py-3">
                    <ng-container
                      [ngTemplateOutlet]="profile"
                      [ngTemplateOutletContext]="{ participant: participant }"
                    />
                    <button
                      type="button"
                      class="ui-secondary-btn"
                      data-size="sm"
                      [disabled]="actionLoading('cancel_invite', participant)"
                      (click)="manage(participant, 'cancel_invite')"
                    >
                      @if (actionLoading('cancel_invite', participant)) {
                        <i class="ph ph-spinner animate-spin"></i>
                      }
                      Cancelar convite
                    </button>
                  </li>
                } @empty {
                  <li class="py-3 text-sm text-gray-10">
                    Nenhum convite pendente.
                  </li>
                }
              </ul>
            </section>
          }

          <section class="py-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-medium text-gray-12">
                Participantes confirmados ({{ confirmed().length }})
              </h3>
              <button
                type="button"
                (click)="copyShareLink()"
                class="ui-ghost-btn"
                data-size="sm"
              >
                <i class="ph ph-share-network"></i>
                Copiar link
              </button>
            </div>
            <ul class="mt-2 divide-y divide-gray-6">
              @for (participant of confirmed(); track participant.$id) {
                <li class="flex items-center justify-between gap-3 py-3">
                  <ng-container
                    [ngTemplateOutlet]="profile"
                    [ngTemplateOutletContext]="{ participant: participant }"
                  />
                  @if (participant.isHost) {
                    <span
                      class="rounded-full bg-blue-3 px-2 py-0.5 text-xs text-blue-11"
                      >Host</span
                    >
                  } @else if (isHost()) {
                    <button
                      type="button"
                      class="ui-destructive-btn"
                      data-size="sm"
                      [disabled]="actionLoading('remove', participant)"
                      (click)="manage(participant, 'remove')"
                    >
                      @if (actionLoading('remove', participant)) {
                        <i class="ph ph-spinner animate-spin"></i>
                      }
                      Remover
                    </button>
                  }
                </li>
              }
            </ul>
          </section>

          <footer
            class="flex flex-wrap justify-end gap-2 border-t border-gray-6 pt-4"
          >
            @if (sess.status !== 'scheduled') {
              <span class="self-center text-sm text-gray-11">
                @if (sess.status === 'cancelled') {
                  Esta Jogatina foi cancelada.
                } @else if (sess.status === 'completed') {
                  Esta Jogatina foi concluída.
                } @else {
                  Esta Jogatina já começou.
                }
              </span>
            } @else if (isHost()) {
              <button
                type="button"
                class="ui-destructive-btn min-w-40"
                [disabled]="
                  sessionsService.isActionLoading('cancel:' + sess.$id)
                "
                (click)="sessionsService.cancelSession(sess.$id)"
              >
                @if (sessionsService.isActionLoading('cancel:' + sess.$id)) {
                  <i class="ph ph-spinner animate-spin"></i>
                  Cancelando
                } @else {
                  <i class="ph ph-trash"></i>
                  Cancelar Jogatina
                }
              </button>
            } @else {
              @switch (sess.myParticipantStatus) {
                @case ('pending') {
                  <span class="self-center text-sm text-gray-11"
                    >Solicitação pendente.</span
                  >
                }
                @case ('invited') {
                  <button
                    type="button"
                    class="ui-secondary-btn"
                    [disabled]="invitationLoading('decline')"
                    (click)="respond('decline')"
                  >
                    @if (invitationLoading('decline')) {
                      <i class="ph ph-spinner animate-spin"></i>
                    }
                    Recusar
                  </button>
                  <button
                    type="button"
                    class="ui-primary-btn"
                    [disabled]="invitationLoading('accept') || isFull()"
                    (click)="respond('accept')"
                  >
                    @if (invitationLoading('accept')) {
                      <i class="ph ph-spinner animate-spin"></i>
                    }
                    Aceitar
                  </button>
                }
                @case ('confirmed') {
                  <button
                    type="button"
                    class="ui-secondary-btn"
                    [disabled]="
                      sessionsService.isActionLoading('leave:' + sess.$id)
                    "
                    (click)="sessionsService.leaveSession(sess.$id)"
                  >
                    @if (sessionsService.isActionLoading('leave:' + sess.$id)) {
                      <i class="ph ph-spinner animate-spin"></i>
                    }
                    Sair da Jogatina
                  </button>
                }
                @case ('rejected') {
                  <span class="self-center text-sm text-gray-11"
                    >Sua solicitação foi recusada.</span
                  >
                }
                @case ('removed') {
                  <span class="self-center text-sm text-gray-11"
                    >Você foi removido desta Jogatina.</span
                  >
                }
                @case ('cancelled') {
                  <span class="self-center text-sm text-gray-11"
                    >Seu convite foi cancelado.</span
                  >
                }
                @default {
                  @if (sess.privacy === 'public') {
                    <button
                      type="button"
                      class="ui-primary-btn min-w-40"
                      [disabled]="
                        sessionsService.isActionLoading('join:' + sess.$id)
                      "
                      (click)="sessionsService.requestToJoin(sess.$id)"
                    >
                      @if (
                        sessionsService.isActionLoading('join:' + sess.$id)
                      ) {
                        <i class="ph ph-spinner animate-spin"></i>
                        Solicitando
                      } @else {
                        <i class="ph ph-user-plus"></i>
                        Solicitar entrada
                      }
                    </button>
                  }
                }
              }
            }
          </footer>
        </div>

        <ng-template #profile let-participant="participant">
          <div class="flex min-w-0 items-center gap-2">
            @if (participant.profile?.avatarUrl) {
              <img
                [src]="participant.profile.avatarUrl"
                [alt]="'Avatar de ' + participant.profile.gamertag"
                class="h-8 w-8 rounded-full object-cover"
              />
            } @else {
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-9 text-xs text-white"
              >
                {{
                  participant.profile?.gamertag?.charAt(0)?.toUpperCase() || '?'
                }}
              </span>
            }
            <span class="truncate text-sm text-gray-12">
              @{{ participant.profile?.gamertag || 'Perfil indisponível' }}
            </span>
          </div>
        </ng-template>
      }
    </ui-modal>
  `,
})
export class SessionDetailModalComponent {
  private toastStore = inject(NotificationStore);
  private connectionsService = inject(ConnectionsService);
  sessionsService = inject(GameplaySessionsService);
  private previousSessionId = '';

  isOpen = model(false);
  session = input<GameplaySession | null>(null);
  loading = input(false);
  currentProfileId = input<string>();
  selectedConnections = signal<UiComboboxOption[]>([]);

  readonly pendingRequests = computed(
    () =>
      this.session()?.participants?.filter((p) => p.status === 'pending') ?? [],
  );
  readonly invitations = computed(
    () =>
      this.session()?.participants?.filter((p) => p.status === 'invited') ?? [],
  );
  readonly confirmed = computed(
    () =>
      this.session()?.participants?.filter((p) => p.status === 'confirmed') ??
      [],
  );
  readonly isHost = computed(
    () => this.session()?.hostProfileId === this.currentProfileId(),
  );
  readonly isFull = computed(
    () =>
      (this.session()?.confirmedCount ?? 0) >=
      (this.session()?.maxPlayers ?? 0),
  );

  readonly searchConnections: UiComboboxSearch = async (query) => {
    const currentProfileId = this.currentProfileId();
    if (!currentProfileId) return [];
    const unavailable = new Set(
      (this.session()?.participants ?? [])
        .filter((participant) =>
          ['pending', 'invited', 'confirmed'].includes(participant.status),
        )
        .map((participant) => participant.profileId),
    );
    unavailable.add(this.session()?.hostProfileId ?? '');
    return (
      await this.connectionsService.searchConnections(currentProfileId, query)
    )
      .filter((profile) => !unavailable.has(profile.$id))
      .map((profile) => ({
        id: profile.$id,
        label: `@${profile.gamertag}`,
        description: 'Conexão',
        imageUrl: profile.avatarUrl,
        imageShape: 'avatar' as const,
        icon: profile.avatarUrl ? undefined : 'ph-user',
      }));
  };

  constructor() {
    effect(() => {
      const sessionId = this.session()?.$id ?? '';
      if (sessionId !== this.previousSessionId) {
        this.previousSessionId = sessionId;
        this.selectedConnections.set([]);
      }
    });
  }

  async inviteConnections() {
    const sessionId = this.session()?.$id;
    if (!sessionId) return;
    const success = await this.sessionsService.inviteParticipants(
      sessionId,
      this.selectedConnections().map((option) => option.id),
    );
    if (success) this.selectedConnections.set([]);
  }

  manage(participant: SessionParticipant, action: ParticipantAction) {
    const sessionId = this.session()?.$id;
    if (sessionId) {
      void this.sessionsService.updateParticipant(
        sessionId,
        participant.$id,
        action,
      );
    }
  }

  respond(action: 'accept' | 'decline') {
    const sessionId = this.session()?.$id;
    if (sessionId) {
      void this.sessionsService.respondToInvitation(sessionId, action);
    }
  }

  actionLoading(action: ParticipantAction, participant: SessionParticipant) {
    return this.sessionsService.isActionLoading(`${action}:${participant.$id}`);
  }

  invitationLoading(action: 'accept' | 'decline') {
    return this.sessionsService.isActionLoading(
      `invitation:${action}:${this.session()?.$id}`,
    );
  }

  async copyShareLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/sessions?id=${this.session()?.$id}`,
      );
      this.toastStore.show({
        message: 'Link da Jogatina copiado!',
        type: 'success',
      });
    } catch {
      this.toastStore.show({
        message: 'Erro ao copiar link.',
        type: 'error',
      });
    }
  }

  formattedDate() {
    return new Date(this.session()?.scheduledAt ?? '').toLocaleDateString(
      'pt-BR',
      { day: '2-digit', month: 'long', year: 'numeric' },
    );
  }

  formattedTime() {
    return new Date(this.session()?.scheduledAt ?? '').toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' },
    );
  }
}
