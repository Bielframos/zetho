import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProfileStore } from '../../../core/userProfiles/profile.store';
import { ZEntriesController } from '../../../core/zEntries/zEntries.controller';
import { ProfileLayoutStore } from './profile-layout.store';
import { NotificationStore } from '../../../core/notifications/notification.store';
import { UserProfileRow } from '../../../types';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, NgComponentOutlet],
  templateUrl: './profile-layout.html',
})
export class AppProfileLayout {
  private meta = inject(Meta);
  private notification = inject(NotificationStore);

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

  get hasSocialNicks() {
    return (
      this.profile?.socialSteam ||
      this.profile?.socialXbox ||
      this.profile?.socialPsn
    );
  }

  async copySocial(key: string) {
    try {
      const valorParaCopiar = this.profile?.[key as keyof UserProfileRow] ?? '';
      await navigator.clipboard.writeText(String(valorParaCopiar));
      this.notification.show({ message: 'Copiado!', type: 'success' });
    } catch (e) {
      this.notification.show({ message: 'Erro ao copiar', type: 'error' });
    }
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
