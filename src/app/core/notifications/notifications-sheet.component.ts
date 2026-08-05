import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  InAppNotification,
  InAppNotificationStore,
} from './in-app-notification.store';
import { NotificationStore } from './notification.store';

@Component({
  selector: 'app-notifications-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Bell Trigger Button -->
    <button
      type="button"
      (click)="toggleSheet()"
      class="relative flex items-center justify-center border-gray-6 text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-6"
      [ngClass]="
        variant() === 'appShell'
          ? 'h-full w-14 border-b border-l bg-gray-1/50 backdrop-blur-lg'
          : variant() === 'menu'
            ? 'h-12 w-full justify-start gap-3 rounded-lg border px-3'
            : 'h-12 w-12 rounded-full border bg-gray-1/95 shadow-lg backdrop-blur'
      "
      aria-label="Notificações"
      [attr.aria-expanded]="isOpen()"
    >
      <i class="ph ph-bell text-xl"></i>
      @if (variant() === 'menu') {
        <span class="text-sm">Notificações</span>
      }
      @if (store.unreadCount() > 0) {
        <span
          class="absolute right-2 top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-9 px-1 text-[10px] font-semibold leading-none text-white"
        >
          {{ store.unreadCount() }}
        </span>
      }
    </button>

    <!-- Overlay & Drawer Sheet -->
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 bg-black/70"
        (click)="closeSheet()"
        aria-hidden="true"
      ></div>

      <aside
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-4 bg-gray-1"
        aria-label="Notificações"
      >
        <header
          class="flex items-center justify-between border-b border-gray-6 px-4 py-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center border border-gray-6"
            >
              <i class="ph ph-bell text-xl text-blue-11"></i>
            </div>
            <div class="min-w-0">
              <h2 class="text-xl text-gray-12">Notificações</h2>
              <p class="text-xs text-gray-10">
                Interações, convites e atualizações
              </p>
            </div>
            @if (store.unreadCount() > 0) {
              <span
                class="shrink-0 rounded-full bg-blue-3 px-2 py-0.5 text-xs text-blue-11"
              >
                {{ store.unreadCount() }}
              </span>
            }
          </div>

          <div class="flex items-center gap-1">
            @if (store.notifications().length > 0) {
              <button
                type="button"
                (click)="store.markAllAsRead()"
                class="ui-ghost-btn"
                data-size="icon"
                aria-label="Marcar todas como lidas"
                title="Marcar todas como lidas"
              >
                <i class="ph ph-checks"></i>
              </button>
            }
            <button
              type="button"
              (click)="closeSheet()"
              class="ui-ghost-btn"
              data-size="icon"
              aria-label="Fechar notificações"
            >
              <i class="ph ph-x"></i>
            </button>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto discreet-scrollbar">
          <div class="flex flex-col divide-y divide-gray-6">
            @for (notif of store.notifications(); track notif.id) {
              <article
                class="group relative flex items-start gap-3 p-4 transition-colors hover:bg-gray-2/60"
                [ngClass]="{
                  'border-l-2 border-blue-9 bg-blue-3/20': !notif.read,
                }"
              >
                @if (notif.avatarUrl) {
                  <img
                    [src]="notif.avatarUrl"
                    alt=""
                    class="h-10 w-10 shrink-0 rounded-full bg-gray-3 object-cover"
                  />
                } @else {
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-9 text-white"
                  >
                    <i class="ph ph-game-controller"></i>
                  </div>
                }

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h3 class="truncate text-sm font-medium text-gray-12">
                        {{ notif.title }}
                      </h3>
                      <p class="mt-1 text-sm leading-5 text-gray-11">
                        {{ notif.message }}
                      </p>
                    </div>
                    <span class="shrink-0 text-xs text-gray-10">
                      {{ notif.createdAt }}
                    </span>
                  </div>

                  @if (notif.status === 'accepted') {
                    <span
                      class="mt-2 inline-flex items-center gap-1 rounded-full bg-green-900/40 px-2 py-0.5 text-xs text-green-300"
                    >
                      <i class="ph ph-check-circle"></i>
                      Convite aceito
                    </span>
                  } @else if (notif.status === 'declined') {
                    <span
                      class="mt-2 inline-flex items-center gap-1 rounded-full bg-red-900/30 px-2 py-0.5 text-xs text-red-300"
                    >
                      <i class="ph ph-x-circle"></i>
                      Convite recusado
                    </span>
                  } @else if (notif.status === 'cancelled') {
                    <span
                      class="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-3 px-2 py-0.5 text-xs text-gray-11"
                    >
                      <i class="ph ph-x-circle"></i>
                      Convite cancelado
                    </span>
                  }

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    @if (
                      notif.type === 'session_invite' &&
                      notif.status === 'pending'
                    ) {
                      <button
                        type="button"
                        (click)="onConfirm(notif)"
                        [disabled]="isProcessing(notif)"
                        class="ui-primary-btn"
                        data-size="sm"
                      >
                        @if (isProcessing(notif)) {
                          <i class="ph ph-spinner animate-spin"></i>
                        } @else {
                          <i class="ph ph-check"></i>
                        }
                        Confirmar
                      </button>

                      <button
                        type="button"
                        (click)="onDecline(notif)"
                        [disabled]="isProcessing(notif)"
                        class="ui-secondary-btn"
                        data-size="sm"
                      >
                        Recusar
                      </button>
                    }

                    @if (notif.sessionId) {
                      <button
                        type="button"
                        (click)="onViewSession(notif)"
                        class="ui-ghost-btn"
                        data-size="sm"
                      >
                        <i class="ph ph-arrow-right"></i>
                        Ver Jogatina
                      </button>
                    }
                  </div>
                </div>

                <button
                  type="button"
                  (click)="
                    store.deleteNotification(notif.id || notif.$id || '')
                  "
                  class="ui-ghost-btn shrink-0 text-gray-10"
                  data-size="icon"
                  aria-label="Excluir notificação"
                  title="Excluir"
                >
                  <i class="ph ph-trash"></i>
                </button>
              </article>
            } @empty {
              <div class="px-4 py-12 text-center">
                <i class="ph ph-bell-slash text-[40px] text-gray-10"></i>
                <h3 class="mt-3 text-lg text-gray-12">Nenhuma notificação</h3>
                <p class="mx-auto mt-2 max-w-xs text-sm text-gray-11">
                  Suas interações, convites e atualizações aparecerão aqui.
                </p>
              </div>
            }
          </div>
        </div>
      </aside>
    }
  `,
})
export class NotificationsSheetComponent {
  store = inject(InAppNotificationStore);
  private toastStore = inject(NotificationStore);
  private router = inject(Router);

  variant = input<'appShell' | 'floating' | 'menu'>('floating');
  isOpen = signal(false);
  processingIds = signal(new Set<string>());

  isProcessing(notif: InAppNotification) {
    return this.processingIds().has(notif.id || notif.$id || '');
  }

  toggleSheet() {
    const open = !this.isOpen();
    this.isOpen.set(open);
    if (open) void this.store.loadNotifications();
  }

  closeSheet() {
    this.isOpen.set(false);
  }

  async onConfirm(notif: InAppNotification) {
    const id = notif.id || notif.$id || '';
    this.setProcessing(id, true);
    try {
      await this.store.acceptSessionInvite(id);
      this.toastStore.show({
        message: 'Convite da Jogatina aceito!',
        type: 'success',
      });
    } catch (error) {
      this.toastStore.show({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível aceitar o convite.',
        type: 'error',
      });
    } finally {
      this.setProcessing(id, false);
    }
  }

  async onDecline(notif: InAppNotification) {
    const id = notif.id || notif.$id || '';
    this.setProcessing(id, true);
    try {
      await this.store.declineSessionInvite(id);
      this.toastStore.show({
        message: 'Convite da Jogatina recusado.',
        type: 'info',
      });
    } catch (error) {
      this.toastStore.show({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível recusar o convite.',
        type: 'error',
      });
    } finally {
      this.setProcessing(id, false);
    }
  }

  onViewSession(notif: InAppNotification) {
    const id = notif.id || notif.$id || '';
    this.store.markAsRead(id);
    this.closeSheet();
    void this.router.navigate(['/sessions'], {
      queryParams: { id: notif.sessionId },
    });
  }

  private setProcessing(id: string, active: boolean) {
    this.processingIds.update((current) => {
      const next = new Set(current);
      active ? next.add(id) : next.delete(id);
      return next;
    });
  }
}
