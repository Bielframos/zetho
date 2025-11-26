import { Routes } from '@angular/router';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { guestGuard, userGuard } from './core/auth/auth.guards';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './pages/admin/admin.guard';
import { Search } from './pages/search/search';
import { Game } from './pages/game/game';
import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { Verification } from './pages/verification/verification';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'registrar', component: Register, canMatch: [guestGuard], title: 'Zetho | Registro' },
  { path: 'entrar', component: Login, canMatch: [guestGuard], title: 'Zetho | Login' },
  { path: 'admin', component: Admin, canMatch: [adminGuard], title: 'Zerie | Admin' },
  { path: 'buscar', component: Search, title: 'Zetho | Busque um jogo' },
  { path: 'jogo/:slug', component: Game },
  { path: 'perfil', component: Profile, canMatch: [userGuard], title: 'Zetho | Meu perfil' },
  { path: 'verificacao', component: Verification, canMatch: [userGuard], title: 'Zetho | Verificação de e-mail' }
];
