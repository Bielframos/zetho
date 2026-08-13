import { bootstrapApplication } from '@angular/platform-browser';
import { appBrowserConfig } from './app/app.config.browser';
import { App } from './app/app';

bootstrapApplication(App, appBrowserConfig).catch((err) => console.error(err));
