import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loader de marca Vectis a pantalla completa.
 * Se muestra durante las transiciones de ruta / carga de contenido.
 * Diseño: anillo dorado girando alrededor del logo + wordmark + puntos.
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vload" role="status" aria-live="polite" aria-label="Cargando">
      <div class="vload-core">
        <span class="ring" aria-hidden="true"></span>
        <span class="ring ring2" aria-hidden="true"></span>
        <img class="logo" src="assets/images/logo.svg" alt="" width="44" height="44" />
      </div>
      <span class="wm">Vectis<i>.</i></span>
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 9999; }
    .vload {
      position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px;
      background: radial-gradient(120% 90% at 50% 35%, #14110c 0%, var(--ink, #0A0A0A) 60%);
      animation: vload-in .28s ease both;
    }
    @keyframes vload-in { from { opacity: 0; } to { opacity: 1; } }

    .vload-core { position: relative; width: 92px; height: 92px; display: grid; place-items: center; }
    .logo { width: 44px; height: 44px; animation: vload-pulse 1.8s ease-in-out infinite; }
    @keyframes vload-pulse { 0%,100% { transform: scale(1); opacity: .95; } 50% { transform: scale(1.06); opacity: 1; } }

    .ring { position: absolute; inset: 0; border-radius: 50%;
      border: 2px solid rgba(231,171,46,.14);
      border-top-color: var(--gold-bright, #E7AB2E);
      border-right-color: var(--gold-soft, #F0C56A);
      animation: vload-spin 1s linear infinite; }
    .ring2 { inset: 12px; border-width: 2px; border-top-color: transparent; border-right-color: transparent;
      border-bottom-color: rgba(231,171,46,.55); border-left-color: rgba(231,171,46,.2);
      animation: vload-spin 1.5s linear infinite reverse; }
    @keyframes vload-spin { to { transform: rotate(360deg); } }

    .wm { font-family: 'Outfit', system-ui, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -.01em; color: #fff; }
    .wm i { color: var(--gold-bright, #E7AB2E); font-style: normal; }

    .dots { display: inline-flex; gap: 6px; }
    .dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--gold-bright, #E7AB2E); opacity: .35; animation: vload-dot 1.2s ease-in-out infinite; }
    .dots i:nth-child(2) { animation-delay: .18s; }
    .dots i:nth-child(3) { animation-delay: .36s; }
    @keyframes vload-dot { 0%,100% { opacity: .3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-4px); } }

    @media (prefers-reduced-motion: reduce) {
      .ring, .ring2, .logo, .dots i { animation-duration: .01ms; animation-iteration-count: 1; }
      .ring { border-top-color: var(--gold-bright, #E7AB2E); }
    }
  `],
})
export class LoadingComponent {}
