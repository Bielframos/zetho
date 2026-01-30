import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZEntriesController } from '../../../../zEntries/zEntries.controller';
import { ProfileStore } from '../../../../userProfiles/profile.store';

@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <ul
      class="flex md:flex-col p-2 space-y-1 overflow-x-auto border-t border-gray-6"
    >
      @for (tab of tabs(); track tab.key) {
        <li
          class="group"
          [attr.data-active]="currentTab() === tab.key"
          [class.pointer-events-none]="tab.count === 0"
        >
          <a
            [routerLink]="['/player', profileStore.current()?.gamertag]"
            [queryParams]="{ t: tab.key }"
            class="flex gap-2 justify-between w-fit md:w-full whitespace-nowrap pl-4 pr-2 py-2 rounded-lg hover:bg-blue-4 hover:text-white group-data-[active=true]:bg-blue-3 group-data-[active=true]:hover:bg-blue-4 transition-colors"
          >
            {{ tab.label }}
            <span
              class="px-1 text-gray-11 rounded-lg bg-blue-2 border border-gray-6 min-w-6 text-center"
            >
              {{ tab.count }}
            </span>
          </a>
        </li>
      }
    </ul>
  `,
})
export class AppProfileSidebar {
  controller = inject(ZEntriesController);
  profileStore = inject(ProfileStore);

  currentTab = this.controller.status;

  tabs = computed(() => [
    {
      key: 'completed',
      label: 'Zerados',
      count: this.profileStore.current()?.totalsCompleted ?? 0,
    },
    {
      key: 'backlog',
      label: 'Backlog',
      count: this.profileStore.current()?.totalsBacklog ?? 0,
    },
    {
      key: 'playing',
      label: 'Jogando',
      count: this.profileStore.current()?.totalsPlaying ?? 0,
    },
    {
      key: 'dropped',
      label: 'Dropados',
      count: this.profileStore.current()?.totalsDropped ?? 0,
    },
    {
      key: 'wishlist',
      label: 'Lista de desejos',
      count: this.profileStore.current()?.totalsWishlist ?? 0,
    },
  ]);
}
