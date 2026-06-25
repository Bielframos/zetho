import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ThemesService } from '../../../themes/themes.service';
import { ProfileTheme } from '../../../themes/themes.types';
import { AuthStore } from '../../../auth/auth.store';
import { getThemeMediaUrl } from '../../../themes/theme-media';

@Component({
  selector: 'z-shop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop.html',
})
export class ShopPage implements OnInit {
  private title = inject(Title);
  private themesService = inject(ThemesService);
  private authStore = inject(AuthStore);

  themes: ProfileTheme[] = [];
  isLoading = true;
  buyingThemeId: string | null = null;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.title.setTitle('Zetho | Loja');
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.themes = await this.themesService.listThemes();
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  getMediaUrl(imageId: string) {
    return getThemeMediaUrl(imageId);
  }

  ownsTheme(theme: ProfileTheme) {
    return (
      this.authStore.profile()?.unlockedThemes?.includes(theme.$id) ?? false
    );
  }

  isActiveTheme(theme: ProfileTheme) {
    return this.authStore.profile()?.activeThemeId === theme.$id;
  }

  async buyTheme(theme: ProfileTheme) {
    if (this.ownsTheme(theme)) {
      this.buyingThemeId = theme.$id;
      this.successMessage = '';
      this.errorMessage = '';

      try {
        await this.themesService.equipTheme(theme.$id);
        this.authStore.setActiveTheme(theme.$id);
        this.successMessage = `Tema "${theme.name}" equipado.`;
      } catch (e: any) {
        this.errorMessage = e.message || 'Erro ao equipar tema.';
      } finally {
        this.buyingThemeId = null;
      }
      return;
    }

    if (
      confirm(
        `Deseja comprar e equipar o tema "${theme.name}" por ${theme.price} z-coins?`,
      )
    ) {
      this.buyingThemeId = theme.$id;
      this.successMessage = '';
      this.errorMessage = '';

      try {
        await this.themesService.buyTheme(theme.$id);
        await this.themesService.equipTheme(theme.$id);
        this.authStore.addUnlockedTheme(theme.$id);
        this.authStore.setActiveTheme(theme.$id);
        this.successMessage = `Tema "${theme.name}" comprado e equipado com sucesso.`;
      } catch (e: any) {
        this.errorMessage =
          e.message || 'Erro ao comprar tema. Verifique seu saldo de z-coins.';
      } finally {
        this.buyingThemeId = null;
      }
    }
  }
}
