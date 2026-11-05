import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppUserLists } from './user-lists';
import { AuthStore } from '../../../core/auth/auth.store';
import { ProfileStore } from '../../../core/userProfiles/profile.store';
import { ListsController } from '../../../core/lists/lists.controller';
import { UiListCard } from '../../ui/list-card';
import { AppNewListDialog } from '../new-list-dialog/new-list-dialog';

@Component({
  selector: 'app-new-list-dialog',
  template: '<button id="stub-new-list">Nova lista stub</button>',
})
class NewListDialogStub {}

@Component({
  selector: 'ui-list-card',
  template: '{{list()?.title}}',
})
class ListCardStub {
  ownerGamertag = input<string>();
  list = input<any>();
}

describe('AppUserLists', () => {
  let fixture: ComponentFixture<AppUserLists>;

  beforeEach(async () => {
    const mockAuthStore = {
      profile: signal({ gamertag: 'my-tag', fingerprint: 'fp-1' }),
    };
    const mockProfileStore = {
      current: signal({ gamertag: 'other-tag', fingerprint: 'fp-2' }),
    };
    const mockListsController = {};

    await TestBed.configureTestingModule({
      imports: [AppUserLists],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: ProfileStore, useValue: mockProfileStore },
        { provide: ListsController, useValue: mockListsController },
      ],
    })
      .overrideComponent(AppUserLists, {
        remove: { imports: [UiListCard, AppNewListDialog] },
        add: { imports: [ListCardStub, NewListDialogStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppUserLists);
  });

  it('renders owner empty state with new-list-dialog projected and without h1 tags when fromMe is true', () => {
    fixture.componentRef.setInput('fromMe', true);
    fixture.componentRef.setInput('lists', []);
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2.textContent).toContain('Crie a sua primeira lista');
    expect(fixture.nativeElement.textContent).toContain(
      'Que tal organizar seus jogos favoritos em listas personalizadas?',
    );
    expect(
      fixture.nativeElement.querySelector('#stub-new-list'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(0);
  });

  it('renders visitor empty state when fromMe is false and lists is empty', () => {
    fixture.componentRef.setInput('fromMe', false);
    fixture.componentRef.setInput('lists', []);
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2.textContent).toContain('Nenhuma lista pública encontrada');
    expect(fixture.nativeElement.textContent).toContain(
      'Este jogador ainda não criou nenhuma lista pública.',
    );
    expect(fixture.nativeElement.querySelector('#stub-new-list')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(0);
  });

  it('renders list cards when lists are provided', () => {
    fixture.componentRef.setInput('lists', [
      {
        $id: 'list-1',
        title: 'Meus Favoritos',
        slug: 'meus-favoritos',
      } as any,
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Meus Favoritos');
    expect(fixture.nativeElement.querySelector('ui-empty-state')).toBeNull();
  });
});
