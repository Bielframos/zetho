import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameStore } from '../../../core/games/game.store';
import { GameRow, GameWithEntry, ZEntry } from '../../../types';

import { GameCoverMenuCoordinator, UiGameQuickActions } from './game-quick-actions';
import { GameQuickEntryStore } from './game-quick-entry.store';

export function igdbCoverLoader({ src, width }: ImageLoaderConfig): string {
  const match = /^(https?:)?\/\/images\.igdb\.com\/igdb\/image\/upload\/t_[^/]+\/(.+)$/i.exec(src);
  if (!match) return src;
  if (!width) return src;
  const size = width <= 90 ? 'cover_small' : width <= 180 ? 'cover_small_2x' : width <= 264 ? 'cover_big' : 'cover_big_2x';
  return `${match[1] || 'https:'}//images.igdb.com/igdb/image/upload/t_${size}/${match[2]}`;
}

type EntryStatus = Exclude<ZEntry['status'], 'wishlist' | null | undefined>;

@Component({
  selector: 'ui-game-card',
  standalone: true,
  templateUrl: './game-card.html',
  styleUrl: './game-card.css',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink, UiGameQuickActions],
  providers: [{ provide: IMAGE_LOADER, useValue: igdbCoverLoader }],
})
export class UiGameCard {
  private gameStore = inject(GameStore);
  readonly quickEntry = inject(GameQuickEntryStore);
  private readonly coordinator = inject(GameCoverMenuCoordinator);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly cover = viewChild<ElementRef<HTMLAnchorElement>>('interactiveCover');
  readonly pressing = signal(false);
  readonly quickContext = signal<{ mobile: boolean; point: { x: number; y: number } } | null>(null);
  readonly quickActionsOpen = computed(() => !!this.quickContext() && this.coordinator.activeOrigin() === this.cover()?.nativeElement);
  private holdTimer?: ReturnType<typeof setTimeout>;
  private pointerStart?: { x: number; y: number; id: number };
  private suppressClick = false;
  private lastTouchAt = 0;

  constructor() {
    const blockHeldClick = (event: MouseEvent) => {
      if (this.suppressClick && this.cover()?.nativeElement.contains(event.target as Node)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.suppressClick = false;
      }
    };
    const cancel = () => this.cancelHold();
    const multiTouch = (event: PointerEvent) => { if (!event.isPrimary) this.cancelHold(); };
    this.host.nativeElement.addEventListener('click', blockHeldClick, true);
    const document = this.host.nativeElement.ownerDocument;
    document.addEventListener('scroll', cancel, { capture: true, passive: true });
    document.addEventListener('pointerdown', multiTouch, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      this.cancelHold();
      this.closeQuickActions();
      this.host.nativeElement.removeEventListener('click', blockHeldClick, true);
      document.removeEventListener('scroll', cancel, true);
      document.removeEventListener('pointerdown', multiTouch);
    });
    effect(() => {
      this.game().$id;
      this.readonlyMode();
      this.quickEntry.eligible();
      untracked(() => { this.cancelHold(); this.closeQuickActions(); });
    });
  }

  onContextMenu(event: MouseEvent) {
    if (!this.quickEntry.eligible()) return;
    event.preventDefault();
    event.stopPropagation();
    const pointerType = (event as PointerEvent).pointerType;
    const touch = pointerType === 'touch' || (!pointerType && Date.now() - this.lastTouchAt < 1000);
    if (touch && this.quickActionsOpen()) return;
    this.cancelHold();
    this.openQuickActions(touch, { x: event.clientX, y: event.clientY });
  }

  onCoverKeydown(event: KeyboardEvent) {
    if (!this.quickEntry.eligible()) return;
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      const rect = this.cover()!.nativeElement.getBoundingClientRect();
      this.openQuickActions(false, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  }

  onPointerDown(event: PointerEvent) {
    this.cancelHold();
    this.suppressClick = false;
    if (!this.quickEntry.eligible() || event.pointerType !== 'touch' || !event.isPrimary) return;
    this.lastTouchAt = Date.now();
    this.pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    this.pressing.set(true);
    this.holdTimer = setTimeout(() => {
      this.holdTimer = undefined;
      this.pressing.set(false);
      this.suppressClick = true;
      this.openQuickActions(true, { x: event.clientX, y: event.clientY });
    }, 420);
  }

  onPointerMove(event: PointerEvent) {
    const start = this.pointerStart;
    if (start && (start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10)) this.cancelHold();
  }

  cancelHold() {
    if (this.holdTimer !== undefined) clearTimeout(this.holdTimer);
    this.holdTimer = undefined;
    this.pointerStart = undefined;
    this.pressing.set(false);
  }

  private openQuickActions(mobile: boolean, point: { x: number; y: number }) {
    const origin = this.cover()?.nativeElement;
    if (!origin || this.readonlyMode()) return;
    this.coordinator.activeOrigin.set(origin);
    this.quickContext.set({ mobile, point });
  }

  closeQuickActions() {
    if (this.coordinator.activeOrigin() === this.cover()?.nativeElement) this.coordinator.activeOrigin.set(null);
    this.quickContext.set(null);
  }

  private isEntryStatus(
    status: ZEntry['status'] | null | undefined,
  ): status is EntryStatus {
    return (
      status === 'completed' ||
      status === 'backlog' ||
      status === 'playing' ||
      status === 'dropped'
    );
  }

  game = input.required<GameRow | GameWithEntry>();
  width = input<number>();
  priority = input(false, { transform: booleanAttribute });
  transitionScope = input<string>();
  transitionItemId = input<string>();
  isIgdbCover = computed(() => /^(https?:)?\/\/images\.igdb\.com\/igdb\/image\/upload\/t_[^/]+\//i.test(this.displayGame().coverUrl || ''));
  coverSizes = computed(() => this.width() ? `${this.width()}px` : '(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 180px');
  transitionName = computed(() => {
    const scope = this.transitionScope();
    if (!scope) return 'none';
    const id = this.transitionItemId() || this.displayGame().$id;
    return `game-${scope.replace(/[^a-zA-Z0-9_-]/g, '-')}-${String(id).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  });
  readonlyMode = input(false, { transform: booleanAttribute });
  showEntryStatus = input(true, { transform: booleanAttribute });
  entryStatus = input<ZEntry['status'] | undefined>(undefined);

  displayGame = computed(() => this.game() || this.gameStore.currentGame());

  statusConfig: Record<
    EntryStatus,
    { bgClass: string; iconClass?: string; label: string }
  > = {
    completed: {
      bgClass: 'bg-blue-9 text-white',
      label: 'Zerei',
    },
    backlog: {
      bgClass: 'bg-green-400 text-blue-2',
      iconClass: 'ph-fill ph-books',
      label: 'Backlog',
    },
    playing: {
      bgClass: 'bg-purple-400 text-blue-2',
      iconClass: 'ph-fill ph-game-controller',
      label: 'Jogando',
    },
    dropped: {
      bgClass: 'bg-red-400 text-blue-2',
      iconClass: 'ph-fill ph-x-circle',
      label: 'Dropei',
    },
  };

  activeEntryStatus = computed<EntryStatus | null>(() => {
    const updated = this.quickEntry.statusFor(this.displayGame().$id);
    if (updated) return this.isEntryStatus(updated.entry?.status) ? updated.entry!.status as EntryStatus : null;
    const propStatus = this.entryStatus();

    if (this.isEntryStatus(propStatus)) return propStatus;

    const gameWithEntry = this.displayGame() as GameRow & {
      zEntry?: { status?: ZEntry['status'] | null };
    };

    const status = gameWithEntry?.zEntry?.status;

    return this.isEntryStatus(status) ? status : null;
  });

  entryIndicator = computed(() => {
    if (!this.showEntryStatus()) return null;
    const status = this.activeEntryStatus();

    if (!status) return null;

    return {
      status,
      ...this.statusConfig[status],
    };
  });

  updateGame() {
    if (this.game()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.gameStore.setGame(this.game()!);
    }
  }
}
