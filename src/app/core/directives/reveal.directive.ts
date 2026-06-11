import { Directive, ElementRef, Input, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Fade/slide an element in when it scrolls into view (once). */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const el = this.host.nativeElement;
    el.classList.add('reveal');
    if (!isPlatformBrowser(this.platformId)) { el.classList.add('in'); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('in'); return; }
    if (this.revealDelay) el.style.transitionDelay = `${this.revealDelay}ms`;
    this.observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { el.classList.add('in'); this.observer?.disconnect(); }
      }
    }, { threshold: 0.15 });
    this.observer.observe(el);
  }
  ngOnDestroy(): void { this.observer?.disconnect(); }
}
