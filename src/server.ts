import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Estáticos saem do disco antes de qualquer render. Na Vercel o filesystem
 * handler já faz isso antes dos rewrites, mas o servidor precisa funcionar
 * sozinho em `node dist/zerei/server/server.mjs`.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Páginas que não existem precisam responder 404, não 302.
 *
 * Quando um dado não é encontrado, as páginas navegam para `/404`. No SSR isso
 * vira um redirect HTTP, e um 302 apontando para uma página de erro é
 * exatamente o padrão que o Google classifica como soft-404: a URL continua
 * elegível para indexação e consome crawl budget. Aqui o redirect é
 * interceptado e a página de 404 é renderizada no lugar, com o status certo.
 */
async function handleWithRealNotFound(req: express.Request) {
  const response = await angularApp.handle(req);
  if (!response) return null;

  const isRedirect = response.status >= 300 && response.status < 400;
  const location = response.headers.get('location');

  if (!isRedirect || location !== '/404') return response;

  const notFoundUrl = new URL('/404', `http://${req.headers.host}`);
  const notFoundRequest = new Request(notFoundUrl, {
    headers: new Headers(req.headers as Record<string, string>),
  });
  const notFoundResponse = await angularApp.handle(notFoundRequest);

  if (!notFoundResponse) return response;

  return new Response(notFoundResponse.body, {
    status: 404,
    statusText: 'Not Found',
    headers: notFoundResponse.headers,
  });
}

app.use((req, res, next) => {
  handleWithRealNotFound(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
