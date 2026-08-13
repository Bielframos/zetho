import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../seo/seo.service';
import { LegalShell } from '../legal-shell';
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from '../legal.constants';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [LegalShell, RouterLink],
  template: `
    <app-legal-shell
      heading="Política de Privacidade"
      subtitle="Como o Zetho coleta, usa e protege seus dados."
      [updatedAt]="updatedAt"
    >
      <h2>1. Quem é o controlador</h2>
      <p>
        O Zetho ("nós") é o controlador dos dados pessoais tratados neste site,
        nos termos da Lei nº 13.709/2018 (LGPD). Para qualquer assunto
        relacionado a privacidade, incluindo o exercício dos direitos descritos
        na seção 7, o contato é
        <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a
        >.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <p>Coletamos apenas o necessário para operar o serviço:</p>
      <ul>
        <li>
          <strong>Dados de cadastro:</strong> e-mail, nome de exibição,
          gamertag e imagem de avatar.
        </li>
        <li>
          <strong>Conteúdo que você cria:</strong> avaliações, críticas,
          comentários, listas e registros de jogos da sua biblioteca.
        </li>
        <li>
          <strong>Dados de uso do produto:</strong> saldo e histórico de
          Z-Coins, conquistas e progresso.
        </li>
        <li>
          <strong>Dados técnicos:</strong> endereço IP, tipo de navegador e
          sistema operacional, páginas acessadas e datas de acesso.
        </li>
        <li>
          <strong>Cookies e armazenamento local:</strong> cookie de sessão da
          nossa plataforma de autenticação (Appwrite) e chaves de
          <code>localStorage</code>/<code>sessionStorage</code> usadas para
          manter você conectado e lembrar preferências de interface.
        </li>
      </ul>
      <p>
        Não coletamos dados sensíveis (origem racial, convicção religiosa,
        opinião política, saúde, biometria) nem dados de pagamento — o Zetho não
        processa pagamentos.
      </p>

      <h2>3. Para que usamos esses dados</h2>
      <ul>
        <li>Criar e autenticar sua conta.</li>
        <li>Exibir seu perfil público, suas críticas e suas listas.</li>
        <li>Calcular Z-Coins, rankings e conquistas.</li>
        <li>Prevenir fraude, abuso e violações dos Termos de Uso.</li>
        <li>Medir o uso do site e melhorar o produto.</li>
        <li>Exibir publicidade, conforme a seção 5.</li>
      </ul>

      <h2>4. Bases legais</h2>
      <ul>
        <li>
          <strong>Execução de contrato</strong> (art. 7º, V da LGPD) — para
          criar sua conta e entregar as funcionalidades do serviço.
        </li>
        <li>
          <strong>Legítimo interesse</strong> (art. 7º, IX) — para segurança,
          prevenção a fraude e métricas agregadas de uso.
        </li>
        <li>
          <strong>Consentimento</strong> (art. 7º, I) — para cookies de
          publicidade e análise não essenciais, quando aplicável.
        </li>
        <li>
          <strong>Cumprimento de obrigação legal</strong> (art. 7º, II) — para
          guarda de registros de acesso, nos termos do Marco Civil da Internet.
        </li>
      </ul>

      <h2>5. Publicidade e cookies de terceiros</h2>
      <ul>
        <li>
          Fornecedores terceiros, <strong>incluindo o Google</strong>, usam
          cookies para veicular anúncios com base em visitas anteriores do
          usuário ao nosso site ou a outros sites.
        </li>
        <li>
          O uso de cookies de publicidade pelo Google permite que ele e seus
          parceiros veiculem anúncios para os usuários com base na visita deles
          aos nossos sites e/ou a outros sites na Internet.
        </li>
        <li>
          Os usuários podem desativar a publicidade personalizada nas
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            >Configurações de anúncios do Google</a
          >.
        </li>
        <li>
          Alternativamente, é possível desativar o uso de cookies por
          fornecedores terceiros para publicidade personalizada em
          <a
            href="https://optout.aboutads.info/"
            target="_blank"
            rel="noopener noreferrer"
            >optout.aboutads.info</a
          >.
        </li>
        <li>
          Saiba mais em
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            >Como o Google usa dados quando você usa sites ou aplicativos de
            nossos parceiros</a
          >.
        </li>
      </ul>

      <h2>6. Com quem compartilhamos</h2>
      <p>
        Não vendemos dados pessoais. Compartilhamos apenas com operadores
        necessários ao funcionamento do serviço:
      </p>
      <ul>
        <li><strong>Appwrite</strong> — autenticação e banco de dados.</li>
        <li>
          <strong>Google (Firebase Analytics e Google AdSense)</strong> —
          métricas de uso e publicidade.
        </li>
        <li>
          <strong>IGDB / Twitch</strong> — catálogo de jogos. Consultamos dados
          deles; não enviamos seus dados pessoais.
        </li>
        <li>
          <strong>Autoridades públicas</strong> — apenas mediante ordem legal
          válida.
        </li>
      </ul>
      <p>
        Parte desses fornecedores está fora do Brasil. Nesses casos a
        transferência internacional ocorre com base no art. 33 da LGPD, com
        garantias contratuais de proteção equivalente.
      </p>

      <h2>7. Seus direitos</h2>
      <p>
        Você pode, a qualquer momento, solicitar: confirmação de tratamento;
        acesso aos dados; correção de dados incompletos ou desatualizados;
        anonimização, bloqueio ou eliminação de dados desnecessários;
        portabilidade; informação sobre compartilhamento; revogação do
        consentimento; e eliminação dos dados tratados com base em
        consentimento.
      </p>
      <p>
        Para exercer qualquer um deles, escreva para
        <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a
        >. Respondemos em até 15 dias.
      </p>

      <h2>8. Retenção</h2>
      <p>
        Mantemos seus dados de cadastro enquanto sua conta existir. Após a
        exclusão da conta, os dados de cadastro são eliminados em até 30 dias,
        exceto: registros de acesso, mantidos por 6 meses por exigência do art.
        15 do Marco Civil da Internet; e conteúdo público que você tenha
        publicado (críticas e comentários), que pode ser mantido de forma
        desvinculada da sua identidade para preservar a integridade das
        discussões.
      </p>

      <h2>9. Segurança</h2>
      <p>
        Usamos conexão criptografada (HTTPS), controle de acesso por sessão e
        segregação de permissões no banco de dados. Nenhum sistema é
        integralmente imune a incidentes; em caso de incidente de segurança
        relevante, comunicaremos você e a ANPD conforme o art. 48 da LGPD.
      </p>

      <h2>10. Idade mínima</h2>
      <p>
        O Zetho não é direcionado a menores de 13 anos e não coleta
        intencionalmente dados dessa faixa etária. Usuários entre 13 e 18 anos
        devem usar o serviço com consentimento dos responsáveis. Se identificar
        cadastro de menor de 13 anos, escreva para
        <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a> e faremos a
        exclusão.
      </p>

      <h2>11. Alterações</h2>
      <p>
        Podemos atualizar esta política. Mudanças relevantes serão comunicadas
        no site. A data de última atualização está no topo desta página.
      </p>

      <p>
        Veja também os <a routerLink="/termos">Termos de Uso</a>.
      </p>
    </app-legal-shell>
  `,
})
export class PrivacyPage {
  private seo = inject(SeoService);
  protected readonly contactEmail = LEGAL_CONTACT_EMAIL;
  protected readonly updatedAt = LEGAL_UPDATED_AT;

  constructor() {
    this.seo.apply({
      title: 'Política de Privacidade — Zetho',
      description:
        'Como o Zetho coleta, usa, compartilha e protege seus dados pessoais, conforme a LGPD.',
      canonical: '/privacidade',
      robots: 'index,follow',
      ogType: 'website',
      twitterCard: 'summary',
    });
  }
}
