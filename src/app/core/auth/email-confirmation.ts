import { DestroyRef, Injectable, NgZone, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

interface ConfirmationAccount {
  $id: string;
  email: string;
  emailVerification: boolean;
}
interface ConfirmationDelivery {
  key: string;
  status: 'sending' | 'sent' | 'error';
  coolingDown: boolean;
}

/** Shares delivery feedback and the resend interval across registration and notices. */
@Injectable({ providedIn: 'root' })
export class EmailConfirmation {
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  readonly delivery = signal<ConfirmationDelivery | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  forAccount(user: ConfirmationAccount | null) {
    const state = this.delivery();
    return user && state?.key === this.key(user) ? state : null;
  }

  private key(user: ConfirmationAccount) {
    return `${user.$id}:${user.email}`;
  }

  async send(user: ConfirmationAccount) {
    const previous = this.forAccount(user);
    if (
      user.emailVerification ||
      previous?.status === 'sending' ||
      previous?.coolingDown
    )
      return;
    const generation = ++this.generation;
    const request: ConfirmationDelivery = {
      key: this.key(user),
      status: 'sending',
      coolingDown: true,
    };
    clearTimeout(this.timer);
    this.delivery.set(request);
    try {
      await this.auth.createEmailVerification();
      if (this.delivery() === request)
        this.delivery.set({ ...request, status: 'sent' });
    } catch {
      if (this.delivery() === request)
        this.delivery.set({ ...request, status: 'error' });
    } finally {
      if (generation === this.generation) {
        this.zone.runOutsideAngular(() => {
          this.timer = setTimeout(() => {
            this.delivery.update((state) =>
              state?.key === request.key
                ? { ...state, coolingDown: false }
                : state,
            );
          }, 60_000);
        });
      }
    }
  }
}
