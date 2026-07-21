import { Routes } from '@angular/router';
import { userGuard } from '../auth/auth.guards';
import { OnboardingPage } from './pages/onboarding/onboarding';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: 'comecar',
    component: OnboardingPage,
    canMatch: [userGuard],
    title: 'Bem-vindo ao Zetho',
  },
];
