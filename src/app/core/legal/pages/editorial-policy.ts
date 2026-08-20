import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../system/seo/seo.service';
import { LegalShell } from '../legal-shell';
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from '../legal.constants';

@Component({
  selector: 'app-editorial-policy-page',
  standalone: true,
  imports: [LegalShell, RouterLink],
  template: `
    <app-legal-shell
      heading="Política Editorial"
      subtitle="Como a seção de notícias do Zetho é produzida."
      [updatedAt]="updatedAt"
    >
      <h2>Resumo</h2>
      <p>
        A seção de <a routerLink="/noticias">notícias</a> do Zetho é produzida
        com apoio de inteligência artificial, sob supervisão humana. Os textos
        assinados por <strong>Zetho Insider</strong> são redigidos por um
        assistente editorial automatizado a partir de fontes públicas, sempre
        com link para a reportagem original. Não apresentamos esses textos como
        escritos por uma pessoa.
      </p>
      <p>
        As <strong>críticas de jogos</strong> publicadas por usuários são outra
        coisa: aquelas são escritas por pessoas, assinadas com a gamertag de
        quem escreveu, e não passam por geração automática.
      </p>

      <h2>Fontes</h2>
      <p>
        Acompanhamos os feeds públicos de veículos e canais oficiais do setor,
        entre eles IGN, GameSpot, Video Games Chronicle, PlayStation Blog e Xbox
        Wire. Toda matéria derivada de uma dessas fontes traz o link para o
        material original.
      </p>

      <h2>Como uma matéria é produzida</h2>
      <ol>
        <li>
          <strong>Captura.</strong> O sistema coleta periodicamente as
          publicações recentes dos feeds acompanhados.
        </li>
        <li>
          <strong>Seleção.</strong> O assistente avalia relevância para o
          público brasileiro e descarta o que é repetido ou irrelevante.
        </li>
        <li>
          <strong>Leitura da fonte.</strong> O conteúdo da reportagem original é
          extraído para servir de base factual.
        </li>
        <li>
          <strong>Redação.</strong> O texto é escrito em português do Brasil,
          com contexto próprio e ligação com os jogos do catálogo do Zetho.
          Não republicamos traduções integrais nem cópias do original.
        </li>
        <li>
          <strong>Publicação.</strong> A matéria vai ao ar assinada por Zetho
          Insider, com data e link da fonte.
        </li>
      </ol>

      <h2>Supervisão humana</h2>
      <p>
        A equipe do Zetho é responsável editorial por tudo que é publicado,
        inclusive pelo que foi gerado automaticamente. Mantemos ferramentas
        internas para revisar, editar, corrigir e despublicar qualquer matéria.
        Conteúdo que não atinge nosso critério mínimo de qualidade não é
        publicado.
      </p>

      <h2>Erros e correções</h2>
      <p>
        Textos produzidos com apoio de IA podem conter imprecisões. Levamos
        correção a sério: se você encontrar um erro, escreva para
        <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a> com a URL da
        matéria e o ponto a corrigir. Analisamos e, quando procedente,
        corrigimos o texto, registramos a correção ou despublicamos a matéria.
      </p>

      <h2>O que não fazemos</h2>
      <ul>
        <li>
          Não atribuímos textos automatizados a jornalistas ou a pessoas reais.
        </li>
        <li>Não publicamos conteúdo patrocinado sem identificá-lo como tal.</li>
        <li>
          Não copiamos nem republicamos integralmente o texto de outros
          veículos.
        </li>
        <li>
          Não usamos IA para gerar críticas de jogos em nome de usuários.
        </li>
      </ul>

      <h2>Independência</h2>
      <p>
        Não temos vínculo com desenvolvedoras, publicadoras ou fabricantes de
        consoles. A receita do site vem de publicidade, que não influencia a
        seleção nem o teor das matérias.
      </p>

      <p>
        Veja também os <a routerLink="/termos">Termos de Uso</a>, a
        <a routerLink="/privacidade">Política de Privacidade</a> e a página
        <a routerLink="/sobre">Sobre</a>.
      </p>
    </app-legal-shell>
  `,
})
export class EditorialPolicyPage {
  private seo = inject(SeoService);
  protected readonly contactEmail = LEGAL_CONTACT_EMAIL;
  protected readonly updatedAt = LEGAL_UPDATED_AT;

  constructor() {
    this.seo.apply({
      title: 'Política Editorial — Zetho',
      description:
        'Como a seção de notícias do Zetho é produzida: fontes, papel da inteligência artificial, supervisão humana e processo de correção.',
      canonical: '/politica-editorial',
      robots: 'index,follow',
      ogType: 'website',
      twitterCard: 'summary',
    });
  }
}
