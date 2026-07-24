import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Configuración exclusiva del servidor (prerender). Toma la config del navegador
 * y le añade el renderizado del lado del servidor con los modos de render por
 * ruta (ver app.routes.server.ts). Todo lo demás —rutas, traducciones,
 * detección de idioma— se comparte con app.config.ts.
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
