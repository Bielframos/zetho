import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';
import { UserProfileService } from '../userProfiles/userProfile.service';
import { NotificationStore } from '../system/notifications/notification.store';

describe('AuthStore registration', () => {
  it('propagates a failed registration so the form stays open instead of entering onboarding', async () => {
    const error = new Error('Registration unavailable');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { register: jasmine.createSpy().and.rejectWith(error) },
        },
        { provide: UserProfileService, useValue: {} },
        { provide: NotificationStore, useValue: {} },
      ],
    });
    const store = TestBed.inject(AuthStore);

    await expectAsync(
      store.register(
        'player@example.com',
        'password123',
        'Player Name',
        'player',
      ),
    ).toBeRejectedWith(error);
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.profile()).toBeNull();
  });
});

describe('Signup conversion receipts', () => {
  it('emits only a confirmed new signup and distinguishes accepted invitations', async () => {
    const { AcquisitionAnalytics } =
      await import('../acquisition/acquisition-analytics.service');
    const emit = jasmine.createSpy();
    const register = jasmine
      .createSpy()
      .and.resolveTo({
        user: { $id: 'owner' },
        profile: {
          fingerprint: 'owner-fingerprint',
          registration: { created: true, inviteAccepted: true },
        },
      });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { register } },
        { provide: UserProfileService, useValue: {} },
        { provide: NotificationStore, useValue: {} },
        { provide: AcquisitionAnalytics, useValue: { emit } },
      ],
    });
    const store = TestBed.inject(AuthStore);
    await store.register(
      'test@example.com',
      'password123',
      'Test',
      'player',
      'not-sent-to-analytics',
    );
    expect(emit).toHaveBeenCalledOnceWith('sign_up', {
      method: 'password',
      invite_status: 'accepted',
    });
    register.and.resolveTo({
      user: { $id: 'owner' },
      profile: {
        fingerprint: 'owner-fingerprint',
        registration: { created: false, inviteAccepted: false },
      },
    });
    await store.register('test@example.com', 'password123', 'Test', 'player');
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
