import { Component, computed, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProfileStore } from '../../../core/userProfiles/profile.store';
import { ProfileLayoutStore } from './profile-layout.store';
import { NgComponentOutlet } from '@angular/common';
import { ZEntriesController } from '../../../core/zEntries/zEntries.controller';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, NgComponentOutlet],
  templateUrl: './profile-layout.html',
})
export class AppProfileLayout {
  private meta = inject(Meta);

  profileStore = inject(ProfileStore);
  layoutStore = inject(ProfileLayoutStore);
  controller = inject(ZEntriesController);

  tabs = computed(() => [
    {
      key: 'games',
      label: 'Jogos',
      icon: 'ph-game-controller',
    },
    {
      key: 'listas',
      label: 'Listas',
      icon: 'ph-list-star',
    },
  ]);

  get profile() {
    return this.profileStore.current();
  }

  constructor() {
    this.meta.addTags([
      {
        name: 'og:title',
        content: `Veja o perfil de ${this.profile?.gamertag} no Zetho`,
      },
    ]);
  }
}
