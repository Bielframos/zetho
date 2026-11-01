import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { UiShareModal } from '../../../share/share-modal';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../auth.store';
import { ShareService } from '../../../share/share.service';
import { EmailConfirmation } from '../../email-confirmation';
import { AuthService } from '../../auth.service';
import { SocialApi } from '../../../../shared/infra/social-api';
import { FounderDirectory } from '../../../../shared/ui/founder-badge';
import { FounderPage, FounderReceipt } from './founder';

describe('Founder recognition page', () => {
  let user: ReturnType<typeof signal<any>>;
  let request: jasmine.Spy;
  let resend: jasmine.Spy;
  let directory: { invalidate: jasmine.Spy; load: jasmine.Spy };
  beforeEach(() => {
    user = signal<any>({ $id: 'zero', email: 'zero@example.com', emailVerification: true });
    request = jasmine
      .createSpy('request')
      .and.resolveTo({ status: 'awarded', number: 0, code: '#0000' });
    resend = jasmine.createSpy('resend').and.resolveTo();
    directory = {
      invalidate: jasmine.createSpy('invalidate'),
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            user,
            activeTheme: signal(null),
            refreshEmailVerification: jasmine.createSpy().and.resolveTo(false),
            ready: Promise.resolve(),
            profile: signal({ gamertag: 'Zero' }),
          },
        },
        { provide: SocialApi, useValue: { request } },
        { provide: AuthService, useValue: { createEmailVerification: resend } },
        { provide: FounderDirectory, useValue: directory },
      ],
    });
  });
  it('reveals #0000 with the real badge and refreshes the identity directory', async () => {
    const fixture = TestBed.createComponent(FounderPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('#0000');
    expect(fixture.nativeElement.textContent).toContain(
      'Você faz parte do começo.',
    );
    expect(fixture.nativeElement.querySelector('img').src).toContain(
      '/achievements/founder-badge/image',
    );
    expect(directory.invalidate).toHaveBeenCalledTimes(1);
    expect(resend).not.toHaveBeenCalled();
  });
  it('previews the awarded code and exports it through the existing share flow', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    const exportNode = jasmine.createSpy().and.resolveTo(blob);
    const deliver = jasmine.createSpy().and.resolveTo('shared');
    TestBed.overrideProvider(ShareService, { useValue: {
      exportNode, deliver, initialsAvatar: () => '', proxyImage: (url: string) => url,
    } });
    const fixture = TestBed.createComponent(FounderPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Compartilhar minha insígnia'))!;
    button.click();
    const modal = fixture.debugElement.query(By.directive(UiShareModal)).componentInstance as UiShareModal;
    expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
    expect(fixture.nativeElement.querySelector('ui-share-card').textContent).toContain('#0000');
    expect(fixture.nativeElement.querySelector('ui-share-card').textContent).toContain('@Zero');
    modal.format.set('square');
    fixture.detectChanges();
    await modal.generate();
    expect(exportNode.calls.mostRecent().args[1]).toBe(540);
    expect(exportNode.calls.mostRecent().args[2]).toBe(540);
    expect(exportNode.calls.mostRecent().args[0].textContent).toContain('#0000');
    expect(deliver).toHaveBeenCalledOnceWith(blob, 'zetho-founder-square.png');
  });

  it('shows verification instructions without revealing a reserved code', async () => {
    user.set({ $id: 'zero', email: 'zero@example.com', emailVerification: false });
    request.and.resolveTo({ status: 'verification_required' });
    const fixture = TestBed.createComponent(FounderPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Falta confirmar seu e-mail.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('#0000');
    expect(directory.invalidate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('ui-share-modal')).toBeNull();
    await TestBed.inject(EmailConfirmation).send(user());
    expect(resend).toHaveBeenCalledTimes(1);
  });
  it('does not display another session receipt after the user changes', async () => {
    let finish!: (value: FounderReceipt) => void;
    request.and.returnValue(
      new Promise<FounderReceipt>((resolve) => (finish = resolve)),
    );
    const fixture = TestBed.createComponent(FounderPage);
    fixture.detectChanges();
    request.and.resolveTo({ status: 'not_eligible' });
    user.set({ $id: 'other' });
    fixture.detectChanges();
    finish({ status: 'awarded', number: 0, code: '#0000' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.receipt()).toEqual({
      status: 'not_eligible',
    });
    expect(
      fixture.nativeElement.querySelector(
        'section[aria-label="Sua insígnia de fundador"]',
      ),
    ).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Sua história também importa.',
    );
  });
  it('offers sign-in without requesting private data when signed out', async () => {
    user.set(null);
    const fixture = TestBed.createComponent(FounderPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(request).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Entrar na minha conta',
    );
  });
});
