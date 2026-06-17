import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

type RGB = [number, number, number];
interface Cell {
  x: number; y: number; w: number; h: number;
  col: RGB; delay: number; fade: number; glow: boolean; accent: boolean; aA: number; dark: boolean;
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
  private w = 0; private h = 0; private dpr = 1;
  private cells: Cell[] = [];
  private raf = 0;
  private startTime = 0;
  private running = false;
  private started = false;
  private exited = false;

  private readonly BASE: RGB = [11, 11, 13];        // #0B0B0D
  private readonly PRIMARY: RGB = [20, 20, 24];      // #141418
  private readonly SECONDARY: RGB = [28, 28, 34];    // #1C1C22
  private readonly HIGHLIGHT: RGB = [43, 43, 53];    // #2B2B35
  private readonly ACCENT: RGB = [232, 232, 232];    // soft off-white, very low opacity

  private readonly SPREAD = 1700;   // region activation delays span this
  private readonly SETTLE = 170;    // glow settle-back
  private readonly HOLD_END = 2500; // calm stable state
  private readonly EXIT = 2650;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => { if (this.started) return; this.started = true; reduce ? this.runReduced() : this.run(); };
    const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts && fonts.ready) { fonts.ready.then(go); window.setTimeout(go, 300); } else { go(); }
  }

  ngOnDestroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('resize', this.onResize);
  }

  private run(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.onResize);
    this.buildCells();
    this.running = true;
    this.startTime = performance.now();
    this.loop();
  }

  private runReduced(): void {
    this.ctx = this.introCanvas.nativeElement.getContext('2d')!;
    this.resize(); this.buildCells();
    this.renderFrame(99999);   // final stable state
    window.setTimeout(() => this.exitIntro(), 900);
  }

  private readonly onResize = (): void => { if (this.ctx) { this.resize(); this.buildCells(); } };

  private resize(): void {
    const cv = this.introCanvas.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth; this.h = window.innerHeight;
    cv.width = Math.floor(this.w * this.dpr); cv.height = Math.floor(this.h * this.dpr);
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private buildCells(): void {
    const ch = this.clamp(Math.round(Math.min(this.w, this.h) / 26), 18, 32);
    const cw = Math.round(ch * 1.35);
    const gap = 3;
    const cols = Math.ceil(this.w / (cw + gap));
    const rows = Math.ceil(this.h / (ch + gap));
    const ph1 = Math.random() * 6.28, ph2 = Math.random() * 6.28, ph3 = Math.random() * 6.28;
    this.cells = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const nx = i / cols, ny = j / rows;
        // 2D value-noise-ish field -> organic density waves (not row/column sweeps)
        let n = 0.5 + 0.5 * (
          0.5 * Math.sin(nx * 6.3 + ny * 4.1 + ph1)
          + 0.3 * Math.sin(nx * 3.7 - ny * 5.3 + ph2)
          + 0.2 * Math.sin((nx + ny) * 4.0 + ph3));
        n = this.clamp(n, 0, 1);
        const delay = n * this.SPREAD + Math.random() * 260;

        // weighted target: some stay dark, varied brightness for depth
        const r = Math.random();
        let col: RGB; let dark = false; let accent = false; let aA = 0;
        if (r < 0.22) { col = this.BASE; dark = true; }
        else if (r < 0.58) col = this.PRIMARY;
        else if (r < 0.83) col = this.SECONDARY;
        else if (r < 0.965) col = this.HIGHLIGHT;
        else { col = this.BASE; accent = true; aA = 0.05 + Math.random() * 0.08; }

        this.cells.push({
          x: i * (cw + gap), y: j * (ch + gap), w: cw, h: ch,
          col, delay, fade: 110 + Math.random() * 140,
          glow: !dark && !accent && Math.random() < 0.12,
          accent, aA, dark,
        });
      }
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    const t = performance.now() - this.startTime;
    this.renderFrame(t);
    if (t >= this.EXIT && !this.exited) { this.exited = true; this.exitIntro(); }
    this.raf = requestAnimationFrame(this.loop);
  };

  private renderFrame(t: number): void {
    const c = this.ctx;
    c.fillStyle = this.rgb(this.BASE);
    c.fillRect(0, 0, this.w, this.h);
    for (const cell of this.cells) {
      if (cell.dark) continue;                 // stays at base
      const local = t - cell.delay;
      if (local <= 0) continue;
      if (cell.accent) {
        const p = this.ease(this.clamp(local / cell.fade, 0, 1));
        c.globalAlpha = p * cell.aA;
        c.fillStyle = this.rgb(this.ACCENT);
        c.fillRect(cell.x, cell.y, cell.w, cell.h);
        c.globalAlpha = 1;
        continue;
      }
      let col: RGB;
      if (local < cell.fade) {
        const p = this.ease(local / cell.fade);
        col = this.mix(this.BASE, cell.glow ? this.brighten(cell.col) : cell.col, p);
      } else if (cell.glow && local < cell.fade + this.SETTLE) {
        const q = this.ease((local - cell.fade) / this.SETTLE);
        col = this.mix(this.brighten(cell.col), cell.col, q);
      } else {
        col = cell.col;
      }
      c.fillStyle = this.rgb(col);
      c.fillRect(cell.x, cell.y, cell.w, cell.h);
    }
  }

  private brighten(c: RGB): RGB { return this.mix(c, [70, 70, 84], 0.6); }
  private mix(a: RGB, b: RGB, t: number): RGB {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
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
