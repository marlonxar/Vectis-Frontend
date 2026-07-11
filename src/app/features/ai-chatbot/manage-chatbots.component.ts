import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSessionService } from './session.service';
import { ChatbotAuthService } from './auth.service';
import { SupabaseClientService } from './supabase.client';

/**
 * /manage — Elegir qué chatbots quedan ACTIVOS según el plan.
 * Al bajar de plan (Business → Pro/Basic), el usuario solo puede mantener
 * un número limitado de chatbots activos; los demás quedan inactivos (visibles).
 */
@Component({
  selector: 'app-chatbot-manage',
  standalone: true,
  imports: [CommonModule, TranslateModule, ChatbotAppHeaderComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <main class="content">
        <div class="wrap">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.MANAGE.EYEBROW' | translate }}</span>
          <h1 class="ttl">{{ 'AICHATBOT.MANAGE.TITLE' | translate }}</h1>
          <p class="lead on-dark">{{ 'AICHATBOT.MANAGE.INTRO' | translate:{ plan: s.planName(), max: s.maxActive() } }}</p>

          <div class="counter" [class.bad]="activeNow() > s.maxActive() || activeNow() === 0">
            {{ 'AICHATBOT.MANAGE.COUNT' | translate:{ n: activeNow(), max: s.maxActive() } }}
          </div>

          <ul class="list">
            @for (c of s.companies(); track $index) {
              <li class="row" [class.off]="!active()[$index]">
                <div class="info">
                  <span class="name">{{ c }}</span>
                  <span class="st" [class.on]="active()[$index]">{{ (active()[$index] ? 'AICHATBOT.MANAGE.ACTIVE' : 'AICHATBOT.MANAGE.INACTIVE') | translate }}</span>
                </div>
                <button type="button" class="sw" [class.on]="active()[$index]" (click)="toggle($index)"
                        [attr.aria-pressed]="active()[$index]" [attr.aria-label]="c">
                  <span class="sw-track"><span class="sw-dot"></span></span>
                </button>
              </li>
            }
          </ul>

          @if (activeNow() > s.maxActive()) { <p class="err">{{ 'AICHATBOT.MANAGE.TOO_MANY' | translate:{ max: s.maxActive() } }}</p> }
          @if (activeNow() === 0) { <p class="err">{{ 'AICHATBOT.MANAGE.NEED_ONE' | translate }}</p> }
          @if (saveErr()) { <p class="err">{{ saveErr() }}</p> }

          <div class="actions">
            <button type="button" class="btn-gold" [disabled]="!canSave() || saving()" (click)="save()">
              {{ (saving() ? 'AICHATBOT.MANAGE.SAVING' : 'AICHATBOT.MANAGE.SAVE') | translate }}
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 60px; max-width: 720px; margin: 0 auto; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .counter { display: inline-block; margin-top: 18px; padding: 7px 14px; border-radius: var(--radius-pill); font-size: 13px; font-weight: 700;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); }
    .counter.bad { color: #ff8a8a; background: rgba(214,69,69,.12); border-color: rgba(214,69,69,.4); }
    .list { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 10px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px 18px;
      background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); transition: border-color var(--dur) var(--ease), opacity var(--dur) var(--ease); }
    .row.off { opacity: .75; }
    .info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .name { font-size: 15.5px; font-weight: 600; }
    .st { font-size: 12px; font-weight: 700; color: var(--text-inv-2); }
    .st.on { color: #34e0a1; }
    .sw { background: transparent; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
    .sw-track { position: relative; display: block; width: 46px; height: 26px; border-radius: 999px; background: rgba(255,255,255,.14); transition: background var(--dur) var(--ease); }
    .sw-dot { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform var(--dur) var(--ease); }
    .sw.on .sw-track { background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); }
    .sw.on .sw-dot { transform: translateX(20px); }
    .err { color: #ff8a8a; font-size: 13.5px; margin: 14px 0 0; }
    .actions { margin-top: 26px; }
    .btn-gold { min-height: 52px; padding: 0 30px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink);
      background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 30px rgba(231,171,46,.3); transition: transform var(--dur) var(--ease); }
    .btn-gold:hover:not(:disabled) { transform: translateY(-2px); }
    .btn-gold:disabled { opacity: .6; cursor: default; }
  `],
})
export class ChatbotManageComponent implements OnInit {
  private title = inject(Title);
  private router = inject(Router);
  private sb = inject(SupabaseClientService).client;
  private auth = inject(ChatbotAuthService);
  readonly s = inject(ChatbotSessionService);

  active = signal<boolean[]>([]);
  saving = signal(false);
  saveErr = signal('');

  activeNow = computed(() => this.active().filter(Boolean).length);
  canSave = computed(() => this.activeNow() >= 1 && this.activeNow() <= this.s.maxActive());

  ngOnInit(): void {
    this.title.setTitle('Gestionar ChatBots — Vectis AI ChatBot');
    this.active.set(this.s.statuses().map((st) => st === 'ACTIVE'));
  }

  toggle(i: number): void {
    const a = [...this.active()];
    a[i] = !a[i];
    this.active.set(a);
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saveErr.set('');
    this.saving.set(true);
    const ids = this.s.clientIds();
    const desired = this.active();
    try {
      for (let i = 0; i < ids.length; i++) {
        const want = desired[i] ? 'ACTIVE' : 'INACTIVE';
        if ((this.s.statuses()[i] ?? 'ACTIVE') !== want) {
          const { error } = await this.sb.from('chatbots').update({ status: want }).eq('id', ids[i]);
          if (error) throw error;
        }
      }
      await this.auth.reload();
      this.s.needsActiveReview.set(false);   // revisión resuelta
      this.saving.set(false);
      this.router.navigateByUrl('/dashboard');
    } catch (e: any) {
      this.saving.set(false);
      this.saveErr.set(e?.message || 'No se pudo guardar. Intenta de nuevo.');
    }
  }
}
