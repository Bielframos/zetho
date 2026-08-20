import { computed, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Notification } from './notification.types';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private notifications = signal<Notification[]>([]);

  readonly list = computed(() => this.notifications());

  private makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  show(opts: Omit<Notification, 'id'>) {
    const id = this.makeId();
    const notification: Notification = { id, closing: false, ...opts };
    this.notifications.update((arr) => [notification, ...arr]);

    // auto dismiss — só no browser: um timer de 5s no servidor segura a
    // estabilidade da zone e trava o render da requisição inteira.
    const timeout = notification.timeout ?? 5000;
    if (this.isBrowser && timeout && timeout > 0) {
      setTimeout(() => this.dismiss(id), timeout);
    }

    return id;
  }

  dismiss(id: string) {
    const current = this.notifications().find((notification) => notification.id === id);

    if (!current || current.closing) {
      return;
    }

    this.notifications.update((list) =>
      list.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              closing: true,
            }
          : notification,
      ),
    );

    setTimeout(() => {
      this.notifications.set(this.notifications().filter((notification) => notification.id !== id));
    }, 180);
  }

  clear() {
    this.notifications.set([]);
  }
}
