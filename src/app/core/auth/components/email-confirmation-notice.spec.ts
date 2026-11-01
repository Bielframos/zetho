import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
    expect(fixture.nativeElement.querySelector('img').src).toContain(
      '/achievements/founder-badge/image',
    );
    expect(
      fixture.nativeElement.querySelector('header [role="status"]'),
    ).toBeNull();
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
  it('hides the notice and its spacing for an already verified account', async () => {
    const user = signal<any>({
      $id: 'owner',
      email: 'player@example.com',
      emailVerification: true,
    });
    const send = jasmine.createSpy();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
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
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    expect(fixture.nativeElement.style.display).toBe('none');
    expect(send).not.toHaveBeenCalled();
    expect(user().emailVerification).toBeTrue();
  });
});
