import {
  ApplicationConfig,
  inject,
  mergeApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideServiceWorker } from '@angular/service-worker';

import { environment } from '../environments/environment';
import { appConfig } from './app.config';
import { AuthStore } from './core/auth/auth.store';

/**
 * Providers que só existem no browser. Nenhum deles pode entrar em
 * `app.config.ts`: Firebase Analytics exige `window`, o Service Worker exige
 * `navigator`, e o initializer de auth lê `sessionStorage`.
 */
const browserConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    ...(environment.firebase.apiKey &&
    environment.firebase.projectId &&
    environment.firebase.appId
      ? [
          provideFirebaseApp(() => initializeApp(environment.firebase)),
          provideAnalytics(() => getAnalytics()),
        ]
      : []),
    provideAppInitializer(() => {
      const authStore = inject(AuthStore);
      // Deliberadamente não bloqueante: se o bootstrap esperasse a sessão, o
      // servidor renderizaria deslogado e o cliente hidrataria logado — o que
      // dispara NG0500 em todo `@if (authStore.user())`. Quem precisa da
      // sessão resolvida espera `authStore.ready`.
      void authStore.init();
    }),
  ],
};

export const appBrowserConfig = mergeApplicationConfig(
  appConfig,
  browserConfig,
);
