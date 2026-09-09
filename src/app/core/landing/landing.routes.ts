import { Routes } from '@angular/router';
import { guestGuard } from '../auth/auth.guards';
import { LandingPage } from './pages/lp/lp';
import { SplashPage } from './pages/splash/splash';

export const LANDING_ROUTES: Routes = [
  { path: '', component: SplashPage },
  { path: 'landing', component: LandingPage, canMatch: [guestGuard] },
];

