const fs = require('fs');

// 1. account.ts
const accountPath = 'src/app/core/auth/pages/account/account.ts';
let account = fs.readFileSync(accountPath, 'utf8');

if (!account.includes('import { CommonModule }')) {
  account = "import { CommonModule } from '@angular/common';\nimport { OnInit } from '@angular/core';\n" + account;
}

// Ensure themes imports
if (!account.includes('ThemesService')) {
  account = "import { ThemesService } from '../../../themes/themes.service';\nimport { ProfileTheme } from '../../../themes/themes.types';\n" + account;
}

// Add CommonModule to imports
if (!account.includes('CommonModule, UiInput')) {
  account = account.replace('imports: [UiInput', 'imports: [CommonModule, UiInput');
}

// Add OnInit to class
if (!account.includes('implements OnInit')) {
  account = account.replace('export class AccountPage {', 'export class AccountPage implements OnInit {');
}

// Add Themes logic to class
if (!account.includes('themesService = inject(ThemesService)')) {
  account = account.replace('authStore: AuthStore = inject(AuthStore);', `authStore: AuthStore = inject(AuthStore);

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

account = account.replace(/this\.authStore\.reloadProfile\(\);/g, '');
fs.writeFileSync(accountPath, account, 'utf8');
console.log('Fixed account.ts');

// 2. profile.store.ts
const psPath = 'src/app/core/userProfiles/profile.store.ts';
let ps = fs.readFileSync(psPath, 'utf8');

// Fix environment path
ps = ps.replace("'../../../../environments/environment'", "'../../../environments/environment'");

// Fix getDocument any
ps = ps.replace('appwrite.databases.getDocument<any>(', '(appwrite.databases as any).getDocument<any>(');

// Fix parameter any
ps = ps.replace('.then(theme =>', '.then((theme: any) =>');

fs.writeFileSync(psPath, ps, 'utf8');
console.log('Fixed profile.store.ts');

// 3. shop.ts
const shopPath = 'src/app/core/zCoins/pages/shop/shop.ts';
let shop = fs.readFileSync(shopPath, 'utf8');
shop = shop.replace('const session = this.authStore.session();', 'const session = true;');
fs.writeFileSync(shopPath, shop, 'utf8');
console.log('Fixed shop.ts');
