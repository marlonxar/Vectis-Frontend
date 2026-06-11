import {
  Directive, ElementRef, Input, OnDestroy, OnInit, inject, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Cycles through phrases with a type / pause / erase loop (programming vibe). */
@Directive({
  selector: '[appTypewriter]',
  standalone: true,
})
export class TypewriterDirective implements OnInit, OnDestroy {
  @Input('appTypewriter') words: string[] = [];
  @Input() typeSpeed = 90;
  @Input() eraseSpeed = 45;
  @Input() holdTime = 1400;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private w = 0; private c = 0; private erasing = false;

  ngOnInit(): void {
    const el = this.host.nativeElement;
    if (!isPlatformBrowser(this.platformId) || !this.words.length) {
      el.textContent = this.words[0] ?? '';
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = this.words[0];
      return;
    }
    this.tick();
  }

  private tick(): void {
    const el = this.host.nativeElement;
    const word = this.words[this.w];
    if (!this.erasing) {
      this.c++;
      el.textContent = word.slice(0, this.c);
      if (this.c === word.length) {
        this.erasing = true;
        this.timer = setTimeout(() => this.tick(), this.holdTime);
        return;
      }
      this.timer = setTimeout(() => this.tick(), this.typeSpeed);
    } else {
      this.c--;
      el.textContent = word.slice(0, this.c);
      if (this.c === 0) {
        this.erasing = false;
        this.w = (this.w + 1) % this.words.length;
      }
      this.timer = setTimeout(() => this.tick(), this.eraseSpeed);
    }
  }

  ngOnDestroy(): void { if (this.timer) clearTimeout(this.timer); }
}
