import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileWithConnection, UserProfileRow } from '../../types';
import { appwrite } from '../../core/appwrite/appwrite.client';

@Component({
  selector: 'ui-profile-card',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/player', profile().gamertag]"
      class="group flex items-center gap-3 border-b border-gray-6 px-3 py-3 hover:bg-gray-3 transition-colors"
    >
      <img
        [src]="playerAvatar(profile())"
        class="h-12 w-12 rounded-full object-cover border border-gray-6"
      />

      <div class="min-w-0">
        <p class="text-gray-12 font-medium truncate">
          {{ profile().gamertag }}
        </p>
        <p
          class="text-xs text-gray-11 group-hover:text-gray-12 transition-colors"
        >
          Ver perfil
        </p>
      </div>

      <i
        class="ph ph-arrow-right ml-auto text-gray-10 group-hover:text-blue-11 group-hover:translate-x-1 transition-all"
      ></i>
    </a>
  `,
})
export class UiProfileCard {
  profile = input.required<UserProfileRow | ProfileWithConnection>();

  playerAvatar(profile: UserProfileRow) {
    if (profile.avatarUrl) return profile.avatarUrl;

    return appwrite.avatars.getInitials({
      name: profile.gamertag,
      width: 80,
      height: 80,
      background: '3e63dd',
    });
  }
}
