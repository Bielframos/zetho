/**
 * Entrada da Serverless Function da Vercel.
 *
 * Reexporta o handler produzido pelo `createNodeRequestHandler` em
 * `src/server.ts`. O `includeFiles` no `vercel.json` é obrigatório: o
 * `AngularNodeAppEngine` lê o diretório `browser/` por caminho relativo em
 * tempo de execução, e sem isso a função sobe e falha só na primeira
 * requisição.
 */
export { reqHandler as default } from '../dist/zerei/server/server.mjs';
