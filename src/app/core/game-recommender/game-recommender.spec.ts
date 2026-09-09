import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../auth/auth.store';
import { SeoService } from '../system/seo/seo.service';
import { GameRecommenderPage } from './game-recommender';
import {
  GameRecommendation,
  GameRecommenderService,
  RecommendationError,
} from './game-recommender.service';

const result: GameRecommendation = {
  id: 'recommendation-1',
  source: 'new',
  game: {
    id: 'game-1',
    name: 'Hollow Knight',
    slug: 'hollow-knight',
    coverUrl: null,
    releaseYear: '2017',
    genres: [],
    ratingAvg: 4.5,
  },
  reason:
    'Uma aventura de exploração para quem gosta de descobrir novos caminhos.',
  matchSignals: ['Exploração', 'Desafio'],
  basedOnGames: [],
  cost: 10,
  balance: 32,
  generatedAt: '2026-09-09T20:00:00.000Z',
};

describe('GameRecommenderPage', () => {
  let page: GameRecommenderPage;
  let api: jasmine.SpyObj<GameRecommenderService>;
  let seo: jasmine.SpyObj<SeoService>;
  const profile = signal({ zcoinBalance: 42 });
  const owner = signal({ $id: 'recommendation-test-user' });
  const setBalance = jasmine.createSpy('setZcoinBalance');

  beforeEach(() => {
    sessionStorage.removeItem('zetho:recommendation:recommendation-test-user');
    profile.set({ zcoinBalance: 42 });
    owner.set({ $id: 'recommendation-test-user' });
    setBalance.calls.reset();
    api = jasmine.createSpyObj<GameRecommenderService>('api', [
      'suggest',
      'history',
    ]);
    seo = jasmine.createSpyObj<SeoService>('seo', ['apply']);
    api.history.and.resolveTo({ items: [], nextCursor: null });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: { user: owner, profile, setZcoinBalance: setBalance },
        },
        { provide: GameRecommenderService, useValue: api },
        { provide: SeoService, useValue: seo },
      ],
    });
    page = TestBed.runInInjectionContext(() => new GameRecommenderPage());
  });
  afterEach(() =>
    sessionStorage.removeItem('zetho:recommendation:recommendation-test-user'),
  );

  it('publishes indexable SSR metadata with the recommendation social image', () => {
    page.ngOnInit();

    expect(seo.apply).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        title: 'Descubra seu próximo jogo com a Zetho',
        canonical: '/recomendacoes',
        robots: 'index, follow',
        ogImage: '/your-next-game.webp',
        twitterCard: 'summary_large_image',
      }),
    );
  });

  it('uses one key across network failures and reloads, including after coins were reserved', async () => {
    api.suggest.and.rejectWith(new TypeError('offline'));
    await page.generate();
    const key = api.suggest.calls.first().args[1];
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    profile.set({ zcoinBalance: 0 });
    const reloaded = TestBed.runInInjectionContext(
      () => new GameRecommenderPage(),
    );
    reloaded.ngOnInit();
    api.suggest.and.resolveTo(result);
    await reloaded.generate();
    expect(api.suggest.calls.mostRecent().args).toEqual(['any', key]);
    expect(reloaded.latest()).toEqual(result);
    expect(setBalance).toHaveBeenCalledOnceWith(32);
    expect(reloaded.pending()).toBeNull();
  });

  it('prevents concurrent clicks and keeps a pending 409 retry idempotent', async () => {
    let reject!: (reason: unknown) => void;
    api.suggest.and.returnValue(
      new Promise((_resolve, fail) => (reject = fail)),
    );
    const request = page.generate();
    await page.generate();
    expect(api.suggest).toHaveBeenCalledTimes(1);
    reject(new RecommendationError(409));
    await request;
    const key = page.pending()!.key;
    api.suggest.and.resolveTo(result);
    await page.generate();
    expect(api.suggest.calls.mostRecent().args[1]).toBe(key);
  });

  it('does not charge or request a recommendation with insufficient displayed balance', async () => {
    profile.set({ zcoinBalance: 9 });
    await page.generate();
    expect(api.suggest).not.toHaveBeenCalled();
  });

  it('makes the daily limit clear and prevents another request after loading today history', async () => {
    api.history.and.resolveTo({
      items: [{ ...result, generatedAt: new Date().toISOString() }],
      nextCursor: null,
    });

    await page.loadHistory();
    await page.generate();

    expect(page.dailyLimitReached()).toBeTrue();
    expect(api.suggest).not.toHaveBeenCalled();
  });

  it('handles the server daily-limit response as terminal for the attempt', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    api.suggest.and.rejectWith(
      new RecommendationError(429, 'GAME_RECOMMENDATION_DAILY_LIMIT', tomorrow),
    );

    await page.generate();

    expect(page.pending()).toBeNull();
    expect(page.dailyLimitReached()).toBeTrue();
    expect(page.error()).toContain('recomendação de hoje');
  });

  it('allows a new key after a terminal provider failure', async () => {
    api.suggest.and.rejectWith(new RecommendationError(502));
    await page.generate();
    const key = api.suggest.calls.first().args[1];
    expect(page.pending()).toBeNull();
    expect(page.error()).toContain('estornada automaticamente');
    api.suggest.and.resolveTo(result);
    await page.generate();
    expect(api.suggest.calls.mostRecent().args[1]).not.toBe(key);
  });

  it('paginates history, deduplicates and never resets balance from historical snapshots', async () => {
    api.history.and.resolveTo({ items: [result], nextCursor: 'next' });
    await page.loadHistory();
    api.history.and.resolveTo({
      items: [
        result,
        { ...result, id: 'older', generatedAt: '2026-09-08T20:00:00.000Z' },
      ],
      nextCursor: null,
    });
    await page.loadHistory();
    expect(api.history.calls.mostRecent().args).toEqual(['next']);
    expect(page.history().map((item) => item.id)).toEqual([
      'recommendation-1',
      'older',
    ]);
    expect(setBalance).not.toHaveBeenCalled();
  });

  it('ignores results if the authenticated user changes during the request', async () => {
    api.suggest.and.callFake(async () => {
      owner.set({ $id: 'different-user' });
      return result;
    });
    await page.generate();
    expect(page.latest()).toBeNull();
    expect(setBalance).not.toHaveBeenCalled();
  });
});

describe('GameRecommenderService', () => {
  it('sends session auth and idempotency headers, with only scope in the body', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { getJwt: async () => 'test-jwt' } },
      ],
    });
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify(result), { status: 201 }),
    );
    await TestBed.inject(GameRecommenderService).suggest(
      'library',
      'request-key',
    );
    const [url, init] = fetchSpy.calls.mostRecent().args;
    expect(String(url)).toContain('/agents/game-recommender/suggestions');
    expect(new Headers(init?.headers).get('Authorization')).toBe(
      'Bearer test-jwt',
    );
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe(
      'request-key',
    );
    expect(JSON.parse(init!.body as string)).toEqual({ scope: 'library' });
    expect(init?.cache).toBe('no-store');
  });
});
