import { UiFounderBadge } from './founder-badge';
import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileWithConnection, UserProfileRow } from '../../types';

@Component({
  selector: 'ui-profile-card',
  imports: [UiFounderBadge, RouterLink],
  template: `
    <a
      [routerLink]="['/player', profile().gamertag]"
      class="group flex items-center gap-3 border-b border-gray-6 px-3 py-3 hover:bg-gray-3 transition-colors"
    >
      @if (profile().avatarUrl && failedAvatarUrl() !== profile().avatarUrl) {
        <img
          [src]="profile().avatarUrl"
          alt=""
          width="48"
          height="48"
          class="h-12 w-12 shrink-0 rounded-full object-cover border border-gray-6"
          (error)="failedAvatarUrl.set(profile().avatarUrl)"
        />
      } @else {
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-9 text-white" aria-hidden="true">
          {{ profile().gamertag.charAt(0).toUpperCase() }}
        </span>
      }

      <div class="min-w-0">
        <p class="text-gray-12 font-medium wrap-anywhere">
          {{ profile().gamertag }}
        </p>
        <div class="flex min-w-0 items-center gap-2 text-xs text-gray-11 group-hover:text-gray-12 transition-colors">
          <span class="min-w-0 truncate">@{{ profile().gamertag }}</span>
          <ui-founder-badge class="shrink-0" [gamertag]="profile().gamertag" />
        </div>
      </div>

      <i
        class="ph ph-arrow-right shrink-0 ml-auto text-gray-10 group-hover:text-blue-11 group-hover:translate-x-1 transition-all"
      ></i>
    </a>
  `,
})
export class UiProfileCard {
  profile = input.required<UserProfileRow | ProfileWithConnection>();

  readonly failedAvatarUrl = signal<string | undefined>(undefined);
}
