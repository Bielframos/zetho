import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/**
 * Os guards são assíncronos de propósito.
 *
 * Com o `init()` do AuthStore não bloqueando mais o bootstrap (necessário para
 * a hidratação não quebrar), `isAuthenticated()` ainda é `false` no primeiro
 * tick. Um guard síncrono leria esse estado provisório e expulsaria da rota um
 * usuário que está, sim, logado. Esperar `authStore.ready` resolve isso sem
 * reintroduzir o bloqueio no bootstrap.
 */
export const guestGuard: CanMatchFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  await authStore.ready;

  if (authStore.isAuthenticated()) {
    return router.parseUrl('/dashboard');
  }

  return true;
};

export const userGuard: CanMatchFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  await authStore.ready;

  if (!authStore.isAuthenticated()) {
    return router.parseUrl('/landing');
  }

  return true;
};

/**
 * Permite que uma página protegida entregue seu conteúdo público e metadados
 * durante o SSR, mantendo a exigência de sessão no navegador.
 *
 * O servidor nunca recebe a sessão Appwrite do visitante, portanto o acesso a
 * dados pessoais continua restrito à API autenticada depois da hidratação.
 */
export const userGuardWithSsr: CanMatchFn = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return true;
  }

  const authStore = inject(AuthStore);
  const router = inject(Router);

  await authStore.ready;

  if (!authStore.isAuthenticated()) {
    return router.parseUrl('/landing');
  }

  return true;
};

export const adminGuard: CanMatchFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  await authStore.ready;

  if (!authStore.isAuthenticated()) {
    return router.parseUrl('/landing');
  }

  if (!authStore.isAdmin()) {
    return router.parseUrl('/dashboard');
  }

  return true;
};
