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
    // Show the intro loader only when the site is opened on the home page (not on
    // privacy, terms, 404, etc.).
    const path = (this.doc.defaultView?.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    this.showIntro.set(path === '/' || path === '/en');

    this.useLang(this.detectLang());
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
        if (e instanceof NavigationEnd) this.updateCanonical(e.urlAfterRedirects);
      }
    });
  }

  private updateCanonical(url: string): void {
    const clean = url.split('?')[0].split('#')[0];
    const base = 'https://wearevectis.com';
    const href = clean === '/' || clean === '' ? base + '/' : base + clean;
    let link = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) { link = this.doc.createElement('link'); link.setAttribute('rel', 'canonical'); this.doc.head.appendChild(link); }
    link.setAttribute('href', href);
  }

  useLang(lang: 'es' | 'en'): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    this.doc.documentElement.lang = lang;
    this.safeSetLang(lang);
    this.updateMeta(lang);
  }

  /** Priority: /en path > ?lang= query > saved preference > 'es'. */
  private detectLang(): 'es' | 'en' {
    const win = this.doc.defaultView;
    if (!win) return 'es';
    const path = win.location.pathname.toLowerCase();
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    const q = new URLSearchParams(win.location.search).get('lang');
    if (q === 'en' || q === 'es') return q;
    const stored = this.safeGetLang();
    return stored === 'en' ? 'en' : stored === 'es' ? 'es' : 'es';
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
