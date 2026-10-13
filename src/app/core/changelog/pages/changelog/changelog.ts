import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiLoading } from '../../../../shared/ui/loading';

type ChangelogSection = {
  title: string;
  items: string[];
};

type ChangelogRelease = {
  version: string;
  date: string;
  sections: ChangelogSection[];
  isCurrent: boolean;
};

@Component({
  selector: 'app-changelog-page',
  standalone: true,
  imports: [RouterLink, UiLoading],
  template: `
    <main class="w-full max-w-5xl mx-auto">
      <header class="border-b border-gray-6 p-4">
        <h1 class="text-3xl md:text-4xl">Changelog</h1>
        <p class="text-gray-11 mt-2">
          Veja o que chegou de novo e o que melhorou no Zetho.
        </p>
      </header>

      @if (loading()) {
        <section class="p-6">
          <ui-loading fallback="Carregando changelog..."></ui-loading>
        </section>
      } @else if (error()) {
        <section class="border border-danger-line bg-danger-bg p-6">
          <p class="text-danger">{{ error() }}</p>
          <a routerLink="/" class="ui-link mt-3 inline-flex"
            >Voltar para início</a
          >
        </section>
      } @else if (!releases().length) {
        <section class="border border-dashed border-gray-6 p-6">
          <p class="text-gray-11">Nenhuma versão encontrada no changelog.</p>
        </section>
      } @else {
        <section class="divide-y divide-gray-6">
          @for (release of releases(); track release.version) {
            <details
              [open]="release.isCurrent"
              [class.current-release]="release.isCurrent"
            >
              <summary
                class="flex cursor-pointer list-none items-center justify-between gap-3 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-6 md:p-6"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-2xl leading-none">v{{ release.version }}</h2>
                  @if (release.isCurrent) {
                    <span
                      class="rounded-full bg-blue-3 text-blue-11 text-xs px-2 py-0.5"
                      >Atual</span
                    >
                  }
                </div>

                <div class="flex items-center gap-3 text-sm text-gray-11">
                  <span>{{ release.date }}</span>
                  <i class="ph ph-caret-down caret" aria-hidden="true"></i>
                </div>
              </summary>

              <div class="grid gap-6 px-5 pb-6 md:px-6">
                @for (section of release.sections; track section.title) {
                  <section>
                    <h3 class="mb-3 text-sm font-semibold text-blue-11">
                      {{ section.title }}
                    </h3>

                    <ul class="grid gap-2">
                      @for (item of section.items; track $index) {
                        <li
                          class="changelog-item"
                          [innerHTML]="inlineFormat(item)"
                        ></li>
                      }
                    </ul>
                  </section>
                }
              </div>
            </details>
          }
        </section>
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100%;
    }

    details.current-release {
      background: color-mix(in srgb, var(--color-blue-3) 25%, transparent);
    }

    summary::-webkit-details-marker {
      display: none;
    }

    .caret {
      transition: transform 150ms ease;
    }

    details[open] .caret {
      transform: rotate(180deg);
    }

    .changelog-item {
      position: relative;
      padding-left: 1rem;
      color: var(--color-gray-12);
      line-height: 1.6;
    }

    .changelog-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.48rem;
      width: 0.42rem;
      height: 0.42rem;
      border-radius: 999px;
      background: var(--color-gray-6);
    }

    .changelog-item :is(code) {
      background: var(--color-blue-3);
      border: 1px solid var(--color-blue-5);
      border-radius: 0.35rem;
      padding: 0.1rem 0.35rem;
      font-size: 0.9em;
    }
  `,
})
export class ChangelogPage {
  loading = signal(true);
  error = signal<string | null>(null);
  releases = signal<ChangelogRelease[]>([]);

  constructor() {
    void this.loadChangelog();
  }

  private async loadChangelog() {
    try {
      const response = await fetch('/CHANGELOG.md');
      if (!response.ok) {
        throw new Error('Não foi possível carregar o changelog agora.');
      }

      const markdown = await response.text();
      this.releases.set(this.parseReleases(markdown));
    } catch {
      this.error.set('Não foi possível carregar o changelog agora.');
    } finally {
      this.loading.set(false);
    }
  }

  private parseReleases(markdown: string): ChangelogRelease[] {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const releases: ChangelogRelease[] = [];
    let currentRelease: ChangelogRelease | null = null;
    let currentSection: ChangelogSection | null = null;

    const pushCurrentSection = () => {
      if (currentRelease && currentSection) {
        currentRelease.sections.push(currentSection);
      }
      currentSection = null;
    };

    const pushCurrentRelease = () => {
      pushCurrentSection();
      if (currentRelease) {
        releases.push(currentRelease);
      }
      currentRelease = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const releaseMatch = line.match(/^##\s+\[([^\]]+)\]\s+-\s+(.+)$/);
      if (releaseMatch) {
        pushCurrentRelease();
        currentRelease = {
          version: releaseMatch[1],
          date: this.formatDatePtBr(releaseMatch[2]),
          sections: [],
          isCurrent: false,
        };
        continue;
      }

      if (!currentRelease) continue;

      const sectionMatch = line.match(/^###\s+(.+)$/);
      if (sectionMatch) {
        pushCurrentSection();
        currentSection = {
          title: this.translateSectionTitle(sectionMatch[1]),
          items: [],
        };
        continue;
      }

      const itemMatch = line.match(/^[-*]\s+(.+)$/);
      if (itemMatch && currentSection) {
        currentSection.items.push(itemMatch[1]);
        continue;
      }

      if (currentSection) {
        currentSection.items.push(line);
      }
    }

    pushCurrentRelease();

    if (releases.length > 0) {
      releases[0].isCurrent = true;
    }

    return releases;
  }

  private translateSectionTitle(title: string): string {
    const map: Record<string, string> = {
      Added: 'Adicionado',
      Changed: 'Alterado',
      Fixed: 'Corrigido',
      Removed: 'Removido',
      Security: 'Segurança',
      Notes: 'Notas',
      Deprecated: 'Obsoleto',
      Performance: 'Desempenho',
      'Under Development': 'Em desenvolvimento',
    };

    return map[title] ?? title;
  }

  private formatDatePtBr(value: string): string {
    const trimmed = value.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }

    return value;
  }

  inlineFormat(value: string): string {
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
}
