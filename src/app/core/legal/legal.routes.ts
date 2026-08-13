import { Routes } from '@angular/router';
import { AboutPage } from './pages/about';
import { ContactPage } from './pages/contact';
import { EditorialPolicyPage } from './pages/editorial-policy';
import { PrivacyPage } from './pages/privacy';
import { TermsPage } from './pages/terms';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'privacidade',
    component: PrivacyPage,
    title: 'Zetho | Política de Privacidade',
  },
  {
    path: 'termos',
    component: TermsPage,
    title: 'Zetho | Termos de Uso',
  },
  {
    path: 'politica-editorial',
    component: EditorialPolicyPage,
    title: 'Zetho | Política Editorial',
  },
  {
    path: 'sobre',
    component: AboutPage,
    title: 'Zetho | Sobre',
  },
  {
    path: 'contato',
    component: ContactPage,
    title: 'Zetho | Contato',
  },
];
