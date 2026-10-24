import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AuthStore } from '../../../auth/auth.store';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ListController } from '../../../lists/list.controller';
import {
  DashboardService,
  ListSocialState,
} from '../../../dashboard/dashboard.service';
import { UiLoading } from '../../../../shared/ui/loading';
import { ListPage } from './list';

@Component({
  selector: 'ui-draggable-list',
  standalone: true,
  template: '',
})
class MockUiDraggableList {
  @Input() itsMe = false;
}

@Component({
  selector: 'app-list-menu',
  standalone: true,
  template: '<div data-testid="list-menu"></div>',
})
class MockAppListMenu {}

@Component({
  selector: 'ui-share-modal',
  standalone: true,
  template: '',
})
class MockUiShareModal {
  @Input() data: any;
  open = jasmine.createSpy('open');
}

describe('ListPage', () => {
  let fixture: ComponentFixture<ListPage>;
  let component: ListPage;
  let authProfile: ReturnType<typeof signal<any>>;
  let profileCurrent: ReturnType<typeof signal<any>>;
  let listData: ReturnType<typeof signal<any>>;
  let listControllerMock: any;
  let dashboardServiceSpy: {
    toggleListLike: jasmine.Spy;
    toggleListSave: jasmine.Spy;
    getListSocialState: jasmine.Spy;
  };

  const initialSocialState: ListSocialState = {
    listId: 'list-123',
    likedByMe: false,
    likeCount: 4,
    savedByMe: false,
    saveCount: 2,
  };

  beforeEach(async () => {
    authProfile = signal({ $id: 'viewer-id' });
    profileCurrent = signal({
      $id: 'owner-id',
      gamertag: 'listowner',
      avatarUrl: 'https://example.com/avatar.png',
    });
    listData = signal({
      $id: 'list-123',
      title: 'Meus RPGs Favoritos',
      description: 'Uma seleção de RPGs clássicos',
      itemCount: 3,
    });

    listControllerMock = {
      list: listData,
      loading: signal(false),
      items: signal([]),
      totalItems: signal(3),
      slug$: new Subject<string>(),
    };

    dashboardServiceSpy = {
      toggleListLike: jasmine
        .createSpy('toggleListLike')
        .and.resolveTo({ ...initialSocialState, likedByMe: true, likeCount: 5 }),
      toggleListSave: jasmine
        .createSpy('toggleListSave')
        .and.resolveTo({ ...initialSocialState, savedByMe: true, saveCount: 3 }),
      getListSocialState: jasmine
        .createSpy('getListSocialState')
        .and.resolveTo(initialSocialState),
    };

    await TestBed.configureTestingModule({
      imports: [ListPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'meus-rpgs-favoritos' })),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            profile: authProfile,
            user: signal({ $id: 'viewer-user' }),
            isAuthenticated: signal(true),
          },
        },
        {
          provide: ProfileStore,
          useValue: {
            current: profileCurrent,
          },
        },
        {
          provide: DashboardService,
          useValue: dashboardServiceSpy,
        },
        {
          provide: ListController,
          useValue: listControllerMock,
        },
      ],
    })
      .overrideComponent(ListPage, {
        set: {
          imports: [
            MockUiDraggableList,
            UiLoading,
            ReactiveFormsModule,
            MockAppListMenu,
            MockUiShareModal,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ListPage);
    component = fixture.componentInstance;
  });

  it('renders list title with a semantic h1 element and correct classes', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading.textContent.trim()).toBe('Meus RPGs Favoritos');
    expect(heading.classList.contains('text-2xl')).toBeTrue();
    expect(heading.classList.contains('font-medium')).toBeTrue();
    expect(heading.classList.contains('max-w-xl')).toBeTrue();
    expect(fixture.nativeElement.querySelector('header h3')).toBeNull();
  });

  describe('Item count and social metadata', () => {
    it('always displays the item count even when social state is not available', () => {
      component.socialState.set(null);
      fixture.detectChanges();

      const metaDiv = fixture.nativeElement.querySelector(
        'header .mt-2.flex.items-center',
      );
      expect(metaDiv).toBeTruthy();
      expect(metaDiv.textContent).toContain('3 jogos');
      expect(metaDiv.textContent).not.toContain('curtidas');
      expect(metaDiv.textContent).not.toContain('salvos');
    });

    it('correctly handles pluralization for singular and plural game counts', () => {
      listData.set({ ...listData(), itemCount: 1 });
      component.socialState.set(null);
      fixture.detectChanges();

      let metaDiv = fixture.nativeElement.querySelector(
        'header .mt-2.flex.items-center',
      );
      expect(metaDiv.textContent).toContain('1 jogo');
      expect(metaDiv.textContent).not.toContain('1 jogos');

      listData.set({ ...listData(), itemCount: 0 });
      fixture.detectChanges();
      metaDiv = fixture.nativeElement.querySelector(
        'header .mt-2.flex.items-center',
      );
      expect(metaDiv.textContent).toContain('0 jogos');
    });

    it('displays social counts alongside game count when social state is available', () => {
      component.socialState.set({
        listId: 'list-123',
        likedByMe: false,
        likeCount: 7,
        savedByMe: false,
        saveCount: 12,
      });
      fixture.detectChanges();

      const metaDiv = fixture.nativeElement.querySelector(
        'header .mt-2.flex.items-center',
      );
      expect(metaDiv.textContent).toContain('3 jogos');
      expect(metaDiv.textContent).toContain('7 curtidas');
      expect(metaDiv.textContent).toContain('12 salvos');
    });
  });

  describe('Action buttons', () => {
    it('configures share button with ui-ghost-btn, touch target classes, and aria-label', () => {
      fixture.detectChanges();
      const shareBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Compartilhar lista"]',
      );
      expect(shareBtn).toBeTruthy();
      expect(shareBtn.classList.contains('ui-ghost-btn')).toBeTrue();
      expect(shareBtn.classList.contains('min-h-11')).toBeTrue();
      expect(shareBtn.classList.contains('min-w-11')).toBeTrue();
      expect(shareBtn.classList.contains('cursor-pointer')).toBeTrue();
      expect(shareBtn.getAttribute('data-size')).toBe('icon');

      spyOn(component, 'openShare').and.callThrough();
      shareBtn.click();
      expect(component.openShare).toHaveBeenCalled();
      expect(component.shareModal()?.open).toHaveBeenCalled();
    });

    it('configures like button with ui-ghost-btn, touch target classes, aria-pressed, and toggles like', async () => {
      component.socialState.set({
        listId: 'list-123',
        likedByMe: false,
        likeCount: 4,
        savedByMe: false,
        saveCount: 2,
      });
      fixture.detectChanges();

      const likeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
        'button[aria-label="Curtir lista"]',
      );
      expect(likeBtn).toBeTruthy();
      expect(likeBtn.classList.contains('ui-ghost-btn')).toBeTrue();
      expect(likeBtn.classList.contains('min-h-11')).toBeTrue();
      expect(likeBtn.classList.contains('min-w-11')).toBeTrue();
      expect(likeBtn.getAttribute('data-size')).toBe('icon');
      expect(likeBtn.getAttribute('aria-pressed')).toBe('false');

      const icon = likeBtn.querySelector('i');
      expect(icon?.classList.contains('ph-heart')).toBeTrue();
      expect(icon?.classList.contains('ph-fill')).toBeFalse();

      likeBtn.click();
      fixture.detectChanges();

      expect(dashboardServiceSpy.toggleListLike).toHaveBeenCalledWith('list-123');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(likeBtn.getAttribute('aria-label')).toBe('Remover curtida da lista');
      expect(likeBtn.getAttribute('aria-pressed')).toBe('true');
      expect(icon?.classList.contains('ph-fill')).toBeTrue();
      expect(icon?.classList.contains('text-danger')).toBeTrue();
    });

    it('configures save button with ui-ghost-btn, touch target classes, aria-pressed, text-blue-11, and toggles save', async () => {
      component.socialState.set({
        listId: 'list-123',
        likedByMe: false,
        likeCount: 4,
        savedByMe: false,
        saveCount: 2,
      });
      fixture.detectChanges();

      const saveBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
        'button[aria-label="Salvar lista"]',
      );
      expect(saveBtn).toBeTruthy();
      expect(saveBtn.classList.contains('ui-ghost-btn')).toBeTrue();
      expect(saveBtn.classList.contains('min-h-11')).toBeTrue();
      expect(saveBtn.classList.contains('min-w-11')).toBeTrue();
      expect(saveBtn.getAttribute('data-size')).toBe('icon');
      expect(saveBtn.getAttribute('aria-pressed')).toBe('false');
      expect(saveBtn.classList.contains('text-blue-11')).toBeFalse();

      const icon = saveBtn.querySelector('i');
      expect(icon?.classList.contains('ph-bookmark-simple')).toBeTrue();
      expect(icon?.classList.contains('ph-fill')).toBeFalse();

      saveBtn.click();
      fixture.detectChanges();

      expect(dashboardServiceSpy.toggleListSave).toHaveBeenCalledWith('list-123');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(saveBtn.getAttribute('aria-label')).toBe('Remover lista dos salvos');
      expect(saveBtn.getAttribute('aria-pressed')).toBe('true');
      expect(saveBtn.classList.contains('text-blue-11')).toBeTrue();
      expect(icon?.classList.contains('ph-fill')).toBeTrue();
    });

    it('renders list menu instead of like/save buttons when viewer is list owner (itsMe)', () => {
      authProfile.set({ $id: 'owner-id' });
      fixture.detectChanges();

      expect(component.itsMe()).toBeTrue();
      expect(
        fixture.nativeElement.querySelector('button[aria-label="Curtir lista"]'),
      ).toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          'button[aria-label="Remover curtida da lista"]',
        ),
      ).toBeNull();
      expect(
        fixture.nativeElement.querySelector('button[aria-label="Salvar lista"]'),
      ).toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          'button[aria-label="Remover lista dos salvos"]',
        ),
      ).toBeNull();

      expect(fixture.nativeElement.querySelector('app-list-menu')).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector(
          'button[aria-label="Compartilhar lista"]',
        ),
      ).toBeTruthy();
    });
  });
});
