import { Injectable, computed, effect, signal, untracked } from '@angular/core';
import { ProfileStore } from '../userProfiles/profile.store';
import { AuthStore } from '../auth/auth.store';
import { ConnectionsRepository } from './connections.repository';
import { ConnectionsService } from './connections.service';
import { UserProfileRow } from '../../types';

@Injectable({ providedIn: 'root' })
export class ConnectionsController {
  pageSize = 12;
  connectionType = signal<'followers' | 'following'>('followers');
  profiles = signal<UserProfileRow[]>([]);
  offset = signal(0);
  total = signal(0);
  hasMore = signal(true);
  initialLoading = signal(false);
  loadingMore = signal(false);
  errors = signal<Record<string, string>>({});
  private generation = 0;

  constructor(
    private profileStore: ProfileStore,
    private connectionsRepository: ConnectionsRepository,
    private connections: ConnectionsService,
    private auth: AuthStore,
  ) {
    const profileId = computed(() => this.profileStore.current()?.$id);
    effect(() => {
      const id = profileId(); this.connectionType(); this.connections.revision(); this.auth.user();
      untracked(() => {
        this.resetState();
        if (id) void this.loadConnections();
        else this.initialLoading.set(false);
      });
    });
  }
  setConnectionType = (type: 'followers' | 'following') => this.connectionType.set(type);

  loadConnections = async () => {
    const profileId = this.profileStore.current()?.$id;
    if (!profileId || this.loadingMore()) return;
    const generation = this.generation;
    const type = this.connectionType();
    const offset = this.offset();
    const session = this.auth.user();
    const current = () => generation === this.generation && this.profileStore.current()?.$id === profileId && this.connectionType() === type && this.auth.user() === session;
    this.loadingMore.set(true); this.errors.set({});
    try {
      const result = await (type === 'followers'
        ? this.connectionsRepository.getFollowers(profileId, { pageSize: this.pageSize, offset })
        : this.connectionsRepository.getFollowing(profileId, { pageSize: this.pageSize, offset }));
      if (!current()) return;
      this.profiles.update(previous => [...previous, ...result.rows]);
      this.total.set(result.total);
      this.offset.set(offset + this.pageSize);
      this.hasMore.set(this.offset() < result.total);
    } catch {
      if (current()) this.errors.set({ loadMore: 'Não foi possível atualizar as conexões. Tente novamente.' });
    } finally {
      if (current()) { this.initialLoading.set(false); this.loadingMore.set(false); }
    }
  };

  resetState = () => {
    this.generation++;
    this.profiles.set([]); this.offset.set(0); this.total.set(0);
    this.hasMore.set(true); this.initialLoading.set(true); this.loadingMore.set(false); this.errors.set({});
  };
}
