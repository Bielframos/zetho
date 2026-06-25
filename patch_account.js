const fs = require('fs');

const path = 'src/app/core/auth/pages/account/account.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add OnInit and CommonModule
if (!content.includes('OnInit')) {
  content = content.replace(/viewChild,\n\} from '@angular\/core';/g, "viewChild,\n  OnInit,\n} from '@angular/core';\nimport { CommonModule } from '@angular/common';");
}

// 2. Add Themes imports
if (!content.includes('ThemesService')) {
  content = content.replace(/import { AuthStore } from '\.\.\/\.\.\/auth\.store';/g, "import { AuthStore } from '../../auth.store';\nimport { ThemesService } from '../../../themes/themes.service';\nimport { ProfileTheme } from '../../../themes/themes.types';");
}

// 3. Add CommonModule to imports array
if (!content.includes('CommonModule, UiInput')) {
  content = content.replace(/imports: \[UiInput, ReactiveFormsModule, UiModal, AppProfileInviteCard, UiLoading\]/g, "imports: [CommonModule, UiInput, ReactiveFormsModule, UiModal, AppProfileInviteCard, UiLoading]");
}

// 4. Implement OnInit in class
if (!content.includes('implements OnInit')) {
  content = content.replace(/export class AccountPage \{/g, "export class AccountPage implements OnInit {");
}

// 5. Add ThemesService and properties
if (!content.includes('themesService = inject(ThemesService)')) {
  content = content.replace(/authStore: AuthStore = inject\(AuthStore\);/g, `authStore: AuthStore = inject(AuthStore);

  themesService = inject(ThemesService);
  unlockedThemes = signal<ProfileTheme[]>([]);
  activeThemeId = computed(() => this.authStore.profile()?.activeThemeId);
  isThemesLoading = signal(true);

  ngOnInit() {
    this.loadThemes();
  }

  async loadThemes() {
    const profile = this.authStore.profile();
    if (!profile || !profile.unlockedThemes || profile.unlockedThemes.length === 0) {
      this.isThemesLoading.set(false);
      return;
    }
    try {
      const allThemes = await this.themesService.listThemes();
      const myThemes = allThemes.filter(t => profile.unlockedThemes!.includes(t.$id));
      this.unlockedThemes.set(myThemes);
    } catch (e) {
      console.error(e);
    } finally {
      this.isThemesLoading.set(false);
    }
  }

  async equipTheme(themeId: string | null) {
    try {
      if (themeId) {
        await this.themesService.equipTheme(themeId);
      } else {
        await this.themesService.unequipTheme();
      }
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  }`);
}

// 6. Fix profile store reloadProfile error if exists
content = content.replace(/this\.authStore\.reloadProfile\(\);/g, "");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed account.ts');
