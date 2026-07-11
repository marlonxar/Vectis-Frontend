import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Sección del home que presenta el producto AI ChatBot.
 * id="ai-chatbot" para que la navbar (scroll) la alcance. CTA → /ai-chatbot.
 */
@Component({
  selector: 'app-chatbot-promo',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <section id="ai-chatbot" class="section sec-dark promo" [attr.aria-label]="'AICHATBOT.PROMO.TITLE' | translate">
      <div class="glow" aria-hidden="true"></div>
      <div class="container inner">
        <div class="copy">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.PROMO.EYEBROW' | translate }}</span>
          <h2 class="section-title">{{ 'AICHATBOT.PROMO.TITLE' | translate }}</h2>
          <p class="lead on-dark">{{ 'AICHATBOT.PROMO.SUBTITLE' | translate }}</p>
          <p class="sub2 on-dark">{{ 'AICHATBOT.PROMO.SUBTITLE2' | translate }}</p>
          <ul class="feats">
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.PROMO.B1' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.PROMO.B2' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.PROMO.B3' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.PROMO.B4' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.PROMO.B5' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.PROMO.B6' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.PROMO.B7' | translate }}</li>
          </ul>
          <a class="cta" routerLink="/">
            {{ 'AICHATBOT.PROMO.CTA' | translate }}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <p class="note on-dark">{{ 'AICHATBOT.PROMO.NOTE' | translate }}</p>
        </div>

        <!-- Mockup de la burbuja de chat -->
        <div class="mock" aria-hidden="true">
          <div class="win">
            <div class="bar"><span class="ava"></span><b>Asistente</b><span class="on">● en línea</span></div>
            <div class="body">
              <div class="b bot">{{ 'AICHATBOT.PROMO.MOCK_BOT1' | translate }}</div>
              <div class="b user">{{ 'AICHATBOT.PROMO.MOCK_USER' | translate }}</div>
              <div class="b bot">{{ 'AICHATBOT.PROMO.MOCK_BOT2' | translate }}</div>
            </div>
            <div class="inp"><span>{{ 'AICHATBOT.PROMO.MOCK_PLACEHOLDER' | translate }}</span></div>
          </div>
        </div>
      </div>

      <!-- Capacidades del producto -->
      <div class="container caps">
        <div class="cap">
          <span class="cap-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-6"/></svg></span>
          <h3>{{ 'AICHATBOT.PROMO.CAP1_T' | translate }}</h3>
          <p>{{ 'AICHATBOT.PROMO.CAP1_D' | translate }}</p>
        </div>
        <div class="cap">
          <span class="cap-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg></span>
          <h3>{{ 'AICHATBOT.PROMO.CAP2_T' | translate }}</h3>
          <p>{{ 'AICHATBOT.PROMO.CAP2_D' | translate }}</p>
        </div>
        <div class="cap">
          <span class="cap-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <h3>{{ 'AICHATBOT.PROMO.CAP3_T' | translate }}</h3>
          <p>{{ 'AICHATBOT.PROMO.CAP3_D' | translate }}</p>
        </div>
        <div class="cap">
          <span class="cap-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></svg></span>
          <h3>{{ 'AICHATBOT.PROMO.CAP4_T' | translate }}</h3>
          <p>{{ 'AICHATBOT.PROMO.CAP4_D' | translate }}</p>
        </div>
      </div>

      <!-- Self-serve en 3 pasos -->
      <div class="container steps-wrap">
        <div class="steps-head">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.PROMO.STEPS_EYEBROW' | translate }}</span>
          <h3 class="steps-title">{{ 'AICHATBOT.PROMO.STEPS_TITLE' | translate }}</h3>
          <p class="lead on-dark">{{ 'AICHATBOT.PROMO.STEPS_SUB' | translate }}</p>
        </div>
        <div class="steps">
          <div class="step">
            <span class="step-n">1</span>
            <h4>{{ 'AICHATBOT.PROMO.STEP1_T' | translate }}</h4>
            <p>{{ 'AICHATBOT.PROMO.STEP1_D' | translate }}</p>
          </div>
          <div class="step">
            <span class="step-n">2</span>
            <h4>{{ 'AICHATBOT.PROMO.STEP2_T' | translate }}</h4>
            <p>{{ 'AICHATBOT.PROMO.STEP2_D' | translate }}</p>
          </div>
          <div class="step">
            <span class="step-n">3</span>
            <h4>{{ 'AICHATBOT.PROMO.STEP3_T' | translate }}</h4>
            <p>{{ 'AICHATBOT.PROMO.STEP3_D' | translate }}</p>
            <code class="snippet">&lt;script src="…/widget.js" data-client-id="…" defer&gt;&lt;/script&gt;</code>
          </div>
        </div>
        <div class="steps-cta">
          <a class="cta" routerLink="/">{{ 'AICHATBOT.PROMO.CTA' | translate }}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <span class="steps-note on-dark">{{ 'AICHATBOT.PROMO.STEPS_NOTE' | translate }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .promo { position: relative; overflow: hidden; padding-top: clamp(36px, 4.5vw, 60px); }
    .glow { position: absolute; top: 10%; right: -120px; width: 560px; height: 560px; pointer-events: none;
      background: radial-gradient(closest-side, rgba(231,171,46,.16), transparent 70%); }
    .inner { position: relative; z-index: 1; display: grid; grid-template-columns: 1.05fr .95fr; gap: 56px; align-items: center; }
    .sub2 { margin-top: 14px; font-size: 16px; color: var(--text-inv-2); max-width: 46ch; }
    .feats { list-style: none; padding: 0; margin: 26px 0 30px; display: grid; gap: 12px; }
    .feats li { display: flex; align-items: center; gap: 12px; color: var(--text-inv-2); font-size: 16px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 10px var(--gold-bright); flex-shrink: 0; }
    .note { margin-top: 18px; font-size: 13.5px; color: var(--text-inv-2); opacity: .85; }

    /* Capacidades — fila editorial con divisores (sin cajas) */
    .caps { position: relative; z-index: 1; margin-top: clamp(48px, 6vw, 80px); display: grid; grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--line-light); }
    .cap { padding: 30px 28px 0; border-left: 1px solid var(--line-light); }
    .cap:first-child { border-left: none; padding-left: 0; }
    .cap-ic { display: inline-grid; place-items: center; width: 42px; height: 42px; color: var(--gold-bright); margin-bottom: 15px; }
    .cap-ic svg { width: 30px; height: 30px; }
    .cap h3 { font-size: 17.5px; margin-bottom: 8px; color: var(--text-inv); }
    .cap p { font-size: 14px; line-height: 1.6; color: var(--text-inv-2); }
    @media (max-width: 920px) { .caps { grid-template-columns: 1fr 1fr; }
      .cap { border-left: 1px solid var(--line-light); border-top: 1px solid var(--line-light); padding: 26px 24px 0; }
      .cap:nth-child(odd) { border-left: none; padding-left: 0; }
      .cap:nth-child(-n+2) { border-top: none; } }
    @media (max-width: 540px) { .caps { grid-template-columns: 1fr; }
      .cap { border-left: none; border-top: 1px solid var(--line-light); padding: 24px 0 0; }
      .cap:first-child { border-top: none; } }
    .cta { display: inline-flex; align-items: center; gap: 10px; min-height: 54px; padding: 0 30px; border-radius: var(--radius-pill);
      font-weight: 700; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright));
      box-shadow: 0 12px 34px rgba(231,171,46,.3); transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease); }
    .cta:hover { transform: translateY(-2px); box-shadow: 0 18px 44px rgba(231,171,46,.45); }

    .mock { display: flex; justify-content: center; }
    .win { width: 100%; max-width: 360px; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg);
      overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,.5); }
    .bar { display: flex; align-items: center; gap: 9px; padding: 14px 16px; border-bottom: 1px solid var(--line-light); font-size: 14px; }
    .bar .ava { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); }
    .bar .on { margin-left: auto; font-size: 11px; color: #34e0a1; }
    .body { padding: 18px 16px; display: flex; flex-direction: column; gap: 10px; min-height: 200px; }
    .b { max-width: 84%; padding: 10px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.45; }
    .b.bot { align-self: flex-start; background: rgba(255,255,255,.07); border: 1px solid var(--line-light); border-bottom-left-radius: 4px; color: var(--text-inv); }
    .b.user { align-self: flex-end; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); border-bottom-right-radius: 4px; font-weight: 500; }
    .inp { padding: 12px 16px; border-top: 1px solid var(--line-light); color: rgba(255,255,255,.4); font-size: 13px; }

    @media (max-width: 920px) { .inner { grid-template-columns: 1fr; gap: 38px; } .mock { order: -1; } }

    .steps-wrap { position: relative; z-index: 1; margin-top: clamp(52px, 7vw, 90px); }
    .steps-head { text-align: center; max-width: 640px; margin: 0 auto 34px; }
    .steps-title { font-size: clamp(22px, 3vw, 30px); margin: 8px 0 10px; color: var(--text-inv); }
    .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
    .step { position: relative; background: rgba(255,255,255,.03); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 26px 22px; }
    .step-n { display: inline-grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; font-weight: 800; color: var(--ink);
      background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 8px 22px rgba(231,171,46,.3); margin-bottom: 14px; }
    .step h4 { font-size: 16.5px; color: var(--text-inv); margin-bottom: 7px; }
    .step p { font-size: 14px; line-height: 1.55; color: var(--text-inv-2); }
    .snippet { display: block; margin-top: 12px; font-size: 10.5px; color: var(--gold-bright); background: rgba(0,0,0,.35);
      border: 1px solid var(--line-light); border-radius: 8px; padding: 8px 10px; overflow-x: auto; white-space: nowrap; }
    .steps-cta { display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap; margin-top: 30px; }
    .steps-note { font-size: 13.5px; color: var(--text-inv-2); }
    @media (max-width: 820px) { .steps { grid-template-columns: 1fr; } }
  `],
})
export class ChatbotPromoComponent {}
