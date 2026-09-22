/**
 * Entrada da Serverless Function da Vercel.
 *
 * Reexporta o handler produzido pelo `createNodeRequestHandler` em
 * `src/server.ts`. O `includeFiles` no `vercel.json` é obrigatório: o
 * `AngularNodeAppEngine` lê o diretório `browser/` por caminho relativo em
 * tempo de execução, e sem isso a função sobe e falha só na primeira
 * requisição.
 *
 * O `buildCommand` do `vercel.json` apaga `dist/zerei/browser/index.csr.html`
 * de propósito. Na Vercel o filesystem handler roda antes dos rewrites e
 * resolve esse arquivo como índice do diretório: enquanto ele existisse, `/`
 * seria servida como shell vazio direto do CDN e nunca chegaria aqui — apesar
 * de a rota estar declarada como `RenderMode.Server`. Apagá-lo é seguro porque
 * o fallback de CSR é lido do manifesto do servidor
 * (`dist/zerei/server/assets-chunks/index_csr_html.mjs`), não do disco. Pela
 * mesma razão o `ngsw-config.json` não pode voltar a referenciar esse arquivo:
 * o service worker faria prefetch de uma URL inexistente e a instalação
 * inteira falharia.
 */
import { reqHandler } from '../dist/zerei/server/server.mjs';

let readiness = { checkedAt: 0, ready: false };
async function releaseIsReady() {
  if (Date.now() - readiness.checkedAt < 5000) return readiness.ready;
  try {
    const response = await fetch('https://api.zetho.app/health/release', {
      signal: AbortSignal.timeout(4000), cache: 'no-store',
    });
    const body = response.ok ? await response.json() : null;
    readiness = { checkedAt: Date.now(), ready: body?.status === 'ok' && body?.capabilities?.includes('social-writes-v1') === true };
  } catch { readiness = { checkedAt: Date.now(), ready: false }; }
  return readiness.ready;
}

export default async function render(req, res) {
  if (await releaseIsReady()) return reqHandler(req, res);
  res.statusCode = 503;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Retry-After', '20');
  res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="20"><title>Zetho em manutenção</title><style>body{margin:0;background:#101113;color:#edeef0;font:18px/1.6 system-ui;min-height:100vh;display:grid;place-items:center}main{max-width:540px;padding:32px}small{color:#93b4ff}h1{font-size:32px;line-height:1.2}p{color:#b0b4ba}</style></head><body><main><small>zetho · Manutenção temporária</small><h1>Estamos concluindo uma atualização.</h1><p>Seus registros continuam salvos. Esta página será atualizada automaticamente quando o aplicativo estiver disponível.</p></main></body></html>`);
}
