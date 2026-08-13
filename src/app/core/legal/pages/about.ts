import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../seo/seo.service';
import { LegalShell } from '../legal-shell';
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from '../legal.constants';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [LegalShell, RouterLink],
  template: `
    <app-legal-shell
      heading="Sobre o Zetho"
      subtitle="O que é, para quem é e quem está por trás."
      [updatedAt]="updatedAt"
    >
      <h2>O que é o Zetho</h2>
      <p>
        O Zetho é uma plataforma brasileira para quem joga levar a sério o
        próprio histórico: registrar o que já zerou, avaliar, escrever críticas
        em português, montar listas e acompanhar a evolução ao longo do tempo.
      </p>
      <p>
        A ideia nasceu de um incômodo simples — a memória do que a gente jogou
        se perde. Uma plataforma abandonada, um console trocado, uma conta
        antiga, e anos de jogatina somem junto. O Zetho existe para que esse
        registro seja seu e fique num lugar só.
      </p>

      <h2>O que dá para fazer aqui</h2>
      <ul>
        <li>
          <strong>Biblioteca.</strong> Marcar jogos como jogando, zerado,
          abandonado ou na fila.
        </li>
        <li>
          <strong>Críticas.</strong> Dar nota e escrever sobre o jogo em
          português, com texto de verdade e não só uma estrela.
        </li>
        <li>
          <strong>Listas.</strong> Organizar seleções próprias e compartilhar.
        </li>
        <li>
          <strong>Perfil público.</strong> Uma página com sua gamertag reunindo
          seu histórico.
        </li>
        <li>
          <strong>Z-Coins.</strong> Pontos de engajamento ganhos ao usar a
          plataforma. São internos, sem valor monetário — os detalhes estão nos
          <a routerLink="/termos">Termos de Uso</a>.
        </li>
        <li>
          <strong>Notícias.</strong> Uma seção editorial sobre o mercado de
          games, cujo processo de produção está descrito na
          <a routerLink="/politica-editorial">Política Editorial</a>.
        </li>
      </ul>

      <h2>De onde vêm os dados dos jogos</h2>
      <p>
        O catálogo — títulos, capas, datas de lançamento, gêneros, plataformas e
        sinopses — vem da
        <a href="https://www.igdb.com/" target="_blank" rel="noopener noreferrer"
          >IGDB</a
        >, uma base pública de dados de jogos. As notas e as críticas, essas
        são escritas pelas pessoas que usam o Zetho.
      </p>

      <h2>Como o Zetho se sustenta</h2>
      <p>
        O uso é gratuito. A operação é custeada por publicidade exibida no site.
        Não vendemos dados pessoais e não cobramos por funcionalidades.
      </p>

      <h2>Quem faz</h2>
      <p>
        O Zetho é um projeto independente, mantido no Brasil por uma equipe
        pequena. Não somos afiliados a desenvolvedoras, publicadoras ou
        fabricantes de consoles.
      </p>

      <h2>Falar com a gente</h2>
      <p>
        Sugestões, correções e problemas:
        <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a
        >. Veja também a página de <a routerLink="/contato">contato</a> e o
        <a routerLink="/changelog">changelog</a>, onde publicamos cada mudança
        do produto.
      </p>
    </app-legal-shell>
  `,
})
export class AboutPage {
  private seo = inject(SeoService);
  protected readonly contactEmail = LEGAL_CONTACT_EMAIL;
  protected readonly updatedAt = LEGAL_UPDATED_AT;

  constructor() {
    this.seo.apply({
      title: 'Sobre o Zetho',
      description:
        'O Zetho é uma plataforma brasileira para registrar jogos zerados, escrever críticas em português e acompanhar sua jornada gamer.',
      canonical: '/sobre',
      robots: 'index,follow',
      ogType: 'website',
      twitterCard: 'summary',
    });
  }
}
