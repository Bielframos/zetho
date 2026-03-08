import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, distinctUntilChanged, filter, map } from 'rxjs';
import { ProfileStore } from '../userProfiles/profile.store';
import { ConnectionsRepository } from './connections.repository';
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
  errors = signal<Record<string, any>>({});

  constructor(
    private profileStore: ProfileStore,
    private connectionsRepository: ConnectionsRepository,
  ) {
    const profile$ = this.profileStore.profile$.pipe(
      filter((profile) => profile !== null && profile !== undefined),
    );

    const connectionType$ = toObservable(this.connectionType);

    combineLatest([profile$, connectionType$])
      .pipe(
        distinctUntilChanged(
          ([prevProfile, prevType], [nextProfile, nextType]) => {
            const sameProfile =
              (prevProfile as any).$id === (nextProfile as any).$id;
            const sameType = prevType === nextType;
            return sameProfile && sameType;
          },
        ),
      )
      .subscribe(([_profile, _type]) => {
        this.resetState();
        void this.loadConnections();
      });
  }

  setConnectionType = (type: 'followers' | 'following') => {
    const currentType = this.connectionType();
    if (currentType !== type) {
      this.connectionType.set(type);
    }
  };

  loadConnections = async () => {
    const profile = this.profileStore.current();

    if (!profile) {
      this.errors.update((s) => ({ ...s, auth: 'Usuário não autenticado.' }));
      return;
    }

    if (this.loadingMore()) return;

    this.loadingMore.set(true);

    try {
      const result =
        this.connectionType() === 'followers'
          ? await this.connectionsRepository.getFollowers(profile.$id, {
              pageSize: this.pageSize,
              offset: this.offset(),
            })
          : await this.connectionsRepository.getFollowing(profile.$id, {
              pageSize: this.pageSize,
              offset: this.offset(),
            });

      this.profiles.update((prev) => [...prev, ...result.rows]);
      this.total.set(result.total);

      const newOffset = this.offset() + this.pageSize;
      this.offset.set(newOffset);
      this.hasMore.set(newOffset < result.total);
    } catch (e) {
      this.errors.update((prev) => ({ ...prev, loadMore: e }));
    } finally {
      this.initialLoading.set(false);
      this.loadingMore.set(false);
    }
  };

  resetState = () => {
    this.profiles.set([]);
    this.offset.set(0);
    this.total.set(0);
    this.hasMore.set(true);
    this.initialLoading.set(true);
    this.loadingMore.set(false);
  };
}
