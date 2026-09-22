import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiInput } from '../../../../../shared/ui/input/input';
import { ProfileStore } from '../../../../userProfiles/profile.store';
import { AuthStore } from '../../../../auth/auth.store';
import { environment } from '../../../../../../environments/environment';

type Goal = {
  profileId: string;
  year: number;
  target: number | null;
  completed: number;
};

@Component({
  selector: 'ui-annual-goal',
  standalone: true,
  imports: [FormsModule, UiInput],
  styles: [
    `
      .goal-edit-trigger {
        width: 1.5rem;
        height: 1.5rem;
        min-height: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
      }
      .goal-edit-trigger i {
        font-size: 0.875rem;
      }
    `,
  ],
  template: `
    @if (loading()) {
      <p class="px-4 py-5 text-sm text-gray-11">
        Carregando meta anual…
      </p>
    }
    @if (!loading() && !goal() && error()) {
      <p class="px-4 py-5 text-sm text-red-11">
        {{ error() }}
      </p>
    }
    @if (goal(); as current) {
      <section
        class="profile-theme-card profile-theme-divider relative px-4 py-5"
        [class.has-theme]="!!profileStore.activeTheme()"
        [style.--theme-bg]="profileStore.activeTheme()?.backgroundColor"
        [style.--theme-c1]="profileStore.activeTheme()?.primaryColor"
        [style.--theme-c2]="profileStore.activeTheme()?.secondaryColor"
        [style.--theme-c3]="profileStore.activeTheme()?.tertiaryColor"
        [style.background-color]="profileStore.activeTheme()?.backgroundColor"
        aria-label="Meta anual de jogos"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg text-gray-12">Meta de {{ current.year }}</h2>
          <div class="flex min-w-0 items-center justify-end gap-1">
            <span class="truncate text-sm tabular-nums text-gray-11"
              >{{ current.completed }} / {{ current.target ?? '—' }} jogos
              @if (current.target) {
                · {{ progress() }}%
              }
            </span>
            @if (profileStore.itsMe()) {
              <button
                #editorTrigger
                type="button"
                class="profile-theme-action ui-ghost-btn goal-edit-trigger shrink-0 text-gray-10 hover:text-gray-12"
                data-size="icon"
                aria-label="Editar meta anual"
                aria-controls="annual-goal-editor"
                [attr.aria-expanded]="editorOpen()"
                (click)="toggleEditor()"
              >
                <i class="ph ph-pencil-simple" aria-hidden="true"></i>
              </button>
            }
          </div>
        </div>
        @if (current.target) {
          <div
            class="mt-3 h-2 overflow-hidden rounded-full bg-gray-4"
            role="progressbar"
            aria-label="Progresso da meta anual"
            [attr.aria-valuenow]="Math.min(current.completed, current.target)"
            [attr.aria-valuemax]="current.target"
            aria-valuemin="0"
          >
            <div
              class="h-full"
              [style.background-color]="
                'var(--profile-theme-accent, var(--color-blue-9))'
              "
              [style.width.%]="progress()"
            ></div>
          </div>
        }
        @if (profileStore.itsMe() && editorOpen()) {
          <div
            #editorPanel
            id="annual-goal-editor"
            class="absolute right-4 top-14 z-20 w-60 max-w-[calc(100%-2rem)] rounded-none border border-gray-6 bg-gray-2 p-3 text-gray-12 shadow-xl"
          >
            <form (submit)="save($event)">
              <label
                class="mb-1.5 block text-sm text-gray-11"
                for="annual-goal-target"
                >Objetivo de jogos</label
              >
              <ui-input
                #targetInput
                id="annual-goal-target"
                name="target"
                type="number"
                variant="secondary"
                [min]="1"
                [max]="1000"
                [step]="1"
                [required]="true"
                [hideNumberControls]="true"
                [ngModel]="current.target ?? ''"
                [ngModelOptions]="{ standalone: true }"
              />
              @if (error()) {
                <p class="mt-2 text-sm text-red-11" role="alert">
                  {{ error() }}
                </p>
              }
              <div class="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="ui-secondary-btn"
                  [disabled]="saving()"
                  (click)="closeEditor(true)"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="ui-primary-btn"
                  [disabled]="saving()"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        }
      </section>
    }
  `,
})
export class AnnualGoalWidget {
  readonly profileStore = inject(ProfileStore);
  private readonly authStore = inject(AuthStore);
  readonly year = new Date().getUTCFullYear();
  readonly goal = signal<Goal | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly editorOpen = signal(false);
  readonly Math = Math;
  readonly error = signal('');
  private loadedProfileId: string | null = null;
  private requestVersion = 0;

  @ViewChild('editorTrigger')
  private editorTrigger?: ElementRef<HTMLButtonElement>;

  @ViewChild('editorPanel')
  private editorPanel?: ElementRef<HTMLElement>;

  @ViewChild('targetInput', { read: ElementRef })
  private set targetInput(input: ElementRef<HTMLElement> | undefined) {
    input?.nativeElement.querySelector('input')?.focus();
  }

  readonly progress = () =>
    Math.min(
      100,
      Math.round(
        (100 * (this.goal()?.completed ?? 0)) / (this.goal()?.target || 1),
      ),
    );

  constructor() {
    effect(() => {
      const id = this.profileStore.current()?.$id ?? null;
      if (id === this.loadedProfileId) return;
      this.loadedProfileId = id;
      this.requestVersion++;
      this.goal.set(null);
      this.error.set('');
      this.saving.set(false);
      this.editorOpen.set(false);
      if (id) void this.load(id, this.requestVersion);
      else this.loading.set(false);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.editorOpen()) return;
    const target = event.target as Node;
    if (
      !this.editorPanel?.nativeElement.contains(target) &&
      !this.editorTrigger?.nativeElement.contains(target)
    ) {
      this.closeEditor(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.editorOpen()) this.closeEditor(true);
  }

  toggleEditor() {
    if (this.editorOpen()) this.closeEditor(true);
    else {
      this.error.set('');
      this.editorOpen.set(true);
    }
  }

  closeEditor(restoreFocus: boolean) {
    this.editorOpen.set(false);
    if (restoreFocus) this.editorTrigger?.nativeElement.focus();
  }

  private url(id: string) {
    return new URL(
      `achievements/${encodeURIComponent(id)}/goals/${this.year}`,
      environment.zethoApiEndpoint,
    );
  }

  private async load(id: string, version: number) {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch(this.url(id));
      if (!response.ok) throw new Error();
      const goal = (await response.json()) as Goal;
      if (
        version === this.requestVersion &&
        this.profileStore.current()?.$id === id
      ) {
        this.goal.set(goal);
      }
    } catch {
      if (
        version === this.requestVersion &&
        this.profileStore.current()?.$id === id
      ) {
        this.error.set('Não foi possível carregar a meta.');
      }
    } finally {
      if (
        version === this.requestVersion &&
        this.profileStore.current()?.$id === id
      ) {
        this.loading.set(false);
      }
    }
  }

  async save(event: Event) {
    event.preventDefault();
    if (this.saving()) return;

    const id = this.profileStore.current()?.$id;
    const version = this.requestVersion;
    const target = (event.target as HTMLFormElement).elements.namedItem(
      'target',
    ) as HTMLInputElement | null;
    const value = Number(target?.value);
    if (
      !id ||
      !this.profileStore.itsMe() ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 1000
    ) {
      this.error.set('Informe uma meta de 1 a 1000 jogos.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    try {
      const token = await this.authStore.getJwt();
      const response = await fetch(this.url(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target: value }),
      });
      if (!response.ok) throw new Error();
      const goal = (await response.json()) as Goal;
      if (
        version === this.requestVersion &&
        this.profileStore.current()?.$id === id
      ) {
        this.goal.set(goal);
        this.closeEditor(true);
      }
    } catch {
      if (
        version === this.requestVersion &&
        this.profileStore.current()?.$id === id
      ) {
        this.error.set('Não foi possível salvar a meta.');
      }
    } finally {
      if (
        version === this.requestVersion &&
        this.profileStore.current()?.$id === id
      ) {
        this.saving.set(false);
      }
    }
  }
}
