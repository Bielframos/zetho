import { Injectable } from '@angular/core';
import { UserProfile, UserProfileRow } from '../../types';
import { UserProfileRepository } from './userProfile.repository';
import { extractKeywords } from '../search/search.helpers';
import { ConnectionsService } from '../connections/connections.service';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  constructor(
    private repository: UserProfileRepository,
    private connectionsService: ConnectionsService,
  ) {}

  async getProfileByUserId(userId: string): Promise<UserProfileRow | null> {
    return this.repository.findByUserId(userId);
  }

  async getProfileByGamertag(gamertag: string): Promise<UserProfileRow | null> {
    return this.repository.findByGamertag(gamertag);
  }

  async createProfile(userId: string, gamertag: string): Promise<void> {
    const gamertagInUse = await this.repository.existsByGamertag(gamertag);

    if (gamertagInUse) {
      throw new Error('Gamertag já está em uso.');
    }

    await this.repository.create(userId, gamertag);
  }

  async isValidGamertag(gamertag: string): Promise<boolean> {
    return !(await this.repository.existsByGamertag(gamertag));
  }

  async updateProfile(
    profileId: string,
    newProfile: Partial<UserProfile>,
  ): Promise<UserProfileRow> {
    return this.repository.update(profileId, newProfile);
  }

  async getProfileCount(): Promise<number> {
    return this.repository.count();
  }

  async searchProfile(
    query: string,
    opts: { pageSize?: number; offset?: number },
  ) {
    const pageSize = opts?.pageSize ?? 12;
    const offset = opts?.offset ?? 0;

    const keywords = extractKeywords(query);

    const exact =
      offset === 0 ? await this.repository.findByGamertag(query) : null;

    const matches = await this.repository.findByKeywords(keywords, {
      pageSize,
      offset,
      excludeGamertag: exact?.gamertag,
    });

    return {
      total: matches.total + (exact ? 1 : 0),
      rows: exact ? [exact, ...matches.rows] : matches.rows,
    };
  }

  async toggleFollow(profileId: string, followerId: string) {
    const connection = await this.connectionsService.followOrUnfollow(
      profileId,
      followerId,
    );

    return connection;
  }
}
