import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../system/seo/seo.service';

@Component({
  selector: 'app-institutional-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="mx-auto w-full max-w-3xl">
      <header class="border-b border-gray-6 p-4">
        <div class="flex items-center gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-6 text-blue-11"
            aria-hidden="true"
          >
            <i class="ph ph-buildings"></i>
          </span>
          <div>
            <h1 class="text-2xl text-gray-12 md:text-3xl">Institucional</h1>
            <p class="mt-1 text-gray-11">
              Informações sobre o Zetho, nossas políticas e canais de contato.
            </p>
          </div>
        </div>
      </header>

      <nav aria-label="Páginas institucionais">
        <ul class="divide-y divide-gray-6">
          @for (page of pages; track page.path) {
            <li>
              <a
                [routerLink]="page.path"
                class="group flex min-h-20 items-center gap-3 px-4 py-4 transition-colors hover:bg-gray-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-6"
              >
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-6 text-blue-11"
                  aria-hidden="true"
                >
                  <i [class]="page.icon"></i>
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block font-medium text-gray-12">
                    {{ page.title }}
                  </span>
                  <span class="mt-1 block text-sm text-gray-11">
                    {{ page.description }}
                  </span>
                </span>

                <i
                  class="ph ph-arrow-right shrink-0 text-gray-10 transition-colors group-hover:text-blue-11"
                  aria-hidden="true"
                ></i>
              </a>
            </li>
          }
        </ul>
      </nav>
    </main>
  `,
})
export class InstitutionalPage {
  private seo = inject(SeoService);

  protected readonly pages = [
    {
      title: 'Termos de Uso',
      description: 'As regras para usar o Zetho.',
      path: '/termos',
      icon: 'ph ph-file-text',
    },
    {
      title: 'Política de Privacidade',
      description: 'Como coletamos, usamos e protegemos seus dados.',
      path: '/privacidade',
      icon: 'ph ph-shield-check',
    },
    {
      title: 'Sobre o Zetho',
      description: 'Conheça a plataforma e quem está por trás dela.',
      path: '/sobre',
      icon: 'ph ph-info',
    },
    {
      title: 'Política Editorial',
      description: 'Como produzimos e revisamos as notícias do Zetho.',
      path: '/politica-editorial',
      icon: 'ph ph-newspaper',
    },
    {
      title: 'Contato',
      description: 'Canais para falar com o time do Zetho.',
      path: '/contato',
      icon: 'ph ph-envelope-simple',
    },
  ] as const;

  constructor() {
    this.seo.apply({
      title: 'Institucional — Zetho',
      description:
        'Acesse os Termos de Uso, a Política de Privacidade e outras informações institucionais do Zetho.',
      canonical: '/institucional',
      robots: 'index,follow',
      ogType: 'website',
      twitterCard: 'summary',
    });
  }
}
