import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameRow } from '../../../types';
import { UiGameCoverFocus } from './game-cover-focus';

describe('UiGameCoverFocus', () => {
  let fixture: ComponentFixture<UiGameCoverFocus>;
  let origin: HTMLButtonElement;
  let originalOverflow: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiGameCoverFocus],
    }).compileComponents();
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
    } as MediaQueryList);
    originalOverflow = document.body.style.overflow;
    origin = document.createElement('button');
    document.body.append(origin);
    origin.focus();
    fixture = TestBed.createComponent(UiGameCoverFocus);
    fixture.componentRef.setInput('game', {
      $id: 'game',
      name: 'A game',
    } as GameRow);
    fixture.componentRef.setInput('originElement', origin);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    origin.remove();
    document.body.style.overflow = originalOverflow;
  });

  it('opens in the top layer and restores the cover, scrolling and focus when closed', async () => {
    const dialog: HTMLDialogElement =
      fixture.nativeElement.querySelector('dialog');
    expect(dialog.open).toBeTrue();
    expect(dialog.matches(':modal')).toBeTrue();
    expect(origin.style.visibility).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
    const closed = jasmine.createSpy();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.componentInstance.close();
    expect(dialog.open).toBeFalse();
    expect(origin.style.visibility).toBe('');
    expect(document.body.style.overflow).toBe(originalOverflow);
    expect(document.activeElement).toBe(origin);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('reports a choice and prevents another choice while saving', () => {
    const choose = jasmine.createSpy();
    fixture.componentInstance.chooseStatus.subscribe(choose);
    const action: HTMLButtonElement =
      fixture.nativeElement.querySelector('.focus-action');
    action.click();
    expect(choose).toHaveBeenCalledOnceWith('completed');
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    action.click();
    fixture.componentInstance.select('playing');
    expect(choose).toHaveBeenCalledTimes(1);
    expect(action.disabled).toBeTrue();
  });

  it('intercepts Escape and restores state', () => {
    const event = new Event('cancel', { cancelable: true });
    fixture.nativeElement.querySelector('dialog').dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(origin.style.visibility).toBe('');
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it('ignores the opening touch release but allows a new tap on the scrim', () => {
    const scrim = fixture.nativeElement.querySelector(
      '.focus-scrim',
    ) as HTMLElement;
    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    const releaseClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: 1,
    });
    scrim.dispatchEvent(releaseClick);
    expect(releaseClick.defaultPrevented).toBeTrue();
    expect(dialog.open).toBeTrue();
    scrim.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }),
    );
    scrim.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(dialog.open).toBeFalse();
  });

  it('blocks changes after a read failure and offers retry', () => {
    const retry = jasmine.createSpy();
    const choose = jasmine.createSpy();
    fixture.componentInstance.retryLoad.subscribe(retry);
    fixture.componentInstance.chooseStatus.subscribe(choose);
    fixture.componentRef.setInput('loadError', true);
    fixture.componentRef.setInput(
      'error',
      'Não foi possível carregar seu registro',
    );
    fixture.detectChanges();
    const actions: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.focus-action'),
    );
    expect(actions.every((action) => action.disabled)).toBeTrue();
    fixture.componentInstance.select('completed');
    expect(choose).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Não foi possível carregar seu registro',
    );
    fixture.nativeElement.querySelector('.focus-feedback button').click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('explains unavailable registrations without offering a loading retry', () => {
    fixture.componentRef.setInput('unavailable', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Os registros ficam disponíveis após o lançamento',
    );
    expect(
      fixture.nativeElement.querySelector('.focus-feedback button'),
    ).toBeNull();
    const actions: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.focus-action'),
    );
    expect(actions.every((action) => action.disabled)).toBeTrue();
  });

  it('reverses from the current position when closed during the opening animation', async () => {
    fixture.destroy();
    (window.matchMedia as jasmine.Spy).and.returnValue({
      matches: false,
    } as MediaQueryList);
    fixture = TestBed.createComponent(UiGameCoverFocus);
    fixture.componentRef.setInput('game', {
      $id: 'game',
      name: 'A game',
    } as GameRow);
    fixture.componentRef.setInput('originElement', origin);
    fixture.detectChanges();
    await fixture.whenStable();
    const cover: HTMLElement =
      fixture.nativeElement.querySelector('.focus-cover');
    const opening = cover.getAnimations()[0];
    opening.pause();
    opening.currentTime = 80;
    const before = cover.getBoundingClientRect();
    const closing = fixture.componentInstance.close();
    const reversing = cover.getAnimations()[0];
    reversing.pause();
    reversing.currentTime = 0;
    const after = cover.getBoundingClientRect();
    expect(after.left).toBeCloseTo(before.left, 1);
    expect(after.top).toBeCloseTo(before.top, 1);
    expect(after.width).toBeCloseTo(before.width, 1);
    reversing.finish();
    await closing;
  });
});
