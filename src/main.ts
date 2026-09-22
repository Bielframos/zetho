import { bootstrapApplication } from '@angular/platform-browser';
import { appBrowserConfig } from './app/app.config.browser';
import { App } from './app/app';

// Retire the old app's cached worker when a visitor opens maintenance.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(
        registrations.map((registration) => registration.unregister()),
      ),
    )
    .catch(() => undefined);
}

bootstrapApplication(App, appBrowserConfig).catch((err) => console.error(err));
