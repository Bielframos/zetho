import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import {
  CreateSessionDto,
  GameplaySession,
  ParticipantAction,
  SessionParticipant,
} from './gameplay-sessions.types';

export interface GameplayNotificationDto {
  $id: string;
  title: string;
  body: string;
  type:
    | 'session_invite'
    | 'session_rsvp'
    | 'session_reminder'
    | 'session_update'
    | 'entry_comment'
    | 'game_comment'
    | 'system';
  read: boolean;
  $createdAt: string;
  entityId?: string;
  participantId?: string;
  actionStatus?: string;
  targetUrl?: string;
  senderProfile?: { avatarUrl?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class GameplaySessionsRepository {
  private authStore = inject(AuthStore);

  private async fetchApi<T>(
    path: string,
    init: RequestInit = {},
    opts: { auth?: boolean } = { auth: true },
  ): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    headers.set('Content-Type', 'application/json');
    if (opts.auth !== false) {
      const jwt = await this.authStore.getJwt();
      if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
    }

    const response = await fetch(
      new URL(path, environment.zethoApiEndpoint).toString(),
      { ...init, headers },
    );
    if (!response.ok) {
      let message = 'Ocorreu um erro ao processar a requisição.';
      try {
        const payload = await response.json();
        message = payload?.message ?? message;
      } catch {}
      throw new Error(message);
    }
    return (await response.json()) as T;
  }

  async getSessions(
    type: 'public' | 'my_sessions' | 'invites' = 'public',
  ): Promise<GameplaySession[]> {
    const response = await this.fetchApi<{
      rows: GameplaySession[];
      total: number;
    }>(`api/gameplay-sessions?type=${type}`);
    return response.rows ?? [];
  }

  async getSessionById(id: string): Promise<GameplaySession> {
    return await this.fetchApi<GameplaySession>(`api/gameplay-sessions/${id}`);
  }

  async createSession(dto: CreateSessionDto): Promise<GameplaySession> {
    const created = await this.fetchApi<GameplaySession>(
      'api/gameplay-sessions',
      { method: 'POST', body: JSON.stringify(dto) },
    );
    return await this.getSessionById(created.$id);
  }

  async requestToJoin(sessionId: string): Promise<void> {
    await this.fetchApi(`api/gameplay-sessions/${sessionId}/join-requests`, {
      method: 'POST',
    });
  }

  async respondToInvitation(
    sessionId: string,
    action: 'accept' | 'decline',
  ): Promise<void> {
    await this.fetchApi(
      `api/gameplay-sessions/${sessionId}/invitations/respond`,
      { method: 'POST', body: JSON.stringify({ action }) },
    );
  }

  async leaveSession(sessionId: string): Promise<void> {
    await this.fetchApi(`api/gameplay-sessions/${sessionId}/leave`, {
      method: 'POST',
    });
  }

  async updateParticipant(
    sessionId: string,
    participantId: string,
    action: ParticipantAction,
  ): Promise<void> {
    await this.fetchApi(
      `api/gameplay-sessions/${sessionId}/participants/${participantId}`,
      { method: 'PATCH', body: JSON.stringify({ action }) },
    );
  }

  async inviteParticipants(
    sessionId: string,
    profileIds: string[],
  ): Promise<{ invited: SessionParticipant[] }> {
    return await this.fetchApi<{ invited: SessionParticipant[] }>(
      `api/gameplay-sessions/${sessionId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify({ invitedProfileIds: profileIds }),
      },
    );
  }

  async cancelSession(sessionId: string): Promise<void> {
    await this.fetchApi(`api/gameplay-sessions/${sessionId}/cancel`, {
      method: 'DELETE',
    });
  }

  async getNotifications(): Promise<GameplayNotificationDto[]> {
    const response = await this.fetchApi<{
      rows: GameplayNotificationDto[];
      total: number;
    }>('api/notifications');
    return response.rows ?? [];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.fetchApi(`api/notifications/${id}/read`, { method: 'PATCH' });
  }

  async deleteNotification(id: string): Promise<void> {
    await this.fetchApi(`api/notifications/${id}`, { method: 'DELETE' });
  }
}
