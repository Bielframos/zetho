import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { UiUserLibGrid } from './profile-entries';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { ZEntriesController } from '../../../../zEntries/zEntries.controller';
import { ProfileStore } from '../../../../userProfiles/profile.store';
import { GameRepository } from '../../../../games/games.repository';

@Component({ selector: 'ui-game-card', template: '{{game()?.name}}' })
class GameCardStub {
  game = input<any>();
  transitionScope = input<string>();
  transitionItemId = input<string>();
  priority = input(false);
  showEntryStatus = input(true);
}

describe('Profile entry groups', () => {
  function setup(own = false) {
    const controller = {
      grouping: signal('none'),
      initialLoading: signal(false),
      loaded: signal(true),
      loadingMore: signal(false),
      entries: signal<any[]>([]),
      groups: signal<any[]>([]),
      errors: signal<Record<string, unknown>>({}),
      hasMore: signal(false),
      offset: signal(0),
    };
    const findBySlugs = jasmine.createSpy().and.resolveTo([{ $id: 'suggestion', name: 'Example', slug: 'example' }]);
    TestBed.configureTestingModule({
      imports: [UiUserLibGrid],
      providers: [
        provideRouter([]),
        { provide: ZEntriesController, useValue: controller },
        { provide: ProfileStore, useValue: { itsMe: () => own, current: () => ({ $id: 'owner' }) } },
        { provide: GameRepository, useValue: { findBySlugs } },
      ],
    }).overrideComponent(UiUserLibGrid, {
      remove: { imports: [UiGameCard] }, add: { imports: [GameCardStub] },
    });
    return { controller, findBySlugs, fixture: TestBed.createComponent(UiUserLibGrid) };
  }

  it('renders sections and prioritizes covers only in the first group', () => {
    const { controller, fixture } = setup();
    const a = { $id: 'a', game: { name: 'First' } }, b = { $id: 'b', game: { name: 'Second' } };
    controller.entries.set([a, b]);
    controller.groups.set([
      { key: '2026', label: '2026', entries: [a] },
      { key: '2025', label: '2025', entries: [b] },
    ]);
    fixture.detectChanges();
    expect([...fixture.nativeElement.querySelectorAll('h2')].map((heading: any) => heading.textContent.trim()))
      .toEqual(['2026', '2025']);
    expect(fixture.debugElement.queryAll(By.directive(GameCardStub)).map(card => card.componentInstance.priority()))
      .toEqual([true, false]);
  });

  it('updates group in the URL while preserving the status filter', async () => {
    const { fixture } = setup();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?t=completed');
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('#profile-entry-grouping');
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-controls="profile-entry-grouping"]');
    expect(panel.hidden).toBeTrue();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    trigger.click();
    fixture.detectChanges();
    expect(panel.hidden).toBeFalse();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fixture.nativeElement.querySelector('ui-select button').click();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('ui-select [role="option"]');
    expect(options[0].textContent).toContain('Recentes · sem agrupamento');
    options[2].click();
    await fixture.whenStable();
    expect(router.parseUrl(router.url).queryParams).toEqual({ t: 'completed', group: 'alphabetical' });
    trigger.click();
    fixture.detectChanges();
    expect(panel.hidden).toBeTrue();
  });

  it('loads the own-profile suggestion after a successful empty page with zero offset', async () => {
    const { controller, fixture, findBySlugs } = setup(true);
    controller.loaded.set(false);
    fixture.detectChanges();
    expect(findBySlugs).not.toHaveBeenCalled();
    controller.loaded.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(controller.offset()).toBe(0);
    expect(findBySlugs).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Você tem muita cara de quem joga Example');
  });

  it('does not suggest a game when the entries request failed', () => {
    const { controller, fixture, findBySlugs } = setup(true);
    controller.errors.set({ loadMore: new Error('offline') });
    fixture.detectChanges();
    expect(findBySlugs).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
  });

  it('renders skeleton cards while initialLoading is true', () => {
    const { controller, fixture } = setup();
    controller.initialLoading.set(true);
    fixture.detectChanges();
    const skeletonSlots = fixture.nativeElement.querySelectorAll('.aspect-3\\/4');
    expect(skeletonSlots.length).toBe(12);
  });
});
