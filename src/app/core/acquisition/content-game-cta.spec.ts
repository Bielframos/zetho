import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SocialApi } from '../../shared/infra/social-api';
import { ZEntryService } from '../zEntries/zEntries.service';
import { AcquisitionAnalytics } from './acquisition-analytics.service';
import { ContentIntentService } from './content-intent.service';
import { ContentGameCta } from './content-game-cta';

describe('Content game CTA', () => {
  const profile = signal<any>(null);
  let api: jasmine.Spy;
  let events: jasmine.Spy;
  beforeEach(() => {
    sessionStorage.removeItem('zetho:content-intent:v1');
    profile.set(null);
    api = jasmine
      .createSpy()
      .and.resolveTo({ saved: true, firstGameSaved: true });
    events = jasmine.createSpy();
    TestBed.configureTestingModule({
      imports: [ContentGameCta],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { profile, ready: Promise.resolve() } },
        { provide: SocialApi, useValue: { request: api } },
        { provide: AcquisitionAnalytics, useValue: { emit: events } },
        {
          provide: ZEntryService,
          useValue: { getEntry: jasmine.createSpy().and.resolveTo(null) },
        },
      ],
    });
  });
  afterEach(() => sessionStorage.removeItem('zetho:content-intent:v1'));
  function create() {
    const fixture = TestBed.createComponent(ContentGameCta);
    fixture.componentRef.setInput('game', {
      id: 'g1',
      slug: 'game-one',
      name: 'Game One',
    });
    fixture.componentRef.setInput('contentId', 'post1');
    fixture.componentRef.setInput('slug', 'news-one');
    fixture.detectChanges();
    return fixture;
  }
  it('asks an anonymous visitor to log in without persisting an entry', async () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(
      true,
    );
    const fixture = create();
    await fixture.componentInstance.save();
    expect(navigate).toHaveBeenCalledWith(['/entrar']);
    expect(api).not.toHaveBeenCalled();
    expect(TestBed.inject(ContentIntentService).read()?.gameId).toBe('g1');
  });
  it('waits for persistence and suppresses repeated clicks', async () => {
    profile.set({ fingerprint: 'owner' });
    let finish!: (value: any) => void;
    api.and.returnValue(new Promise((resolve) => (finish = resolve)));
    const fixture = create();
    const cta = fixture.componentInstance;
    const pending = cta.save();
    await Promise.resolve();
    await cta.save();
    expect(api).toHaveBeenCalledTimes(1);
    expect(cta.saved()).toBeFalse();
    finish({ saved: true, firstGameSaved: true });
    await pending;
    expect(cta.saved()).toBeTrue();
    expect(events).toHaveBeenCalledWith(
      'first_game_saved',
      {},
      jasmine.objectContaining({ gameId: 'g1', contentId: 'post1' }),
    );
    expect(TestBed.inject(ContentIntentService).read()).toBeNull();
  });
  it('preserves the idempotency key after errors, and permits cancellation', async () => {
    profile.set({ fingerprint: 'owner' });
    api.and.rejectWith(new Error('offline'));
    const cta = create().componentInstance;
    await cta.save();
    const first = api.calls.mostRecent().args[2].requestId;
    expect(cta.saved()).toBeFalse();
    expect(cta.message()).toContain('Não foi possível');
    await cta.save();
    expect(api.calls.mostRecent().args[2].requestId).toBe(first);
    cta.cancel();
    expect(TestBed.inject(ContentIntentService).read()).toBeNull();
  });
  it('invalidates a request before JWT submission when the viewer changes', async () => {
    profile.set({ fingerprint: 'owner-a' });
    const fixture = create();
    await fixture.componentInstance.save();
    const isCurrent = api.calls.mostRecent().args[3];
    profile.set({ fingerprint: 'owner-b' });
    fixture.detectChanges();
    expect(isCurrent()).toBeFalse();
  });
});
