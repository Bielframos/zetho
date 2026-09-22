import { bootstrapApplication } from '@angular/platform-browser';
import { appBrowserConfig } from './app/app.config.browser';
import { App } from './app/app';
import { environment } from './environments/environment';

async function bootstrapWhenReady() {
  if (environment.production) {
    let ready = false;
    try {
      const response = await fetch(new URL('health/release', environment.zethoApiEndpoint), {
        signal: AbortSignal.timeout(4000), cache: 'no-store',
      });
      const body = response.ok ? await response.json() : null;
      ready = body?.status === 'ok' && body?.capabilities?.includes('social-writes-v1') === true;
    } catch { /* Keep the maintenance notice until the API is ready. */ }
    if (!ready) {
      document.title = 'Zetho em manutenção';
      const root = document.querySelector('app-root');
      if (root) root.innerHTML = '<main style="max-width:540px;margin:15vh auto;padding:32px"><p>zetho · Manutenção temporária</p><h1>Estamos concluindo uma atualização.</h1><p>Seus registros continuam salvos. Esta página será atualizada automaticamente quando o aplicativo estiver disponível.</p></main>';
      setTimeout(() => window.location.reload(), 20000);
      return;
    }
  }
  await bootstrapApplication(App, appBrowserConfig);
}

void bootstrapWhenReady().catch((err) => console.error(err));
