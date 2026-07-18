import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_VERSION } from './version';

/**
 * Footer minimalista del producto: «@Vectis» a la izquierda y la versión a la
 * derecha como enlace al historial de versiones (changelog).
 */
@Component({
  selector: 'app-chatbot-version-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="vf">
      <span class="vf-brand">&#64;Vectis</span>
      <a class="vf-ver" routerLink="/changelog" [fragment]="anchor" [attr.aria-label]="'Ver novedades de la versión ' + version">v{{ version }}</a>
    </footer>
  `,
  styles: [`
    .vf { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; height: 40px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 0 clamp(16px, 4vw, 28px); border-top: 1px solid var(--line-light);
      background: var(--ink); color: var(--text-inv-2); font-size: 12.5px; }
    .vf-brand { font-weight: 600; letter-spacing: .01em; }
    .vf-ver { color: var(--text-inv-2); font-weight: 600; font-variant-numeric: tabular-nums;
      padding: 3px 8px; border-radius: 999px; border: 1px solid var(--line-light); transition: color .15s ease, border-color .15s ease; }
    .vf-ver:hover, .vf-ver:focus-visible { color: var(--gold-bright); border-color: rgba(231,171,46,.5); }
  `],
})
export class ChatbotVersionFooterComponent {
  readonly version = APP_VERSION;
  readonly anchor = 'v' + APP_VERSION.replace(/\./g, '-');
}
