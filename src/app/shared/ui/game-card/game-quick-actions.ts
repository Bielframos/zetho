import { Menu, MenuContent, MenuItem } from '@angular/aria/menu';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  Injectable,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GameRow, GameWithEntry, ZEntryRow } from '../../../types';
import { NotificationStore } from '../../../core/system/notifications/notification.store';
import { UiZethoIcon } from '../zetho-icon';
import { UiLoading } from '../loading';
import { UiGameCoverFocus } from './game-cover-focus';
import {
  GameQuickEntryStore,
  QuickEntryStatus,
} from './game-quick-entry.store';

@Injectable({ providedIn: 'root' })
export class GameCoverMenuCoordinator {
  readonly activeOrigin = signal<HTMLElement | null>(null);
}

@Component({
  selector: 'ui-game-quick-actions',
  standalone: true,
  imports: [
    Menu,
    MenuContent,
    MenuItem,
    OverlayModule,
    UiLoading,
    UiZethoIcon,
    UiGameCoverFocus,
  ],
  template: `
    @if (mobile()) {
      <ui-game-cover-focus
        [game]="game()"
        [originElement]="originElement()"
        [status]="status()"
        [loading]="loading()"
        [saving]="saving()"
        [error]="error()"
        [loadError]="loadError()"
        [unavailable]="!store.canUpdate(game())"
        (chooseStatus)="choose($event)"
        (retryLoad)="load()"
        (closed)="dismiss()"
      />
    } @else {
      <ng-template
        [cdkConnectedOverlayOpen]="true"
        [cdkConnectedOverlay]="{
          origin: point(),
          usePopover: 'global',
          positions,
          viewportMargin: 12,
          push: true,
        }"
        (overlayOutsideClick)="dismiss(false)"
        (overlayKeydown)="onKeydown($event)"
      >
        <div
          ngMenu
          #menu="ngMenu"
          class="quick-menu border border-gray-6 text-gray-12"
          style="border-radius: 0"
          [attr.aria-label]="'Registrar ' + game().name"
          (onSelect)="choose($event)"
          (keydown)="onKeydown($event)"
        >
          <ng-template ngMenuContent>
            <div class="mb-1 border-b border-gray-6 px-2 py-2">
              <p class="truncate text-sm font-medium text-gray-12">
                {{ game().name }}
              </p>
              @if (loading() || saving()) {
                <div class="mt-2" role="status">
                  <ui-loading
                    [inline]="true"
                    size="sm"
                    [fallback]="saving() ? 'Salvando…' : 'Carregando registro…'"
                  />
                </div>
              }
            </div>
            @for (action of actions; track action.key) {
              <button
                type="button"
                ngMenuItem
                [value]="action.key"
                [disabled]="
                  loading() ||
                  saving() ||
                  !store.canUpdate(game()) ||
                  !!loadError()
                "
                style="border-radius: 0"
                class="w-full items-center text-sm focus:ring-2 focus:ring-inset focus:ring-focus-ring"
                [class.text-blue-11]="status() === action.key"
                [attr.aria-label]="
                  action.label +
                  (status() === action.key ? ', status atual' : '')
                "
              >
                @if (action.key === 'completed') {
                  <ui-zetho-icon />
                } @else {
                  <i [class]="action.icon" aria-hidden="true"></i>
                }
                <span class="flex-1 text-left">{{ action.label }}</span>
                @if (status() === action.key) {
                  <i class="ph ph-check text-blue-11" aria-hidden="true"></i>
                }
              </button>
            }
            @if (!store.canUpdate(game())) {
              <p class="border-t border-gray-6 px-2 py-3 text-xs text-gray-11">
                Os registros ficam disponíveis após o lançamento.
              </p>
            }
            @if (error()) {
              <p role="alert" class="px-2 py-2 text-xs text-danger">
                {{ error() }}
              </p>
              @if (loadError()) {
                <button
                  type="button"
                  ngMenuItem
                  value="retry"
                  class="w-full text-sm"
                  style="border-radius: 0"
                >
                  Tentar novamente
                </button>
              }
            }
          </ng-template>
        </div>
      </ng-template>
    }
  `,
  styles: `
    .quick-menu {
      border-radius: 0;
      animation: quick-menu-in 130ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .quick-menu [ngMenuItem] {
      min-height: 36px;
      border-radius: 0;
    }
    .quick-menu [ngMenuItem][aria-disabled='true'] {
      opacity: 0.5;
      cursor: default;
    }
    @keyframes quick-menu-in {
      from {
        opacity: 0;
        transform: translateY(3px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .quick-menu {
        animation: none;
      }
    }
  `,
})
export class UiGameQuickActions {
  readonly game = input.required<GameRow | GameWithEntry>();
  readonly originElement = input.required<HTMLElement>();
  readonly point = input.required<{ x: number; y: number }>();
  readonly mobile = input(false);
  readonly closed = output<void>();
  readonly store = inject(GameQuickEntryStore);
  private readonly notification = inject(NotificationStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusView = viewChild(UiGameCoverFocus);
  private readonly menu = viewChild<Menu<string>>('menu');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadError = signal(false);
  private readonly entry = signal<ZEntryRow | null>(null);
  readonly status = computed(() => {
    const status = (
      this.store.statusFor(this.game().$id)?.entry ?? this.entry()
    )?.status;
    return status && status !== 'wishlist' ? status : null;
  });
  private loadVersion = 0;
  readonly actions: { key: QuickEntryStatus; label: string; icon: string }[] = [
    { key: 'completed', label: 'Zerei', icon: '' },
    { key: 'backlog', label: 'Biblioteca', icon: 'ph ph-books' },
    { key: 'playing', label: 'Jogando', icon: 'ph ph-game-controller' },
    { key: 'dropped', label: 'Dropei', icon: 'ph ph-x-circle' },
  ];
  readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4,
    },
  ];

  constructor() {
    afterNextRender(() => {
      void this.load();
      this.menu()?.element.focus({ preventScroll: true });
    });
  }

  async load() {
    if (this.saving()) return;
    const version = ++this.loadVersion;
    this.loading.set(true);
    this.loadError.set(false);
    this.error.set(null);
    try {
      const entry = await this.store.load(this.game());
      if (!this.destroyRef.destroyed && version === this.loadVersion)
        this.entry.set(entry);
    } catch {
      if (!this.destroyRef.destroyed && version === this.loadVersion) {
        this.loadError.set(true);
        this.error.set(
          'Não foi possível carregar seu registro. Tente novamente.',
        );
      }
    } finally {
      if (!this.destroyRef.destroyed && version === this.loadVersion)
        this.loading.set(false);
    }
  }

  async choose(value: string) {
    if (value === 'retry') {
      await this.load();
      return;
    }
    const action = this.actions.find((action) => action.key === value);
    if (
      !action ||
      this.loading() ||
      this.saving() ||
      this.loadError() ||
      !this.store.canUpdate(this.game())
    )
      return;
    if (this.status() === action.key) {
      this.close();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.store.save(this.game(), this.entry(), action.key);
      this.notification.show({
        message: `${this.game().name}: ${action.label}`,
        type: 'success',
      });
      if (!this.destroyRef.destroyed) this.close();
    } catch {
      if (!this.destroyRef.destroyed)
        this.error.set('Não foi possível salvar. Tente novamente.');
    } finally {
      if (!this.destroyRef.destroyed) this.saving.set(false);
    }
  }

  close() {
    if (this.mobile()) void this.focusView()?.close();
    else this.dismiss();
  }

  dismiss(restoreFocus = true) {
    if (restoreFocus && !this.mobile())
      this.originElement().focus({ preventScroll: true });
    this.closed.emit();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
      this.dismiss();
    }
  }
}
