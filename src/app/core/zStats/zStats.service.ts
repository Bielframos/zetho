import { Injectable, inject } from '@angular/core';
import { ZStatsRepository } from './zStats.repository';

@Injectable({ providedIn: 'root' })
export class ZStatsService {
  private readonly zStatsRepository = inject(ZStatsRepository);

  getTrendingGames(params: { total: number } = { total: 6 }) {
    return this.zStatsRepository.listTrendingGames(params);
  }
}
