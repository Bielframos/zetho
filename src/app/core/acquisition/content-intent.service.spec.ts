import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ContentIntentService } from './content-intent.service';

describe('Content intent', () => {
  const input = {
    source: 'news' as const,
    contentId: 'post-1',
    slug: 'news-game',
    gameId: 'g1',
    position: 'related_games' as const,
  };
  beforeEach(() => {
    sessionStorage.removeItem('zetho:content-intent:v1');
  });
  afterEach(() => {
    sessionStorage.removeItem('zetho:content-intent:v1');
  });
  it('preserves a request across reload and auth, and rejects a different account', () => {
    let service = TestBed.inject(ContentIntentService);
    const request = service.start(input)!;
    service.bind('owner-a');
    TestBed.resetTestingModule();
    service = TestBed.inject(ContentIntentService);
    expect(service.read()?.requestId).toBe(request.requestId);
    expect(service.returnPath('owner-a')).toBe('/noticias/news-game');
    expect(service.returnPath('owner-b')).toBeNull();
    service.bind('owner-b');
    expect(service.read()).toBeNull();
  });
  it('does not regenerate duplicate actions and never resumes cancellation', () => {
    const service = TestBed.inject(ContentIntentService);
    expect(service.start(input)?.requestId).toBe(
      service.start(input)?.requestId,
    );
    service.clear();
    expect(service.returnPath()).toBeNull();
  });
  it('rejects external destinations, stale intents and arbitrary actions', () => {
    for (const change of [
      { slug: '//evil.example' },
      { action: 'delete' },
      { createdAt: Date.now() - 31 * 60_000 },
    ]) {
      sessionStorage.setItem(
        'zetho:content-intent:v1',
        JSON.stringify({
          ...input,
          requestId: 'test-id',
          action: 'wishlist',
          createdAt: Date.now(),
          ...change,
        }),
      );
      expect(TestBed.inject(ContentIntentService).read()).toBeNull();
    }
  });
  it('is inert on the server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    expect(TestBed.inject(ContentIntentService).start(input)).toBeNull();
  });
});
