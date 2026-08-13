import type { BootstrapContext } from '@angular/platform-browser';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * O `context` precisa ser repassado ao `bootstrapApplication`: é ele que
 * carrega a plataforma criada pelo `renderApplication` do platform-server.
 * Omiti-lo faz o build falhar na extração de rotas com NG0401
 * ("No platform exists!").
 */
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);

export default bootstrap;
