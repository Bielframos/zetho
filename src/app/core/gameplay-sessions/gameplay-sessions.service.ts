import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { InAppNotificationStore } from '../notifications/in-app-notification.store';
import { NotificationStore } from '../notifications/notification.store';
import { GameplaySessionsRepository } from './gameplay-sessions.repository';
import {
  CreateSessionDto,
  GameplaySession,
  ParticipantAction,
  SessionFilter,
} from './gameplay-sessions.types';

@Injectable({ providedIn: 'root' })
export class GameplaySessionsService {
  private repository = inject(GameplaySessionsRepository);
  private authStore = inject(AuthStore);
  private toastStore = inject(NotificationStore);
  private inAppStore = inject(InAppNotificationStore);

  sessions = signal<GameplaySession[]>([]);
  loading = signal(false);
  detailLoading = signal(false);
  creating = signal(false);
  private activeActions = signal(new Set<string>());
  filter = signal<SessionFilter>('all');
  searchQuery = signal('');
  selectedSession = signal<GameplaySession | null>(null);

  readonly currentProfile = computed(() => this.authStore.profile());
  readonly currentProfileId = computed(() => this.currentProfile()?.$id ?? '');
  readonly filteredSessions = computed(() => {
    const activeFilter = this.filter();
    const query = this.searchQuery().toLowerCase().trim();
    return this.sessions().filter((session) => {
      if (
        activeFilter === 'my_sessions' &&
        session.hostProfileId !== this.currentProfileId() &&
        session.myParticipantStatus !== 'confirmed'
      )
        return false;
      if (activeFilter === 'public' && session.privacy !== 'public')
        return false;
      if (activeFilter === 'private' && session.privacy !== 'closed')
        return false;
      if (
        activeFilter === 'joined' &&
        session.myParticipantStatus !== 'confirmed'
      )
        return false;
      if (
        activeFilter === 'invites' &&
        session.myParticipantStatus !== 'invited'
      )
        return false;
      return (
        !query ||
        session.title.toLowerCase().includes(query) ||
        session.gameName.toLowerCase().includes(query)
      );
    });
  });

  isActionLoading(key: string): boolean {
    return this.activeActions().has(key);
  }

  async loadSessions(): Promise<void> {
    this.loading.set(true);
    try {
      const filter = this.filter();
      let data: GameplaySession[];
      if (filter === 'all') {
        const [publicRows, myRows] = await Promise.all([
          this.repository.getSessions('public'),
          this.repository.getSessions('my_sessions'),
        ]);
        data = [
          ...new Map(
            [...publicRows, ...myRows].map((s) => [s.$id, s]),
          ).values(),
        ];
      } else if (filter === 'invites') {
        data = await this.repository.getSessions('invites');
      } else if (['my_sessions', 'private', 'joined'].includes(filter)) {
        data = await this.repository.getSessions('my_sessions');
      } else {
        data = await this.repository.getSessions('public');
      }
      data.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      this.sessions.set(data);
    } catch (error) {
      this.showError(error, 'Erro ao carregar as Jogatinas.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSessionDetail(sessionId: string): Promise<GameplaySession | null> {
    this.detailLoading.set(true);
    try {
      const detail = await this.repository.getSessionById(sessionId);
      this.updateSessionInState(detail);
      this.selectedSession.set(detail);
      return detail;
    } catch (error) {
      this.selectedSession.set(null);
      this.showError(error, 'Não foi possível carregar a Jogatina.');
      return null;
    } finally {
      this.detailLoading.set(false);
    }
  }

  async createSession(dto: CreateSessionDto): Promise<GameplaySession | null> {
    this.creating.set(true);
    try {
      const created = await this.repository.createSession(dto);
      this.updateSessionInState(created, true);
      this.toastStore.show({
        message: 'Jogatina criada com sucesso!',
        type: 'success',
      });
      this.inAppStore.addNotification({
        title: 'Jogatina criada',
        message: `Sua Jogatina "${created.title}" para ${created.gameName} está no ar!`,
        type: 'system',
        sessionId: created.$id,
      });
      return created;
    } catch (error) {
      this.showError(error, 'Erro ao criar a Jogatina.');
      return null;
    } finally {
      this.creating.set(false);
    }
  }

  async requestToJoin(sessionId: string): Promise<void> {
    await this.runMutation(
      `join:${sessionId}`,
      () => this.repository.requestToJoin(sessionId),
      sessionId,
      'Solicitação enviada ao host.',
    );
  }

  async respondToInvitation(
    sessionId: string,
    action: 'accept' | 'decline',
  ): Promise<void> {
    await this.runMutation(
      `invitation:${action}:${sessionId}`,
      () => this.repository.respondToInvitation(sessionId, action),
      sessionId,
      action === 'accept' ? 'Convite aceito!' : 'Convite recusado.',
    );
  }

  async leaveSession(sessionId: string): Promise<void> {
    await this.runMutation(
      `leave:${sessionId}`,
      () => this.repository.leaveSession(sessionId),
      sessionId,
      'Você saiu da Jogatina.',
    );
  }

  async updateParticipant(
    sessionId: string,
    participantId: string,
    action: ParticipantAction,
  ): Promise<void> {
    const messages: Record<ParticipantAction, string> = {
      approve: 'Entrada aprovada.',
      reject: 'Solicitação recusada.',
      remove: 'Participante removido.',
      cancel_invite: 'Convite cancelado.',
    };
    await this.runMutation(
      `${action}:${participantId}`,
      () => this.repository.updateParticipant(sessionId, participantId, action),
      sessionId,
      messages[action],
    );
  }

  async inviteParticipants(
    sessionId: string,
    profileIds: string[],
  ): Promise<boolean> {
    const key = `invite:${sessionId}`;
    if (this.isActionLoading(key)) return false;
    this.setActionLoading(key, true);
    try {
      const response = await this.repository.inviteParticipants(
        sessionId,
        profileIds,
      );
      await this.refreshAfterMutation(sessionId);
      this.toastStore.show({
        message:
          response.invited.length === 1
            ? 'Convite enviado!'
            : `${response.invited.length} convites enviados!`,
        type: 'success',
      });
      return true;
    } catch (error) {
      this.showError(error, 'Erro ao enviar convites.');
      return false;
    } finally {
      this.setActionLoading(key, false);
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    const succeeded = await this.runMutation(
      `cancel:${sessionId}`,
      () => this.repository.cancelSession(sessionId),
      sessionId,
      'Jogatina cancelada.',
    );
    if (succeeded) {
      this.sessions.update((rows) =>
        rows.filter((row) => row.$id !== sessionId),
      );
    }
  }

  private async runMutation(
    key: string,
    mutation: () => Promise<void>,
    sessionId: string | null,
    successMessage: string,
  ): Promise<boolean> {
    if (this.isActionLoading(key)) return false;
    this.setActionLoading(key, true);
    try {
      await mutation();
      if (sessionId) await this.refreshAfterMutation(sessionId);
      else {
        await Promise.all([
          this.loadSessions(),
          this.inAppStore.loadNotifications(),
        ]);
      }
      this.toastStore.show({ message: successMessage, type: 'success' });
      return true;
    } catch (error) {
      this.showError(error, 'Não foi possível concluir a ação.');
      return false;
    } finally {
      this.setActionLoading(key, false);
    }
  }

  private async refreshAfterMutation(sessionId: string): Promise<void> {
    await Promise.all([
      this.loadSessionDetail(sessionId),
      this.loadSessions(),
      this.inAppStore.loadNotifications(),
    ]);
  }

  private setActionLoading(key: string, active: boolean) {
    this.activeActions.update((current) => {
      const next = new Set(current);
      active ? next.add(key) : next.delete(key);
      return next;
    });
  }

  private updateSessionInState(
    updated: GameplaySession,
    prepend = false,
  ): void {
    this.sessions.update((rows) => {
      const exists = rows.some((row) => row.$id === updated.$id);
      if (!exists) return prepend ? [updated, ...rows] : rows;
      return rows.map((row) => (row.$id === updated.$id ? updated : row));
    });
    if (this.selectedSession()?.$id === updated.$id) {
      this.selectedSession.set(updated);
    }
  }

  private showError(error: unknown, fallback: string) {
    this.toastStore.show({
      message: error instanceof Error ? error.message : fallback,
      type: 'error',
    });
  }
}
