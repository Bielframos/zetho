import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';
import { FollowStore } from '../../core/connections/follow.store';

@Component({
  selector: 'ui-follow-control',
  host: { '[style.width]': "variant() === 'icon' ? '44px' : compact() ? '132px' : '156px'" },
  styles: `
    :host { display: block; position: relative; max-width: 100%; min-width: 0; }
    .follow-button { display: flex; align-items: center; justify-content: center; gap: .5rem; width: 100%; min-height: 44px; padding: .5rem; border: 1px solid currentColor; border-radius: .5rem; font-size: .875rem; cursor: pointer; }
    .follow-button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
    .follow-button:active:not(:disabled) { box-shadow: inset 0 0 0 2px currentColor; }
    .follow-button:disabled { cursor: default; }
    .follow-button:disabled:not([aria-busy="true"]) { border-style: dashed; }
    .follow-primary { color: var(--color-on-accent); background: var(--blue-9); border-color: var(--blue-9); }
    .follow-primary:hover:not(:disabled) { background: var(--blue-10); border-color: var(--blue-10); }
    .follow-secondary { background: var(--gray-2); color: inherit; }
    .follow-secondary:hover:not(:disabled) { text-decoration: underline; background: var(--gray-3); }
    .follow-icon { width: 44px; height: 44px; border-color: transparent; background: var(--gray-2); color: inherit; }
    .follow-icon:hover:not(:disabled) { background: var(--gray-3); }
    .follow-icon.following { background: var(--gray-3); }
    .follow-icon:disabled { opacity: .65; }
    .icon-feedback { position: absolute; top: calc(100% + 6px); right: 0; z-index: 40; width: min(210px, calc(100vw - 64px)); padding: .75rem; border: 1px solid currentColor; border-radius: .5rem; background: var(--gray-2); color: inherit; }
    .icon-feedback .follow-error { margin-top: 0; }
    .follow-menu { position: absolute; z-index: 30; right: 0; top: calc(100% + 6px); width: max(100%, 190px); max-width: calc(100vw - 32px); padding: .5rem; background: var(--gray-2); color: inherit; border: 1px solid currentColor; border-radius: .5rem; }
    .follow-menu button { border-color: transparent; white-space: nowrap; }
    .follow-error { margin-top: .5rem; font-size: .75rem; overflow-wrap: anywhere; }
    .follow-error + button { margin-top: .5rem; }
    @media (prefers-reduced-motion: no-preference) { .spinning { animation: follow-spin 1s linear infinite; } }
    @keyframes follow-spin { to { transform: rotate(360deg); } }
  `,
  template: `
    @if (visible()) {
      <button #trigger type="button" class="follow-button"
        [class.follow-primary]="variant() !== 'icon' && state().known && !state().connection"
        [class.follow-secondary]="variant() !== 'icon' && (!state().known || !!state().connection)"
        [class.follow-icon]="variant() === 'icon'" [class.following]="!!state().connection"
        [disabled]="!!state().pending || !state().known"
        [attr.aria-label]="buttonLabel() + ' ' + gamertag()"
        [title]="buttonLabel() + ' ' + gamertag()"
        [attr.aria-busy]="!!state().pending"
        [attr.aria-expanded]="variant() !== 'icon' && state().connection ? expanded() : null"
        (click)="activate()">
        @if (state().pending) { <i class="ph ph-circle-notch spinning" aria-hidden="true"></i> }
        @else if (state().connection && state().known) { <i class="ph" [class.ph-user-minus]="variant() === 'icon'" [class.ph-check]="variant() !== 'icon'" aria-hidden="true"></i> }
        @else if (state().known) { <i class="ph ph-user-plus" aria-hidden="true"></i> }
        @else { <i class="ph ph-warning-circle" aria-hidden="true"></i> }
        @if (variant() !== 'icon') { {{ buttonLabel() }} }
        @if (variant() !== 'icon' && state().connection && !state().pending && state().known) { <i class="ph" [class.ph-caret-up]="expanded()" [class.ph-caret-down]="!expanded()" aria-hidden="true"></i> }
      </button>
      @if (expanded() && state().known && state().connection && !state().pending) {
        <div class="follow-menu">
          <button type="button" class="follow-button follow-secondary" [attr.aria-label]="'Deixar de seguir ' + gamertag()" (click)="unfollow()"><i class="ph ph-user-minus" aria-hidden="true"></i>Deixar de seguir</button>
        </div>
      }
      @if (state().error) {
        <div [class.icon-feedback]="variant() === 'icon'">
        <p class="follow-error" role="alert"><i class="ph ph-warning-circle" aria-hidden="true"></i> {{ state().error }}</p>
        <button type="button" class="follow-button follow-secondary" [disabled]="!!state().pending" (click)="retry()">{{ state().known ? 'Atualizar consulta' : 'Verificar novamente' }}</button>
        </div>
      }
      <span class="sr-only" aria-live="polite" aria-atomic="true">{{ state().announcement }}</span>
    }
  `,
})
export class FollowControl {
  readonly profileId = input.required<string>();
  readonly gamertag = input.required<string>();
  readonly compact = input(false);
  readonly variant = input<'default' | 'icon'>('default');
  readonly store = inject(FollowStore);
  private auth = inject(AuthStore);
  private element = inject(ElementRef);
  private document = inject(DOCUMENT);
  private destroy = inject(DestroyRef);
  private trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  readonly expanded = signal(false);
  readonly state = computed(() => this.store.state(this.profileId()));
  readonly visible = computed(() => this.store.canFollow(this.profileId()));
  readonly buttonLabel = computed(() => {
    const state = this.state();
    if (state.pending === 'follow') return 'Seguindo…';
    if (state.pending === 'unfollow') return 'Removendo…';
    if (state.pending === 'read' && !state.known) return 'Verificando…';
    if (!state.known) return 'Indisponível';
    return state.connection ? (this.variant() === 'icon' ? 'Deixar de seguir' : 'Seguindo') : 'Seguir';
  });
  constructor() {
    effect(() => {
      const target = this.profileId(); this.auth.user(); this.store.ownerId();
      untracked(() => { this.expanded.set(false); void this.store.ensure(target); });
    });
  }
  activate() {
    if (this.state().pending || !this.state().known) return;
    if (this.state().connection && this.variant() === 'icon') void this.save(false);
    else if (this.state().connection) this.expanded.update(value => !value);
    else void this.save(true);
  }
  unfollow() { void this.save(false); }
  private save(following: boolean) {
    const target = this.profileId();
    return this.withFocusRecovery(() => this.store.setFollowing(target, following));
  }
  retry() {
    const target = this.profileId();
    void this.withFocusRecovery(() => this.store.refresh(target));
  }
  private async withFocusRecovery(operation: () => Promise<void>) {
    const target = this.profileId(); const session = this.auth.user();
    let moved = false;
    const interaction = () => { moved = true; };
    const cleanup = () => {
      this.document.removeEventListener('pointerdown', interaction, true);
      this.document.removeEventListener('keydown', interaction, true);
    };
    this.document.addEventListener('pointerdown', interaction, true);
    this.document.addEventListener('keydown', interaction, true);
    const unregister = this.destroy.onDestroy(cleanup);
    this.expanded.set(false);
    await operation();
    this.document.defaultView?.setTimeout(() => {
      cleanup(); unregister();
      const trigger = this.trigger()?.nativeElement;
      const focusTarget = trigger?.disabled ? this.element.nativeElement.querySelector('.follow-error + button') as HTMLButtonElement | null : trigger;
      if (!moved && target === this.profileId() && session === this.auth.user() &&
          this.element.nativeElement.isConnected && this.element.nativeElement.getClientRects().length &&
          (this.document.activeElement === this.document.body || this.document.activeElement === trigger) && focusTarget && !focusTarget.disabled) focusTarget.focus();
    });
  }
  @HostListener('document:click', ['$event']) outside(event: Event) {
    if (!this.element.nativeElement.contains(event.target)) this.expanded.set(false);
  }
  @HostListener('keydown.escape', ['$event']) escape(event: Event) {
    if (!this.expanded()) return;
    event.stopPropagation(); this.expanded.set(false); this.trigger()?.nativeElement.focus();
  }
}
