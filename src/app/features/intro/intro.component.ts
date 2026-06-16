import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface Particle { x: number; y: number; u: number; off: number; fx: number; fy: number; sp: number; s: number; a: number; }
type RGB = [number, number, number];

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
  private bg!: HTMLCanvasElement;
  private sprites: HTMLCanvasElement[] = [];
  private w = 0; private h = 0; private dpr = 1;
  private particles: Particle[] = [];
  private raf = 0;
  private startTime = 0;
  private dissolved = false;
  private running = false;
  private started = false;
  private exited = false;
  private lines: string[] = [];
  private vMinX = 0; private vMaxX = 0;

  private readonly CHAR: RGB = [40, 35, 60];      // charcoal text on white
  // pastel particle palette: purple, pink, blue
  private readonly PAL: RGB[] = [[150, 120, 215], [228, 140, 190], [110, 150, 230], [180, 150, 225]];
  // final wordmark gradient (blue -> purple -> pink)
  private readonly W_BLUE: RGB = [110, 150, 230];
  private readonly W_PURP: RGB = [150, 118, 214];
  private readonly W_PINK: RGB = [228, 140, 190];

  private readonly T = {
    p1In: 400, p1Hold: 1050, p1Out: 1350,
    hoyIn: 1550, hoyHold: 2050, hoyOut: 2330,
    p2In: 2550, p2Fade: 360, p2OutStart: 3300,
    dissolve: 3500, convergeStart: 4600,
    cfStart: 5150, cfEnd: 5650, exit: 5800,
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
    this.lines = this.lang() === 'en'
      ? ['Your time comes back.', 'Today', 'Repetitive work, automated.', 'Vectis']
      : ['Tu tiempo vuelve.', 'Hoy', 'El trabajo repetitivo automatizado.', 'Vectis'];
    this.running = true;
    this.startTime = performance.now();
    this.loop();
  }

  private runReduced(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize();
    this.ctx.drawImage(this.bg, 0, 0, this.w, this.h);
    this.vMinX = this.w * 0.3; this.vMaxX = this.w * 0.7;
    this.drawBrand('Vectis', 1);
    window.setTimeout(() => this.exitIntro(), 1300);
  }

  private readonly onResize = (): void => { if (this.ctx) this.resize(); };

  private resize(): void {
    const cv = this.introCanvas.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth; this.h = window.innerHeight;
    cv.width = Math.floor(this.w * this.dpr); cv.height = Math.floor(this.h * this.dpr);
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.bg = this.buildBg();
    if (!this.sprites.length) this.sprites = this.PAL.map((c) => this.makeSprite(c));
  }

  private buildBg(): HTMLCanvasElement {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, this.w, this.h);
    const r = Math.max(this.w, this.h);
    const g1 = c.createRadialGradient(this.w * 0.24, this.h * 0.18, 0, this.w * 0.24, this.h * 0.18, r * 0.75);
    g1.addColorStop(0, 'rgba(150,130,215,0.16)'); g1.addColorStop(1, 'rgba(150,130,215,0)');
    c.fillStyle = g1; c.fillRect(0, 0, this.w, this.h);
    const g2 = c.createRadialGradient(this.w * 0.82, this.h * 0.86, 0, this.w * 0.82, this.h * 0.86, r * 0.7);
    g2.addColorStop(0, 'rgba(230,150,195,0.16)'); g2.addColorStop(1, 'rgba(230,150,195,0)');
    c.fillStyle = g2; c.fillRect(0, 0, this.w, this.h);
    return cv;
  }

  private makeSprite(color: RGB): HTMLCanvasElement {
    const s = 48; const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const x = cv.getContext('2d')!;
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.95)`);
    g.addColorStop(0.45, `rgba(${color[0]},${color[1]},${color[2]},0.5)`);
    g.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    return cv;
  }

  private loop = (): void => {
    if (!this.running) return;
    const t = performance.now() - this.startTime;
    const c = this.ctx;
    c.drawImage(this.bg, 0, 0, this.w, this.h);   // white + pastel base every frame

    if (t < this.T.dissolve) {
      // ----- elegant centered phrases -----
      if (t < this.T.p1Out) {
        this.drawCentered(this.lines[0], this.ramp(t, this.T.p1In, this.T.p1Hold, this.T.p1Out), false);
      } else if (t < this.T.hoyOut) {
        this.drawCentered(this.lines[1], this.ramp(t, this.T.hoyIn, this.T.hoyHold, this.T.hoyOut), true);
      } else if (t >= this.T.p2In) {
        this.drawPhrase2(t);
      }
    } else {
      // ----- particle ribbon -> reconstruct into Vectis -----
      if (!this.dissolved) { this.spawnParticles(); this.dissolved = true; }
      const time = t * 0.001;
      const cx = this.w / 2, cy = this.h / 2;
      const ribbon = t < this.T.convergeStart;
      const scroll = (t - this.T.dissolve) * 0.00016;
      const reveal = this.ease(this.clamp((t - this.T.cfStart) / (this.T.cfEnd - this.T.cfStart), 0, 1));
      c.save();
      for (const p of this.particles) {
        let tx: number, ty: number, k: number;
        if (ribbon) {
          const uu = (p.u + scroll) % 1;
          tx = -0.14 * this.w + 1.28 * this.w * uu;
          ty = cy + Math.sin(uu * Math.PI * 2.4 + time * 1.3) * this.h * 0.16 + p.off;
          k = 0.07;
        } else {
          tx = p.fx; ty = p.fy; k = 0.16;
        }
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k;
        const a = p.a * (1 - reveal);
        if (a > 0.01) {
          c.globalAlpha = a;
          c.drawImage(this.sprites[p.sp], p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
        }
      }
      c.restore();
      if (reveal > 0) this.drawBrand('Vectis', reveal);
      if (t >= this.T.exit && !this.exited) { this.exited = true; this.exitIntro(); }
      void cx;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private ramp(t: number, inT: number, hold: number, out: number): number {
    if (t < inT) return this.ease(this.clamp(t / inT, 0, 1));
    if (t < hold) return 1;
    return 1 - this.ease(this.clamp((t - hold) / (out - hold), 0, 1));
  }

  private brandMetrics(): { fs: number; ls: number } {
    const fs = Math.min(this.h * 0.2, this.w * 0.16);
    return { fs, ls: Math.round(fs * 0.02) };
  }

  private drawBrand(text: string, alpha: number): void {
    const c = this.ctx, m = this.brandMetrics();
    c.save(); c.globalAlpha = alpha; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = m.ls + 'px';
    c.font = `700 ${m.fs}px 'Outfit', Arial, sans-serif`;
    const half = c.measureText(text).width / 2;
    const g = c.createLinearGradient(this.w / 2 - half, 0, this.w / 2 + half, 0);
    g.addColorStop(0, this.rgb(this.W_BLUE)); g.addColorStop(0.5, this.rgb(this.W_PURP)); g.addColorStop(1, this.rgb(this.W_PINK));
    c.shadowColor = 'rgba(150,120,215,0.35)'; c.shadowBlur = 26 * alpha;
    c.fillStyle = g; c.fillText(text, this.w / 2, this.h / 2);
    if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '0px';
    c.restore();
  }

  private drawCentered(text: string, alpha: number, gradient: boolean): void {
    if (alpha <= 0) return;
    const c = this.ctx, base = Math.min(this.w, this.h);
    c.save(); c.globalAlpha = alpha; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fs = Math.max(22, Math.min(base * 0.07, this.w * 0.05));
    c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
    if (gradient) {
      const half = c.measureText(text).width / 2;
      const g = c.createLinearGradient(this.w / 2 - half, 0, this.w / 2 + half, 0);
      g.addColorStop(0, this.rgb(this.W_PURP)); g.addColorStop(1, this.rgb(this.W_PINK));
      c.fillStyle = g;
    } else { c.fillStyle = this.rgb(this.CHAR); }
    c.fillText(text, this.w / 2, this.h / 2);
    c.restore();
  }

  private drawPhrase2(t: number): void {
    const c = this.ctx; const { fs, lines } = this.phraseLayout(this.lines[2]);
    const total = lines.reduce((n, l) => n + l.split(' ').length, 0);
    const inA = this.ease(this.clamp((t - this.T.p2In) / this.T.p2Fade, 0, 1));
    const outA = 1 - this.ease(this.clamp((t - this.T.p2OutStart) / (this.T.dissolve - this.T.p2OutStart), 0, 1));
    c.save(); c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
    const lh = fs * 1.24, spaceW = c.measureText(' ').width;
    let y = this.h / 2 - (lines.length * lh) / 2 + lh / 2; let wi = 0;
    for (const ln of lines) {
      const words = ln.split(' ');
      let x = (this.w - c.measureText(ln).width) / 2;
      for (const wd of words) {
        const last = wi === total - 1;
        const ww = c.measureText(wd).width;
        c.globalAlpha = last ? inA : inA * outA;       // last word ("automatizado") stays, others fade out
        if (last) {
          const g = c.createLinearGradient(x, 0, x + ww, 0);
          g.addColorStop(0, this.rgb(this.W_PURP)); g.addColorStop(1, this.rgb(this.W_PINK));
          c.fillStyle = g;
        } else { c.fillStyle = this.rgb(this.CHAR); }
        c.fillText(wd, x, y);
        x += ww + spaceW; wi++;
      }
      y += lh;
    }
    c.globalAlpha = 1; c.restore();
  }

  private spawnParticles(): void {
    const src = this.sampleLastWord(this.lines[2]);
    const target = this.sampleText(this.lines[3], true);
    if (!target.length) return;
    this.vMinX = Infinity; this.vMaxX = -Infinity;
    for (const p of target) { if (p.x < this.vMinX) this.vMinX = p.x; if (p.x > this.vMaxX) this.vMaxX = p.x; }
    const base = Math.min(this.w, this.h);
    const N = base < 560 ? 2200 : 4200;
    this.particles = [];
    for (let i = 0; i < N; i++) {
      const tg = target[(Math.random() * target.length) | 0];
      const st = src.length ? src[(Math.random() * src.length) | 0] : { x: this.w / 2, y: this.h / 2 };
      this.particles.push({
        x: st.x, y: st.y,
        u: Math.random(),
        off: (Math.random() - 0.5) * this.h * 0.22,
        fx: tg.x + (Math.random() - 0.5) * 1.6, fy: tg.y + (Math.random() - 0.5) * 1.6,
        sp: (Math.random() * this.sprites.length) | 0,
        s: 2.4 + Math.random() * 4,
        a: 0.4 + Math.random() * 0.35,
      });
    }
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

  private sampleLastWord(text: string): { x: number; y: number }[] {
    const { fs, lines } = this.phraseLayout(text);
    return this.sampleLayout(lines, fs, '500', false, lines.reduce((n, l) => n + l.split(' ').length, 0) - 1);
  }

  private sampleText(text: string, brand: boolean): { x: number; y: number }[] {
    if (brand) {
      const m = this.brandMetrics();
      return this.sampleLayout([text], m.fs, '700', true, -1);
    }
    const { fs, lines } = this.phraseLayout(text);
    return this.sampleLayout(lines, fs, '500', false, -1);
  }

  /** Render given lines to an offscreen canvas and return opaque pixels.
   *  onlyWord >= 0 restricts to that global word index. */
  private sampleLayout(lines: string[], fs: number, weight: string, brand: boolean, onlyWord: number): { x: number; y: number }[] {
    const w = this.w, h = this.h, base = Math.min(w, h);
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const c = off.getContext('2d')!;
    c.fillStyle = '#fff'; c.textBaseline = 'middle';
    if (brand && 'letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = this.brandMetrics().ls + 'px';
    c.font = `${weight} ${fs}px 'Outfit', Arial, sans-serif`;
    const lh = fs * 1.24, spaceW = c.measureText(' ').width;
    let y = h / 2 - (lines.length * lh) / 2 + lh / 2;
    if (onlyWord < 0) {
      c.textAlign = 'center';
      for (const ln of lines) { c.fillText(ln, w / 2, y); y += lh; }
    } else {
      c.textAlign = 'left'; let wi = 0;
      for (const ln of lines) {
        let x = (w - c.measureText(ln).width) / 2;
        for (const wd of ln.split(' ')) { if (wi === onlyWord) c.fillText(wd, x, y); x += c.measureText(wd).width + spaceW; wi++; }
        y += lh;
      }
    }
    const data = c.getImageData(0, 0, w, h).data;
    const step = base < 520 ? 3 : 4;
    const pts: { x: number; y: number }[] = [];
    for (let yy = 0; yy < h; yy += step)
      for (let xx = 0; xx < w; xx += step)
        if (data[(yy * w + xx) * 4 + 3] > 140) pts.push({ x: xx, y: yy });
    return pts;
  }

  private wrap(text: string, maxW: number, ctx?: CanvasRenderingContext2D): string[] {
    const c = ctx || this.ctx;
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
    el.style.transition = 'opacity 0.6s ease';
    el.style.opacity = '0';
    window.setTimeout(() => {
      el.style.display = 'none';
      window.dispatchEvent(new CustomEvent('intro-finished'));
    }, 620);
  }
}
