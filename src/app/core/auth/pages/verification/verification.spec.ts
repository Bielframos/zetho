import { Location } from '@angular/common';
import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth.service';
import { AuthStore } from '../../auth.store';
import { VerificationPage } from './verification';

describe('Email confirmation', () => {
  let verify: jasmine.Spy;
  let user: ReturnType<typeof signal<any>>;
  let refresh: jasmine.Spy;
  let navigate: jasmine.Spy;
  let params: Record<string, string>;
  beforeEach(() => {
    verify = jasmine.createSpy('verifyEmail').and.resolveTo();
    user = signal<any>({ $id: 'owner' });
    refresh = jasmine.createSpy('refresh').and.resolveTo();
    params = { userId: 'owner', secret: 'test-token' };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { verifyEmail: verify } },
        {
          provide: AuthStore,
          useValue: {
            user,
            ready: Promise.resolve(),
            refresh,
            logout: jasmine.createSpy().and.resolveTo(),
          },
        },
        {
          provide: ActivatedRoute,
          useFactory: () => ({ queryParamMap: of(convertToParamMap(params)) }),
        },
        {
          provide: Location,
          useValue: { replaceState: jasmine.createSpy('replaceState') },
        },
      ],
    });
  });
  function create() {
    const fixture = TestBed.createComponent(VerificationPage);
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    return fixture;
  }
  it('refreshes the current account and opens the founder receipt after confirmation', async () => {
    const fixture = create();
    await fixture.whenStable();
    expect(verify).toHaveBeenCalledOnceWith('owner', 'test-token');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/fundador'], { replaceUrl: true });
    expect(TestBed.inject(Location).replaceState).toHaveBeenCalledWith(
      '/verificacao',
    );
  });
  it('confirms the link without a session and offers sign-in without exposing an award', async () => {
    user.set(null);
    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(verify).toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Descobrir minha insígnia',
    );
  });
  it('does not redeem a verification token during SSR', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const fixture = create();
    await fixture.whenStable();
    expect(verify).not.toHaveBeenCalled();
  });
  it('does not submit an incomplete link', async () => {
    params = {};
    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(verify).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Este link está incompleto',
    );
  });
});
