import { TestBed } from '@angular/core/testing';
import { GameplaySessionsService } from '../../gameplay-sessions.service';
import {
  GameplaySession,
  ParticipantStatus,
} from '../../gameplay-sessions.types';
import { SessionCardComponent } from './session-card';

describe('SessionCardComponent', () => {
  const baseSession: GameplaySession = {
    $id: 'session-1',
    hostProfileId: 'host-1',
    gameId: 'game-1',
    gameName: 'Hades',
    title: 'Noite no Tártaro',
    description: 'Cooperativo',
    scheduledAt: new Date(Date.now() + 60_000).toISOString(),
    privacy: 'public',
    maxPlayers: 4,
    confirmedCount: 1,
    status: 'scheduled',
    host: {
      $id: 'host-1',
      gamertag: 'Melinoe',
      avatarUrl: 'melinoe.png',
    },
    $createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SessionCardComponent],
      providers: [
        {
          provide: GameplaySessionsService,
          useValue: { isActionLoading: () => false },
        },
      ],
    });
  });

  function render(status?: ParticipantStatus) {
    const fixture = TestBed.createComponent(SessionCardComponent);
    fixture.componentRef.setInput('session', {
      ...baseSession,
      myParticipantStatus: status,
    });
    fixture.componentRef.setInput('currentProfileId', 'viewer-1');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the enriched host name and avatar', () => {
    const element = render();
    expect(element.textContent).toContain('@Melinoe');
    expect(
      element.querySelector('img[alt="Avatar de Melinoe"]'),
    ).not.toBeNull();
  });

  it('shows the public request action only without a relationship', () => {
    expect(render().textContent).toContain('Solicitar entrada');
    expect(render('pending').textContent).toContain('Solicitação pendente');
    expect(render('pending').textContent).not.toContain('Solicitar entrada');
  });

  it('shows invitation and confirmed actions by status', () => {
    const invitation = render('invited').textContent ?? '';
    expect(invitation).toContain('Aceitar');
    expect(invitation).toContain('Recusar');
    expect(render('confirmed').textContent).toContain('Sair');
  });

  it('shows terminal states without a new request action', () => {
    const rejected = render('rejected').textContent ?? '';
    expect(rejected).toContain('Solicitação recusada');
    expect(rejected).not.toContain('Solicitar entrada');
  });
});
