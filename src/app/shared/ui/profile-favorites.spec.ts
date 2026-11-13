import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { GameRepository } from '../../core/games/games.repository';
import { GameService } from '../../core/games/games.service';
import { ProfileStore } from '../../core/userProfiles/profile.store';
import { UiProfileFavorites } from './profile-favorites';

const game = (id: string) => ({
  $id: id,
  name: `Jogo ${id}`,
  slug: `jogo-${id}`,
  coverUrl: '',
});

describe('UiProfileFavorites', () => {
  function setup(opts: { owner: boolean; ids?: string[] }) {
    const findByIds = jasmine
      .createSpy('findByIds')
      .and.callFake(async (ids: string[]) => ids.map(game).reverse());
    const updateProfile = jasmine.createSpy('updateProfile').and.resolveTo();
    const set = jasmine.createSpy('set');
    TestBed.configureTestingModule({
      imports: [UiProfileFavorites],
      providers: [
        provideRouter([]),
        { provide: GameRepository, useValue: { findByIds } },
        { provide: GameService, useValue: { searchGame: async () => ({ rows: [] }) } },
        {
          provide: AuthStore,
          useValue: { updateProfile, profile: () => ({ $id: 'p1' }) },
        },
        { provide: ProfileStore, useValue: { itsMe: signal(opts.owner), set } },
      ],
    });
    const fixture = TestBed.createComponent(UiProfileFavorites);
    fixture.componentRef.setInput('profile', {
      $id: 'p1',
      gamertag: 'player',
      favoriteGameIds: opts.ids,
    });
    fixture.detectChanges();
    return { fixture, findByIds, updateProfile, set };
  }

  const settle = async (fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('renders nothing for a visitor when there are no favorites', async () => {
    const { fixture, findByIds } = setup({ owner: false });
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('ul')).toBeNull();
    expect(findByIds).not.toHaveBeenCalled();
  });

  it('shows only filled slots to a visitor, in the saved order', async () => {
    const { fixture } = setup({ owner: false, ids: ['b', 'a'] });
    await settle(fixture);
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.map((a) => a.getAttribute('title'))).toEqual(['Jogo b', 'Jogo a']);
    expect(fixture.nativeElement.querySelector('button[aria-label^="Escolher"]')).toBeNull();
  });

  it('gives the owner empty slots to fill', async () => {
    const { fixture } = setup({ owner: true, ids: ['a'] });
    await settle(fixture);
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(1);
    const empties = fixture.nativeElement.querySelectorAll('button[aria-label^="Escolher"]');
    expect([...empties].map((b: HTMLElement) => b.getAttribute('aria-label'))).toEqual([
      'Escolher 2º jogo favorito',
      'Escolher 3º jogo favorito',
    ]);
  });

  it('saves the reordered draft and refreshes the profile store', async () => {
    const { fixture, updateProfile, set } = setup({ owner: true, ids: ['a', 'b'] });
    await settle(fixture);
    const cmp = fixture.componentInstance;
    cmp.openEditor();
    cmp.move(0, 1);
    const close = jasmine.createSpy('close');
    await cmp.save({ close });
    expect(updateProfile).toHaveBeenCalledWith({ favoriteGameIds: ['b', 'a'] });
    expect(set).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('keeps the editor open when saving fails', async () => {
    const { fixture, updateProfile } = setup({ owner: true, ids: ['a'] });
    updateProfile.and.rejectWith(new Error('x'));
    await settle(fixture);
    const close = jasmine.createSpy('close');
    fixture.componentInstance.openEditor();
    await fixture.componentInstance.save({ close });
    expect(close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.saving()).toBeFalse();
  });

  it('never keeps more than three drafts', async () => {
    const { fixture } = setup({ owner: true, ids: ['a', 'b', 'c'] });
    await settle(fixture);
    const cmp = fixture.componentInstance;
    cmp.openEditor();
    cmp.onPick([{ id: 'd', label: 'Jogo d' }]);
    expect(cmp.draft().map((d) => d.id)).toEqual(['a', 'b', 'c']);
  });
});
