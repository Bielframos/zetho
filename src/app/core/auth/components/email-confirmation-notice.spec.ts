import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { AuthStore } from '../auth.store';
import { EmailConfirmation } from '../email-confirmation';
import { EmailConfirmationNotice } from './email-confirmation-notice';

describe('Email confirmation notice', () => {
  it('offers resend and email correction, then replaces the notice after confirmation', async () => {
    const user = signal<any>({
      $id: 'owner',
      email: 'player@example.com',
      emailVerification: false,
    });
    const send = jasmine.createSpy().and.resolveTo();
    const refresh = jasmine.createSpy().and.resolveTo(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { user, refreshEmailVerification: refresh },
        },
        {
          provide: EmailConfirmation,
          useValue: { forAccount: () => null, send },
        },
      ],
    });
    const fixture = TestBed.createComponent(EmailConfirmationNotice);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('player@example.com');
    expect(fixture.nativeElement.textContent).toContain(
      'Se sua conta fizer parte',
    );
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(
      '/minha-conta#account-email',
    );
    fixture.nativeElement.querySelector('button').click();
    expect(send).toHaveBeenCalledOnceWith(user());
    refresh.and.callFake(async () => {
      user.update((value) => ({ ...value, emailVerification: true }));
      return true;
    });
    await fixture.componentInstance.check();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('E-mail confirmado!');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(
      '/fundador',
    );
  });
  it('previews the notice locally for a verified account without allowing a resend', async () => {
    const user = signal<any>({
      $id: 'owner',
      email: 'player@example.com',
      emailVerification: true,
    });
    const send = jasmine.createSpy();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(
              convertToParamMap({ previewEmailConfirmation: '1' }),
            ),
          },
        },
        { provide: AuthStore, useValue: { user } },
        {
          provide: EmailConfirmation,
          useValue: { forAccount: () => null, send },
        },
      ],
    });
    const fixture = TestBed.createComponent(EmailConfirmationNotice);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Prévia local do aviso',
    );
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTrue();
    button.click();
    expect(send).not.toHaveBeenCalled();
    expect(user().emailVerification).toBeTrue();
  });
});
