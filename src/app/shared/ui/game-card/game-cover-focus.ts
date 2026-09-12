import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GameRow } from '../../../types';
import { UiLoading } from '../loading';
import { UiZethoIcon } from '../zetho-icon';
import { QuickEntryStatus } from './game-quick-entry.store';

@Component({
  selector: 'ui-game-cover-focus',
  standalone: true,
  imports: [UiLoading, UiZethoIcon],
  templateUrl: './game-cover-focus.html',
  styleUrl: './game-cover-focus.css',
})
export class UiGameCoverFocus {
  readonly game = input.required<GameRow>();
  readonly originElement = input.required<HTMLElement>();
  readonly status = input<QuickEntryStatus | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly unavailable = input(false);
  readonly loadError = input(false);
  readonly chooseStatus = output<QuickEntryStatus>();
  readonly retryLoad = output<void>();
  readonly closed = output<void>();
  readonly closing = signal(false);

  readonly actions: {
    status: QuickEntryStatus;
    label: string;
    icon: string;
  }[] = [
    { status: 'completed', label: 'Zerei', icon: 'ph-trophy' },
    { status: 'backlog', label: 'Biblioteca', icon: 'ph-books' },
    { status: 'playing', label: 'Jogando', icon: 'ph-game-controller' },
    { status: 'dropped', label: 'Dropei', icon: 'ph-x-circle' },
  ];

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cover = viewChild.required<ElementRef<HTMLElement>>('cover');
  private readonly scrim = viewChild.required<ElementRef<HTMLElement>>('scrim');
  private readonly controls =
    viewChild.required<ElementRef<HTMLElement>>('controls');
  private animations: Animation[] = [];
  private restore: (() => void) | undefined;
  private reducedMotion = false;
  private openingGesture = true;

  constructor() {
    afterNextRender(() => this.open());
    this.destroyRef.onDestroy(() => {
      this.animations.forEach((animation) => animation.cancel());
      if (this.restore) this.dialog().nativeElement.close();
      this.restore?.();
    });
  }

  private open(): void {
    // The release of the held touch can synthesize a click on the scrim after
    // the cover moves. Only a new pointer-down starts an intentional action.
    const dialog = this.dialog().nativeElement;
    const startInteraction = () => {
      this.openingGesture = false;
    };
    const ignoreHeldRelease = (event: MouseEvent) => {
      if (this.openingGesture && event.detail > 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.openingGesture = false;
      }
    };
    dialog.addEventListener('pointerdown', startInteraction, true);
    dialog.addEventListener('click', ignoreHeldRelease, true);
    this.destroyRef.onDestroy(() => {
      dialog.removeEventListener('pointerdown', startInteraction, true);
      dialog.removeEventListener('click', ignoreHeldRelease, true);
    });
    const origin = this.originElement();
    const originalVisibility = origin.style.visibility;
    const originalOverflow = this.document.body.style.overflow;
    const previousFocus = this.document.activeElement;
    const start = origin.getBoundingClientRect();
    this.reducedMotion = !!this.document.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    this.document.body.style.overflow = 'hidden';
    this.dialog().nativeElement.showModal();
    origin.style.visibility = 'hidden';
    this.restore = () => {
      origin.style.visibility = originalVisibility;
      this.document.body.style.overflow = originalOverflow;
      if (origin.isConnected) origin.focus({ preventScroll: true });
      else if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      )
        previousFocus.focus({ preventScroll: true });
      this.restore = undefined;
    };
    if (!this.reducedMotion) {
      this.animate(
        this.cover().nativeElement,
        [{ transform: this.originTransform(start) }, { transform: 'none' }],
        320,
      );
      this.animate(
        this.scrim().nativeElement,
        [{ opacity: 0 }, { opacity: 1 }],
        260,
      );
      this.animate(
        this.controls().nativeElement,
        [
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' },
        ],
        240,
        100,
      );
    }
  }

  onCancel(event: Event): void {
    event.preventDefault();
    void this.close();
  }

  select(status: QuickEntryStatus): void {
    if (
      this.loading() ||
      this.saving() ||
      this.unavailable() ||
      this.loadError() ||
      this.closing()
    )
      return;
    this.chooseStatus.emit(status);
  }

  async close(): Promise<void> {
    if (this.closing() || this.destroyRef.destroyed) return;
    this.closing.set(true);
    // Snapshot before cancelling: closing mid-flight must start at the visible pose.
    const coverStyle = getComputedStyle(this.cover().nativeElement);
    const coverPose = {
      transform: coverStyle.transform,
      opacity: coverStyle.opacity,
    };
    const scrimOpacity = getComputedStyle(this.scrim().nativeElement).opacity;
    const controlsStyle = getComputedStyle(this.controls().nativeElement);
    const controlsPose = {
      transform: controlsStyle.transform,
      opacity: controlsStyle.opacity,
    };
    this.animations.forEach((animation) => animation.cancel());
    this.animations = [];
    if (!this.reducedMotion) {
      const origin = this.originElement();
      this.animate(
        this.cover().nativeElement,
        [
          coverPose,
          {
            transform: origin.isConnected
              ? this.originTransform(origin.getBoundingClientRect())
              : 'scale(.95)',
            opacity: origin.isConnected ? 1 : 0,
          },
        ],
        260,
      );
      this.animate(
        this.scrim().nativeElement,
        [{ opacity: scrimOpacity }, { opacity: 0 }],
        260,
      );
      this.animate(
        this.controls().nativeElement,
        [controlsPose, { transform: controlsPose.transform, opacity: 0 }],
        120,
      );
      await Promise.allSettled(
        this.animations.map((animation) => animation.finished),
      );
    }
    if (this.destroyRef.destroyed) return;
    this.dialog().nativeElement.close();
    this.restore?.();
    this.closed.emit();
  }

  private originTransform(origin: DOMRect): string {
    const target = this.cover().nativeElement.getBoundingClientRect();
    if (!target.width || !target.height) return 'none';
    return `translate(${origin.left - target.left}px, ${origin.top - target.top}px) scale(${origin.width / target.width}, ${origin.height / target.height})`;
  }

  private animate(
    element: HTMLElement,
    keyframes: Keyframe[],
    duration: number,
    delay = 0,
  ): void {
    this.animations.push(
      element.animate(keyframes, {
        duration,
        delay,
        easing: 'cubic-bezier(.22, 1, .36, 1)',
        fill: 'both',
      }),
    );
  }
}
