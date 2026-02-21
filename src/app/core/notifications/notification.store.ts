import { computed, Injectable, signal } from '@angular/core';
import { Notification } from './notification.types';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private notifications = signal<Notification[]>([]);

  readonly list = computed(() => this.notifications());

  private makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  show(opts: Omit<Notification, 'id'>) {
    const id = this.makeId();
    const notification: Notification = { id, ...opts };
    this.notifications.update((arr) => [notification, ...arr]);

    // auto dismiss
    const timeout = notification.timeout ?? 5000;
    if (timeout && timeout > 0) {
      setTimeout(() => this.dismiss(id), timeout);
    }

    return id;
  }

  dismiss(id: string) {
    this.notifications.set(this.notifications().filter((n) => n.id !== id));
  }

  clear() {
    this.notifications.set([]);
  }
}
