import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

/**
 * Punto de entrada del renderizado en servidor (prerender / SSG).
 * En Angular 20 el bootstrap de servidor DEBE recibir y reenviar el
 * BootstrapContext; sin él, el prerender falla con "Missing Platform" (NG0401).
 * El navegador arranca por main.ts; aquí no va código de analytics del navegador.
 */
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
