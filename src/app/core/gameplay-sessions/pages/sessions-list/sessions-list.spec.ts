import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { GameplaySessionsService } from '../../gameplay-sessions.service';
import { SessionsListPage } from './sessions-list';

describe('SessionsListPage deep links', () => {
  it('loads the complete detail by id even when the card is absent', async () => {
    const params = new BehaviorSubject(convertToParamMap({ id: 'deep-id' }));
    const sessionsService = {
      sessions: signal([]),
      selectedSession: signal(null),
      loadSessions: jasmine.createSpy('loadSessions').and.resolveTo(),
      loadSessionDetail: jasmine
        .createSpy('loadSessionDetail')
        .and.resolveTo(null),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: GameplaySessionsService, useValue: sessionsService },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: params.asObservable() },
        },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new SessionsListPage());
    page.ngOnInit();
    await Promise.resolve();

    expect(sessionsService.loadSessions).toHaveBeenCalled();
    expect(sessionsService.loadSessionDetail).toHaveBeenCalledOnceWith(
      'deep-id',
    );
    expect(page.isDetailModalOpen()).toBeTrue();
  });
});
