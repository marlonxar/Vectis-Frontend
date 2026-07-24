import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollService } from '../../core/services/scroll.service';

/**
 * "Cómo funciona — 3 pasos". Es la columna vertebral de la oferta y antes vivía
 * enterrada en una respuesta del FAQ. Ahora tiene su propia sección en el home,
 * entre "Qué construimos" y "Nosotros". Un solo CTA: el diagnóstico gratis.
 */
@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="how sec-dark" aria-labelledby="how-title">
      <div class="container">
        <span class="eyebrow">{{ 'HOWITWORKS.EYEBROW' | translate }}</span>
        <h2 id="how-title" class="title">{{ 'HOWITWORKS.TITLE' | translate }}</h2>

        <ol class="steps">
          <li class="step">
            <span class="num" aria-hidden="true">1</span>
            <h3>{{ 'HOWITWORKS.S1_T' | translate }}</h3>
            <p>{{ 'HOWITWORKS.S1_D' | translate }}</p>
          </li>
          <li class="step">
            <span class="num" aria-hidden="true">2</span>
            <h3>{{ 'HOWITWORKS.S2_T' | translate }}</h3>
            <p>{{ 'HOWITWORKS.S2_D' | translate }}</p>
          </li>
          <li class="step">
            <span class="num" aria-hidden="true">3</span>
            <h3>{{ 'HOWITWORKS.S3_T' | translate }}</h3>
            <p>{{ 'HOWITWORKS.S3_D' | translate }}</p>
          </li>
        </ol>

        <button type="button" class="cta" (click)="scroll.scrollToId('contacto')">{{ 'HOWITWORKS.CTA' | translate }}</button>
      </div>
    </section>
  `,
  styles: [`
    .how { padding: clamp(64px, 9vw, 120px) 0; }
    .container { width: min(1120px, 92vw); margin: 0 auto; }
    .eyebrow { display: block; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--gold, #E7AB2E); }
    .title { font-size: clamp(28px, 4vw, 46px); margin-top: 12px; max-width: 720px; }
    .steps { list-style: none; margin: clamp(34px, 5vw, 56px) 0 0; padding: 0; display: grid; gap: 20px; grid-template-columns: repeat(3, 1fr); counter-reset: step; }
    .step { position: relative; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 26px 24px; }
    .num { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; font-weight: 800; font-size: 17px;
      color: #0A0A0A; background: linear-gradient(135deg, var(--gold-soft, #F0C868), var(--gold, #E7AB2E)); }
    .step h3 { font-size: 19px; margin: 16px 0 8px; }
    .step p { font-size: 15px; line-height: 1.55; color: var(--muted, #B9BCC9); }
    /* Conector entre pasos, solo en escritorio */
    .step:not(:last-child)::after { content: ''; position: absolute; top: 46px; right: -13px; width: 26px; height: 2px;
      background: linear-gradient(90deg, var(--gold, #E7AB2E), transparent); }
    .cta { display: inline-flex; align-items: center; justify-content: center; margin-top: clamp(30px, 4vw, 44px); min-height: 52px; padding: 0 30px;
      border: none; cursor: pointer; font: inherit; border-radius: 999px; font-weight: 700; color: #0A0A0A;
      background: linear-gradient(135deg, var(--gold-soft, #F0C868), var(--gold, #E7AB2E)); box-shadow: 0 14px 34px rgba(231,171,46,.32); }
    .cta:hover { filter: brightness(1.04); }
    @media (max-width: 860px) {
      .steps { grid-template-columns: 1fr; gap: 14px; }
      .step:not(:last-child)::after { display: none; }
      .cta { width: 100%; }
    }
  `],
})
export class HowItWorksComponent {
  readonly scroll = inject(ScrollService);
}
