import { Routes } from '@angular/router';
import { guestGuard, userGuard } from './core/auth/auth.guards';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './pages/admin/admin.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Game } from './pages/game/game';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Recovery } from './pages/recovery-pass/recovery';
import { Register } from './pages/register/register';
import { ResetPass } from './pages/reset-pass/reset-pass';
import { Search } from './pages/search/search';
import { Verification } from './pages/verification/verification';
import { Profile } from './pages/profile/profile';
import { Account } from './pages/account/profile-settings';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'dashboard', component: Dashboard, canMatch: [userGuard], title: 'Zetho' },
  { path: 'registrar', component: Register, canMatch: [guestGuard], title: 'Zetho | Registro' },
  { path: 'entrar', component: Login, canMatch: [guestGuard], title: 'Zetho | Login' },
  { path: 'recuperar-senha', component: Recovery, canMatch: [guestGuard], title: 'Zetho | Recuperar senha' },
  { path: 'redefinir-senha', component: ResetPass, canMatch: [guestGuard], title: 'Zetho | Recuperar senha' },
  { path: 'admin', component: Admin, canMatch: [adminGuard], title: 'Zerie | Admin' },
  { path: 'buscar', component: Search, title: 'Zetho | Busque um jogo' },
  { path: 'jogo/:slug', component: Game },
  { path: 'minha-conta', component: Account, canMatch: [userGuard], title: 'Zetho | Minha conta' },
  { path: 'verificacao', component: Verification, canMatch: [userGuard], title: 'Zetho | Verificação de e-mail' },
  { path: 'player/:gamertag', component: Profile, canMatch: [userGuard] }
];
