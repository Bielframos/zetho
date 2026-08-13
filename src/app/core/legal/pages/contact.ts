import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../seo/seo.service';
import { LegalShell } from '../legal-shell';
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from '../legal.constants';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [LegalShell, RouterLink],
  template: `
    <app-legal-shell
      heading="Contato"
      subtitle="Como falar com o time do Zetho."
      [updatedAt]="updatedAt"
    >
      <h2>E-mail</h2>
      <p>
        <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a>
      </p>
      <p>
        É o canal único para todos os assuntos. Respondemos em até 5 dias úteis
        — pedidos de privacidade têm prazo próprio de 15 dias, conforme a
        <a routerLink="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>O que enviar em cada caso</h2>
      <ul>
        <li>
          <strong>Erro ou bug.</strong> Descreva o que aconteceu, a URL e o
          navegador usado.
        </li>
        <li>
          <strong>Correção de conteúdo editorial.</strong> Envie a URL da
          matéria e o ponto a corrigir. O processo está na
          <a routerLink="/politica-editorial">Política Editorial</a>.
        </li>
        <li>
          <strong>Denúncia de conteúdo.</strong> Envie a URL e o motivo. Veja as
          regras nos <a routerLink="/termos">Termos de Uso</a>.
        </li>
        <li>
          <strong>Direitos autorais.</strong> Identifique a obra, a URL no Zetho
          e sua relação com o titular.
        </li>
        <li>
          <strong>Dados pessoais.</strong> Diga qual direito quer exercer
          (acesso, correção, exclusão, portabilidade) e o e-mail da conta.
        </li>
        <li>
          <strong>Publicidade e parcerias.</strong> Descreva a proposta.
        </li>
      </ul>

      <h2>Outras páginas úteis</h2>
      <ul>
        <li><a routerLink="/sobre">Sobre o Zetho</a></li>
        <li><a routerLink="/changelog">Changelog</a> — o que mudou em cada versão</li>
        <li><a routerLink="/termos">Termos de Uso</a></li>
        <li><a routerLink="/privacidade">Política de Privacidade</a></li>
      </ul>
    </app-legal-shell>
  `,
})
export class ContactPage {
  private seo = inject(SeoService);
  protected readonly contactEmail = LEGAL_CONTACT_EMAIL;
  protected readonly updatedAt = LEGAL_UPDATED_AT;

  constructor() {
    this.seo.apply({
      title: 'Contato — Zetho',
      description:
        'Fale com o time do Zetho: bugs, correções de conteúdo, denúncias, direitos autorais e pedidos de privacidade.',
      canonical: '/contato',
      robots: 'index,follow',
      ogType: 'website',
      twitterCard: 'summary',
    });
  }
}
