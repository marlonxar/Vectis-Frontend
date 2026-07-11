import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes, chatbotRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateService, provideTranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

export function httpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  // Cache-busting: cada carga de la app pide el JSON con un parámetro nuevo, así el
  // navegador NUNCA sirve una versión vieja cacheada de las traducciones.
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json?v=' + Date.now());
}

/** Idioma inicial: /en > ?lang= > preferencia guardada > 'es'. */
function detectInitialLang(): 'es' | 'en' {
  try {
    const path = location.pathname.toLowerCase();
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'es') return q;
    const stored = localStorage.getItem('vectis-lang');
    if (stored === 'en' || stored === 'es') return stored;
  } catch { /* SSR / privacidad */ }
  return 'es';
}

/** The AI ChatBot product is served from the aichatbot.wearevectis.com subdomain. */
function isChatbotHost(): boolean {
  try { return /(^|\.)aichatbot\./i.test(location.hostname); } catch { return false; }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(isChatbotHost() ? chatbotRoutes : routes),
    provideAnimations(),
    provideHttpClient(),
    provideTranslateService({
      defaultLanguage: 'es',
      loader: { provide: TranslateLoader, useFactory: httpLoaderFactory, deps: [HttpClient] },
    }),
    // Precarga las traducciones ANTES de renderizar la app para evitar que se vean
    // las claves crudas (p. ej. AICHATBOT.GUIDE.HOW_TITLE) mientras baja el JSON.
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      // Si el JSON falla, no bloqueamos el arranque (la app carga igual).
      return firstValueFrom(translate.use(detectInitialLang())).catch(() => undefined);
    }),
  ],
};
