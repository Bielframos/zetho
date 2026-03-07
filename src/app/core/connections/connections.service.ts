import { Injectable } from '@angular/core';
import { ConnectionsRepository } from './connections.repository';
import { ConnectionRow } from './connections.types';

@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  connectionsCache: Record<string, ConnectionRow> = {};

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
        delete this.connectionsCache[profileId];
      } else {
        const connection = await this.repository.create(profileId, followerId);
        this.connectionsCache[profileId] = connection;
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

      const cachedConnection = this.connectionsCache[profileId];

      if (cachedConnection && cachedConnection.targetProfileId === followerId) {
        connection = cachedConnection;
      } else {
        connection = await this.repository.findUnique(profileId, followerId);

        if (connection) {
          this.connectionsCache[profileId] = connection;
        }
      }

      return connection;
    } catch (e) {
      throw new Error(
        'Ocorreu um erro ao verificar a conexão. Por favor, tente novamente mais tarde.',
      );
    }
  }
}
