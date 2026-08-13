import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';

/**
 * Configuração isomórfica: só o que roda igual no browser e no Node.
 *
 * Tudo que depende de `window`, `document`, `sessionStorage` ou de SDK de
 * terceiro que assume o browser vive em `app.config.browser.ts`. Além de
 * evitar crash no SSR, isso tira `@angular/fire` + `firebase` (~400KB) do
 * bundle do servidor por tree-shaking.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),
    provideClientHydration(),
  ],
};
