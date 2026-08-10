import {
  Component, OnInit, OnDestroy, HostListener, inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Intro de entrada — animación de 3 tiempos (problema → solución → marca).
 *
 * Reemplaza la intro de canvas anterior (6.5 s, texto no legible) por una capa
 * liviana en DOM que cumple el change order:
 *  - Texto real en el DOM, legible por buscadores e IA.
 *  - Duración total ≤ 2.6 s (≈0.85 s por beat); luego se disuelve.
 *  - Se salta con click, tap, scroll o cualquier tecla.
 *  - Una sola vez por sesión (bandera en sessionStorage).
 *  - No bloquea el LCP: el overlay solo se monta en el navegador, así que el
 *    hero es el contenido superior en el HTML prerenderizado y con JS apagado.
 *  - prefers-reduced-motion: sin animación, muestra el beat 3 y se disuelve.
 */
@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
})
export class IntroComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  /** 0 = nada, 1/2/3 = beat visible. */
  readonly beat = signal(0);
  /** Activa el disolvido final antes de quitar el overlay. */
  readonly leaving = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private finished = false;

  // Ritmo: cada beat ~0.85 s → 3 beats ≈ 2.55 s. El disolvido dura 300 ms.
  private readonly BEAT_MS = 850;
  private readonly FADE_MS = 300;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Una vez por sesión: si ya se vio, no se muestra en navegaciones internas.
    let seen = false;
    try { seen = sessionStorage.getItem('vectisIntroSeen') === '1'; } catch { /* noop */ }
    if (seen) { this.finish(true); return; }
    try { sessionStorage.setItem('vectisIntroSeen', '1'); } catch { /* noop */ }

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      // Sin animación: se muestra directo el beat 3 (la marca) y se disuelve.
      this.beat.set(3);
      this.at(900, () => this.finish());
      return;
    }

    this.beat.set(1);
    this.at(this.BEAT_MS, () => this.beat.set(2));
    this.at(this.BEAT_MS * 2, () => this.beat.set(3));
    this.at(this.BEAT_MS * 3, () => this.finish());
  }

  /** Cualquier interacción salta la intro de inmediato. */
  skip(): void { this.finish(); }
  @HostListener('window:keydown') onKey(): void { this.finish(); }
  @HostListener('window:wheel') onWheel(): void { this.finish(); }
  @HostListener('window:touchstart') onTouch(): void { this.finish(); }

  private at(ms: number, fn: () => void): void { this.timers.push(setTimeout(fn, ms)); }

  /** Cierra: disuelve el overlay y avisa a quien escuche (p. ej. el portafolio). */
  private finish(immediate = false): void {
    if (this.finished) return;
    this.finished = true;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.leaving.set(true);
    const done = () => { try { window.dispatchEvent(new CustomEvent('intro-finished')); } catch { /* noop */ } };
    if (immediate) { done(); return; }
    setTimeout(done, this.FADE_MS);
  }

  ngOnDestroy(): void { this.timers.forEach(clearTimeout); }
}
