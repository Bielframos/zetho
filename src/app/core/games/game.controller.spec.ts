import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameController } from './game.controller';
import { GameService } from './games.service';
import { AuthStore } from '../auth/auth.store';
import { ZEntryService } from '../zEntries/zEntries.service';
import { ZCoinsService } from '../zCoins/zcoins.service';
import { NotificationStore } from '../system/notifications/notification.store';

describe('GameController concurrent loads', () => {
  it('keeps the authenticated entry when an older anonymous request finishes last', async () => {
    let finishOld!: (value: any) => void;
    const user = signal<any>(null),
      profile = signal<any>(null);
    const data = {
      game: { $id: 'game' },
      zEntry: { status: 'completed' },
      similarGames: [],
      medias: [],
      heroImage: null,
    };
    const loadGamePage = jasmine
      .createSpy()
      .and.returnValues(
        new Promise((resolve) => (finishOld = resolve)),
        Promise.resolve(data),
      );
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: {} },
        { provide: GameService, useValue: { loadGamePage } },
        { provide: AuthStore, useValue: { user, profile } },
        { provide: ZEntryService, useValue: {} },
        { provide: ZCoinsService, useValue: {} },
        { provide: NotificationStore, useValue: {} },
      ],
    });
    const controller = TestBed.inject(GameController);
    const old = controller.loadPage('example');
    user.set({ $id: 'user' });
    profile.set({ fingerprint: 'owner' });
    await controller.loadPage('example');
    finishOld({ ...data, zEntry: null });
    await old;
    expect(controller.zEntry()?.status).toBe('completed');
    expect(controller.loading()).toBeFalse();
  });
});
