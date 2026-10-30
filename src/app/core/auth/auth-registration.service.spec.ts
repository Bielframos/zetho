import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { UserProfileService } from '../userProfiles/userProfile.service';
import { SocialApi } from '../../shared/infra/social-api';
import { appwrite } from '../../shared/infra/appwrite/appwrite.client';

describe('Registration retry authentication', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        { provide: UserProfileService, useValue: {} },
        { provide: SocialApi, useValue: {} },
      ],
    }),
  );
  it('authenticates an existing account before resuming a partial registration', async () => {
    const service = TestBed.inject(AuthService);
    spyOn(appwrite.account, 'create').and.rejectWith({ code: 409 });
    spyOn(service, 'getLoggedInUser').and.returnValues(
      Promise.resolve(null),
      Promise.resolve({ $id: 'owner', email: 'test@example.com' } as any),
    );
    const login = spyOn(service, 'login').and.resolveTo({
      $id: 'session',
    } as any);
    const complete = spyOn(service, 'completeRegistration').and.resolveTo({
      fingerprint: 'f',
    } as any);
    await service.register(
      'test@example.com',
      'password123',
      'Test',
      'player',
      'invite',
    );
    expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(complete).toHaveBeenCalledWith('player', 'invite');
  });
  it('never completes a profile for a different active account', async () => {
    const service = TestBed.inject(AuthService);
    spyOn(appwrite.account, 'create').and.rejectWith({ code: 409 });
    spyOn(service, 'getLoggedInUser').and.resolveTo({
      $id: 'different',
      email: 'different@example.com',
    } as any);
    const complete = spyOn(service, 'completeRegistration');
    await expectAsync(
      service.register('test@example.com', 'password123', 'Test', 'player'),
    ).toBeRejected();
    expect(complete).not.toHaveBeenCalled();
  });
});
