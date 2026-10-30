import { ContentIntentNotice } from '../../../acquisition/content-intent-notice';
import { DecimalPipe, DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  signal,
} from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ShaderBackground } from '../../../../shared/ui/shader-background';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { ZStatsService } from '../../../zStats/zStats.service';
import { GameRow } from '../../../games/game.types';

export interface CommunityGame {
  game: GameRow;
  playing: number | null;
  completed: number | null;
  wishlist: number | null;
}

@Component({
  selector: 'app-auth-game-space',
  imports: [
    ContentIntentNotice,
    ShaderBackground,
    UiGameCard,
    DecimalPipe,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './auth-game-space.html',
  styleUrl: './auth-game-space.css',
  host: { class: 'flex w-full flex-1' },
})
export class AuthGameSpace {
  private readonly stats = inject(ZStatsService);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  readonly games = signal<CommunityGame[]>([]);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly paused = signal(false);
  readonly formFocused = signal(false);
  readonly active = signal<string | null>(null);
  private restoringFocus = false;
  private leaveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroy.onDestroy(() => clearTimeout(this.leaveTimer));
    afterNextRender(() => {
      void this.loadGames();
      this.zone.runOutsideAngular(() => this.initializeParallax());
    });
  }

  async loadGames() {
    if (this.loading()) return;
    this.loading.set(true);
    this.failed.set(false);
    try {
      const rows = await this.stats.getCommunityGames();
      if (this.destroy.destroyed) return;
      const games = rows.flatMap((row): CommunityGame[] => {
        if (!row.game || typeof row.game === 'string' || !row.game.coverUrl)
          return [];
        return [
          {
            game: row.game,
            playing: this.count(row.playingCount),
            completed: this.count(row.completedCount),
            wishlist: this.count(row.wishlistCount),
          },
        ];
      });
      this.games.set(games.slice(0, 6));
    } catch {
      if (!this.destroy.destroyed) this.failed.set(true);
    } finally {
      if (!this.destroy.destroyed) this.loading.set(false);
    }
  }

  private count(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : null;
  }

  activate(id: string) {
    clearTimeout(this.leaveTimer);
    this.active.set(id);
  }

  onFocus(id: string) {
    if (!this.restoringFocus) this.activate(id);
  }

  leave(id: string, node: HTMLElement) {
    clearTimeout(this.leaveTimer);
    // Allow crossing the small gap between the floating cover and its panel.
    this.leaveTimer = setTimeout(() => {
      if (this.active() === id && !node.contains(this.document.activeElement)) {
        this.active.set(null);
      }
    }, 180);
  }

  blur(id: string, node: HTMLElement, event: FocusEvent) {
    if (
      this.active() === id &&
      !node.contains(event.relatedTarget as Node | null)
    )
      this.active.set(null);
  }

  panelBlur(event: FocusEvent, panel: HTMLElement) {
    if (!panel.contains(event.relatedTarget as Node | null))
      this.formFocused.set(false);
  }

  @HostListener('document:keydown.escape')
  dismiss() {
    clearTimeout(this.leaveTimer);
    const id = this.active();
    if (!id) return;
    const button = [
      ...this.host.nativeElement.querySelectorAll<HTMLButtonElement>(
        '[data-game-button]',
      ),
    ].find((item) => item.dataset['gameButton'] === id);
    const focusInGame = button?.parentElement?.contains(
      this.document.activeElement,
    );
    this.active.set(null);
    if (focusInGame) {
      this.restoringFocus = true;
      button?.focus({ preventScroll: true });
      this.restoringFocus = false;
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  outside(event: PointerEvent) {
    if (
      !(event.target instanceof Element) ||
      !this.host.nativeElement.contains(event.target) ||
      !event.target.closest('.orbit')
    )
      this.active.set(null);
  }

  private initializeParallax() {
    const element = this.host.nativeElement;
    const window = this.document.defaultView;
    if (!window) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      element.style.setProperty('--parallax-x', `${x}px`);
      element.style.setProperty('--parallax-y', `${y}px`);
    };
    const move = (event: PointerEvent) => {
      if (
        reduced.matches ||
        !fine.matches ||
        this.paused() ||
        this.formFocused()
      )
        return;
      const bounds = element.getBoundingClientRect();
      x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
      y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const reset = () => {
      x = 0;
      y = 0;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', reset);
    this.destroy.onDestroy(() => {
      window.cancelAnimationFrame(frame);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
    });
  }
}
