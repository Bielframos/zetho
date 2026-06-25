const fs = require('fs');

// Fix profile-layout.ts
const plPath = 'src/app/shared/app/profile-layout/profile-layout.ts';
let pl = fs.readFileSync(plPath, 'utf8');
pl = pl.replace("import { Component, computed, inject } from '@angular/core';", "import { Component, computed, inject } from '@angular/core';\nimport { CommonModule } from '@angular/common';");
pl = pl.replace("imports: [RouterModule, UiLoading, UiButton]", "imports: [CommonModule, RouterModule, UiLoading, UiButton]");
fs.writeFileSync(plPath, pl, 'utf8');
console.log('Fixed profile-layout.ts');

// Fix profile.store.ts
const psPath = 'src/app/core/userProfiles/profile.store.ts';
let ps = fs.readFileSync(psPath, 'utf8');
ps = ps.replace("appwrite.databases.getDocument<any>(", "(appwrite.databases as any).getDocument<any>(");
fs.writeFileSync(psPath, ps, 'utf8');
console.log('Fixed profile.store.ts');
