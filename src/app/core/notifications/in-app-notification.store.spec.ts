import { TestBed } from '@angular/core/testing';
import { GameplaySessionsRepository } from '../gameplay-sessions/gameplay-sessions.repository';
import { InAppNotificationStore } from './in-app-notification.store';

describe('InAppNotificationStore', () => {
  it('keeps a read invitation actionable from actionStatus', async () => {
    const repository = {
      getNotifications: jasmine.createSpy().and.resolveTo([
        {
          $id: 'notification-1',
          title: 'Convite',
          body: 'Venha jogar',
          type: 'session_invite',
          read: true,
          $createdAt: new Date().toISOString(),
          entityId: 'session-1',
          participantId: 'participant-1',
          actionStatus: 'invited',
        },
      ]),
      respondToInvitation: jasmine.createSpy().and.resolveTo(),
      markNotificationAsRead: jasmine.createSpy().and.resolveTo(),
      deleteNotification: jasmine.createSpy().and.resolveTo(),
    };
    TestBed.configureTestingModule({
      providers: [
        InAppNotificationStore,
        { provide: GameplaySessionsRepository, useValue: repository },
      ],
    });
    const store = TestBed.inject(InAppNotificationStore);

    await store.loadNotifications();
    expect(store.notifications()[0].read).toBeTrue();
    expect(store.notifications()[0].status).toBe('pending');

    await store.acceptSessionInvite('notification-1');
    expect(repository.respondToInvitation).toHaveBeenCalledOnceWith(
      'session-1',
      'accept',
    );
    expect(store.notifications()[0].status).toBe('accepted');
  });

  it('deletes a notification in the API and restores it when persistence fails', async () => {
    const repository = {
      getNotifications: jasmine.createSpy().and.resolveTo([
        {
          $id: 'notification-1',
          title: 'Atualização',
          body: 'A Jogatina mudou',
          type: 'session_rsvp',
          read: false,
          $createdAt: new Date().toISOString(),
          entityId: 'session-1',
        },
      ]),
      deleteNotification: jasmine
        .createSpy()
        .and.rejectWith(new Error('Falha ao excluir')),
    };
    TestBed.configureTestingModule({
      providers: [
        InAppNotificationStore,
        { provide: GameplaySessionsRepository, useValue: repository },
      ],
    });
    const store = TestBed.inject(InAppNotificationStore);
    await store.loadNotifications();

    await expectAsync(
      store.deleteNotification('notification-1'),
    ).toBeRejectedWithError('Falha ao excluir');
    expect(store.notifications()).toHaveSize(1);
  });
});
