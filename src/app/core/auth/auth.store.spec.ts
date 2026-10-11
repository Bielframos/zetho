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
