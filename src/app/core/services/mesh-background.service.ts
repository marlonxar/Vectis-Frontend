import { Injectable, NgZone, inject } from '@angular/core';

interface P { x: number; y: number; px: number; py: number; life: number; max: number; hue: number; }

/**
 * Original interactive "gold filament" flow field.
 * Particles are advected by a smooth curl-noise field and leave fading gold
 * trails on black; the mouse injects an attraction + swirl vortex so the
 * filaments curl toward the cursor. A few particles render near-white for spark.
 * Respects prefers-reduced-motion; ambient-only on coarse pointers.
 */
@Injectable({ providedIn: 'root' })
export class MeshBackgroundService {
  private readonly zone = inject(NgZone);

  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D | null;
  private parts: P[] = [];
  private count = 0;
  private raf = 0;
  private running = false;
  private dpr = 1;
  private reduced = false;
  private coarse = false;
  private w = 0; private h = 0; private t = 0;
  private mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

  initCanvas(canvas: HTMLCanvasElement): void {
    if (typeof window === 'undefined') return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.coarse = window.matchMedia('(pointer: coarse)').matches;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });
    if (!this.coarse) {
      window.addEventListener('mousemove', this.onMouse, { passive: true });
      window.addEventListener('mouseout', this.onLeave, { passive: true });
    }
    if (this.reduced) { this.renderStatic(); return; }
    this.startLoop();
  }

  private startLoop(): void {
    if (this.running) return;
    this.running = true;
    this.zone.runOutsideAngular(() => { this.raf = requestAnimationFrame(this.tick); });
  }
  pause(): void { this.running = false; cancelAnimationFrame(this.raf); }
  resume(): void { if (this.canvas && !this.reduced) this.startLoop(); }

  destroy(): void {
    this.pause();
    if (typeof window === 'undefined') return;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouse);
    window.removeEventListener('mouseout', this.onLeave);
    this.canvas = undefined; this.ctx = null; this.parts = [];
  }

  private onResize = () => this.resize();
  private onMouse = (e: MouseEvent) => { this.mouse.tx = e.clientX; this.mouse.ty = e.clientY; this.mouse.active = true; };
  private onLeave = () => { this.mouse.active = false; this.mouse.tx = -9999; this.mouse.ty = -9999; };

  private resize(): void {
    if (!this.canvas || !this.ctx) return;
    this.w = window.innerWidth;
    this.h = Math.max(window.innerHeight, 640);
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.fillStyle = '#0A0A0A';
    this.ctx.fillRect(0, 0, this.w, this.h);

    this.count = Math.min(1600, Math.round((this.w * this.h) / 1350));
    this.parts = [];
    for (let i = 0; i < this.count; i++) this.parts.push(this.spawn());
  }

  private spawn(): P {
    const x = Math.random() * this.w;
    const y = Math.random() * this.h;
    return { x, y, px: x, py: y, life: 0, max: 80 + Math.random() * 180, hue: Math.random() };
  }

  /** smooth pseudo-curl flow angle */
  private field(x: number, y: number): number {
    const s = 0.0016;
    const n = Math.sin(x * s + this.t * 0.20) +
              Math.cos(y * s * 1.3 - this.t * 0.15) +
              Math.sin((x + y) * s * 0.7 + this.t * 0.10);
    return n * 1.4;
  }

  private renderStatic(): void {
    if (!this.ctx) return;
    this.t = 12;
    for (let k = 0; k < 240; k++) {
      let p = this.spawn();
      for (let s = 0; s < 60; s++) {
        const a = this.field(p.x, p.y);
        p.px = p.x; p.py = p.y;
        p.x += Math.cos(a) * 2.4; p.y += Math.sin(a) * 2.4;
        this.ctx.strokeStyle = 'rgba(242,182,52,0.18)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath(); this.ctx.moveTo(p.px, p.py); this.ctx.lineTo(p.x, p.y); this.ctx.stroke();
      }
    }
  }

  private tick = () => {
    if (!this.running || !this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    this.t += 0.016;

    // ease mouse + fade trails
    if (this.mouse.tx > -9000) { this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.10; this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.10; }
    ctx.fillStyle = 'rgba(10, 10, 10, 0.045)';
    ctx.fillRect(0, 0, this.w, this.h);

    const R = 240;
    for (const p of this.parts) {
      const ang = this.field(p.x, p.y);
      let vx = Math.cos(ang) * 1.7;
      let vy = Math.sin(ang) * 1.7;

      if (this.mouse.active && !this.coarse) {
        const dx = this.mouse.x - p.x, dy = this.mouse.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 0.1) {
          const f = (1 - d / R);
          const a = Math.atan2(dy, dx);
          // swirl (perpendicular) + gentle pull
          vx += Math.cos(a + Math.PI / 2) * f * 2.6 + (dx / d) * f * 0.8;
          vy += Math.sin(a + Math.PI / 2) * f * 2.6 + (dy / d) * f * 0.8;
        }
      }

      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy;
      p.life++;

      const near = this.mouse.active && !this.coarse
        ? Math.max(0, 1 - Math.hypot(this.mouse.x - p.x, this.mouse.y - p.y) / R) : 0;

      if (p.hue > 0.85) {
        ctx.strokeStyle = `rgba(255,250,238,${0.22 + near * 0.7})`;
        ctx.lineWidth = 1.2 + near * 0.6;
      } else {
        const a = 0.18 + near * 0.68;
        ctx.strokeStyle = `rgba(245,188,58,${a})`;
        ctx.lineWidth = 1.3 + near * 1.0;
      }
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();

      if (p.life > p.max || p.x < -20 || p.x > this.w + 20 || p.y < -20 || p.y > this.h + 20) {
        Object.assign(p, this.spawn());
      }
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}
