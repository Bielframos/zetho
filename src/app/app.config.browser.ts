import {
  ApplicationConfig,
  mergeApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { appConfig } from './app.config';

// Maintenance does not initialize auth, analytics, or the service worker.
const browserConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};

export const appBrowserConfig = mergeApplicationConfig(
  appConfig,
  browserConfig,
);
