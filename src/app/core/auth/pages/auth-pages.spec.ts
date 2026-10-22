import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AuthStore } from '../auth.store';
import { UserProfileService } from '../../userProfiles/userProfile.service';
import { LoginPage } from './login/login';
import { RegisterPage } from './register/register';

describe('Entry forms', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let profiles: jasmine.SpyObj<UserProfileService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthStore>('AuthStore', ['login', 'register']);
    profiles = jasmine.createSpyObj<UserProfileService>('Profiles', [
      'isValidGamertag',
    ]);
    profiles.isValidGamertag.and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: auth },
        { provide: UserProfileService, useValue: profiles },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate').and.resolveTo(true),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    });
  });

  it('clears a password mismatch when either password is corrected', () => {
    const page = TestBed.runInInjectionContext(() => new RegisterPage());
    page.form.controls.password.setValue('first-password');
    page.form.controls.confirmPassword.setValue('second-password');
    expect(page.form.hasError('passwordsMismatch')).toBeTrue();
    page.form.controls.password.setValue('second-password');
    expect(page.form.hasError('passwordsMismatch')).toBeFalse();
    expect(page.form.controls.confirmPassword.valid).toBeTrue();
    page.form.controls.password.setValue('third-password');
    expect(page.form.hasError('passwordsMismatch')).toBeTrue();
    page.form.controls.confirmPassword.setValue('third-password');
    expect(page.form.hasError('passwordsMismatch')).toBeFalse();
    expect(page.form.controls.confirmPassword.valid).toBeTrue();
  });

  it('waits for gamertag validation before registering and preserves invitations', async () => {
    let resolveAvailability!: (available: boolean) => void;
    const availability = new Promise<boolean>((resolve) => {
      resolveAvailability = resolve;
    });
    profiles.isValidGamertag.and.returnValue(availability);
    const page = TestBed.runInInjectionContext(() => new RegisterPage());
    page.form.setValue({
      name: 'Ana Silva',
      gamertag: 'ana',
      email: 'ana@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      inviteCode: 'my-invite',
    });
    expect(page.form.pending).toBeTrue();
    await page.submit();
    expect(auth.register).not.toHaveBeenCalled();
    resolveAvailability(true);
    await availability;
    expect(page.form.valid).toBeTrue();
    auth.register.and.resolveTo();
    await page.submit();
    expect(auth.register).toHaveBeenCalledOnceWith(
      'ana@example.com',
      'password123',
      'Ana Silva',
      'ana',
      'my-invite',
    );
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/comecar']);
  });

  it('marks invalid login fields as touched without sending credentials', async () => {
    const page = TestBed.runInInjectionContext(() => new LoginPage());
    const control = new FormGroup({ email: new FormControl('') });
    page.result.set({ message: 'Erro anterior' });
    await page.login({ invalid: true, control } as unknown as NgForm);
    expect(control.controls.email.touched).toBeTrue();
    expect(auth.login).not.toHaveBeenCalled();
    expect(page.result().message).toBeUndefined();
  });

  it('prevents duplicate login requests while a submission is in progress', async () => {
    let finish!: () => void;
    auth.login.and.returnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const page = TestBed.runInInjectionContext(() => new LoginPage());
    page.email = 'ana@example.com';
    page.password = 'password123';
    const validForm = { invalid: false } as NgForm;
    const request = page.login(validForm);
    await page.login(validForm);
    expect(auth.login).toHaveBeenCalledTimes(1);
    finish();
    await request;
    expect(page.isLoading()).toBeFalse();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/feed']);
  });
});
