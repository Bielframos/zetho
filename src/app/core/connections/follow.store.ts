import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { ConnectionsService } from './connections.service';
import { ConnectionRow } from './connections.types';

export interface FollowState {
  known: boolean;
  connection: ConnectionRow | null;
  pending: 'read' | 'follow' | 'unfollow' | null;
  error: string;
  announcement: string;
}
const INITIAL: FollowState = { known: false, connection: null, pending: null, error: '', announcement: '' };

/** One state per session/owner/target, shared by every presentation of the action. */
@Injectable({ providedIn: 'root' })
export class FollowStore {
  private auth = inject(AuthStore);
  private connections = inject(ConnectionsService);
  private states = signal<Record<string, FollowState>>({});
  private generations = new Map<string, number>();
  private session: unknown;
  private owner = '';
  readonly ownerId = computed(() => this.auth.isAuthenticated() ? this.auth.profile()?.$id ?? '' : '');

  constructor() {
    effect(() => {
      const session = this.auth.user();
      const owner = this.ownerId();
      untracked(() => this.syncSession(session, owner));
    });
  }

  private syncSession(session = this.auth.user(), owner = this.ownerId()) {
    if (this.session !== session || this.owner !== owner) {
      this.session = session; this.owner = owner;
      this.states.set({}); this.generations.clear();
    }
  }
  private key(target: string) { return JSON.stringify([this.ownerId(), target]); }
  state(target: string): FollowState { return this.states()[this.key(target)] ?? INITIAL; }
  canFollow(target: string) { return !!this.ownerId() && !!target && target !== this.ownerId(); }
  private update(key: string, value: Partial<FollowState>) {
    this.states.update(states => ({ ...states, [key]: { ...(states[key] ?? INITIAL), ...value } }));
  }
  private context(target: string) {
    this.syncSession();
    const owner = this.ownerId(); const session = this.auth.user(); const key = this.key(target);
    const generation = (this.generations.get(key) ?? 0) + 1;
    this.generations.set(key, generation);
    return { owner, key, current: () => this.auth.user() === session && this.ownerId() === owner && this.generations.get(key) === generation };
  }

  async ensure(target: string) {
    this.syncSession();
    if (!this.canFollow(target)) return;
    const state = this.state(target);
    if (state.known || state.pending || state.error) return;
    await this.refresh(target);
  }

  /** Retry after an uncertain result is always a read, never another mutation. */
  async refresh(target: string) {
    this.syncSession();
    if (!this.canFollow(target) || this.state(target).pending) return;
    const reconcile = !!this.state(target).error;
    const context = this.context(target);
    this.update(context.key, { pending: 'read', error: '' });
    try {
      const connection = await this.connections.getConnection(target, context.owner);
      if (!context.current()) return;
      this.update(context.key, { known: true, connection, pending: null, announcement: connection ? 'Conexão confirmada. Você está seguindo este jogador.' : 'Conexão verificada. Você não segue este jogador.' });
      if (reconcile) this.connections.revision.update(value => value + 1);
    } catch {
      if (context.current()) this.update(context.key, { pending: null, error: this.state(target).known ? 'A conexão foi alterada, mas não foi possível atualizar a consulta.' : 'Não foi possível confirmar a conexão. Verifique antes de tentar novamente.' });
    }
  }

  async setFollowing(target: string, following: boolean) {
    this.syncSession();
    if (!this.canFollow(target)) return;
    const state = this.state(target);
    if (!state.known || state.pending || !!state.connection === following) return;
    const context = this.context(target);
    this.update(context.key, { pending: following ? 'follow' : 'unfollow', error: '', announcement: '' });
    try {
      const connection = await this.connections.setFollowing(target, context.owner, following, context.current);
      if (!context.current()) return;
      this.update(context.key, { known: true, connection, pending: null, announcement: following ? 'Agora você segue este jogador.' : 'Você deixou de seguir este jogador.' });
      // Mutation result is authoritative. A failed refresh cannot roll it back or repeat it.
      await this.refresh(target);
    } catch {
      if (context.current()) this.update(context.key, { known: false, pending: null, error: 'Não foi possível confirmar a alteração. Verifique a conexão antes de tentar novamente.' });
    }
  }
}
