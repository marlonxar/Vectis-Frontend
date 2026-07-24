import { ApplicationConfig, PLATFORM_ID, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { PlatformLocation, isPlatformBrowser } from '@angular/common';
import { routes, chatbotRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateService, provideTranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

export function httpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  // Cache-busting: cada carga de la app pide el JSON con un parámetro nuevo, así el
  // navegador NUNCA sirve una versión vieja cacheada de las traducciones.
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json?v=' + Date.now());
}

/**
 * Idioma inicial: ruta /es o /en > ?lang= > preferencia guardada > inglés.
 * El sitio es INGLÉS por defecto: la raíz (/) es inglés y el español vive en /es.
 * Lee la ruta con PlatformLocation (no con el global `location`), para que
 * FUNCIONE también durante el prerender: así / genera HTML en inglés y /es en
 * español, en vez de quedarse siempre en el mismo idioma.
 */
function detectInitialLang(pl: PlatformLocation, isBrowser: boolean): 'es' | 'en' {
  try {
    const path = (pl.pathname || '/').toLowerCase();
    if (path === '/es' || path.startsWith('/es/')) return 'es';
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    const q = new URLSearchParams(pl.search || '').get('lang');
    if (q === 'en' || q === 'es') return q;
    if (isBrowser) {
      const stored = localStorage.getItem('vectis-lang');
      if (stored === 'en' || stored === 'es') return stored;
    }
  } catch { /* privacidad / entorno sin DOM */ }
  return 'en';
}

/** The AI ChatBot product is served from the aichatbot.wearevectis.com subdomain. */
function isChatbotHost(): boolean {
  try { return /(^|\.)aichatbot\./i.test(location.hostname); } catch { return false; }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // anchorScrolling: al llegar a wearevectis.com/#seccion (p. ej. desde el subdominio), baja a la sección.
    provideRouter(isChatbotHost() ? chatbotRoutes : routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    // Async: carga el módulo de animaciones en el navegador de forma diferida y
    // no rompe el prerender en servidor (la versión eager sí lo hacía — NG0401).
    provideAnimationsAsync(),
    // withFetch: necesario para que HttpClient (y con él la carga de traducciones)
    // funcione durante el prerender en Node, no solo en el navegador.
    provideHttpClient(withFetch()),
    provideTranslateService({
      defaultLanguage: 'es',
      loader: { provide: TranslateLoader, useFactory: httpLoaderFactory, deps: [HttpClient] },
    }),
    // Precarga las traducciones ANTES de renderizar la app para evitar que se vean
    // las claves crudas (p. ej. AICHATBOT.GUIDE.HOW_TITLE) mientras baja el JSON.
    // En prerender esto además garantiza que el HTML salga con el texto ya traducido.
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      const pl = inject(PlatformLocation);
      const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
      const lang = detectInitialLang(pl, isBrowser);
      // Si el JSON falla, no bloqueamos el arranque (la app carga igual).
      return firstValueFrom(translate.use(lang)).catch(() => undefined);
    }),
  ],
};
