import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

type RGB = [number, number, number];
interface Blob {
  col: RGB; x0: number; y0: number; r: number; amp: number;
  sa: number; sb: number; pa: number; pb: number; alpha: number;
}

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
  private sc!: HTMLCanvasElement;       // small offscreen for the fluid field
  private sctx!: CanvasRenderingContext2D;
  private sw = 0; private sh = 0;
  private w = 0; private h = 0; private dpr = 1;
  private blobs: Blob[] = [];
  private raf = 0;
  private startTime = 0;
  private running = false;
  private started = false;
  private exited = false;
  private lines: string[] = [];

  private readonly BASE: RGB = [11, 0, 20];   // deep near-black violet
  // electric violet, deep purple, hot pink, soft orange, warm yellow
  private readonly PALETTE: RGB[] = [
    [138, 61, 255], [58, 12, 163], [255, 45, 155], [255, 79, 176],
    [255, 122, 69], [255, 209, 102], [120, 40, 230], [255, 90, 150],
  ];
  private readonly ACCENT_A: RGB = [255, 122, 69];   // orange
  private readonly ACCENT_B: RGB = [255, 209, 102];  // yellow
  private readonly VIOLET: RGB = [150, 90, 255];
  private readonly PINK: RGB = [255, 90, 170];

  private readonly T = {
    bgIn: 600,
    p1In: 700, p1Hold: 1700, p1Out: 2050,
    hoyIn: 2200, hoyHold: 2900, hoyOut: 3200,
    p2In: 3400, p2Hold: 4500, p2Out: 4850,
    brandIn: 5050, hold: 6100, exit: 6200,
  };

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
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('resize', this.onResize);
  }

  private lang(): 'es' | 'en' {
    const p = window.location.pathname.toLowerCase();
    return (p === '/en' || p.startsWith('/en/')) ? 'en' : 'es';
  }

  private run(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.onResize);
    this.makeBlobs();
    this.lines = this.lang() === 'en'
      ? ['Your time comes back.', 'Today', 'Repetitive work, automated.', 'Vectis']
      : ['Tu tiempo vuelve.', 'Hoy', 'El trabajo repetitivo automatizado.', 'Vectis'];
    this.running = true;
    this.startTime = performance.now();
    this.loop();
  }

  private runReduced(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize(); this.makeBlobs();
    this.renderField(0);
    this.drawCentered('Vectis', 1, 'brand');
    window.setTimeout(() => this.exitIntro(), 1400);
  }

  private readonly onResize = (): void => { if (this.ctx) { this.resize(); } };

  private resize(): void {
    const cv = this.introCanvas.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth; this.h = window.innerHeight;
    cv.width = Math.floor(this.w * this.dpr); cv.height = Math.floor(this.h * this.dpr);
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // tiny offscreen: upscaling it produces ultra-soft, edgeless fluid fields
    this.sw = Math.max(40, Math.round(this.w * 0.14));
    this.sh = Math.max(40, Math.round(this.h * 0.14));
    if (!this.sc) { this.sc = document.createElement('canvas'); this.sctx = this.sc.getContext('2d')!; }
    this.sc.width = this.sw; this.sc.height = this.sh;
  }

  private makeBlobs(): void {
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    this.blobs = this.PALETTE.map((col, i) => ({
      col,
      x0: rnd(0.1, 0.9), y0: rnd(0.1, 0.9),
      r: rnd(0.45, 0.8),
      amp: rnd(0.12, 0.26),
      sa: rnd(0.05, 0.13) * (i % 2 ? 1 : -1),   // slow, mixed directions
      sb: rnd(0.03, 0.09) * (i % 3 ? -1 : 1),
      pa: rnd(0, Math.PI * 2), pb: rnd(0, Math.PI * 2),
      alpha: i < 4 ? 0.55 : 0.8,                 // back layer dimmer, front brighter
    }));
  }

  /** Draw the fluid gradient field (tiny canvas, additive, then upscaled = soft liquid). */
  private renderField(time: number): void {
    const s = this.sctx, sw = this.sw, sh = this.sh;
    s.globalCompositeOperation = 'source-over';
    s.fillStyle = `rgb(${this.BASE[0]},${this.BASE[1]},${this.BASE[2]})`;
    s.fillRect(0, 0, sw, sh);
    s.globalCompositeOperation = 'lighter';
    for (const b of this.blobs) {
      // organic, non-repeating drift (two incommensurate sines per axis)
      const px = (b.x0 + b.amp * Math.sin(time * b.sa + b.pa) + b.amp * 0.6 * Math.sin(time * b.sb * 1.7 + b.pb)) * sw;
      const py = (b.y0 + b.amp * Math.cos(time * b.sb + b.pb) + b.amp * 0.6 * Math.cos(time * b.sa * 1.3 + b.pa)) * sh;
      const rad = b.r * sw;
      const g = s.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},${b.alpha})`);
      g.addColorStop(1, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0)`);
      s.fillStyle = g; s.fillRect(0, 0, sw, sh);
    }
    s.globalCompositeOperation = 'source-over';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(this.sc, 0, 0, this.w, this.h);
  }

  private loop = (): void => {
    if (!this.running) return;
    const t = performance.now() - this.startTime;
    const time = t * 0.001;

    this.renderField(time);
    // bg eases in from black; living motion continues under all the text
    const bgA = this.ease(this.clamp(t / this.T.bgIn, 0, 1));
    if (bgA < 1) { this.ctx.save(); this.ctx.globalAlpha = 1 - bgA; this.ctx.fillStyle = 'rgb(11,0,20)'; this.ctx.fillRect(0, 0, this.w, this.h); this.ctx.restore(); }

    if (t < this.T.p1Out) {
      this.drawCentered(this.lines[0], this.ramp(t, this.T.p1In, this.T.p1Hold, this.T.p1Out), 'white');
    } else if (t < this.T.hoyOut) {
      this.drawCentered(this.lines[1], this.ramp(t, this.T.hoyIn, this.T.hoyHold, this.T.hoyOut), 'violet');
    } else if (t < this.T.p2Out) {
      this.drawPhrase2(this.ramp(t, this.T.p2In, this.T.p2Hold, this.T.p2Out));
    } else if (t >= this.T.brandIn) {
      this.drawCentered(this.lines[3], this.ease(this.clamp((t - this.T.brandIn) / 600, 0, 1)), 'brand');
    }

    if (t >= this.T.exit && !this.exited) { this.exited = true; this.exitIntro(); }
    this.raf = requestAnimationFrame(this.loop);
  };

  private ramp(t: number, inT: number, hold: number, out: number): number {
    if (t < inT) return this.ease(this.clamp((t - (inT - 500)) / 500, 0, 1));
    if (t < hold) return 1;
    return 1 - this.ease(this.clamp((t - hold) / (out - hold), 0, 1));
  }

  private fontPx(kind: 'white' | 'violet' | 'brand'): number {
    const base = Math.min(this.w, this.h);
    return kind === 'brand' ? Math.min(this.h * 0.2, this.w * 0.16) : Math.max(22, Math.min(base * 0.07, this.w * 0.05));
  }

  private drawCentered(text: string, alpha: number, kind: 'white' | 'violet' | 'brand'): void {
    if (alpha <= 0) return;
    const c = this.ctx;
    c.save(); c.globalAlpha = alpha; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fs = this.fontPx(kind);
    const weight = kind === 'brand' ? 700 : 500;
    c.font = `${weight} ${fs}px 'Outfit', Arial, sans-serif`;
    c.shadowColor = 'rgba(20,0,30,0.45)'; c.shadowBlur = fs * 0.4;
    if (kind === 'violet') {
      const half = c.measureText(text).width / 2;
      const g = c.createLinearGradient(this.w / 2 - half, 0, this.w / 2 + half, 0);
      g.addColorStop(0, this.rgb(this.VIOLET)); g.addColorStop(1, this.rgb(this.PINK));
      c.fillStyle = g;
    } else {
      c.fillStyle = '#ffffff';
    }
    c.fillText(text, this.w / 2, this.h / 2);
    c.restore();
  }

  private drawPhrase2(alpha: number): void {
    if (alpha <= 0) return;
    const c = this.ctx; const { fs, lines } = this.phraseLayout(this.lines[2]);
    const total = lines.reduce((n, l) => n + l.split(' ').length, 0);
    c.save(); c.globalAlpha = alpha; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
    c.shadowColor = 'rgba(20,0,30,0.45)'; c.shadowBlur = fs * 0.4;
    const lh = fs * 1.24, spaceW = c.measureText(' ').width;
    let y = this.h / 2 - (lines.length * lh) / 2 + lh / 2; let wi = 0;
    for (const ln of lines) {
      const words = ln.split(' ');
      let x = (this.w - c.measureText(ln).width) / 2;
      for (const wd of words) {
        const ww = c.measureText(wd).width;
        if (wi === total - 1) {
          const g = c.createLinearGradient(x, 0, x + ww, 0);
          g.addColorStop(0, this.rgb(this.ACCENT_A)); g.addColorStop(1, this.rgb(this.ACCENT_B));
          c.fillStyle = g;
        } else { c.fillStyle = '#ffffff'; }
        c.fillText(wd, x, y);
        x += ww + spaceW; wi++;
      }
      y += lh;
    }
    c.restore();
  }

  private phraseLayout(text: string): { fs: number; lines: string[] } {
    const c = this.ctx, base = Math.min(this.w, this.h);
    let fs = Math.max(20, Math.min(base * 0.064, this.w * 0.044));
    const maxW = this.w * 0.84; let lines = [text];
    for (let g = 0; g < 8; g++) {
      c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
      lines = this.wrap(text, maxW, c);
      const widest = Math.max(...lines.map((l) => c.measureText(l).width));
      if (lines.length <= 2 && widest <= maxW) break;
      fs *= 0.9;
    }
    return { fs, lines };
  }

  private wrap(text: string, maxW: number, c: CanvasRenderingContext2D): string[] {
    const words = text.split(' '); const lines: string[] = []; let cur = '';
    for (const wd of words) {
      const t = cur ? cur + ' ' + wd : wd;
      if (c.measureText(t).width <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = wd; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  private rgb(c: RGB): string { return `rgb(${c[0]},${c[1]},${c[2]})`; }
  private clamp(v: number, lo: number, hi: number): number { return v < lo ? lo : v > hi ? hi : v; }
  private ease(t: number): number { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  private exitIntro(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const el = this.introContainer.nativeElement;
    el.style.transition = 'opacity 0.7s ease';
    el.style.opacity = '0';
    window.setTimeout(() => {
      el.style.display = 'none';
      window.dispatchEvent(new CustomEvent('intro-finished'));
    }, 720);
  }
}
