import { Injectable } from '@angular/core';
import { UserProfileRow } from '../../types';
import { ConnectionsRepository } from './connections.repository';
import { ConnectionRow } from './connections.types';

@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  myConnectionsCache: Record<string, ConnectionRow> = {};

  constructor(private repository: ConnectionsRepository) {}

  async followOrUnfollow(profileId: string, followerId: string) {
    let existingConnection: ConnectionRow | null = null;

    try {
      existingConnection = await this.repository.findUnique(
        profileId,
        followerId,
      );

      if (existingConnection) {
        await this.repository.delete(existingConnection.$id);
        delete this.myConnectionsCache[profileId];
      } else {
        const connection = await this.repository.create(profileId, followerId);
        this.myConnectionsCache[profileId] = connection;
      }
    } catch (e) {
      throw new Error(
        'Ocorreu um erro ao tentar seguir/deixar de seguir este usuário. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async getConnection(profileId: string, followerId: string) {
    try {
      let connection: ConnectionRow | null = null;

      const cachedConnection = this.myConnectionsCache[profileId];

      if (cachedConnection && cachedConnection.targetProfileId === followerId) {
        connection = cachedConnection;
      } else {
        connection = await this.repository.findUnique(profileId, followerId);

        if (connection) {
          this.myConnectionsCache[profileId] = connection;
        }
      }

      return connection;
    } catch (e) {
      throw new Error(
        'Ocorreu um erro ao verificar a conexão. Por favor, tente novamente mais tarde.',
      );
    }
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
