import { computed, inject, Injectable, signal } from '@angular/core';
import { GameplaySessionsRepository } from '../../gameplay-sessions/gameplay-sessions.repository';

export interface InAppNotification {
  $id?: string;
  id?: string;
  title: string;
  body?: string;
  message?: string;
  type:
    | 'session_invite'
    | 'session_rsvp'
    | 'session_reminder'
    | 'session_update'
    | 'entry_comment'
    | 'game_comment'
    | 'system';
  read: boolean;
  createdAt: string;
  avatarUrl?: string;
  entityId?: string;
  sessionId?: string;
  participantId?: string;
  actionStatus?: string;
  targetUrl?: string;
  status?: 'pending' | 'accepted' | 'declined' | 'cancelled';
}

@Injectable({ providedIn: 'root' })
export class InAppNotificationStore {
  private repository = inject(GameplaySessionsRepository);

  private notificationsSignal = signal<InAppNotification[]>([]);

  readonly notifications = computed(() => this.notificationsSignal());
  readonly unreadCount = computed(
    () => this.notificationsSignal().filter((n) => !n.read).length,
  );

  async loadNotifications(): Promise<void> {
    try {
      const items = await this.repository.getNotifications();
      if (Array.isArray(items)) {
        const mapped: InAppNotification[] = items.map((n) => ({
          id: n.$id,
          title: n.title,
          message: n.body || '',
          type: n.type || 'system',
          read: n.read ?? false,
          createdAt: n.$createdAt
            ? this.formatRelativeTime(n.$createdAt)
            : 'Agora',
          sessionId:
            n.type === 'entry_comment' || n.type === 'game_comment'
              ? undefined
              : n.entityId,
          entityId: n.entityId,
          participantId: n.participantId,
          actionStatus: n.actionStatus,
          targetUrl: n.targetUrl,
          avatarUrl: n.senderProfile?.avatarUrl,
          status:
            n.type !== 'session_invite'
              ? undefined
              : n.actionStatus === 'invited'
                ? 'pending'
                : n.actionStatus === 'confirmed'
                  ? 'accepted'
                  : n.actionStatus === 'declined'
                    ? 'declined'
                    : n.actionStatus === 'cancelled'
                      ? 'cancelled'
                      : undefined,
        }));
        this.notificationsSignal.set(mapped);
      }
    } catch {}
  }

  async markAsRead(id: string): Promise<void> {
    const previous = this.notificationsSignal();
    const updated = this.notificationsSignal().map((n) =>
      n.id === id || n.$id === id ? { ...n, read: true } : n,
    );
    this.notificationsSignal.set(updated);
    try {
      await this.repository.markNotificationAsRead(id);
    } catch (error) {
      this.notificationsSignal.set(previous);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    const list = this.notificationsSignal();
    const updated = list.map((n) => ({ ...n, read: true }));
    this.notificationsSignal.set(updated);

    try {
      await Promise.all(
        list
          .filter((notification) => !notification.read)
          .map((notification) =>
            this.repository.markNotificationAsRead(
              notification.id || notification.$id || '',
            ),
          ),
      );
    } catch (error) {
      this.notificationsSignal.set(list);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    const previous = this.notificationsSignal();
    this.notificationsSignal.set(
      previous.filter(
        (notification) => notification.id !== id && notification.$id !== id,
      ),
    );
    try {
      await this.repository.deleteNotification(id);
    } catch (error) {
      this.notificationsSignal.set(previous);
      throw error;
    }
  }

  clear(): void {
    this.notificationsSignal.set([]);
  }

  dismissLocalNotification(id: string): void {
    const updated = this.notificationsSignal().filter(
      (n) => n.id !== id && n.$id !== id,
    );
    this.notificationsSignal.set(updated);
  }

  addNotification(
    item: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>,
  ): void {
    const newNotif: InAppNotification = {
      ...item,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: 'Agora mesmo',
    };
    this.notificationsSignal.update((arr) => [newNotif, ...arr]);
  }

  async acceptSessionInvite(notificationId: string): Promise<void> {
    const notif = this.notificationsSignal().find(
      (n) => n.id === notificationId || n.$id === notificationId,
    );
    if (!notif?.sessionId) {
      throw new Error('Jogatina do convite não encontrada.');
    }

    await this.repository.respondToInvitation(notif.sessionId, 'accept');
    this.notificationsSignal.update((items) =>
      items.map((item) =>
        item.id === notificationId || item.$id === notificationId
          ? { ...item, read: true, status: 'accepted' }
          : item,
      ),
    );
    await this.repository.markNotificationAsRead(notificationId);
  }

  async declineSessionInvite(notificationId: string): Promise<void> {
    const notif = this.notificationsSignal().find(
      (n) => n.id === notificationId || n.$id === notificationId,
    );
    if (!notif?.sessionId) {
      throw new Error('Jogatina do convite não encontrada.');
    }

    await this.repository.respondToInvitation(notif.sessionId, 'decline');
    this.notificationsSignal.update((items) =>
      items.map((item) =>
        item.id === notificationId || item.$id === notificationId
          ? { ...item, read: true, status: 'declined' }
          : item,
      ),
    );
    await this.repository.markNotificationAsRead(notificationId);
  }

  private formatRelativeTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Há ${diffHours}h`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return isoString;
    }
  }
}
