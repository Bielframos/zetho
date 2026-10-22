import { Component, input } from '@angular/core';
import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShaderBackground } from '../../../../shared/ui/shader-background';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { ZStatsService } from '../../../zStats/zStats.service';
import { ZStatsRow } from '../../../zStats/zStats.types';
import { GameRow } from '../../../games/game.types';
import { AuthGameSpace } from './auth-game-space';

@Component({ selector: 'ui-game-card', template: '' })
class CoverStub {
  game = input.required<GameRow>();
  readonlyMode = input(false);
  showEntryStatus = input(false);
}
@Component({ selector: 'ui-shader-background', template: '' })
class ShaderStub {
  paused = input(false);
}

const row = {
  $id: 'stats',
  playingCount: 0,
  completedCount: 12,
  wishlistCount: -1,
  game: {
    $id: 'game',
    name: 'Jogo de teste',
    coverUrl: '/test.jpg',
    slug: 'test',
    ratingAvg: 4,
    ratingCount: 2,
  },
} as ZStatsRow;

describe('AuthGameSpace', () => {
  let stats: jasmine.SpyObj<ZStatsService>;
  beforeEach(() => {
    stats = jasmine.createSpyObj<ZStatsService>('ZStatsService', [
      'getCommunityGames',
    ]);
    stats.getCommunityGames.and.resolveTo([row]);
    TestBed.configureTestingModule({
      imports: [AuthGameSpace],
      providers: [
        provideRouter([]),
        { provide: ZStatsService, useValue: stats },
      ],
    });
    TestBed.overrideComponent(AuthGameSpace, {
      remove: { imports: [UiGameCard, ShaderBackground] },
      add: { imports: [CoverStub, ShaderStub] },
    });
  });
  async function create() {
    const fixture = TestBed.createComponent(AuthGameSpace);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
    return fixture;
  }

  it('exposes real statistics on focus, distinguishes zero from missing data, and returns focus on Escape', async () => {
    const fixture = await create();
    const element: HTMLElement = fixture.nativeElement;
    const cover = element.querySelector<HTMLButtonElement>('.cover')!;
    cover.focus();
    fixture.detectChanges();
    expect(element.querySelector('h2')?.textContent).toContain('Jogo de teste');
    expect(
      [...element.querySelectorAll('dd')].map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['0', '12', '—']);
    const link = element.querySelector<HTMLAnchorElement>('.details a')!;
    link.focus();
    fixture.detectChanges();
    expect(element.querySelector('.details')).not.toBeNull();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(element.querySelector('.details')).toBeNull();
    expect(document.activeElement).toBe(cover);
    expect(cover.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps statistics open while crossing the gap to the panel', fakeAsync(() => {
    const fixture = TestBed.createComponent(AuthGameSpace);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    const orbit: HTMLElement = fixture.nativeElement.querySelector('.orbit');
    orbit.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    fixture.detectChanges();
    orbit.dispatchEvent(new PointerEvent('pointerleave'));
    tick(80);
    expect(fixture.componentInstance.active()).toBe('game');
    orbit.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    tick(200);
    expect(fixture.componentInstance.active()).toBe('game');
    orbit.dispatchEvent(new PointerEvent('pointerleave'));
    tick(200);
    expect(fixture.componentInstance.active()).toBeNull();
    fixture.destroy();
  }));

  it('pauses the scene while editing the form and preserves a manual pause after blur', async () => {
    const fixture = await create();
    const panel = fixture.nativeElement.querySelector('.panel') as HTMLElement;
    const field = document.createElement('input');
    panel.append(field);
    field.focus();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.space').dataset.paused).toBe(
      'true',
    );
    const pause = fixture.nativeElement.querySelector(
      '.motion',
    ) as HTMLButtonElement;
    pause.click();
    pause.focus();
    fixture.detectChanges();
    expect(fixture.componentInstance.formFocused()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.space').dataset.paused).toBe(
      'true',
    );
    pause.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.space').dataset.paused).toBe(
      'false',
    );
  });

  it('allows retry after a catalog failure without removing the authentication panel', async () => {
    stats.getCommunityGames.and.rejectWith(new Error('Offline'));
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('.panel')).not.toBeNull();
    expect(fixture.componentInstance.failed()).toBeTrue();
    stats.getCommunityGames.and.resolveTo([row]);
    await fixture.componentInstance.loadGames();
    fixture.detectChanges();
    expect(fixture.componentInstance.failed()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.cover')).not.toBeNull();
    expect(stats.getCommunityGames).toHaveBeenCalledTimes(2);
  });

  it('ignores a catalog response after the scene has been destroyed', async () => {
    let resolve!: (rows: ZStatsRow[]) => void;
    stats.getCommunityGames.and.returnValue(
      new Promise<ZStatsRow[]>((done) => {
        resolve = done;
      }),
    );
    const fixture = await create();
    const scene = fixture.componentInstance;
    fixture.destroy();
    resolve([row]);
    await Promise.resolve();
    expect(scene.games()).toEqual([]);
  });
});
