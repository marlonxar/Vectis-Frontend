import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

type RGB = [number, number, number];
interface Cell { x: number; y: number; w: number; h: number; delay: number; fade: number; accent: boolean; aA: number; }
type Hue = 'white' | 'gold' | 'blue';
interface Particle {
  tx: number; ty: number; call: number; hue: Hue; dust: boolean; size: number;
  hx: number; hy: number;                      // drift anchor
  ax1: number; ax2: number; ay1: number; ay2: number;
  f1: number; f2: number; f3: number; f4: number;
  p1: number; p2: number; p3: number; p4: number;
  captured: boolean; fromX: number; fromY: number;
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
  private video!: HTMLVideoElement;
  private videoReady = false;
  private w = 0; private h = 0; private dpr = 1;
  private cells: Cell[] = [];
  private parts: Particle[] = [];
  private whiteSprite: HTMLCanvasElement | null = null;
  private goldSprite: HTMLCanvasElement | null = null;
  private blueSprite: HTMLCanvasElement | null = null;
  private vLayout: { fs: number; xs: number[]; dotX: number; y: number; word: string; x0: number; w: number } | null = null;
  private raf = 0;
  private startTime = 0;
  private running = false;
  private started = false;
  private exited = false;
  private reduced = false;
  private lightState = false;
  private phrase1 = 'Tu tiempo vuelve.';
  private phrase2 = 'El trabajo repetitivo, automatizado.';

  private readonly BASE: RGB = [9, 9, 11];
  private GOLD = 'rgb(231,171,46)';            // resolved from --gold-bright at runtime
  private goldRGB: RGB = [231, 171, 46];
  private vignette: CanvasGradient | null = null;

  private readonly SPREAD = 1000;              // grid reveals the video, bottom -> top
  private readonly P1_START = 350; private readonly P_PER = 300; private readonly P_FADE = 220;
  private readonly SWITCH_START = 1500; private readonly SWITCH_END = 1850;   // ~0.35s white "switch"
  private readonly P2_START = 1980;
  private readonly V_START = 3700;             // particle finale begins
  private readonly BG_FADE = 700;
  private readonly LETTER_START = 250; private readonly LETTER_GAP = 190; private readonly CONVERGE = 800;
  private readonly TEXT_START = 1650; private readonly TEXT_FADE = 480;
  private readonly CLOSE_START = 2080; private readonly CLOSE_DUR = 430;       // VECTIS landing close
  private readonly DUST_OUT_A = 1400; private readonly DUST_OUT_B = 2200;
  private readonly EXIT = 6500;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let seen = false;
    try { seen = sessionStorage.getItem('vectisIntroSeen') === '1'; } catch { /* noop */ }
    if (seen) { this.finishImmediately(); return; }
    try { sessionStorage.setItem('vectisIntroSeen', '1'); } catch { /* noop */ }
    this.lockScroll();   // no scrolling while the intro is on screen → hero is seen first
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => { if (this.started) return; this.started = true; this.reduced ? this.runReduced() : this.run(); };
    // Make sure the exact Outfit weights are decoded before frame 1 (correct wordmark).
    const fonts = (document as unknown as { fonts?: { ready: Promise<unknown>; load?: (f: string) => Promise<unknown> } }).fonts;
    if (fonts && fonts.load) {
      Promise.all([fonts.load("500 1em 'Outfit'"), fonts.load("800 1em 'Outfit'")]).then(go).catch(go);
      window.setTimeout(go, 700);
    } else if (fonts && fonts.ready) { fonts.ready.then(go); window.setTimeout(go, 400); } else { go(); }
  }

  private finishImmediately(): void {
    const el = this.introContainer.nativeElement;
    el.style.display = 'none';
    window.dispatchEvent(new CustomEvent('intro-finished'));
    this.focusMain();
  }

  private prevHtmlOverflow = '';
  private prevBodyOverflow = '';
  private scrollLocked = false;

  private lockScroll(): void {
    try {
      const d = document.documentElement, b = document.body;
      this.prevHtmlOverflow = d.style.overflow; this.prevBodyOverflow = b.style.overflow;
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      d.style.overflow = 'hidden'; b.style.overflow = 'hidden';
      this.scrollLocked = true;
    } catch { /* noop */ }
  }

  private unlockScroll(): void {
    if (!this.scrollLocked) return;
    try {
      window.scrollTo(0, 0);   // start at the top → hero is the first thing seen
      document.documentElement.style.overflow = this.prevHtmlOverflow;
      document.body.style.overflow = this.prevBodyOverflow;
      this.scrollLocked = false;
    } catch { /* noop */ }
  }

  /** Move keyboard/SR focus into the page once the intro is gone. */
  private focusMain(): void {
    try {
      const m = document.getElementById('main-content');
      if (m) { if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1'); (m as HTMLElement).focus({ preventScroll: true }); }
    } catch { /* noop */ }
  }

  ngOnDestroy(): void {
    this.running = false;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.raf);
    if (this.video) { try { this.video.pause(); } catch { /* noop */ } }
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('keydown', this.onKey);
      this.unlockScroll();
    }
  }

  /** Skip: jump to the VECTIS finale; if already there, end the intro. */
  private skip(): void {
    if (!this.running) return;
    const t = performance.now() - this.startTime;
    if (t < this.V_START) this.startTime = performance.now() - this.V_START;
    else if (!this.exited) { this.exited = true; this.exitIntro(); }
  }

  private readonly onKey = (e: KeyboardEvent): void => {
    if (['Escape', 'Tab', 'Enter', ' ', 'Spacebar', 'Space'].includes(e.key)) { e.preventDefault(); this.skip(); }
  };
  private readonly onPointer = (): void => { this.skip(); };

  private lang(): 'es' | 'en' {
    const p = window.location.pathname.toLowerCase();
    return (p === '/en' || p.startsWith('/en/')) ? 'en' : 'es';
  }

  private run(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKey);
    this.introContainer.nativeElement.addEventListener('pointerdown', this.onPointer);
    if (this.lang() === 'en') {
      this.phrase1 = 'Get your time back.';
      this.phrase2 = 'Repetitive work, automated.';
    }
    this.readGold();
    this.video = document.createElement('video');
    this.video.src = 'assets/videos/background.mp4';
    this.video.muted = true; this.video.loop = true; this.video.playsInline = true; this.video.preload = 'auto';
    this.video.addEventListener('playing', () => { this.videoReady = true; });
    this.video.play().catch(() => { /* fallback to black */ });
    this.buildCells();
    this.makeSprites();
    this.computeParticles();
    this.running = true;
    this.startTime = performance.now();
    this.loop();
  }

  /** Pull the brand gold from --gold-bright so the dot/underline stay in sync with the theme. */
  private readGold(): void {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--gold-bright').trim();
      const m = /^#?([0-9a-f]{6})$/i.exec(v);
      if (m) {
        const n = parseInt(m[1], 16);
        this.goldRGB = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        this.GOLD = `rgb(${this.goldRGB[0]},${this.goldRGB[1]},${this.goldRGB[2]})`;
      }
    } catch { /* keep default */ }
  }

  private runReduced(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize();
    this.readGold();
    this.makeSprites();
    this.computeParticles();
    this.drawParticles(this.V_START + 999999);   // word already formed
    window.setTimeout(() => this.exitIntro(), 1100);
  }

  private resizeTimer = 0;
  // Debounced: only rebuild layout on a real width change. Mobile address-bar show/hide
  // changes height constantly — recomputing then would make the animation jump.
  private readonly onResize = (): void => {
    if (!this.ctx) return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      const prevW = this.w;
      this.resize();
      if (Math.abs(this.w - prevW) > 2) { this.buildCells(); this.computeParticles(); }
    }, 150);
  };

  private resize(): void {
    const cv = this.introCanvas.nativeElement;
    const host = this.introContainer.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = host.clientWidth || window.innerWidth;
    this.h = host.clientHeight || window.innerHeight;
    cv.width = Math.floor(this.w * this.dpr); cv.height = Math.floor(this.h * this.dpr);
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.vignette = null;
  }

  private buildCells(): void {
    const ch = this.clamp(Math.round(Math.min(this.w, this.h) / 26), 18, 32);
    const cw = Math.round(ch * 1.35);
    const cols = Math.ceil(this.w / cw) + 1;
    const rows = Math.ceil(this.h / ch) + 1;
    this.cells = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const nx = i / cols, ny = j / rows;
        const delay = Math.max(0, (1 - ny) * this.SPREAD + Math.sin(nx * 7 + ny * 3) * 80 + Math.random() * 180);
        const accent = Math.random() > 0.97;
        this.cells.push({ x: i * cw, y: j * ch, w: cw, h: ch, delay, fade: 140 + Math.random() * 150, accent, aA: accent ? 0.06 + Math.random() * 0.08 : 0 });
      }
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    const t = performance.now() - this.startTime;
    const c = this.ctx;

    if (t < this.SWITCH_START) {
      this.renderBackground(t);
      this.drawPhrase(this.phrase1, this.P1_START, t, '#ffffff', false, 1);
    } else if (t < this.SWITCH_END) {
      // SWITCH: video stays, washed light/white, letters turn black (interruptor)
      this.drawVideoLayer('white');
      const sw = t - this.SWITCH_START;                       // crisp white peak on the flip
      if (sw < 130) { c.globalAlpha = this.clamp(1 - sw / 130, 0, 1) * 0.7; c.fillStyle = '#ffffff'; c.fillRect(0, 0, this.w, this.h); c.globalAlpha = 1; }
      this.drawPhrase(this.phrase1, this.P1_START, t, '#0a0a0a', true, 1);
    } else if (t < this.V_START) {
      // back to dark video, second phrase types in, fades out quickly before the finale
      this.drawVideoLayer('dark');
      const out = this.clamp((this.V_START - t) / 220, 0, 1);
      this.drawPhrase(this.phrase2, this.P2_START, t, '#ffffff', false, out);
    } else {
      this.drawParticles(t);
    }

    // subtle vignette for depth (not during the white flash)
    if (!(t >= this.SWITCH_START && t < this.SWITCH_END)) this.drawVignette();

    // toggle the skip hint to a dark tone while the background flashes white
    const light = t >= this.SWITCH_START && t < this.SWITCH_END;
    if (light !== this.lightState) {
      this.lightState = light;
      this.introContainer.nativeElement.classList.toggle('switch-light', light);
    }

    // exit when the timeline is done AND the page has finished loading (capped, so it acts as a real loader)
    if (!this.exited && t >= this.EXIT && (document.readyState === 'complete' || t >= this.EXIT + 1500)) {
      this.exited = true; this.exitIntro();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private drawVignette(): void {
    const c = this.ctx;
    if (!this.vignette) {
      const g = c.createRadialGradient(this.w / 2, this.h * 0.5, Math.min(this.w, this.h) * 0.28, this.w / 2, this.h * 0.5, Math.max(this.w, this.h) * 0.72);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.34)');
      this.vignette = g;
    }
    c.fillStyle = this.vignette; c.fillRect(0, 0, this.w, this.h);
  }

  /**
   * Draw the video cover-fit, desaturated + darkened (or washed white during the switch).
   * Uses canvas blend modes (not ctx.filter): Safari accepts ctx.filter but does NOT apply it
   * to drawImage of a <video>, so the video stayed in colour (blue) on iOS.
   */
  private drawVideoLayer(mode: 'dark' | 'white'): void {
    const c = this.ctx;
    c.fillStyle = this.rgb(this.BASE); c.fillRect(0, 0, this.w, this.h);
    if (!(this.videoReady && this.video.videoWidth)) return;

    const vw = this.video.videoWidth, vh = this.video.videoHeight;
    const scale = Math.max(this.w / vw, this.h / vh);
    const dw = vw * scale, dh = vh * scale;
    const dx = (this.w - dw) / 2, dy = (this.h - dh) / 2;

    c.drawImage(this.video, dx, dy, dw, dh);

    // desaturate to grayscale ('color' blend with a gray source removes hue + saturation)
    c.save();
    c.globalCompositeOperation = 'color';
    c.fillStyle = 'rgb(128,128,128)';
    c.fillRect(0, 0, this.w, this.h);
    c.restore();

    if (mode === 'dark') {
      c.save();
      c.globalCompositeOperation = 'multiply';   // darken (~brightness 0.5)
      c.fillStyle = 'rgb(120,120,120)';
      c.fillRect(0, 0, this.w, this.h);
      c.restore();
      c.fillStyle = 'rgba(9,9,11,0.4)';
      c.fillRect(0, 0, this.w, this.h);
    } else {
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(0, 0, this.w, this.h);
    }
  }

  /** Video (desaturated + darkened) revealed by the grid bottom -> top. */
  private renderBackground(t: number): void {
    const c = this.ctx;
    this.drawVideoLayer('dark');
    for (const cell of this.cells) {
      const local = t - cell.delay;
      const coverA = local <= 0 ? 1 : 1 - this.ease(this.clamp(local / cell.fade, 0, 1));
      if (coverA > 0.001) { c.globalAlpha = coverA; c.fillStyle = this.rgb(this.BASE); c.fillRect(cell.x, cell.y, cell.w, cell.h); }
      if (cell.accent && local > 0 && local < cell.fade + 240) {
        c.globalAlpha = Math.sin((local / (cell.fade + 240)) * Math.PI) * cell.aA;
        c.fillStyle = 'rgb(236,236,236)'; c.fillRect(cell.x, cell.y, cell.w, cell.h);
      }
    }
    c.globalAlpha = 1;
  }

  /** A phrase typed word by word, wrapped to fit the viewport, with a legibility veil over the video. */
  private drawPhrase(text: string, startMs: number, t: number, color: string, full: boolean, outMul: number): void {
    const c = this.ctx, base = Math.min(this.w, this.h);
    const fs = Math.max(18, Math.min(base * 0.072, this.w * 0.06));
    c.save(); c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `500 ${fs}px 'Outfit', Arial, sans-serif`;
    const maxW = this.w * 0.86;
    const spaceW = c.measureText(' ').width;

    // greedy word wrap
    const words = text.split(' ');
    const lines: string[][] = []; let cur: string[] = []; let curW = 0;
    for (const wd of words) {
      const ww = c.measureText(wd).width;
      if (cur.length && curW + spaceW + ww > maxW) { lines.push(cur); cur = [wd]; curW = ww; }
      else { if (cur.length) curW += spaceW; cur.push(wd); curW += ww; }
    }
    if (cur.length) lines.push(cur);

    // legibility veil (only for light text over the moving video)
    if (color === '#ffffff') {
      const vg = c.createRadialGradient(this.w / 2, this.h / 2, 0, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.5);
      vg.addColorStop(0, 'rgba(9,9,11,0.5)'); vg.addColorStop(1, 'rgba(9,9,11,0)');
      c.fillStyle = vg; c.fillRect(0, 0, this.w, this.h);
    }

    const lh = fs * 1.32, totalH = lines.length * lh;
    c.fillStyle = color;
    let gi = 0;
    for (let li = 0; li < lines.length; li++) {
      const lw = lines[li];
      const lineW = lw.reduce((a, wd) => a + c.measureText(wd).width, 0) + spaceW * (lw.length - 1);
      let x = this.w / 2 - lineW / 2;
      const y = this.h / 2 - totalH / 2 + lh * (li + 0.5);
      for (const wd of lw) {
        const a = (full ? 1 : this.ease(this.clamp((t - (startMs + gi * this.P_PER)) / this.P_FADE, 0, 1))) * outMul;
        const ww = c.measureText(wd).width;
        if (a > 0) { c.globalAlpha = a; c.fillText(wd, x, y); }
        x += ww + spaceW; gi++;
      }
    }
    c.globalAlpha = 1; c.restore();
  }

  /** Pre-render a refined luminous particle: tight bright core + soft halo. */
  private glowSprite(r: number, g: number, b: number): HTMLCanvasElement {
    const d = 64; const cv = document.createElement('canvas'); cv.width = d; cv.height = d;
    const x = cv.getContext('2d')!;
    const grad = x.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
    grad.addColorStop(0, `rgba(255,255,255,1)`);          // hot white core
    grad.addColorStop(0.12, `rgba(${r},${g},${b},0.95)`);
    grad.addColorStop(0.35, `rgba(${r},${g},${b},0.4)`);
    grad.addColorStop(0.7, `rgba(${r},${g},${b},0.08)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = grad; x.fillRect(0, 0, d, d);
    return cv;
  }

  private makeSprites(): void {
    this.whiteSprite = this.glowSprite(248, 246, 238);
    this.goldSprite = this.glowSprite(238, 178, 58);
    this.blueSprite = this.glowSprite(120, 168, 255);
  }

  private spriteFor(h: Hue): HTMLCanvasElement | null {
    return h === 'gold' ? this.goldSprite : h === 'blue' ? this.blueSprite : this.whiteSprite;
  }

  private driftParticle(dust: boolean, tx: number, ty: number, call: number, hue: Hue, size: number): Particle {
    const amp = dust ? 1 : 0.7;
    return {
      tx, ty, call, hue, dust, size,
      hx: Math.random() * this.w, hy: Math.random() * this.h,
      ax1: (40 + Math.random() * 70) * amp, ax2: (14 + Math.random() * 26) * amp,
      ay1: (34 + Math.random() * 60) * amp, ay2: (12 + Math.random() * 22) * amp,
      f1: 0.12 + Math.random() * 0.4, f2: 0.3 + Math.random() * 0.6,
      f3: 0.12 + Math.random() * 0.4, f4: 0.3 + Math.random() * 0.6,
      p1: Math.random() * 6.28, p2: Math.random() * 6.28, p3: Math.random() * 6.28, p4: Math.random() * 6.28,
      captured: false, fromX: 0, fromY: 0,
    };
  }

  /** Organic multi-frequency drift position (no rigid circles). */
  private driftPos(p: Particle, tSec: number): [number, number] {
    const x = p.hx + p.ax1 * Math.sin(tSec * p.f1 + p.p1) + p.ax2 * Math.sin(tSec * p.f2 + p.p2);
    const y = p.hy + p.ay1 * Math.cos(tSec * p.f3 + p.p3) + p.ay2 * Math.cos(tSec * p.f4 + p.p4);
    return [x, y];
  }

  /** Sample "VECTIS." into letter-ordered particle targets + ambient drifting dust. */
  private computeParticles(): void {
    const fs = Math.min(this.h * 0.15, this.w * 0.16);   // larger on narrow/portrait screens
    const ls = Math.round(fs * 0.02);
    const tc = document.createElement('canvas');
    tc.width = Math.max(1, Math.floor(this.w));
    tc.height = Math.max(1, Math.floor(this.h));
    const g = tc.getContext('2d');
    if (!g) { this.parts = []; return; }
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `800 ${fs}px 'Outfit', Arial, sans-serif`;
    const word = 'VECTIS';
    const charW = [...word].map((ch) => g.measureText(ch).width);
    const dotW = g.measureText('.').width;
    const total = charW.reduce((a, b) => a + b, 0) + ls * word.length + dotW;
    let x = this.w / 2 - total / 2;
    const y = this.h / 2;
    const xs: number[] = [];
    for (let i = 0; i < word.length; i++) { xs.push(x); x += charW[i] + ls; }
    const dotX = x;
    g.fillStyle = '#fff';
    for (let i = 0; i < word.length; i++) g.fillText(word[i], xs[i], y);
    g.fillText('.', dotX, y);
    this.vLayout = { fs, xs, dotX, y, word, x0: xs[0], w: (dotX + dotW) - xs[0] };

    const img = g.getImageData(0, 0, tc.width, tc.height).data;
    const step = Math.max(2, Math.round(fs * 0.03));
    this.parts = [];
    for (let py = 0; py < tc.height; py += step) {
      for (let px = 0; px < tc.width; px += step) {
        if (img[(py * tc.width + px) * 4 + 3] > 128) {
          let idx = 0;
          for (let k = 0; k < word.length; k++) if (px >= xs[k] - ls / 2) idx = k;
          const isDot = px >= dotX - ls / 2;
          if (isDot) idx = word.length;
          const call = this.LETTER_START + idx * this.LETTER_GAP + Math.random() * 90;
          this.parts.push(this.driftParticle(false,
            px + (Math.random() - 0.5) * step, py + (Math.random() - 0.5) * step,
            call, isDot ? 'gold' : 'white', 4 + Math.random() * 5));
        }
      }
    }
    // ambient drifting dust to fill the screen while the word forms (capped for big screens)
    const dust = Math.min(340, Math.round((this.w * this.h) / 7000));
    for (let i = 0; i < dust; i++) {
      const r = Math.random();
      const hue: Hue = r < 0.12 ? 'gold' : r < 0.24 ? 'blue' : 'white';
      this.parts.push(this.driftParticle(true, 0, 0, Infinity, hue, 3 + Math.random() * 7));
    }
  }

  private smoother(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }

  /** Fade the video out; particles drift organically, then form "VECTIS" left-to-right; text resolves crisp. */
  private drawParticles(t: number): void {
    const c = this.ctx;
    const el = t - this.V_START;
    const tSec = el / 1000;
    const bgA = this.clamp(1 - el / this.BG_FADE, 0, 1);
    this.drawVideoLayer('dark');
    if (bgA < 1) { c.fillStyle = this.rgb(this.BASE); c.globalAlpha = 1 - bgA; c.fillRect(0, 0, this.w, this.h); c.globalAlpha = 1; }
    if (!this.whiteSprite) return;

    const txtA = this.clamp((el - this.TEXT_START) / this.TEXT_FADE, 0, 1);

    c.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      const [ax, ay] = this.driftPos(p, tSec);
      let x: number, y: number, bright: number, sz = p.size;
      if (p.dust) {
        const inA = this.clamp(el / 500, 0, 1);
        const outA = 1 - this.clamp((el - this.DUST_OUT_A) / (this.DUST_OUT_B - this.DUST_OUT_A), 0, 1);
        bright = 0.42 * inA * outA * (0.65 + 0.35 * Math.sin(tSec * 3 + p.p1));
        if (bright <= 0.02) continue;
        x = ax; y = ay;
      } else {
        const local = el - p.call;
        if (local <= 0) { x = ax; y = ay; bright = 0.42 * (0.7 + 0.3 * Math.sin(tSec * 4 + p.p1)); }
        else {
          if (!p.captured) { p.captured = true; p.fromX = ax; p.fromY = ay; }
          const e = this.smoother(this.clamp(local / this.CONVERGE, 0, 1));
          x = p.fromX + (p.tx - p.fromX) * e; y = p.fromY + (p.ty - p.fromY) * e;
          // bright while flying in, then dim so the crisp wordmark dominates
          bright = (0.5 + 0.5 * e) * (1 - 0.78 * txtA);
          sz = p.size * (1 - 0.35 * e);
        }
      }
      c.globalAlpha = this.clamp(bright, 0, 1);
      const sp = this.spriteFor(p.hue)!;
      c.drawImage(sp, x - sz / 2, y - sz / 2, sz, sz);
    }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;

    if (txtA > 0) this.drawWordmark(txtA);

    // landing close: brief gold bloom + a fine gold underline that grows from the centre
    const closeT = this.clamp((el - this.CLOSE_START) / this.CLOSE_DUR, 0, 1);
    if (closeT > 0 && this.vLayout) {
      const L = this.vLayout, e = this.ease(closeT);
      const bloom = Math.sin(closeT * Math.PI) * 0.16;
      if (bloom > 0.001) {
        const bg = c.createRadialGradient(this.w / 2, L.y, 0, this.w / 2, L.y, L.w * 0.75);
        bg.addColorStop(0, `rgba(238,178,58,${bloom})`); bg.addColorStop(1, 'rgba(238,178,58,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = bg; c.fillRect(0, 0, this.w, this.h);
        c.globalCompositeOperation = 'source-over';
      }
      const uy = L.y + L.fs * 0.46, uw = L.w * e, uh = Math.max(2, L.fs * 0.025);
      c.globalAlpha = e; c.fillStyle = this.GOLD; c.fillRect(this.w / 2 - uw / 2, uy, uw, uh); c.globalAlpha = 1;
    }
  }

  /** Crisp, legible "VECTIS." (white + gold dot). */
  private drawWordmark(alpha: number): void {
    if (!this.vLayout) return;
    const c = this.ctx, L = this.vLayout;
    c.save();
    c.globalAlpha = alpha;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.font = `800 ${L.fs}px 'Outfit', Arial, sans-serif`;
    c.fillStyle = '#ffffff';
    for (let i = 0; i < L.word.length; i++) c.fillText(L.word[i], L.xs[i], L.y);
    c.fillStyle = this.GOLD;
    c.fillText('.', L.dotX, L.y);
    c.restore();
  }

  private rgb(c: RGB): string { return `rgb(${c[0]},${c[1]},${c[2]})`; }
  private clamp(v: number, lo: number, hi: number): number { return v < lo ? lo : v > hi ? hi : v; }
  private ease(t: number): number { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  private exitIntro(): void {
    this.running = false;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.raf);
    const el = this.introContainer.nativeElement;
    if (this.reduced) {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
    } else {
      // hand-off: VECTIS shrinks toward the navbar logo (top-left) while fading
      el.style.transition = 'transform 0.7s cubic-bezier(0.6,0,0.2,1), opacity 0.7s ease';
      el.style.transformOrigin = '7% 5%';
      el.style.transform = 'scale(0.3)';
      el.style.opacity = '0';
    }
    window.setTimeout(() => {
      el.style.display = 'none';
      this.unlockScroll();
      window.dispatchEvent(new CustomEvent('intro-finished'));
      this.focusMain();
    }, 720);
  }
}
