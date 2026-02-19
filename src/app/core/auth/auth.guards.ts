import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const guestGuard: CanMatchFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return router.parseUrl('/dashboard');
  }

  return true;
};

export const userGuard: CanMatchFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.parseUrl('/');
  }

  return true;
};
