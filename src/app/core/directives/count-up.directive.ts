import {
  Directive, ElementRef, Input, OnDestroy, OnInit, inject, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Animates a number from 0 to [countTo] when scrolled into view. */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnInit, OnDestroy {
  @Input('appCountUp') countTo = 0;
  @Input() countSuffix = '';
  @Input() countPrefix = '';
  @Input() countDuration = 1600;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;
  private raf = 0;

  ngOnInit(): void {
    const el = this.host.nativeElement;
    if (!isPlatformBrowser(this.platformId)) {
      el.textContent = `${this.countPrefix}${this.countTo}${this.countSuffix}`;
      return;
    }
    el.textContent = `${this.countPrefix}0${this.countSuffix}`;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        this.observer?.disconnect();
        if (reduce) { el.textContent = `${this.countPrefix}${this.countTo}${this.countSuffix}`; return; }
        this.run();
      }
    }, { threshold: 0.4 });
    this.observer.observe(el);
  }

  private run(): void {
    const el = this.host.nativeElement;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - startTime) / this.countDuration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(eased * this.countTo);
      el.textContent = `${this.countPrefix}${val}${this.countSuffix}`;
      if (t < 1) { this.raf = requestAnimationFrame(step); }
    };
    this.raf = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.raf);
  }
}
