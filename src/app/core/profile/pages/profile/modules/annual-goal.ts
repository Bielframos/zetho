import { Component, effect, inject, signal } from '@angular/core';
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
  template: `
    @if (loading()) {
      <p class="border-b border-gray-6 px-4 py-5 text-sm text-gray-11">
        Carregando meta anual…
      </p>
    }
    @if (!loading() && !goal() && error()) {
      <p class="border-b border-gray-6 px-4 py-5 text-sm text-red-11">
        {{ error() }}
      </p>
    }
    @if (goal(); as current) {
      <section
        class="border-b border-gray-6 px-4 py-5"
        aria-label="Meta anual de jogos"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg text-gray-12">Meta de {{ current.year }}</h2>
          <span class="text-sm tabular-nums text-gray-11"
            >{{ current.completed }} / {{ current.target ?? '—' }} jogos
            @if (current.target) {
              · {{ progress() }}%
            }
          </span>
        </div>
        @if (current.target) {
          <div
            class="mt-3 h-2 overflow-hidden rounded-full bg-gray-4"
            role="progressbar"
            [attr.aria-valuenow]="Math.min(current.completed, current.target)"
            [attr.aria-valuemax]="current.target"
            aria-valuemin="0"
          >
            <div class="h-full bg-blue-9" [style.width.%]="progress()"></div>
          </div>
        }
        @if (profileStore.itsMe()) {
          <form class="mt-3 flex items-center gap-2" (submit)="save($event)">
            <label class="text-sm text-gray-11" for="annual-goal-target"
              >Objetivo</label
            >
            <input
              id="annual-goal-target"
              type="number"
              min="1"
              max="1000"
              [value]="current.target ?? ''"
              #targetInput
              class="w-20 rounded-lg border border-gray-6 bg-transparent px-2 py-1 text-gray-12 focus:ring-2 focus:ring-blue-6"
            />
            <button
              type="submit"
              class="ui-secondary-btn"
              [disabled]="saving()"
            >
              Salvar
            </button>
          </form>
          @if (error()) {
            <p class="mt-2 text-sm text-red-11">{{ error() }}</p>
          }
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
  readonly Math = Math;
  readonly error = signal('');
  private loadedProfileId: string | null = null;
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
      this.goal.set(null);
      this.error.set('');
      if (id) void this.load(id);
      else this.loading.set(false);
    });
  }
  private url(id: string) {
    return new URL(
      `achievements/${encodeURIComponent(id)}/goals/${this.year}`,
      environment.zethoApiEndpoint,
    );
  }
  private async load(id: string) {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch(this.url(id));
      if (!response.ok) throw new Error();
      const goal = (await response.json()) as Goal;
      if (this.profileStore.current()?.$id === id) this.goal.set(goal);
    } catch {
      if (this.profileStore.current()?.$id === id)
        this.error.set('Não foi possível carregar a meta.');
    } finally {
      if (this.profileStore.current()?.$id === id) this.loading.set(false);
    }
  }
  async save(event: Event) {
    event.preventDefault();
    const id = this.profileStore.current()?.$id;
    const value = Number(
      (event.target as HTMLFormElement).querySelector('input')?.value,
    );
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
      this.goal.set((await response.json()) as Goal);
    } catch {
      this.error.set('Não foi possível salvar a meta.');
    } finally {
      this.saving.set(false);
    }
  }
}
