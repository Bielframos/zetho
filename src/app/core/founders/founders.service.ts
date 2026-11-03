import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../shared/infra/social-api';

export interface Founder {
  profileId: string;
  gamertag: string;
  number: number;
  avatarUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class FoundersService {
  private readonly api = inject(SocialApi);

  list(): Promise<Founder[]> {
    return this.api.requestPublic<Founder[]>('achievements/founders');
  }
}
