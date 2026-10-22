import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColorModeSelector } from '../ui/color-mode-selector';

@Component({
  selector: 'app-public-entry-layout',
  imports: [RouterLink, ColorModeSelector],
  template: `
    <div class="flex min-h-dvh flex-col bg-gray-1 text-gray-12">
      <header class="border-b border-gray-4">
        <nav
          aria-label="Navegação principal"
          class="mx-auto flex min-h-20 w-full max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8"
        >
          <a
            routerLink="/landing"
            aria-label="Zetho — início"
            class="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
          >
            <span class="font-display text-[40px] leading-none">zetho</span>
          </a>
          <div class="flex items-center gap-2 sm:gap-4">
            <a
              routerLink="/buscar"
              class="ui-ghost-btn min-h-11 rounded-lg text-sm"
              >Explorar</a
            >
            @if (showLogin()) {
              <a
                routerLink="/entrar"
                class="ui-secondary-btn min-h-11 rounded-lg text-sm"
                >Entrar</a
              >
            }
          </div>
        </nav>
      </header>

      <div class="route-transition-scope flex flex-1 flex-col">
        <ng-content />
      </div>

      <footer class="border-t border-gray-4">
        <div
          class="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
        >
          <p class="text-xs text-gray-10">
            Jogos por
            <a
              href="https://www.igdb.com/"
              class="rounded hover:text-link hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >IGDB</a
            >
          </p>
          <nav
            aria-label="Rodapé"
            class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-11"
          >
            <a
              routerLink="/sobre"
              class="inline-flex min-h-11 items-center rounded hover:text-link hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >Sobre</a
            >
            <a
              routerLink="/termos"
              class="inline-flex min-h-11 items-center rounded hover:text-link hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >Termos</a
            >
            <a
              routerLink="/privacidade"
              class="inline-flex min-h-11 items-center rounded hover:text-link hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >Privacidade</a
            >
            <a
              href="https://github.com/Bielframos/Zetho"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Código aberto no GitHub (abre em nova aba)"
              class="inline-flex min-h-11 items-center rounded hover:text-link hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >Código aberto</a
            >
            <ui-color-mode-selector />
          </nav>
        </div>
      </footer>
    </div>
  `,
})
export class PublicEntryLayout {
  showLogin = input(false);
}
