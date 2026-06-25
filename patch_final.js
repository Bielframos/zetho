const fs = require('fs');

// Fix profile.store.ts
const psPath = 'src/app/core/userProfiles/profile.store.ts';
let ps = fs.readFileSync(psPath, 'utf8');
ps = ps.replace('(appwrite.databases as any).getDocument<any>(', '(appwrite.databases as any).getDocument(');
fs.writeFileSync(psPath, ps, 'utf8');

// Fix app.ts (needs CommonModule for app.html)
const appPath = 'src/app/app.ts';
let app = fs.readFileSync(appPath, 'utf8');
if (!app.includes('import { CommonModule }')) {
  app = "import { CommonModule } from '@angular/common';\n" + app;
}
if (!app.includes('CommonModule, RouterOutlet')) {
  app = app.replace('imports: [RouterOutlet', 'imports: [CommonModule, RouterOutlet');
}
fs.writeFileSync(appPath, app, 'utf8');

// Fix profile-layout.ts
const plPath = 'src/app/shared/app/profile-layout/profile-layout.ts';
let pl = fs.readFileSync(plPath, 'utf8');
if (!pl.includes('import { CommonModule }')) {
  pl = "import { CommonModule } from '@angular/common';\n" + pl;
}
if (!pl.includes('CommonModule, RouterModule')) {
  pl = pl.replace('imports: [RouterModule', 'imports: [CommonModule, RouterModule');
}
fs.writeFileSync(plPath, pl, 'utf8');

console.log('Final fixes applied');
