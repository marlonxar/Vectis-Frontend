import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Modo de render por ruta para el build.
 *  - Prerender: se genera HTML estático en el build (lo que ven Google, ChatGPT,
 *    Perplexity sin ejecutar JavaScript). Es lo que queremos para el sitio.
 *  - Client: no se prerenderiza; se arma en el navegador. Lo usamos para las rutas
 *    con parámetro (:id), que no tienen un valor conocido en el build.
 */
export const serverRoutes: ServerRoute[] = [
  // Rutas con parámetro dinámico: no se pueden prerenderizar sin conocer el id.
  { path: 'discovery-assistant/:id', renderMode: RenderMode.Client },
  { path: 'discovery-assistent/:id', renderMode: RenderMode.Client },
  { path: 'asistente-de-descubrimiento/:id', renderMode: RenderMode.Client },
  // Todo lo demás (home, /en, páginas legales, 404) se prerenderiza.
  { path: '**', renderMode: RenderMode.Prerender },
];
