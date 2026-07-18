import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_VERSION } from './version';

/**
 * Footer minimalista y centrado del producto:
 * «Developed by Vectis · v1.1.0» — «Vectis» enlaza al sitio y la versión al changelog.
 * Centrado para no chocar con la burbuja del widget (esquina inferior derecha).
 */
@Component({
  selector: 'app-chatbot-version-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="vf">
      <span class="vf-txt">
        Developed by <a class="vf-link" href="https://www.wearevectis.com" target="_blank" rel="noopener">Vectis</a>
        <span class="vf-sep">·</span>
        <a class="vf-link vf-ver" routerLink="/changelog" [fragment]="anchor" [attr.aria-label]="'Ver novedades de la versión ' + version">v{{ version }}</a>
      </span>
    </footer>
  `,
  styles: [`
    .vf { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; height: 38px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 90px; border-top: 1px solid var(--line-light);
      background: var(--ink); color: var(--text-inv-2); font-size: 12.5px; pointer-events: none; }
    .vf-txt { pointer-events: auto; display: inline-flex; align-items: center; gap: 7px; }
    .vf-sep { opacity: .5; }
    .vf-link { color: var(--text-inv-2); font-weight: 600; transition: color .15s ease; }
    .vf-link:hover, .vf-link:focus-visible { color: var(--gold-bright); }
    .vf-ver { font-variant-numeric: tabular-nums; }
  `],
})
export class ChatbotVersionFooterComponent {
  readonly version = APP_VERSION;
  readonly anchor = 'v' + APP_VERSION.replace(/\./g, '-');
}
