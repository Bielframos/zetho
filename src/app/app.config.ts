import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics'

import { routes } from './app.routes';
import { UserStore } from './core/auth/user.store';
import { __rewriteRelativeImportExtension } from 'tslib';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideAppInitializer(async () => {
      const userStore = inject(UserStore)
      await userStore.init()
    })
  ]
};
