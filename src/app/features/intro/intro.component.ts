import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface Particle { x: number; y: number; tx: number; ty: number; vx: number; vy: number; sp: number; bs: number; a: number; }
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
  private w = 0; private h = 0; private dpr = 1;
  private particles: Particle[] = [];
  private sprites: HTMLCanvasElement[] = [];
  private raf = 0;
  private startTime = 0;
  private dissolved = false;
  private running = false;
  private started = false;
  private exited = false;
  private lines: string[] = [];
  private vMinX = 0; private vMaxX = 0;

  private readonly LIGHT: RGB = [243, 241, 234];
  private readonly DARK: RGB = [10, 10, 10];
  private readonly INK_TEXT: RGB = [12, 12, 14];
  private readonly G_BLUE: RGB = [44, 62, 145];
  private readonly G_GOLD: RGB = [231, 171, 46];
  private readonly G_WHITE: RGB = [255, 243, 214];
  // soft-glow particle colors (mixed cloud): mostly gold, some white & blue
  private readonly CLOUD: RGB[] = [[231, 171, 46], [240, 201, 102], [255, 243, 214], [70, 96, 190], [44, 62, 145]];

  private readonly T = {
    p1In: 450, p1HoldEnd: 1100, p1Out: 1450,
    bgStart: 1500, bgEnd: 3100,
    p2Start: 1680, p2PerWord: 240, p2Fade: 320,
    dissolve: 3150, gatherStart: 4150, gatherEnd: 4980,
    cfStart: 4780, cfEnd: 5300, exit: 5400,
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
    this.sprites = this.CLOUD.map((c) => this.makeSprite(c));
    window.addEventListener('resize', this.onResize);
    this.lines = this.lang() === 'en'
      ? ['Your time comes back.', 'Repetitive work, automated.', 'VECTIS']
      : ['Tu tiempo vuelve.', 'El trabajo repetitivo, automatizado.', 'VECTIS'];
    this.running = true;
    this.startTime = performance.now();
    this.loop();
  }

  private runReduced(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize();
    this.ctx.fillStyle = 'rgb(10,10,10)'; this.ctx.fillRect(0, 0, this.w, this.h);
    this.drawBrandText(1);
    window.setTimeout(() => this.exitIntro(), 1300);
  }

  private makeSprite(color: RGB): HTMLCanvasElement {
    const s = 64; const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const x = cv.getContext('2d')!;
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.95)`);
    g.addColorStop(0.35, `rgba(${color[0]},${color[1]},${color[2]},0.4)`);
    g.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    return cv;
  }

  private readonly onResize = (): void => { if (this.ctx) this.resize(); };

  private resize(): void {
    const cv = this.introCanvas.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth; this.h = window.innerHeight;
    cv.width = Math.floor(this.w * this.dpr); cv.height = Math.floor(this.h * this.dpr);
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private loop = (): void => {
    if (!this.running) return;
    const t = performance.now() - this.startTime;
    const c = this.ctx;

    if (t < this.T.dissolve) {
      const bgP = this.ease(this.clamp((t - this.T.bgStart) / (this.T.bgEnd - this.T.bgStart), 0, 1));
      const bg = this.mix(this.LIGHT, this.DARK, bgP);
      c.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      c.fillRect(0, 0, this.w, this.h);
      const textCol = this.mix(this.INK_TEXT, this.LIGHT, bgP);
      if (t < this.T.p1Out) {
        const a = t < this.T.p1In ? t / this.T.p1In
          : t < this.T.p1HoldEnd ? 1
          : 1 - (t - this.T.p1HoldEnd) / (this.T.p1Out - this.T.p1HoldEnd);
        this.drawPhrase(this.lines[0], this.clamp(a, 0, 1), textCol);
      } else {
        this.drawPhraseWords(this.lines[1], textCol, t);
      }
    } else {
      // ----- soft-glow cloud that fills the screen, then gathers into VECTIS -----
      if (!this.dissolved) { this.spawnParticles(); this.dissolved = true; }
      c.fillStyle = 'rgba(10,10,10,0.55)';   // short trail, clears back to black (no gray haze)
      c.fillRect(0, 0, this.w, this.h);

      const gather = this.clamp((t - this.T.gatherStart) / (this.T.gatherEnd - this.T.gatherStart), 0, 1);
      const gEase = this.ease(gather);
      const flow = 1 - gather;
      const time = t * 0.001;
      const cf = this.clamp((t - this.T.cfStart) / (this.T.cfEnd - this.T.cfStart), 0, 1);
      const pAlpha = 1 - cf;

      if (pAlpha > 0.01) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (const p of this.particles) {
          // turbulent flow (smoke-like, mixes the cloud)
          p.vx += Math.sin(p.y * 0.011 + time * 1.7) * 0.5 * flow;
          p.vy += Math.cos(p.x * 0.011 + time * 1.5) * 0.5 * flow;
          p.vx *= 0.94; p.vy *= 0.94;
          p.x += p.vx; p.y += p.vy;
          // gather toward the word
          p.x += (p.tx - p.x) * gEase * 0.27;
          p.y += (p.ty - p.y) * gEase * 0.27;
          const sz = p.bs * (1 - 0.86 * gEase);
          c.globalAlpha = p.a * pAlpha;
          c.drawImage(this.sprites[p.sp], p.x - sz, p.y - sz, sz * 2, sz * 2);
        }
        c.restore();
      }
      if (cf > 0) this.drawBrandText(cf);
      if (t >= this.T.exit && !this.exited) { this.exited = true; this.exitIntro(); }
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private brandMetrics(): { fs: number; ls: number } {
    const fs = Math.min(this.h * 0.24, this.w * 0.18);
    return { fs, ls: Math.round(fs * 0.06) };
  }

  private drawBrandText(alpha: number): void {
    const c = this.ctx, m = this.brandMetrics();
    c.save();
    c.globalAlpha = alpha;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = m.ls + 'px';
    c.font = `800 ${m.fs}px 'Outfit', Arial, sans-serif`;
    const x0 = this.vMaxX > this.vMinX ? this.vMinX : this.w * 0.3;
    const x1 = this.vMaxX > this.vMinX ? this.vMaxX : this.w * 0.7;
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, this.rgb(this.G_BLUE));
    g.addColorStop(0.4, this.rgb(this.G_GOLD));
    g.addColorStop(0.78, this.rgb(this.G_GOLD));
    g.addColorStop(1, this.rgb(this.G_WHITE));
    // settle: subtle scale-up + gold glow as it resolves
    const s = 0.965 + 0.035 * alpha;
    c.translate(this.w / 2, this.h / 2); c.scale(s, s); c.translate(-this.w / 2, -this.h / 2);
    c.shadowColor = 'rgba(231,171,46,0.5)'; c.shadowBlur = 24 * alpha;
    c.fillStyle = g;
    c.fillText('VECTIS', this.w / 2, this.h / 2);
    if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '0px';
    c.restore();
  }

  private phraseLayout(text: string): { fs: number; lines: string[] } {
    const c = this.ctx, base = Math.min(this.w, this.h);
    let fs = Math.max(20, Math.min(base * 0.072, this.w * 0.046));
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

  private drawPhrase(text: string, alpha: number, col: RGB): void {
    if (alpha <= 0) return;
    const c = this.ctx; const { fs, lines } = this.phraseLayout(text);
    c.save(); c.globalAlpha = alpha; c.fillStyle = this.rgb(col);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
    const lh = fs * 1.22; let y = this.h / 2 - (lines.length * lh) / 2 + lh / 2;
    for (const ln of lines) { c.fillText(ln, this.w / 2, y); y += lh; }
    c.restore();
  }

  private drawPhraseWords(text: string, col: RGB, t: number): void {
    const c = this.ctx; const { fs, lines } = this.phraseLayout(text);
    const total = lines.reduce((n, l) => n + l.split(' ').length, 0);
    c.save(); c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
    const lh = fs * 1.22, spaceW = c.measureText(' ').width;
    let y = this.h / 2 - (lines.length * lh) / 2 + lh / 2; let wi = 0;
    for (const ln of lines) {
      const words = ln.split(' ');
      let x = (this.w - c.measureText(ln).width) / 2;
      for (const wd of words) {
        const a = this.clamp((t - (this.T.p2Start + wi * this.T.p2PerWord)) / this.T.p2Fade, 0, 1);
        if (a > 0) {
          c.globalAlpha = a;
          c.fillStyle = wi === total - 1 ? this.rgb(this.G_GOLD) : this.rgb(col);  // emphasize last word
          c.fillText(wd, x, y);
        }
        x += c.measureText(wd).width + spaceW; wi++;
      }
      y += lh;
    }
    c.globalAlpha = 1; c.restore();
  }

  private spawnParticles(): void {
    const src = this.sampleLastWord(this.lines[1]);   // dissolve out of the emphasized last word
    const target = this.sampleText('VECTIS', true);
    if (!target.length) return;
    this.vMinX = Infinity; this.vMaxX = -Infinity;
    for (const p of target) { if (p.x < this.vMinX) this.vMinX = p.x; if (p.x > this.vMaxX) this.vMaxX = p.x; }
    const cx = this.w / 2, cy = this.h / 2;
    const base = Math.min(this.w, this.h);
    const N = base < 560 ? 950 : 1700;
    this.particles = [];
    for (let i = 0; i < N; i++) {
      const tg = target[(Math.random() * target.length) | 0];
      const st = src.length ? src[(Math.random() * src.length) | 0] : { x: cx, y: cy };
      const ang = Math.atan2(st.y - cy, st.x - cx) + (Math.random() - 0.5) * 1.2;
      const sp = 5 + Math.random() * 16;
      // weight: mostly gold (0,1), some white (2), some blue (3,4)
      const r = Math.random();
      const sprite = r < 0.55 ? (Math.random() < 0.5 ? 0 : 1) : r < 0.75 ? 2 : (Math.random() < 0.5 ? 3 : 4);
      this.particles.push({
        x: st.x, y: st.y,
        tx: tg.x + (Math.random() - 0.5) * 2, ty: tg.y + (Math.random() - 0.5) * 2,
        vx: Math.cos(ang) * sp - Math.sin(ang) * sp * 0.5,
        vy: Math.sin(ang) * sp + Math.cos(ang) * sp * 0.5,
        sp: sprite,
        bs: 5 + Math.random() * 16,
        a: 0.06 + Math.random() * 0.12,
      });
    }
  }

  private sampleText(text: string, brand: boolean): { x: number; y: number }[] {
    const w = this.w, h = this.h, base = Math.min(w, h);
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const c = off.getContext('2d')!;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    const family = "'Outfit', Arial, sans-serif";
    const maxW = w * 0.84;
    let fs: number; const weight = brand ? '800' : '500'; let lines = [text];
    if (brand) {
      const m = this.brandMetrics(); fs = m.fs;
      if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = m.ls + 'px';
    } else {
      fs = Math.max(20, Math.min(base * 0.072, w * 0.046));
      for (let g = 0; g < 8; g++) {
        c.font = `${weight} ${fs}px ${family}`;
        lines = this.wrap(text, maxW, c);
        const widest = Math.max(...lines.map((l) => c.measureText(l).width));
        if (lines.length <= 2 && widest <= maxW) break;
        fs *= 0.9;
      }
    }
    c.font = `${weight} ${fs}px ${family}`;
    const lh = fs * 1.22;
    let y = h / 2 - (lines.length * lh) / 2 + lh / 2;
    for (const ln of lines) { c.fillText(ln, w / 2, y); y += lh; }
    const data = c.getImageData(0, 0, w, h).data;
    const step = base < 520 ? 3 : 4;
    const pts: { x: number; y: number }[] = [];
    for (let yy = 0; yy < h; yy += step)
      for (let xx = 0; xx < w; xx += step)
        if (data[(yy * w + xx) * 4 + 3] > 140) pts.push({ x: xx, y: yy });
    return pts;
  }

  /** Pixels of ONLY the last word of a phrase, in its real on-screen position. */
  private sampleLastWord(text: string): { x: number; y: number }[] {
    const { fs, lines } = this.phraseLayout(text);
    const w = this.w, h = this.h, base = Math.min(w, h);
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const c = off.getContext('2d')!;
    c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
    const lh = fs * 1.22, spaceW = c.measureText(' ').width;
    const total = lines.reduce((n, l) => n + l.split(' ').length, 0);
    let y = h / 2 - (lines.length * lh) / 2 + lh / 2; let wi = 0;
    for (const ln of lines) {
      const words = ln.split(' ');
      let x = (w - c.measureText(ln).width) / 2;
      for (const wd of words) {
        if (wi === total - 1) c.fillText(wd, x, y);
        x += c.measureText(wd).width + spaceW; wi++;
      }
      y += lh;
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
  private mix(a: RGB, b: RGB, t: number): RGB {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  }
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
