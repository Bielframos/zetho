import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../system/seo/seo.service';
import { LegalShell } from '../legal-shell';
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from '../legal.constants';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [LegalShell, RouterLink],
  template: `
    <app-legal-shell
      heading="Termos de Uso"
      subtitle="As regras para usar o Zetho."
      [updatedAt]="updatedAt"
    >
      <h2>1. Aceitação</h2>
      <p>
        Ao criar uma conta ou usar o Zetho, você concorda com estes Termos e com
        a <a routerLink="/privacidade">Política de Privacidade</a>. Se não
        concordar, não use o serviço.
      </p>

      <h2>2. O que é o Zetho</h2>
      <p>
        O Zetho é uma plataforma para registrar jogos, escrever críticas, montar
        listas e acompanhar sua jornada como jogador. O serviço é oferecido
        gratuitamente, no estado em que se encontra, e pode mudar ou ser
        descontinuado a qualquer momento.
      </p>

      <h2>3. Sua conta</h2>
      <ul>
        <li>Você é responsável pela veracidade dos dados que cadastrar.</li>
        <li>
          Você é responsável por manter suas credenciais em sigilo e por toda
          atividade realizada na sua conta.
        </li>
        <li>
          É proibido manter mais de uma conta com o objetivo de acumular
          Z-Coins, manipular rankings ou burlar limites do serviço.
        </li>
        <li>
          Você pode excluir sua conta a qualquer momento pelas configurações ou
          escrevendo para
          <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a
          >.
        </li>
      </ul>

      <h2>4. Z-Coins</h2>
      <p>
        Z-Coins são pontos de engajamento internos, sem qualquer natureza
        financeira. Especificamente:
      </p>
      <ul>
        <li>
          <strong>Não possuem valor monetário</strong> e não constituem moeda,
          valor mobiliário, ativo virtual ou meio de pagamento.
        </li>
        <li>
          <strong>Não são resgatáveis</strong> por dinheiro, crédito ou qualquer
          outro bem fora do Zetho.
        </li>
        <li>
          <strong>Não são transferíveis</strong> entre contas nem para
          terceiros, e não podem ser comprados ou vendidos.
        </li>
        <li>
          Podem ser ajustados, expirados, revogados ou zerados a qualquer
          momento, inclusive em caso de erro de cálculo, falha técnica ou uso
          abusivo.
        </li>
        <li>
          Não geram direito adquirido. O encerramento do serviço ou da sua conta
          extingue o saldo sem direito a compensação.
        </li>
      </ul>

      <h2>5. Conteúdo que você publica</h2>
      <p>
        Você mantém a titularidade das críticas, comentários e listas que
        publicar. Ao publicá-los, você concede ao Zetho uma licença não
        exclusiva, gratuita, mundial e pelo prazo de proteção legal para
        armazenar, exibir, reproduzir, adaptar formato e distribuir esse
        conteúdo dentro do serviço e na sua divulgação, inclusive em resultados
        de mecanismos de busca e em redes sociais.
      </p>
      <p>Você declara que o conteúdo é seu e que não viola direitos de terceiros.</p>

      <h2>6. Conduta proibida</h2>
      <ul>
        <li>Publicar conteúdo ilegal, difamatório, discriminatório ou de ódio.</li>
        <li>Publicar conteúdo sexual explícito ou violência gratuita.</li>
        <li>Publicar spam, propaganda não autorizada ou links maliciosos.</li>
        <li>Plagiar críticas ou textos de terceiros.</li>
        <li>
          Automatizar acesso, raspar dados em massa ou tentar contornar limites
          técnicos e de segurança.
        </li>
        <li>Manipular notas, votos, rankings ou saldo de Z-Coins.</li>
      </ul>

      <h2>7. Moderação</h2>
      <p>
        Podemos remover conteúdo, suspender ou encerrar contas que violem estes
        Termos, com ou sem aviso prévio conforme a gravidade. Se você discordar
        de uma remoção, escreva para
        <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a
        >. Denúncias de conteúdo impróprio ou de violação de direitos autorais
        devem ser enviadas para o mesmo endereço, com identificação da URL e do
        motivo.
      </p>

      <h2>8. Conteúdo de terceiros</h2>
      <p>
        Informações de jogos — títulos, capas, datas, sinopses, gêneros e
        plataformas — são fornecidas pela
        <a href="https://www.igdb.com/" target="_blank" rel="noopener noreferrer"
          >IGDB</a
        >
        e pertencem a seus respectivos titulares. O Zetho não é afiliado a
        desenvolvedoras, publicadoras ou fabricantes de consoles.
      </p>
      <p>
        Parte do conteúdo editorial da seção de notícias é produzida com apoio
        de automação. O funcionamento e os limites desse processo estão
        descritos na
        <a routerLink="/politica-editorial">Política Editorial</a>.
      </p>

      <h2>9. Publicidade</h2>
      <p>
        O site pode exibir anúncios de terceiros para custear a operação. Não
        endossamos os produtos anunciados nem respondemos por eles.
      </p>

      <h2>10. Limitação de responsabilidade</h2>
      <p>
        O serviço é fornecido "como está", sem garantia de disponibilidade
        ininterrupta ou ausência de erros. Na máxima extensão permitida pela
        lei, não respondemos por danos indiretos, lucros cessantes ou perda de
        dados decorrentes do uso do serviço. Nada aqui afasta direitos
        assegurados ao consumidor pelo Código de Defesa do Consumidor.
      </p>

      <h2>11. Alterações</h2>
      <p>
        Podemos alterar estes Termos. Mudanças relevantes serão comunicadas no
        site, e o uso continuado após a comunicação significa aceitação.
      </p>

      <h2>12. Lei aplicável e foro</h2>
      <p>
        Estes Termos são regidos pela lei brasileira. Fica eleito o foro do
        domicílio do usuário para dirimir controvérsias, conforme o art. 101, I
        do Código de Defesa do Consumidor.
      </p>
    </app-legal-shell>
  `,
})
export class TermsPage {
  private seo = inject(SeoService);
  protected readonly contactEmail = LEGAL_CONTACT_EMAIL;
  protected readonly updatedAt = LEGAL_UPDATED_AT;

  constructor() {
    this.seo.apply({
      title: 'Termos de Uso — Zetho',
      description:
        'Regras de uso do Zetho: conta, Z-Coins, conteúdo publicado, moderação e responsabilidades.',
      canonical: '/termos',
      robots: 'index,follow',
      ogType: 'website',
      twitterCard: 'summary',
    });
  }
}
