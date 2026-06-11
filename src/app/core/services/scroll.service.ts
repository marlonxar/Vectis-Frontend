import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  private get smooth(): ScrollBehavior {
    const reduce = this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return reduce ? 'auto' : 'smooth';
  }

  /** Scroll to a section by id. If it's not on the current page (e.g. the 404 page),
   *  navigate to home first, then scroll once it has rendered. */
  scrollToId(id: string): void {
    if (!this.isBrowser) return;
    const el = this.doc.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: this.smooth, block: 'start' }); return; }
    this.router.navigate(['/']).then(() => setTimeout(() => this.scrollWhenReady(id), 150));
  }

  private scrollWhenReady(id: string, tries = 0): void {
    const el = this.doc.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: this.smooth, block: 'start' }); return; }
    if (tries < 25) { setTimeout(() => this.scrollWhenReady(id, tries + 1), 60); }
  }

  scrollToTop(): void {
    if (!this.isBrowser) return;
    this.doc.defaultView?.scrollTo({ top: 0, behavior: this.smooth });
  }
}
