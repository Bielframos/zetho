import { FollowControl } from '../../ui/follow-control';
import { ProfileThemeContrast } from '../../ui/profile-theme-contrast';
import { CommonModule } from '@angular/common';
import { NgComponentOutlet } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProfileStore } from '../../../core/userProfiles/profile.store';
import { ZEntriesController } from '../../../core/zEntries/zEntries.controller';
import { ProfileLayoutStore } from './profile-layout.store';
import { NotificationStore } from '../../../core/system/notifications/notification.store';
import { UserProfileRow } from '../../../types';
import { SeoService } from '../../../core/system/seo/seo.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { getThemeMediaUrl } from '../../../core/themes/theme-media';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [FollowControl,ProfileThemeContrast,RouterLink, RouterOutlet, NgComponentOutlet],
  templateUrl: './profile-layout.html',
})
export class AppProfileLayout {
  private seo = inject(SeoService);
  private notification = inject(NotificationStore);
  authStore = inject(AuthStore);

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
    {
      key: 'conexoes',
      label: 'Conexões',
      icon: 'ph-users-three',
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

  getMediaUrl(imageId: string) {
    return getThemeMediaUrl(imageId);
  }

  constructor() {
    effect(() => {
      const profile = this.profileStore.current();
      if (!profile) return;

      const gamertag = profile.gamertag;
      const canonical = `/player/${encodeURIComponent(gamertag)}`;
      const description =
        profile.bio?.trim() ||
        `Veja o perfil gamer de ${gamertag}, jogos zerados e listas no Zetho.`;

      this.seo.apply({
        title: `${gamertag} — Perfil gamer | Zetho`,
        description,
        canonical,
        robots: 'index,follow',
        ogType: 'profile',
        ogImage: profile.avatarUrl,
      });

      this.seo.setJsonLd('profile-page', {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: `Perfil de ${gamertag} no Zetho`,
        mainEntity: {
          '@type': 'Person',
          name: gamertag,
          description,
          image: profile.avatarUrl,
        },
      });
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd('profile-page');
  }
}
