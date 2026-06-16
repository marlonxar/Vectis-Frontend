import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface Particle { x: number; y: number; tx: number; ty: number; vx: number; vy: number; c: string; s: number; }

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
})
export class IntroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('introContainer', { static: true }) introContainer!: ElementRef<HTMLElement>;
  @ViewChild('introCanvas', { static: true }) introCanvas!: ElementRef<HTMLCanvasElement>;
  private readonly platformId = inject(PLATFORM_ID);

  private ctx!: CanvasRenderingContext2D;
  private w = 0; private h = 0; private dpr = 1;
  private particles: Particle[] = [];
  private raf = 0;
  private timers: number[] = [];
  private running = false;
  private started = false;
  private readonly GOLD = ['#E7AB2E', '#B8881C', '#F0C966', '#D7A12A', '#FFE3A0'];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => { if (this.started) return; this.started = true; reduce ? this.runReduced() : this.run(); };
    const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts && fonts.ready) { fonts.ready.then(go); window.setTimeout(go, 600); } else { go(); }
  }

  ngOnDestroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.timers.forEach((t) => clearTimeout(t));
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('resize', this.onResize);
  }

  private lang(): 'es' | 'en' {
    const p = window.location.pathname.toLowerCase();
    return (p === '/en' || p.startsWith('/en/')) ? 'en' : 'es';
  }

  private run(): void {
    const cv = this.introCanvas.nativeElement;
    this.ctx = cv.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.onResize);

    const N = Math.min(2800, Math.max(1500, Math.floor(this.w * 1.7)));
    for (let i = 0; i < N; i++) {
      this.particles.push({
        x: Math.random() * this.w, y: Math.random() * this.h,
        tx: this.w / 2, ty: this.h / 2, vx: 0, vy: 0,
        c: this.GOLD[(Math.random() * this.GOLD.length) | 0],
        s: 1.0 + Math.random() * 1.4,
      });
    }

    const lines = this.lang() === 'en'
      ? ['Your time comes back.', 'Repetitive work, automated.', 'VECTIS']
      : ['Tu tiempo vuelve.', 'El trabajo repetitivo, automatizado.', 'VECTIS'];

    this.running = true;
    this.loop();

    this.setTargets(lines[0], false);
    this.timers.push(window.setTimeout(() => this.setTargets(lines[1], false), 1850));
    this.timers.push(window.setTimeout(() => this.setTargets(lines[2], true), 3750));
    this.timers.push(window.setTimeout(() => this.exitIntro(), 5450));
  }

  /** Reduced-motion fallback: show the brand statically, then exit. */
  private runReduced(): void {
    const cv = this.introCanvas.nativeElement;
    this.ctx = cv.getContext('2d')!;
    this.resize();
    const c = this.ctx;
    c.fillStyle = '#0A0A0A'; c.fillRect(0, 0, this.w, this.h);
    c.fillStyle = '#E7AB2E'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fs = Math.min(this.h * 0.22, this.w * 0.18);
    if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = Math.round(fs * 0.06) + 'px';
    c.font = `800 ${fs}px 'Outfit', Arial, sans-serif`;
    c.fillText('VECTIS', this.w / 2, this.h / 2);
    this.timers.push(window.setTimeout(() => this.exitIntro(), 1300));
  }

  private readonly onResize = (): void => { if (this.ctx) this.resize(); };

  private resize(): void {
    const cv = this.introCanvas.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth; this.h = window.innerHeight;
    cv.width = Math.floor(this.w * this.dpr);
    cv.height = Math.floor(this.h * this.dpr);
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private loop = (): void => {
    if (!this.running) return;
    const c = this.ctx;
    c.fillStyle = 'rgba(10,10,10,0.34)';      // translucent clear -> soft motion trails
    c.fillRect(0, 0, this.w, this.h);
    for (const p of this.particles) {
      p.vx += (p.tx - p.x) * 0.018;
      p.vy += (p.ty - p.y) * 0.018;
      p.vx *= 0.84; p.vy *= 0.84;
      p.x += p.vx; p.y += p.vy;
      c.fillStyle = p.c;
      c.fillRect(p.x, p.y, p.s, p.s);
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Point the particle pool at the pixels of a new phrase (triggers the morph). */
  private setTargets(text: string, brand: boolean): void {
    const pts = this.sampleText(text, brand);
    if (!pts.length) return;
    for (const p of this.particles) {
      const pt = pts[(Math.random() * pts.length) | 0];
      p.tx = pt.x + (Math.random() - 0.5) * 1.6;
      p.ty = pt.y + (Math.random() - 0.5) * 1.6;
      p.vx += (Math.random() - 0.5) * 6;       // kick -> scatter then reform
      p.vy += (Math.random() - 0.5) * 6;
    }
  }

  /** Render text to an offscreen canvas and return its opaque pixel coordinates. */
  private sampleText(text: string, brand: boolean): { x: number; y: number }[] {
    const w = this.w, h = this.h, base = Math.min(w, h);
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const c = off.getContext('2d')!;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    const family = "'Outfit', Arial, sans-serif";
    const weight = brand ? '800' : '700';
    const maxW = w * 0.82;

    let fontSize = brand ? Math.min(h * 0.24, w * 0.18) : Math.min(base * 0.085, w * 0.052);
    fontSize = Math.max(20, fontSize);
    let lines: string[] = [text];

    if (!brand) {
      for (let guard = 0; guard < 8; guard++) {
        c.font = `${weight} ${fontSize}px ${family}`;
        lines = this.wrap(c, text, maxW);
        const widest = Math.max(...lines.map((l) => c.measureText(l).width));
        if (lines.length <= 2 && widest <= maxW) break;
        fontSize *= 0.9;
      }
    }
    if (brand && 'letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = Math.round(fontSize * 0.06) + 'px';

    c.font = `${weight} ${fontSize}px ${family}`;
    const lh = fontSize * 1.18;
    let y = h / 2 - (lines.length * lh) / 2 + lh / 2;
    for (const ln of lines) { c.fillText(ln, w / 2, y); y += lh; }

    const data = c.getImageData(0, 0, w, h).data;
    const step = base < 520 ? 3 : 4;
    const pts: { x: number; y: number }[] = [];
    for (let yy = 0; yy < h; yy += step) {
      for (let xx = 0; xx < w; xx += step) {
        if (data[(yy * w + xx) * 4 + 3] > 140) pts.push({ x: xx, y: yy });
      }
    }
    return pts;
  }

  private wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    const words = text.split(' '); const lines: string[] = []; let cur = '';
    for (const wd of words) {
      const t = cur ? cur + ' ' + wd : wd;
      if (c.measureText(t).width <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = wd; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  private exitIntro(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const el = this.introContainer.nativeElement;
    el.style.transition = 'opacity 0.6s ease';
    el.style.opacity = '0';
    window.setTimeout(() => {
      el.style.display = 'none';
      window.dispatchEvent(new CustomEvent('intro-finished'));
    }, 620);
  }
}
