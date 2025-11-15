import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { UserStore } from './user.store';

export const guestGuard: CanMatchFn = () => {
  const userStore = inject(UserStore);
  const router = inject(Router);

  if (userStore.isAuthenticated()) {
    return router.parseUrl('/');
  }

  return true;
};
