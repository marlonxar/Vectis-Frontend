import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSessionService, PlanId } from './session.service';
import { ChatbotAuthService } from './auth.service';

interface Plan {
  id: PlanId;
  popular: boolean;
  nameKey: string;
  price: string;
  taglineKey: string;
  features: string[];
}

/**
 * /ai-chatbot/plans — Elegir plan (Basic / Pro / Business).
 * Al elegir: guarda el plan y va al onboarding (/ai-chatbot/configure).
 */
@Component({
  selector: 'app-chatbot-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ChatbotAppHeaderComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <section class="plans">
        <div class="glow" aria-hidden="true"></div>
        <div class="container inner">
          <header class="head">
            <span class="eyebrow on-dark">{{ 'AICHATBOT.PLANS.EYEBROW' | translate }}</span>
            <h1 class="ttl">{{ 'AICHATBOT.PLANS.TITLE' | translate }}</h1>
            <p class="lead on-dark">{{ 'AICHATBOT.PLANS.SUBTITLE' | translate }}</p>
          </header>

          <div class="cards">
            @for (p of plans; track p.id) {
              <article class="plan" [class.popular]="p.popular">
                @if (p.popular) { <span class="badge">{{ 'AICHATBOT.PLANS.POPULAR' | translate }}</span> }
                <h2 class="name">{{ p.nameKey | translate }}</h2>
                <p class="tag">{{ p.taglineKey | translate }}</p>
                <div class="price"><span class="amt">{{ p.price }}</span><span class="per">{{ 'AICHATBOT.PLANS.PER_MONTH' | translate }}</span></div>
                <ul class="feat">
                  @for (f of p.features; track f) {
                    <li>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
                      {{ f | translate }}
                    </li>
                  }
                </ul>
                <button type="button" class="choose" [class.gold]="p.popular" (click)="choose(p.id)">
                  {{ 'AICHATBOT.PLANS.CHOOSE' | translate }}
                </button>
              </article>
            }
          </div>

          <p class="note">{{ 'AICHATBOT.PLANS.NOTE' | translate }}</p>
          <p class="note legal">
            {{ 'AICHATBOT.PLANS.REFUNDS_NOTE' | translate }}
            <a routerLink="/refounds">{{ 'AICHATBOT.PLANS.REFUNDS_LINK' | translate }}</a>
            <span aria-hidden="true"> · </span>
            <a routerLink="/terms">{{ 'AICHATBOT.PLANS.TERMS_LINK' | translate }}</a>
            <span aria-hidden="true"> · </span>
            <a routerLink="/privacy">{{ 'AICHATBOT.PLANS.PRIVACY_LINK' | translate }}</a>
          </p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; overflow-y: auto; background: var(--ink); color: var(--text-inv); }
    .plans { position: relative; overflow: hidden; padding: 56px 0 80px; }
    .glow { position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 760px; height: 520px; pointer-events: none;
      background: radial-gradient(closest-side, rgba(231,171,46,.16), transparent 70%); }
    .inner { position: relative; z-index: 1; }
    .head { text-align: center; max-width: 640px; margin: 0 auto 48px; }
    .ttl { font-size: clamp(34px, 5vw, 60px); margin-top: 12px; }
    .head .lead { margin: 16px auto 0; }

    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; align-items: stretch; }
    .plan { position: relative; display: flex; flex-direction: column; background: var(--ink-card);
      border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 30px 26px; transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease); }
    .plan:hover { transform: translateY(-4px); }
    .plan.popular { border-color: var(--gold-bright); box-shadow: 0 24px 60px rgba(231,171,46,.16); }
    .badge { position: absolute; top: -12px; left: 26px; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
      color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); padding: 5px 12px; border-radius: var(--radius-pill); }
    .name { font-size: 22px; }
    .tag { color: var(--text-inv-2); font-size: 14px; margin-top: 6px; min-height: 40px; }
    .price { display: flex; align-items: baseline; gap: 8px; margin: 14px 0 6px; }
    .amt { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; }
    .per { color: var(--text-inv-2); font-size: 14px; }
    .feat { list-style: none; padding: 18px 0; margin: 12px 0; display: grid; gap: 12px; border-top: 1px solid var(--line-light); flex: 1; }
    .feat li { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; color: var(--text-inv-2); }
    .feat li svg { color: var(--gold-bright); flex-shrink: 0; margin-top: 2px; }
    .choose { width: 100%; min-height: 50px; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700;
      border: 1px solid var(--line-light); background: transparent; color: var(--text-inv); transition: transform var(--dur) var(--ease), background var(--dur) var(--ease); }
    .choose:hover { transform: translateY(-2px); background: rgba(255,255,255,.06); }
    .choose.gold { border: none; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 30px rgba(231,171,46,.3); }
    .note { text-align: center; color: var(--text-inv-2); font-size: 13px; margin-top: 32px; }
    .note.legal { margin-top: 10px; }
    .note.legal a { color: var(--gold-bright); font-weight: 600; }
    .note.legal a:hover { text-decoration: underline; }

    @media (max-width: 920px) { .cards { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; } }
  `],
})
export class ChatbotPlansComponent implements OnInit {
  private router = inject(Router);
  private title = inject(Title);
  private session = inject(ChatbotSessionService);
  private auth = inject(ChatbotAuthService);

  plans: Plan[] = [
    {
      id: 'basic', popular: false, nameKey: 'AICHATBOT.PLANS.BASIC.NAME', price: '$19',
      taglineKey: 'AICHATBOT.PLANS.BASIC.TAG',
      features: ['AICHATBOT.PLANS.BASIC.F1', 'AICHATBOT.PLANS.BASIC.F2', 'AICHATBOT.PLANS.BASIC.F3', 'AICHATBOT.PLANS.BASIC.F4', 'AICHATBOT.PLANS.BASIC.F5', 'AICHATBOT.PLANS.BASIC.F6'],
    },
    {
      id: 'pro', popular: true, nameKey: 'AICHATBOT.PLANS.PRO.NAME', price: '$49',
      taglineKey: 'AICHATBOT.PLANS.PRO.TAG',
      features: ['AICHATBOT.PLANS.PRO.F1', 'AICHATBOT.PLANS.PRO.F2', 'AICHATBOT.PLANS.PRO.F3', 'AICHATBOT.PLANS.PRO.F4', 'AICHATBOT.PLANS.PRO.F5', 'AICHATBOT.PLANS.PRO.F6', 'AICHATBOT.PLANS.PRO.F7', 'AICHATBOT.PLANS.PRO.F8'],
    },
    {
      id: 'business', popular: false, nameKey: 'AICHATBOT.PLANS.BUSINESS.NAME', price: '$99',
      taglineKey: 'AICHATBOT.PLANS.BUSINESS.TAG',
      features: ['AICHATBOT.PLANS.BUSINESS.F1', 'AICHATBOT.PLANS.BUSINESS.F2', 'AICHATBOT.PLANS.BUSINESS.F3', 'AICHATBOT.PLANS.BUSINESS.F4', 'AICHATBOT.PLANS.BUSINESS.F5', 'AICHATBOT.PLANS.BUSINESS.F6', 'AICHATBOT.PLANS.BUSINESS.F7'],
    },
  ];

  ngOnInit(): void {
    this.title.setTitle('Planes — Vectis AI ChatBot');
  }

  async choose(id: PlanId): Promise<void> {
    // Guarda el plan en la base de datos (RPC) y calcula el vencimiento (30 días).
    const { error } = await this.auth.selectPlan(id);
    if (!error) {
      this.session.plan.set(id);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      this.session.planExpiry.set(d.toISOString().slice(0, 10));
      this.session.cancelAtPeriodEnd.set(false);   // reactivar suscripción
      this.session.bannerDismissed.set(false);
    }
    // Si quedó con más chatbots activos de los que permite el nuevo plan, ir a elegir cuáles.
    if (this.session.overLimit()) {
      this.router.navigateByUrl('/ai-chatbot/manage');
    } else {
      this.router.navigateByUrl('/ai-chatbot/configure');
    }
  }
}
