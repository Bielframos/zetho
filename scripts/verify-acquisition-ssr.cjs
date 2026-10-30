// Local fixtures only. Build with .env.example values before running this script.
// Uses ports 3000/4000 and never connects to a real Appwrite project.
const http = require('node:http');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const evidence = path.join(os.tmpdir(), 'zetho-acquisition-verification');
fs.mkdirSync(evidence, { recursive: true });
const topic = { $id: 'topic1', $createdAt: '2026-10-01T12:00:00Z', $updatedAt: '2026-10-02T12:00:00Z', gameId: 'g1', title: 'Discussão pública de teste', slug: 'discussao-teste', content: '<p>Conteúdo público sanitizado de teste.</p><script>secret_attack()</script>', excerpt: 'Discussão pública de teste', parentId: null, depth: 0, voteCount: 2, replyCount: 21, viewerVote: null, author: { $id: 'author1', gamertag: 'PessoaFicticia', avatarUrl: null }, game: { $id: 'g1', name: 'Jogo fictício', slug: 'jogo-ficticio', coverUrl: null, releaseYear: '2026' }, seo: { indexable: true, canonicalSlug: 'discussao-teste', description: 'Discussão pública de teste' } };
const reply = { ...topic, $id: 'reply1', parentId: 'topic1', depth: 1, title: '', content: '<p>Resposta pública paginada de teste.</p>', replyCount: 1 };
const list = { $id: 'list1', ownerType: 'system', status: 'published', isPublic: true, itemCount: 1, slug: 'zetho-list1', title: 'Seleção editorial de teste', description: 'Jogos fictícios para validar apresentação.', criteria: 'Seleção editorial subjetiva por variedade.', author: 'Zetho', items: [{ $id: 'item1', list: 'list1', orderKey: '0|000001:', gameId: 'g1', reason: 'Uma escolha fictícia para testar a página.', sources: ['https://publisher.example/game'], game: { $id: 'g1', name: 'Jogo fictício', slug: 'jogo-ficticio' } }] };
const news = { $id: 'post1', $createdAt: topic.$createdAt, $updatedAt: topic.$updatedAt, title: 'Notícia de teste', subtitle: 'Conteúdo fictício para testes.', slug: 'noticia-teste', tags: [], author: { name: 'Zetho' }, body: '<p>Texto público da notícia de teste.</p>', originalSourceUrl: null, relatedGames: [{id: 'g1', ...list.items[0].game}] };
const mock = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', '*');
  const url = new URL(req.url, 'http://localhost');
  let data;
  if (url.pathname === '/health/release') data = { status: 'ok', capabilities: ['social-writes-v1'] };
  else if (url.pathname === '/forum/posts') data = { items: [topic], page: Number(url.searchParams.get('page') || 1), pageSize: 12, total: 30, totalPages: 3, game: null };
  else if (url.pathname === '/forum/posts/falha') { res.statusCode = 503; data = { statusCode: 503 }; }
  else if (['/forum/posts/discussao-teste', '/forum/posts/topic1', '/forum/posts/reply1'].includes(url.pathname)) data = { post: topic, replies: { items: [reply], total: 21, page: 1, pageSize: 15, hasMore: true }, focusedThread: null, seo: topic.seo };
  else if (url.pathname.startsWith('/forum/comments/')) data = { items: [reply], total: 21, page: Number(url.searchParams.get('page') || 1), pageSize: 20, hasMore: url.searchParams.get('page') !== '2' };
  else if (url.pathname === '/lists/public') data = {items: [list], hasMore: false, page: 1, pageSize: 12, total: 1};
  else if (url.pathname === '/lists/list1/social') data = {listId:'list1',likeCount:0,saveCount:0,likedByMe:false,savedByMe:false};
  else if (url.pathname === '/lists/list1/items') data = {rows: list.items, total: 1};
  else if (url.pathname === '/lists/detail/zetho-list1') data = list;
  else if (url.pathname === '/noticias/noticia-teste') data = news;
  else if (url.pathname === '/noticias') data = { items: [news], total: 1, page: 1, pageSize: 12, hasMore: false };
  else { res.statusCode = 404; data = { statusCode: 404, message: 'not_found' }; }
  res.end(JSON.stringify(data));
});
(async () => {
 await new Promise(resolve => mock.listen(3000, '127.0.0.1', resolve));
 const output = fs.openSync(path.join(evidence, 'ssr-server.log'), 'w');
 const guard = path.join(evidence, 'local-fetch-only.mjs');
 fs.writeFileSync(guard, `const originalFetch = globalThis.fetch; globalThis.fetch = (input, options) => { const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url); if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Non-local network blocked by fixture'); return originalFetch(input, options); };`);
 const server = spawn(process.execPath, ['--import', guard, 'dist/zerei/server/server.mjs'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT: '4000' }, stdio: ['ignore', output, output] });
 try {
  for (let i = 0; i < 50; i++) { try { await fetch('http://localhost:4000/sobre'); break; } catch { await new Promise(resolve => setTimeout(resolve, 200)); } }
  const checks = [
    ['/forum', 200, 'Discussão pública de teste', 'page=2'],
    ['/forum?page=2', 200, 'Discussão pública de teste', 'page=3'],
    ['/forum/discussao-teste', 200, 'Conteúdo público sanitizado de teste.', '/respostas/topic1'],
    ['/forum/discussao-teste/respostas/topic1?page=2', 200, 'Resposta pública paginada de teste.', 'noindex,follow'],
    ['/forum/ausente', 404, 'noindex,follow'],
    ['/forum/falha', 503, 'noindex,follow'],
    ['/listas/zetho-list1', 200, 'Seleção editorial de teste', 'Quero jogar'],
    ['/listas/ausente', 404, 'noindex,follow'],
    ['/noticias/noticia-teste', 200, 'Texto público da notícia de teste.', 'Quero jogar'],
  ];
  for (const [path, status, ...needles] of checks) {
    const response = await fetch(`http://localhost:4000${path}`, { headers: { cookie: 'test-other-user=fictional' } });
    const html = await response.text();
    assert.equal(response.status, status, path);
    for (const needle of needles) assert.ok(html.includes(needle), `${path}: missing ${needle}`);
    assert.ok(!html.includes('<script>secret_attack()'), 'Unsanitized script');
    if (path.startsWith('/forum') || path.startsWith('/listas')) assert.match(response.headers.get('cache-control') || '', /no-store/);
    console.log(`PASS ${status} ${path}`);
  }
  try {
    if (!process.env.PLAYWRIGHT_PACKAGE) { console.log('SKIP browser: set PLAYWRIGHT_PACKAGE to an installed Playwright package.'); return; }
    const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE);
    const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ serviceWorkers: 'block' });
    let adminFixture = false;
    let adminList = {...list, status:'draft', revision:'revision-1'};
    const actions = [];
    const profile = {$id:'fixture-profile', userId:'fixture-admin', fingerprint:'fixture',gamertag:'EditorTeste',zcoinBalance:0, registration:{created:false}};
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      const json = body => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body),headers:{'Access-Control-Allow-Origin':'http://localhost:4000','Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS'}});
      if(adminFixture) {
        if(route.request().method()==='OPTIONS') return json({});
        if(url.pathname==='/v1/account') return json({$id:'fixture-admin',labels:['admin'],prefs:{},name:'EditorTeste',emailVerification:true});
        if(url.pathname==='/v1/account/jwts') return json({jwt:'local-fixture-token'});
        if(url.pathname.includes('/tables/user_profiles/rows')) return json({rows:[profile],total:1});
        if(url.pathname==='/profile') return json(profile);
        if(url.pathname==='/lists/detail/zetho-list1') return json(adminList);
        if(url.pathname==='/lists/list1/editorial') {actions.push('save');adminList={...adminList,...route.request().postDataJSON().content,revision:'revision-2'};return json(adminList);}
        if(url.pathname==='/lists/list1/status') {const body=route.request().postDataJSON();assert.equal(body.revision,adminList.revision);if(body.status==='published')assert.equal(body.sourcesVerified,true);actions.push(body.status);adminList={...adminList,status:body.status};return json(adminList);}
        if(url.pathname.startsWith('/v1/')) return json({rows:[],total:0});
      }
      if (['localhost', '127.0.0.1'].includes(url.hostname) && ['3000', '4000'].includes(url.port)) return route.continue();
      return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({message:'Local fixture: anonymous session'}),headers:{'Access-Control-Allow-Origin':'*'}});
    });
    page.on('pageerror', error => console.log('PAGEERROR', error.message));
    page.on('console', message => { if (message.type() === 'error') console.log('CONSOLE', message.text()); });
    page.on('requestfailed', request => console.log('REQUEST_FAILED', request.url(), request.failure()?.errorText));
    for (const [width, label] of [[1280, 'desktop'], [390, 'mobile']]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:4000/listas/zetho-list1');
      try { await page.getByRole('button', { name: 'Quero jogar', exact: true }).waitFor({ timeout: 8000 }); } catch(error) { await page.screenshot({ path: path.join(evidence, 'browser-failure.png'), fullPage: true }); console.log('BODY', await page.locator('body').innerText()); await browser.close(); throw error; }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow');
      await page.screenshot({ path: path.join(evidence, `cta-${label}.png`), fullPage: true });
      console.log(`PASS CTA viewport ${label}`);
    }
    adminFixture = true;
    await page.goto('http://localhost:4000/listas/zetho-list1');
    await page.getByRole('heading',{name:'Publicação da lista',exact:true}).waitFor({timeout:10000});
    await page.getByLabel('Critérios da seleção').fill('Critérios conferidos pela equipe editorial de teste.');
    await page.getByRole('button',{name:'Salvar revisão',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('textarea[name="criteria"]')?.value === 'Critérios conferidos pela equipe editorial de teste.' && !document.querySelector('button[type="submit"]')?.disabled);
    await page.getByRole('checkbox',{name:'Conferi os jogos, as fontes e as datas desta versão.'}).check();
    await page.screenshot({path:path.join(evidence,'list-review-mobile.png'),fullPage:true});
    await page.getByRole('button',{name:'Publicar lista',exact:true}).click();
    await page.getByRole('button',{name:'Voltar para rascunho',exact:true}).waitFor();
    await page.getByRole('button',{name:'Arquivar lista',exact:true}).click();
    await page.getByText('Arquivada',{exact:true}).waitFor();
    assert.deepEqual(actions,['save','published','archived']);
    assert.equal(new URL(page.url()).pathname,'/listas/zetho-list1');
    await page.emulateMedia({colorScheme:'dark'});
    await page.screenshot({path:path.join(evidence,'list-archived-dark.png'),fullPage:true});
    console.log('PASS admin save → publish → archive on the same list URL');
    await browser.close();
  } catch (error) { throw new Error(`Browser verification failed: ${error.message}`); }
 } finally { server.kill(); mock.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
