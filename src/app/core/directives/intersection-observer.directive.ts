import {
  Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Emits once (or every time) the host element enters the viewport.
 * Used to lazy-trigger entrance animations, canvases and count-ups.
 */
@Directive({
  selector: '[appInView]',
  standalone: true,
})
export class IntersectionObserverDirective implements OnInit, OnDestroy {
  @Input() inViewThreshold = 0.2;
  @Input() inViewOnce = true;
  @Output() inView = new EventEmitter<boolean>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) { this.inView.emit(true); return; }
    if (!('IntersectionObserver' in window)) { this.inView.emit(true); return; }

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.inView.emit(true);
          if (this.inViewOnce) { this.observer?.disconnect(); }
        } else if (!this.inViewOnce) {
          this.inView.emit(false);
        }
      }
    }, { threshold: this.inViewThreshold });

    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
