import {
  Component, EventEmitter, HostListener, Input, Output, OnInit, OnDestroy,
  inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollService } from '../../../core/services/scroll.service';
import { mobileMenuStagger } from '../../animations/page-animations';

interface NavLink { id: string; key: string; }

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

  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);
  readonly activeId = signal('inicio');

  readonly links: NavLink[] = [
    { id: 'inicio', key: 'NAV.HOME' },
    { id: 'servicios', key: 'NAV.SERVICES' },
    { id: 'portafolio', key: 'NAV.PORTFOLIO' },
    { id: 'nosotros', key: 'NAV.ABOUT' },
    { id: 'contacto', key: 'NAV.CONTACT' },
    { id: 'faq', key: 'NAV.FAQ' },
  ];

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) this.activeId.set(e.target.id);
      }
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    for (const l of this.links) {
      const el = document.getElementById(l.id);
      if (el) this.observer.observe(el);
    }
  }

  ngOnDestroy(): void { this.observer?.disconnect(); this.lockScroll(false); }

  private lockScroll(lock: boolean): void {
    if (!this.scroll.isBrowser) return;
    this.doc.body.style.overflow = lock ? 'hidden' : '';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.scroll.isBrowser) return;
    this.scrolled.set(window.scrollY > 40);
  }

  go(id: string): void {
    this.menuOpen.set(false);
    this.lockScroll(false);
    this.scroll.scrollToId(id);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    this.lockScroll(this.menuOpen());
  }

  setLang(lang: 'es' | 'en'): void {
    if (lang !== this.currentLang) this.langChange.emit(lang);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.menuOpen()) { this.menuOpen.set(false); this.lockScroll(false); } }
}
