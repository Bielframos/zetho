import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { GameStore } from '../../../core/games/game.store';
import { UiGameCard, igdbCoverLoader } from './game-card';
import { GameQuickEntryStore } from './game-quick-entry.store';

// Gesture tests deliberately stop before rendering the overlay, which has its own integration tests.
describe('Game cover gestures', () => {
  const eligible = signal(true);
  const setGame = jasmine.createSpy('setGame');
  beforeEach(() => {
    eligible.set(true);
    setGame.calls.reset();
    TestBed.configureTestingModule({
      imports: [UiGameCard],
      providers: [
        provideRouter([]),
        {
          provide: GameStore,
          useValue: { currentGame: signal(null), setGame },
        },
        {
          provide: GameQuickEntryStore,
          useValue: { eligible, statusFor: () => undefined },
        },
      ],
    });
  });
  function create(readonlyMode = false) {
    const fixture = TestBed.createComponent(UiGameCard);
    fixture.componentRef.setInput('game', {
      $id: 'game',
      slug: 'game',
      name: 'Game',
      coverUrl: null,
    });
    fixture.componentRef.setInput('readonlyMode', readonlyMode);
    fixture.detectChanges();
    return fixture;
  }
  function touch(x = 30, y = 40) {
    return new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      clientX: x,
      clientY: y,
    });
  }
  it('opens on a held touch and suppresses the subsequent link click', fakeAsync(() => {
    const fixture = create();
    const anchor = fixture.nativeElement.querySelector(
      'a',
    ) as HTMLAnchorElement;
    const navigation = spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture.componentInstance.onPointerDown(touch());
    tick(419);
    expect(fixture.componentInstance.quickContext()).toBeNull();
    tick(1);
    expect(fixture.componentInstance.quickContext()?.mobile).toBeTrue();
    fixture.componentInstance.cancelHold();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(click);
    expect(click.defaultPrevented).toBeTrue();
    expect(navigation).not.toHaveBeenCalled();
    expect(setGame).not.toHaveBeenCalled();
    fixture.destroy();
  }));
  it('cancels for movement, short tap and pointer cancellation', fakeAsync(() => {
    const fixture = create();
    const card = fixture.componentInstance;
    card.onPointerDown(touch());
    card.onPointerMove(
      new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 30,
        clientY: 60,
      }),
    );
    tick(500);
    expect(card.quickContext()).toBeNull();
    card.onPointerDown(touch());
    tick(100);
    card.cancelHold();
    tick(500);
    expect(card.quickContext()).toBeNull();
    expect(card.pressing()).toBeFalse();
    fixture.destroy();
  }));
  it('scopes transition names to the container and item', () => {
    const first = create();
    const second = create();
    first.componentRef.setInput('transitionScope', 'library');
    first.componentRef.setInput('transitionItemId', 'entry-1');
    second.componentRef.setInput('transitionScope', 'library');
    second.componentRef.setInput('transitionItemId', 'entry-2');
    first.detectChanges();
    second.detectChanges();
    const firstName = (first.nativeElement.querySelector('.base-card') as HTMLElement).style.viewTransitionName;
    const secondName = (second.nativeElement.querySelector('.base-card') as HTMLElement).style.viewTransitionName;
    expect(firstName).toBe('game-library-entry-1');
    expect(secondName).toBe('game-library-entry-2');
    expect(firstName).not.toBe(secondName);
    first.destroy();
    second.destroy();
  });
  it('preserves the native context menu for guests and keeps readonly covers passive', () => {
    eligible.set(false);
    const fixture = create();
    const contextmenu = new MouseEvent('contextmenu', { cancelable: true });
    fixture.componentInstance.onContextMenu(contextmenu);
    expect(contextmenu.defaultPrevented).toBeFalse();
    expect(fixture.componentInstance.quickContext()).toBeNull();
    fixture.destroy();
    eligible.set(true);
    const readonly = create(true);
    expect(readonly.nativeElement.querySelector('a')).toBeNull();
    readonly.destroy();
  });
});

describe('IGDB cover optimization', () => {
  it('selects official cover variants and preserves other URLs', () => {
    const src = 'https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg';
    expect(igdbCoverLoader({ src, width: 90 })).toContain('/t_cover_small/abc.jpg');
    expect(igdbCoverLoader({ src, width: 180 })).toContain('/t_cover_small_2x/abc.jpg');
    expect(igdbCoverLoader({ src, width: 264 })).toContain('/t_cover_big/abc.jpg');
    expect(igdbCoverLoader({ src, width: 528 })).toContain('/t_cover_big_2x/abc.jpg');
    expect(igdbCoverLoader({ src })).toBe(src);
    expect(igdbCoverLoader({ src: 'https://example.com/manual.png', width: 90 })).toBe('https://example.com/manual.png');
  });
});
