const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos a serem atualizados
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const envProdPath = path.join(rootDir, 'src/environments/environment.ts');
const envDevPath = path.join(rootDir, 'src/environments/environment.development.ts');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function calculateNextVersion(currentVersion, bumpType) {
  const parsed = parseSemver(currentVersion);
  if (!parsed) {
    throw new Error(`Versão atual inválida no package.json: "${currentVersion}"`);
  }

  if (bumpType === 'patch') {
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
  if (bumpType === 'minor') {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }
  if (bumpType === 'major') {
    return `${parsed.major + 1}.0.0`;
  }
  if (parseSemver(bumpType)) {
    return bumpType;
  }

  throw new Error(
    `Tipo de bump inválido: "${bumpType}". Use "patch", "minor", "major" ou uma versão no formato "x.y.z".`
  );
}

function updatePackageJson(targetVersion) {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const updated = content.replace(
    /"version":\s*"[^"]+"/,
    `"version": "${targetVersion}"`
  );
  fs.writeFileSync(packageJsonPath, updated, 'utf8');
  console.log(`  ✓ package.json -> "${targetVersion}"`);
}

function updateEnvironmentFile(filePath, targetVersion) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(
    /appVersion:\s*'[^']+'/,
    `appVersion: '${targetVersion}'`
  );
  fs.writeFileSync(filePath, updated, 'utf8');
  const relativePath = path.relative(rootDir, filePath);
  console.log(`  ✓ ${relativePath} -> '${targetVersion}'`);
}

function updateChangelog(targetVersion) {
  if (!fs.existsSync(changelogPath)) return;
  let content = fs.readFileSync(changelogPath, 'utf8');
  const today = getTodayISO();
  const versionHeader = `## [${targetVersion}] - ${today}`;

  if (content.includes(`## [${targetVersion}]`)) {
    console.log(`  ℹ CHANGELOG.md já possui a seção ## [${targetVersion}]`);
    return;
  }

  if (content.includes('## [Unreleased]')) {
    content = content.replace(
      '## [Unreleased]',
      `## [Unreleased]\n\n${versionHeader}`
    );
  } else {
    // Insere logo abaixo do cabeçalho principal se não houver [Unreleased]
    content = content.replace(
      /# CHANGELOG\s*\n/,
      `# CHANGELOG\n\n## [Unreleased]\n\n${versionHeader}\n`
    );
  }

  fs.writeFileSync(changelogPath, content, 'utf8');
  console.log(`  ✓ CHANGELOG.md -> adicionada seção ${versionHeader}`);
}

function main() {
  const arg = process.argv[2];

  if (!arg || arg === '--help' || arg === '-h') {
    console.log(`
Uso do Script de Bump de Versão:
  node scripts/bump-version.js <patch | minor | major | x.y.z> [sync]

Exemplos:
  pnpm bump patch      (ex: 1.21.1 -> 1.21.2)
  pnpm bump minor      (ex: 1.21.1 -> 1.22.0)
  pnpm bump major      (ex: 1.21.1 -> 2.0.0)
  pnpm bump 1.22.0     (define a versão exata 1.22.0)
  pnpm bump sync       (sincroniza a versão atual do package.json em todos os arquivos)
`);
    process.exit(0);
  }

  const pkgContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = pkgContent.version;

  let targetVersion;
  if (arg === 'sync') {
    targetVersion = currentVersion;
    console.log(`\nSincronizando versão atual (${currentVersion}) em todos os arquivos do app...\n`);
  } else {
    targetVersion = calculateNextVersion(currentVersion, arg);
    console.log(`\nIncrementando versão: ${currentVersion} ➔ ${targetVersion}\n`);
  }

  updatePackageJson(targetVersion);
  updateEnvironmentFile(envProdPath, targetVersion);
  updateEnvironmentFile(envDevPath, targetVersion);
  updateChangelog(targetVersion);

  console.log(`\n✨ Versão atualizada para v${targetVersion} com sucesso!\n`);
}

main();
