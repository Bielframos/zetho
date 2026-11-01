import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiDraggableList } from './draggable-list';
import { ListController } from '../../../../lists/list.controller';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { AppListCardMenu } from './list-card-menu';

@Component({ selector: 'ui-game-card', template: '' })
class GameCardStub {
  width = input<number>();
  game = input<any>();
  transitionScope = input<string>();
  transitionItemId = input<string>();
  readonlyMode = input(false);
}

@Component({ selector: 'app-list-card-menu', template: '' })
class ListCardMenuStub {
  item = input<any>();
}

describe('UiDraggableList', () => {
  let fixture: ComponentFixture<UiDraggableList>;
  let mockController: {
    list: ReturnType<typeof signal<any>>;
    items: ReturnType<typeof signal<any[]>>;
    hasMore: ReturnType<typeof signal<boolean>>;
    load: jasmine.Spy;
    notifyReorder: jasmine.Spy;
  };

  beforeEach(async () => {
    mockController = {
      list: signal(null),
      items: signal<any[]>([]),
      hasMore: signal(false),
      load: jasmine.createSpy('load'),
      notifyReorder: jasmine.createSpy('notifyReorder'),
    };

    await TestBed.configureTestingModule({
      imports: [UiDraggableList],
      providers: [
        provideRouter([]),
        { provide: ListController, useValue: mockController },
      ],
    })
      .overrideComponent(UiDraggableList, {
        remove: { imports: [UiGameCard, AppListCardMenu] },
        add: { imports: [GameCardStub, ListCardMenuStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UiDraggableList);
  });

  it('renders owner empty state with action link to /buscar when itsMe is true and list is empty', () => {
    fixture.componentRef.setInput('itsMe', true);
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2.textContent).toContain('Essa lista está vazia');
    expect(fixture.nativeElement.textContent).toContain(
      'Busque jogos para adicionar e começar a organizar esta lista.',
    );
    const actionLink = fixture.nativeElement.querySelector('a[href="/buscar"]');
    expect(actionLink).not.toBeNull();
    expect(actionLink.textContent).toContain('Buscar jogos');
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(0);
  });

  it('renders visitor empty state when itsMe is false and list is empty', () => {
    fixture.componentRef.setInput('itsMe', false);
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2.textContent).toContain('Essa lista está vazia');
    expect(fixture.nativeElement.textContent).toContain(
      'Nenhum jogo foi adicionado a esta lista ainda.',
    );
    expect(fixture.nativeElement.querySelector('a[href="/buscar"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(0);
  });

  it('renders list items when list is not empty', () => {
    mockController.items.set([
      {
        $id: 'item-1',
        orderKey: 'a',
        game: { name: 'Chrono Trigger', slug: 'chrono-trigger' },
      },
    ]);
    fixture.componentRef.setInput('itsMe', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Chrono Trigger');
    expect(fixture.nativeElement.querySelector('ui-empty-state')).toBeNull();
  });
});
