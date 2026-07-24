import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top.component';
import { IntroComponent } from './features/intro/intro.component';
import { LoadingComponent } from './shared/components/loading/loading.component';

/** The AI ChatBot product runs on the aichatbot.wearevectis.com subdomain. */
function detectChatbotHost(): boolean {
  try { return /(^|\.)aichatbot\./i.test(location.hostname); } catch { return false; }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    BackToTopComponent,
    IntroComponent,
    LoadingComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  /** On the chatbot subdomain we hide the marketing chrome and let the chatbot own its SEO. */
  readonly isChatbot = detectChatbotHost();

  readonly currentLang = signal<'es' | 'en'>('es');
  readonly progress = signal(0);
  readonly showIntro = signal(false);
  readonly loading = signal(false);
  private navTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('window:scroll')
  onScroll(): void {
    const el = this.doc.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    this.progress.set(max > 0 ? (el.scrollTop / max) * 100 : 0);
  }

  ngOnInit(): void {
    // Chatbot subdomain: no marketing intro or canonical/meta (the chatbot manages its own),
    // but KEEP the route-change loader so guarded/lazy pages show a loader until they activate.
    if (this.isChatbot) {
      this.showIntro.set(false);
      this.router.events.subscribe((e) => {
        if (e instanceof NavigationStart) {
          if (this.navTimer) clearTimeout(this.navTimer);
          this.navTimer = setTimeout(() => this.loading.set(true), 140);
        } else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
          if (this.navTimer) { clearTimeout(this.navTimer); this.navTimer = null; }
          this.loading.set(false);
        }
      });
      return;
    }

    // Show the intro loader only when the site is opened on the home page (not on
    // privacy, terms, 404, etc.).
    const path = (this.doc.defaultView?.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    this.showIntro.set(path === '/' || path === '/en' || path === '/es');

    this.applyLangForUrl(this.router.url);
    this.updateCanonical(this.router.url);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        // Debounce: solo mostramos el loader si la navegación tarda (>140ms),
        // para no parpadear en cambios de ruta instantáneos.
        if (this.navTimer) clearTimeout(this.navTimer);
        this.navTimer = setTimeout(() => this.loading.set(true), 140);
      } else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        if (this.navTimer) { clearTimeout(this.navTimer); this.navTimer = null; }
        this.loading.set(false);
        if (e instanceof NavigationEnd) { this.updateCanonical(e.urlAfterRedirects); this.applyLangForUrl(e.urlAfterRedirects); }
      }
    });
  }

  /**
   * Ajusta el idioma según la ruta: las rutas legales imponen su idioma; el resto
   * usa la preferencia (por defecto inglés). Aplica SIEMPRE (aunque el idioma no
   * cambie), para que el título y la meta description queden en el idioma del
   * cuerpo — antes, en la raíz, el cuerpo salía en un idioma y el título en otro.
   */
  private applyLangForUrl(url: string): void {
    this.useLang(this.routeLang(url) ?? this.detectLang(), false);
  }

  private updateCanonical(url: string): void {
    const clean = url.split('?')[0].split('#')[0];
    // Dominio FIJO de producción (siempre www). Antes usábamos location.origin, pero
    // durante el prerender el origen es el del render (ng-localhost) y quedaba horneado
    // en el HTML: un crawler sin JS veía una canónica falsa. Este sitio siempre vive en
    // www.wearevectis.com, así que fijarlo también resuelve el desajuste www/no-www.
    const base = 'https://www.wearevectis.com';
    // /en es un alias en inglés de la raíz: su canónica apunta a / para no duplicar contenido.
    const cleanLower = clean.toLowerCase().replace(/\/+$/, '');
    const path = (cleanLower === '/en') ? '/' : clean;
    const href = path === '/' || path === '' ? base + '/' : base + path;
    let link = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) { link = this.doc.createElement('link'); link.setAttribute('rel', 'canonical'); this.doc.head.appendChild(link); }
    link.setAttribute('href', href);
  }

  useLang(lang: 'es' | 'en', persist = true): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    this.doc.documentElement.lang = lang;
    if (persist) this.safeSetLang(lang);   // no persiste cuando el idioma lo impone la ruta
    this.updateMeta(lang);
  }

  /** Idioma forzado por rutas legales: EN para /privacy /terms /refunds, ES para las españolas. */
  private routeLang(url: string): 'es' | 'en' | null {
    const clean = url.split('?')[0].split('#')[0].toLowerCase().replace(/\/+$/, '');
    if (['/privacy', '/terms', '/refunds', '/refounds'].includes(clean)) return 'en';
    if (['/privacidad', '/terminos', '/reembolsos'].includes(clean)) return 'es';
    return null;
  }

  /**
   * Prioridad: ruta /es o /en > ?lang= > preferencia guardada > inglés (por defecto).
   * El sitio es inglés por defecto: la raíz (/) es inglés y el español vive en /es.
   */
  private detectLang(): 'es' | 'en' {
    const win = this.doc.defaultView;
    if (!win) return 'en';
    const path = win.location.pathname.toLowerCase();
    if (path === '/es' || path.startsWith('/es/')) return 'es';
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    const q = new URLSearchParams(win.location.search).get('lang');
    if (q === 'en' || q === 'es') return q;
    const stored = this.safeGetLang();
    return stored === 'es' ? 'es' : 'en';
  }

  private updateMeta(lang: 'es' | 'en'): void {
    this.translate.get(['SEO.TITLE', 'SEO.DESCRIPTION']).subscribe((t: Record<string, string>) => {
      this.title.setTitle(t['SEO.TITLE']);
      this.meta.updateTag({ name: 'description', content: t['SEO.DESCRIPTION'] });
      this.meta.updateTag({ property: 'og:title', content: t['SEO.TITLE'] });
      this.meta.updateTag({ property: 'og:description', content: t['SEO.DESCRIPTION'] });
      this.meta.updateTag({ property: 'og:locale', content: lang === 'es' ? 'es_CR' : 'en_US' });
    });
  }

  private safeGetLang(): string | null {
    try { return this.doc.defaultView?.localStorage.getItem('vectis-lang') ?? null; } catch { return null; }
  }
  private safeSetLang(lang: string): void {
    try { this.doc.defaultView?.localStorage.setItem('vectis-lang', lang); } catch { /* SSR / privacy */ }
  }
}
