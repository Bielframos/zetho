import { Injectable, signal } from '@angular/core';
import { UserProfileRow } from '../../types';
import { ConnectionsRepository } from './connections.repository';
import { ConnectionRow } from './connections.types';

@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  readonly revision = signal(0);

  constructor(private repository: ConnectionsRepository) {}

  async setFollowing(profileId: string, followerId: string, following: boolean, isCurrent: () => boolean) {
    const assertCurrent = () => { if (!isCurrent()) throw new Error('Sessão alterada.'); };
    assertCurrent();
    if (!profileId || !followerId || profileId === followerId) throw new Error('Conexão inválida.');
    let connection: ConnectionRow | null;
    if (following) {
      // POST is idempotent: an existing connection is returned, never toggled.
      connection = await this.repository.create(profileId, followerId, isCurrent);
    } else {
      const existing = await this.repository.findUnique(profileId, followerId);
      assertCurrent();
      if (existing) await this.repository.delete(existing.$id, isCurrent);
      connection = null;
    }
    assertCurrent();
    this.revision.update(value => value + 1);
    return connection;
  }

  async getConnection(profileId: string, followerId: string) {
    // No target-only cache: reads must belong to the current owner/target pair.
    const connection = await this.repository.findUnique(profileId, followerId);
    if (connection && (connection.requesterProfileId !== followerId || connection.targetProfileId !== profileId)) {
      throw new Error('Conexão incompatível com o perfil.');
    }
    return connection;
  }

  async searchConnections(
    profileId: string,
    query = '',
  ): Promise<UserProfileRow[]> {
    const [followers, following] = await Promise.all([
      this.repository.getFollowers(profileId, { pageSize: 100, offset: 0 }),
      this.repository.getFollowing(profileId, { pageSize: 100, offset: 0 }),
    ]);

    const profilesById = new Map<string, UserProfileRow>();
    for (const profile of [...followers.rows, ...following.rows]) {
      profilesById.set(profile.$id, profile);
    }

    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return Array.from(profilesById.values())
      .filter((profile) => {
        if (!normalizedQuery) return true;
        return profile.gamertag
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedQuery);
      })
      .sort((a, b) => a.gamertag.localeCompare(b.gamertag, 'pt-BR'));
  }
}
