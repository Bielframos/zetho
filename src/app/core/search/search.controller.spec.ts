import { SearchController } from './search.controller';
import { GameService } from '../games/games.service';
import { UserProfileService } from '../userProfiles/userProfile.service';
import { AuthStore } from '../auth/auth.store';

describe('Search error recovery', () => {
  for (const kind of ['games', 'players'] as const) {
    it(`distinguishes ${kind} failures from empty results and recovers on retry`, async () => {
      const games = { searchGame: jasmine.createSpy().and.rejectWith(new Error('Offline')) };
      const players = { searchProfile: jasmine.createSpy().and.rejectWith(new Error('Offline')) };
      const controller = new SearchController(
        games as unknown as GameService,
        players as unknown as UserProfileService,
        { profile: () => null } as unknown as AuthStore,
      );
      controller.search('test');
      await controller[kind].reload();
      expect(controller[kind].error()).toBeTrue();
      expect(controller[kind].loading()).toBeFalse();
      games.searchGame.and.resolveTo({ rows: [], total: 0 });
      players.searchProfile.and.resolveTo({ rows: [], total: 0 });
      await controller[kind].reload();
      expect(controller[kind].error()).toBeFalse();
      expect(controller[kind].total()).toBe(0);
    });
  }
});
