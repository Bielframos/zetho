import { Routes } from '@angular/router';
import { guestGuard, userGuard } from './core/auth/auth.guards';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './pages/admin/admin.guard';
import { Game } from './pages/game/game';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Profile } from './pages/profile/profile';
import { Recovery } from './pages/recovery-pass/recovery';
import { Register } from './pages/register/register';
import { ResetPass } from './pages/reset-pass/reset-pass';
import { Search } from './pages/search/search';
import { Verification } from './pages/verification/verification';
import { AppLayout } from './pages/app-layout/app-layout';
import { AppDashboard } from './pages/app-dashboard/app-dashboard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'app', component: AppLayout, canMatch: [userGuard], children: [{ path: '', component: AppDashboard }] },
  { path: 'registrar', component: Register, canMatch: [guestGuard], title: 'Zetho | Registro' },
  { path: 'entrar', component: Login, canMatch: [guestGuard], title: 'Zetho | Login' },
  { path: 'recuperar-senha', component: Recovery, canMatch: [guestGuard], title: 'Zetho | Recuperar senha' },
  { path: 'redefinir-senha', component: ResetPass, canMatch: [guestGuard], title: 'Zetho | Recuperar senha' },
  { path: 'admin', component: Admin, canMatch: [adminGuard], title: 'Zerie | Admin' },
  { path: 'buscar', component: Search, title: 'Zetho | Busque um jogo' },
  { path: 'jogo/:slug', component: Game },
  { path: 'perfil', component: Profile, canMatch: [userGuard], title: 'Zetho | Meu perfil' },
  { path: 'verificacao', component: Verification, canMatch: [userGuard], title: 'Zetho | Verificação de e-mail' }
];
