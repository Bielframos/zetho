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
export { reqHandler as default } from '../dist/zerei/server/server.mjs';
