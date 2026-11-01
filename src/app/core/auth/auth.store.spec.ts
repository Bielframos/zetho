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

describe('Signup confirmation and returning to the app', () => {
  const user = { $id: 'owner', email: 'player@example.com', emailVerification: false };
  let service: { register: jasmine.Spy; createEmailVerification: jasmine.Spy; getLoggedInUser: jasmine.Spy };
  beforeEach(() => {
    service = {
      register: jasmine.createSpy().and.resolveTo({ user, profile: { fingerprint: 'owner' } }),
      createEmailVerification: jasmine.createSpy().and.resolveTo(),
      getLoggedInUser: jasmine.createSpy().and.resolveTo(user),
    };
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: service },
      { provide: UserProfileService, useValue: {} },
      { provide: NotificationStore, useValue: {} },
    ] });
  });

  it('automatically sends confirmation without failing the completed signup if delivery fails', async () => {
    service.createEmailVerification.and.rejectWith(new Error('offline'));
    const store = TestBed.inject(AuthStore);
    await store.register(user.email, 'password123', 'Player', 'player');
    expect(service.createEmailVerification).toHaveBeenCalledTimes(1);
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.profile()?.fingerprint).toBe('owner');
  });

  it('recognizes confirmation from another tab without resetting the session on network failure', async () => {
    const store = TestBed.inject(AuthStore);
    await store.register(user.email, 'password123', 'Player', 'player');
    service.getLoggedInUser.and.resolveTo(null);
    expect(await store.refreshEmailVerification()).toBeFalse();
    expect(store.user()).toEqual(user as any);
    service.getLoggedInUser.and.resolveTo({ ...user, emailVerification: true });
    expect(await store.refreshEmailVerification()).toBeTrue();
    expect(store.user()?.emailVerification).toBeTrue();
  });

  it('sends a fresh confirmation to a corrected address before the old one is verified', async () => {
    const corrected = { ...user, email: 'correct@example.com' };
    TestBed.overrideProvider(AuthService, { useValue: {
      ...service, updateEmail: jasmine.createSpy().and.resolveTo(corrected),
    } });
    const store = TestBed.inject(AuthStore);
    await store.register(user.email, 'password123', 'Player', 'player');
    await store.updateEmail(corrected.email, 'password123');
    expect(store.user()?.email).toBe(corrected.email);
    expect(store.user()?.emailVerification).toBeFalse();
    expect(service.createEmailVerification).toHaveBeenCalledTimes(2);
  });

  it('discards a confirmation check after a different session replaces the original one', async () => {
    const store = TestBed.inject(AuthStore);
    await store.register(user.email, 'password123', 'Player', 'player');
    let finish!: (result: any) => void;
    service.getLoggedInUser.and.returnValue(new Promise(resolve => finish = resolve));
    const checking = store.refreshEmailVerification();
    service.register.and.resolveTo({ user: { ...user, $id: 'other' }, profile: { fingerprint: 'other' } });
    await store.register(user.email, 'password123', 'Other', 'other');
    finish({ ...user, emailVerification: true });
    expect(await checking).toBeFalse();
    expect(store.user()?.$id).toBe('other');
  });
});
