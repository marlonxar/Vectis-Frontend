import {
  Component, EventEmitter, HostListener, Input, Output, OnInit, OnDestroy,
  inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { ScrollService } from '../../../core/services/scroll.service';
import { mobileMenuStagger } from '../../animations/page-animations';

interface NavLink { id: string; key: string; }

const SITE_BASE = 'https://www.wearevectis.com';
/** True when the marketing navbar renders on the AI ChatBot subdomain. */
function onChatbotHost(): boolean { try { return /(^|\.)aichatbot\./i.test(location.hostname); } catch { return false; } }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  animations: [mobileMenuStagger],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() currentLang: 'es' | 'en' = 'es';
  @Output() langChange = new EventEmitter<'es' | 'en'>();

  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);
  readonly activeId = signal('inicio');
  readonly forceSolid = signal(false);
  readonly isChatbot = onChatbotHost();

  readonly links: NavLink[] = [
    { id: 'inicio', key: 'NAV.HOME' },
    { id: 'servicios', key: 'NAV.SERVICES_PRODUCTS' },
    { id: 'works', key: 'NAV.PORTFOLIO' },
    { id: 'nosotros', key: 'NAV.ABOUT' },
    { id: 'contacto', key: 'NAV.CONTACT' },
    { id: 'faq', key: 'NAV.FAQ' },
  ];

  ngOnInit(): void {
    this.updateSolid(this.router.url);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.updateSolid(e.urlAfterRedirects);
        setTimeout(() => this.updateActive(), 120);
      }
    });
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => this.updateActive(), 300);
  }

  ngOnDestroy(): void { this.lockScroll(false); }

  private updateSolid(url: string): void { this.forceSolid.set(/privac|term|refound|refund|reembolso/i.test(url)); }

  private lockScroll(lock: boolean): void {
    if (!this.scroll.isBrowser) return;
    this.doc.body.style.overflow = lock ? 'hidden' : '';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.scroll.isBrowser) return;
    this.scrolled.set(window.scrollY > 40);
    this.updateActive();
  }

  /** Scroll-spy: mark the section currently under the probe line as active. */
  private updateActive(): void {
    if (!this.scroll.isBrowser) return;
    // En el producto AI ChatBot (subdominio o ruta), resaltar "Servicios & Productos".
    if (this.isChatbot || /ai-chatbot/.test(this.router.url)) { this.activeId.set('servicios'); return; }
    const probe = window.innerHeight * 0.35;
    let current = this.links[0].id;
    for (const l of this.links) {
      const el = document.getElementById(l.id);
      if (el && el.getBoundingClientRect().top <= probe) current = l.id;
    }
    this.activeId.set(current);
  }

  go(id: string): void {
    this.menuOpen.set(false);
    this.lockScroll(false);
    // On the chatbot subdomain the marketing sections don't exist here → go to the main site.
    if (this.isChatbot) { window.location.href = SITE_BASE + (id === 'inicio' ? '/' : '/#' + id); return; }
    this.scroll.scrollToId(id);
  }

  /** Navega a una ruta (ej. el producto AI ChatBot) y sube al inicio de la página. */
  goRoute(path: string): void {
    this.menuOpen.set(false);
    this.lockScroll(false);
    this.router.navigateByUrl(path).then(() => this.scroll.scrollToTop());
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    this.lockScroll(this.menuOpen());
  }

  /** Cierra el submenú al salir el mouse: quita el foco para que :focus-within no lo mantenga abierto. */
  closeDropdown(): void {
    const el = document.activeElement as HTMLElement | null;
    if (el && typeof el.blur === 'function') el.blur();
  }

  setLang(lang: 'es' | 'en'): void {
    if (lang !== this.currentLang) this.langChange.emit(lang);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.menuOpen()) { this.menuOpen.set(false); this.lockScroll(false); } }
}
