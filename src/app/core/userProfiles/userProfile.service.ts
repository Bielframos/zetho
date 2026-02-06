import { Injectable } from '@angular/core';
import { UserProfile, UserProfileRow } from '../../types';
import { UserProfileRepository } from './userProfile.repository';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  constructor(private repository: UserProfileRepository) {}

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
}
