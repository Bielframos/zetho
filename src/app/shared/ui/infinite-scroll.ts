import {
  Directive,
  ElementRef,
  DestroyRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Observa o elemento host (uma "sentinela" no fim de uma lista) e emite
 * `scrolled` quando ele entra na viewport, permitindo carregar o próximo lote
 * antes de o usuário chegar de fato ao fim — scroll infinito.
 *
 * Uso:
 *   <div uiInfiniteScroll
 *        [disabled]="loading() || !hasMore()"
 *        (scrolled)="loadMore()"></div>
 */
@Directive({
  selector: '[uiInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);

  /** Impede o disparo (ex.: já carregando ou sem mais itens). */
  disabled = input(false);

  /** Margem para pré-carregar antes de a sentinela ficar visível. */
  rootMargin = input('400px');

  /** Emitido quando a sentinela fica visível e o carregamento é permitido. */
  scrolled = output<void>();

  private isIntersecting = false;

  constructor() {
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          this.isIntersecting = entries[0]?.isIntersecting ?? false;
          this.maybeEmit();
        },
        { rootMargin: this.rootMargin() },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    // Listas curtas: se a sentinela continua visível após um lote terminar,
    // reavaliamos quando `disabled` volta a false para seguir preenchendo.
    effect(() => {
      this.disabled();
      this.maybeEmit();
    });
  }

  private maybeEmit() {
    if (!this.disabled() && this.isIntersecting) {
      this.scrolled.emit();
    }
  }
}
