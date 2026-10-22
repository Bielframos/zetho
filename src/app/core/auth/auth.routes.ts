import { Routes } from '@angular/router';
import { guestGuard, userGuard } from './auth.guards';
import { LoginPage } from './pages/login/login';
import { AccountPage } from './pages/account/account';
import { RecoveryPage } from './pages/recovery-pass/recovery';
import { RegisterPage } from './pages/register/register';
import { ResetPassPage } from './pages/reset-pass/reset-pass';
import { VerificationPage } from './pages/verification/verification';

export const AUTH_ROUTES: Routes = [
  {
    path: 'minha-conta',
    component: AccountPage,
    canMatch: [userGuard],
    title: 'Zetho | Minha conta',
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/auth-game-space/auth-game-space').then(
        (m) => m.AuthGameSpace,
      ),
    children: [
      {
        path: 'registrar',
        component: RegisterPage,
        canMatch: [guestGuard],
        title: 'Zetho | Registro',
      },
      {
        path: 'entrar',
        component: LoginPage,
        canMatch: [guestGuard],
        title: 'Zetho | Login',
      },
    ],
  },
  {
    path: 'recuperar-senha',
    component: RecoveryPage,
    canMatch: [guestGuard],
    title: 'Zetho | Recuperar senha',
  },
  {
    path: 'redefinir-senha',
    component: ResetPassPage,
    canMatch: [guestGuard],
    title: 'Zetho | Recuperar senha',
  },
  {
    path: 'verificacao',
    component: VerificationPage,
    canMatch: [userGuard],
    title: 'Zetho | Verificação de e-mail',
  },
];
