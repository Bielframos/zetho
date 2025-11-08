import { Routes } from '@angular/router';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { guestGuard } from './core/auth/auth.guards';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './pages/admin/admin.guard';

export const routes: Routes = [
  { path: 'registrar', component: Register, canMatch: [guestGuard] },
  { path: 'entrar', component: Login, canMatch: [guestGuard] },
  { path: 'admin', component: Admin, canMatch: [adminGuard] }
];
