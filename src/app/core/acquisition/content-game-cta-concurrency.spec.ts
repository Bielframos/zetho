import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SocialApi } from '../../shared/infra/social-api';
import { ZEntryService } from '../zEntries/zEntries.service';
import { AcquisitionAnalytics } from './acquisition-analytics.service';
import { ContentIntent, ContentIntentService } from './content-intent.service';
import { ContentGameCta } from './content-game-cta';

type Receipt = { saved: boolean; firstGameSaved: boolean };

describe('Concurrent content CTAs', () => {
  beforeEach(() => sessionStorage.removeItem('zetho:content-intent:v1'));
  afterEach(() => sessionStorage.removeItem('zetho:content-intent:v1'));

  for (const order of [
    ['g1', 'g2'],
    ['g2', 'g1'],
  ]) {
    it(`attributes each completion to its own game when ${order[0]} finishes first`, async () => {
      const pending = new Map<string, (value: Receipt) => void>();
      const events: Array<{
        event: string;
        gameId?: string;
        contentId?: string;
      }> = [];
      let intent: ContentIntentService;
      TestBed.configureTestingModule({
        imports: [ContentGameCta],
        providers: [
          provideRouter([]),
          {
            provide: AuthStore,
            useValue: {
              profile: signal({ fingerprint: 'owner' }),
              ready: Promise.resolve(),
            },
          },
          {
            provide: ZEntryService,
            useValue: { getEntry: () => Promise.resolve(null) },
          },
          {
            provide: SocialApi,
            useValue: {
              request: (
                _path: string,
                _method: string,
                body: { gameId: string },
              ) =>
                new Promise<Receipt>((resolve) =>
                  pending.set(body.gameId, resolve),
                ),
            },
          },
          {
            provide: AcquisitionAnalytics,
            useValue: {
              emit: (
                event: string,
                _extra: unknown,
                context: ContentIntent | null = intent.read(),
              ) =>
                events.push({
                  event,
                  gameId: context?.gameId,
                  contentId: context?.contentId,
                }),
            },
          },
        ],
      });
      intent = TestBed.inject(ContentIntentService);
      const create = (id: string) => {
        const fixture = TestBed.createComponent(ContentGameCta);
        fixture.componentRef.setInput('game', { id, name: id, slug: id });
        fixture.componentRef.setInput('contentId', `post-${id}`);
        fixture.componentRef.setInput('slug', `news-${id}`);
        fixture.detectChanges();
        return fixture.componentInstance;
      };
      const a = create('g1');
      const b = create('g2');
      const savingA = a.save();
      await Promise.resolve();
      const savingB = b.save();
      await Promise.resolve();
      const saves: Record<string, Promise<void>> = { g1: savingA, g2: savingB };

      pending.get(order[0])!({ saved: true, firstGameSaved: true });
      await saves[order[0]];
      expect(events.find((e) => e.event === 'first_game_saved')).toEqual({
        event: 'first_game_saved',
        gameId: order[0],
        contentId: `post-${order[0]}`,
      });
      if (order[0] === 'g1') expect(intent.read()?.gameId).toBe('g2');

      pending.get(order[1])!({ saved: true, firstGameSaved: false });
      await saves[order[1]];
      expect(
        events.filter((e) => e.event === 'content_action_complete'),
      ).toEqual(
        order.map((gameId) => ({
          event: 'content_action_complete',
          gameId,
          contentId: `post-${gameId}`,
        })),
      );
      expect(a.saved()).toBeTrue();
      expect(b.saved()).toBeTrue();
      expect(intent.read()).toBeNull();
    });
  }
});
