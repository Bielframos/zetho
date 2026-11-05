import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConnectionsPage } from './connections';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ConnectionsController } from '../../../connections/connections.controller';
import { ProfileLayoutStore } from '../../../../shared/app/profile-layout/profile-layout.store';
import { UiEmptyState } from '../../../../shared/ui/empty-state';
import { UiLoading } from '../../../../shared/ui/loading';

describe('ConnectionsPage', () => {
  let fixture: ComponentFixture<ConnectionsPage>;
  let component: ConnectionsPage;

  let currentProfileSignal: ReturnType<typeof signal<any>>;
  let itsMeSignal: ReturnType<typeof signal<boolean>>;
  let connectionTypeSignal: ReturnType<typeof signal<'followers' | 'following'>>;
  let profilesSignal: ReturnType<typeof signal<any[]>>;
  let totalSignal: ReturnType<typeof signal<number>>;
  let initialLoadingSignal: ReturnType<typeof signal<boolean>>;
  let loadingMoreSignal: ReturnType<typeof signal<boolean>>;
  let hasMoreSignal: ReturnType<typeof signal<boolean>>;
  let errorsSignal: ReturnType<typeof signal<Record<string, string>>>;
  let sidebarComponentSignal: ReturnType<typeof signal<any>>;

  let mockController: any;

  beforeEach(async () => {
    currentProfileSignal = signal({ $id: 'prof-1', gamertag: 'MasterChief' });
    itsMeSignal = signal(true);
    connectionTypeSignal = signal<'followers' | 'following'>('followers');
    profilesSignal = signal<any[]>([]);
    totalSignal = signal(0);
    initialLoadingSignal = signal(false);
    loadingMoreSignal = signal(false);
    hasMoreSignal = signal(false);
    errorsSignal = signal({});
    sidebarComponentSignal = signal<any>('some-sidebar');

    mockController = {
      connectionType: connectionTypeSignal,
      profiles: profilesSignal,
      total: totalSignal,
      initialLoading: initialLoadingSignal,
      loadingMore: loadingMoreSignal,
      hasMore: hasMoreSignal,
      errors: errorsSignal,
      setConnectionType: jasmine.createSpy('setConnectionType').and.callFake((val: 'followers' | 'following') => {
        connectionTypeSignal.set(val);
      }),
      loadConnections: jasmine.createSpy('loadConnections'),
    };

    await TestBed.configureTestingModule({
      imports: [ConnectionsPage],
      providers: [
        provideRouter([]),
        {
          provide: ProfileStore,
          useValue: {
            current: currentProfileSignal,
            itsMe: itsMeSignal,
          },
        },
        {
          provide: ConnectionsController,
          useValue: mockController,
        },
        {
          provide: ProfileLayoutStore,
          useValue: {
            sidebarComponent: sidebarComponentSignal,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and clear sidebarComponent on init', () => {
    expect(component).toBeTruthy();
    expect(sidebarComponentSignal()).toBeNull();
  });

  it('should render loading state when initialLoading is true', () => {
    initialLoadingSignal.set(true);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('ui-loading');
    expect(loading).not.toBeNull();
    expect(fixture.nativeElement.querySelector('header')).toBeNull();
  });

  it('should render semantic h1 in header for followers and following', () => {
    connectionTypeSignal.set('followers');
    fixture.detectChanges();

    const h1 = fixture.nativeElement.querySelector('header h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent.trim()).toBe('Seguidores');
    expect(h1.classList.contains('text-2xl')).toBeTrue();
    expect(h1.classList.contains('font-medium')).toBeTrue();

    connectionTypeSignal.set('following');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('header h1').textContent.trim()).toBe('Seguindo');
  });

  it('should render UiEmptyState with h2 heading level when list is empty for followers', () => {
    connectionTypeSignal.set('followers');
    profilesSignal.set([]);
    fixture.detectChanges();

    const emptyStateEl = fixture.nativeElement.querySelector('ui-empty-state');
    expect(emptyStateEl).not.toBeNull();

    const h2 = emptyStateEl.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2.textContent.trim()).toBe('Nenhum seguidor ainda');

    const desc = emptyStateEl.querySelector('p.text-sm');
    expect(desc).not.toBeNull();
    expect(desc.textContent.trim()).toBe('Quando alguém começar a seguir, aparecerá aqui.');
  });

  it('should render UiEmptyState with gamertag in description for following empty state', () => {
    connectionTypeSignal.set('following');
    profilesSignal.set([]);
    fixture.detectChanges();

    const emptyStateEl = fixture.nativeElement.querySelector('ui-empty-state');
    expect(emptyStateEl).not.toBeNull();

    const h2 = emptyStateEl.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2.textContent.trim()).toBe('Não está seguindo ninguém');

    const desc = emptyStateEl.querySelector('p.text-sm');
    expect(desc).not.toBeNull();
    expect(desc.textContent.trim()).toBe('Quando MasterChief seguir alguém, aparecerá aqui.');
  });

  it('should fallback to "este jogador" in description when currentProfile is null', () => {
    currentProfileSignal.set(null);
    connectionTypeSignal.set('following');
    profilesSignal.set([]);
    fixture.detectChanges();

    const emptyStateEl = fixture.nativeElement.querySelector('ui-empty-state');
    const desc = emptyStateEl.querySelector('p.text-sm');
    expect(desc.textContent.trim()).toBe('Quando este jogador seguir alguém, aparecerá aqui.');
  });

  it('should render profile cards when profiles are present instead of empty state', () => {
    profilesSignal.set([
      { $id: 'p1', gamertag: 'PlayerOne', avatarUrl: '' },
      { $id: 'p2', gamertag: 'PlayerTwo', avatarUrl: '' },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ui-empty-state')).toBeNull();
    const cards = fixture.nativeElement.querySelectorAll('ui-profile-card');
    expect(cards.length).toBe(2);
  });
});
