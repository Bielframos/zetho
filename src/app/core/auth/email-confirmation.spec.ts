import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { AuthService } from './auth.service';
import { EmailConfirmation } from './email-confirmation';

const account = {
  $id: 'owner',
  email: 'player@example.com',
  emailVerification: false,
};

describe('Email confirmation delivery', () => {
  let send: jasmine.Spy;
  beforeEach(() => {
    send = jasmine.createSpy().and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { createEmailVerification: send } },
      ],
    });
  });

  it('shares successful delivery feedback and limits resends for one minute', fakeAsync(() => {
    const flow = TestBed.inject(EmailConfirmation);
    void flow.send(account);
    void flow.send(account);
    expect(send).toHaveBeenCalledTimes(1);
    flushMicrotasks();
    expect(flow.forAccount(account)?.status).toBe('sent');
    tick(59_999);
    void flow.send(account);
    expect(send).toHaveBeenCalledTimes(1);
    tick(1);
    void flow.send(account);
    flushMicrotasks();
    expect(send).toHaveBeenCalledTimes(2);
    tick(60_000);
  }));

  it('keeps delivery failures recoverable and permits a corrected email', fakeAsync(() => {
    send.and.rejectWith(new Error('offline'));
    const flow = TestBed.inject(EmailConfirmation);
    void flow.send(account);
    flushMicrotasks();
    expect(flow.forAccount(account)?.status).toBe('error');
    const corrected = { ...account, email: 'correct@example.com' };
    expect(flow.forAccount(corrected)).toBeNull();
    send.and.resolveTo();
    void flow.send(corrected);
    flushMicrotasks();
    expect(flow.forAccount(corrected)?.status).toBe('sent');
    expect(flow.forAccount(account)).toBeNull();
    tick(60_000);
  }));

  it('does not send confirmation for an already verified account', async () => {
    await TestBed.inject(EmailConfirmation).send({
      ...account,
      emailVerification: true,
    });
    expect(send).not.toHaveBeenCalled();
  });
});
