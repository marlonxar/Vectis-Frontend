import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService } from './session.service';
import { SupabaseClientService } from './supabase.client';

const WORKER_URL = 'https://chatbot.vectisauto.workers.dev';

/**
 * /handoff — Handoff a humano.
 * Canal actual: Telegram (bot propio del negocio). El dueño pega el token de su bot,
 * el worker registra el webhook automáticamente, y luego el dueño envía /start para vincular.
 */
@Component({
  selector: 'app-chatbot-handoff',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <app-chatbot-version-footer></app-chatbot-version-footer>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <span class="eyebrow on-dark">{{ 'AICHATBOT.HANDOFF.EYEBROW' | translate }}</span>
            <h1 class="ttl">{{ 'AICHATBOT.HANDOFF.TITLE' | translate }}</h1>
            <p class="lead on-dark">{{ 'AICHATBOT.HANDOFF.LEAD' | translate }}</p>

            <!-- Cómo funciona -->
            <section class="card">
              <h3 class="ch">{{ 'AICHATBOT.HANDOFF.HOW_TITLE' | translate }}</h3>
              <ol class="how">
                <li>{{ 'AICHATBOT.HANDOFF.HOW1' | translate }}</li>
                <li>{{ 'AICHATBOT.HANDOFF.HOW2' | translate }}</li>
                <li>{{ 'AICHATBOT.HANDOFF.HOW3' | translate }}</li>
                <li>{{ 'AICHATBOT.HANDOFF.HOW4' | translate }}</li>
              </ol>
            </section>

            <!-- Canal: Telegram -->
            <section class="card">
              <div class="ch-row">
                <button type="button" class="ch-info" [class.clickable]="enabled()" (click)="toggleOpen()" [disabled]="!enabled()"
                        [attr.aria-expanded]="enabled() && open()" [attr.aria-label]="'AICHATBOT.HANDOFF.TOGGLE_DETAILS' | translate">
                  <span class="ch-ic">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg>
                  </span>
                  <div class="ch-txt">
                    <b>{{ 'AICHATBOT.HANDOFF.CH_TELEGRAM' | translate }}</b>
                    <span class="ch-sub">{{ 'AICHATBOT.HANDOFF.CH_SOON' | translate }}</span>
                  </div>
                  @if (enabled()) {
                    <svg class="ch-chev" [class.up]="open()" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                  }
                </button>
                <button type="button" class="tgl" [class.on]="enabled()" (click)="toggle()" [attr.aria-pressed]="enabled()" [attr.aria-label]="'AICHATBOT.HANDOFF.ENABLE' | translate"><span></span></button>
              </div>

              @if (enabled() && open()) {
                <div class="tg-body">
                  <p class="guide-title">{{ 'AICHATBOT.HANDOFF.GUIDE_TITLE' | translate }}</p>
                  <ol class="guide">
                    <li>{{ 'AICHATBOT.HANDOFF.G1' | translate }}</li>
                    <li>{{ 'AICHATBOT.HANDOFF.G2' | translate }}</li>
                    <li>{{ 'AICHATBOT.HANDOFF.G3' | translate }}</li>
                    <li>{{ 'AICHATBOT.HANDOFF.G4' | translate }}</li>
                    <li>{{ 'AICHATBOT.HANDOFF.G5' | translate }}</li>
                    <li>{{ 'AICHATBOT.HANDOFF.G6' | translate }}</li>
                  </ol>

                  <div class="field">
                    <label for="tg-token">{{ 'AICHATBOT.HANDOFF.F_TOKEN' | translate }}</label>
                    <input id="tg-token" type="text" [(ngModel)]="tokenV" [attr.placeholder]="'AICHATBOT.HANDOFF.F_TOKEN_PH' | translate" autocomplete="off" spellcheck="false" />
                  </div>
                  <div class="field">
                    <label for="tg-user">{{ 'AICHATBOT.HANDOFF.F_USER' | translate }}</label>
                    <div class="at"><span>&#64;</span><input id="tg-user" type="text" [(ngModel)]="userV" [attr.placeholder]="'AICHATBOT.HANDOFF.F_USER_PH' | translate" autocomplete="off" spellcheck="false" /></div>
                    <p class="hint">{{ 'AICHATBOT.HANDOFF.F_USER_HINT' | translate }}</p>
                  </div>

                  <button type="button" class="save" [disabled]="saving()" (click)="save()">
                    {{ (saving() ? 'AICHATBOT.HANDOFF.SAVING' : 'AICHATBOT.HANDOFF.SAVE') | translate }}
                  </button>
                  @if (err()) { <p class="err">{{ err() }}</p> }
                  @if (okMsg()) { <p class="ok">{{ okMsg() }}</p> }

                  <!-- Estado de vinculación -->
                  @if (connected()) {
                    <div class="status linked"><span class="sdot"></span>{{ 'AICHATBOT.HANDOFF.STATUS_LINKED' | translate }}</div>
                  } @else if (username()) {
                    <div class="status pending">
                      <p>{{ 'AICHATBOT.HANDOFF.STATUS_PENDING' | translate }}</p>
                      <div class="status-actions">
                        <a class="ghost-btn" [href]="botLink()" target="_blank" rel="noopener">{{ 'AICHATBOT.HANDOFF.OPEN_BOT' | translate }} &#64;{{ username() }}</a>
                        <button type="button" class="ghost-btn" [disabled]="checking()" (click)="checkStatus()">{{ (checking() ? 'AICHATBOT.HANDOFF.CHECKING' : 'AICHATBOT.HANDOFF.CHECK') | translate }}</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .layout { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 40px; max-width: 860px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 22px 24px; margin-top: 22px; }
    .ch { font-size: 15px; margin-bottom: 12px; }
    .how, .guide { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
    .how li, .guide li { font-size: 14px; line-height: 1.55; color: var(--text-inv-2); }

    .ch-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
    .ch-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 13px; background: transparent; border: none; color: inherit; font: inherit; text-align: left; padding: 0; }
    .ch-info.clickable { cursor: pointer; }
    .ch-info:disabled { cursor: default; }
    .ch-txt { min-width: 0; }
    .ch-chev { margin-left: auto; color: var(--text-inv-2); transition: transform var(--dur) var(--ease); flex-shrink: 0; }
    .ch-chev.up { transform: rotate(180deg); }
    .ch-ic { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; color: #229ED9; background: rgba(34,158,217,.12); border: 1px solid rgba(34,158,217,.3); }
    .ch-info b { display: block; font-size: 15.5px; }
    .ch-sub { font-size: 12px; color: var(--text-inv-2); }
    .tgl { width: 46px; height: 26px; border-radius: 999px; border: 1px solid var(--line-light); background: rgba(255,255,255,.08); position: relative; cursor: pointer; flex-shrink: 0; transition: background var(--dur) var(--ease); }
    .tgl span { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform var(--dur) var(--ease); }
    .tgl.on { background: var(--gold-bright); border-color: var(--gold-bright); }
    .tgl.on span { transform: translateX(20px); }

    .tg-body { margin-top: 20px; border-top: 1px solid var(--line-light); padding-top: 20px; }
    .guide-title { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-inv-2); margin-bottom: 10px; }
    .field { margin-top: 16px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin-bottom: 6px; }
    input { width: 100%; padding: 11px 13px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; }
    input:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    .at { display: flex; align-items: center; gap: 0; }
    .at span { padding: 11px 12px; border: 1px solid var(--line-light); border-right: none; border-radius: var(--radius-md) 0 0 var(--radius-md); background: rgba(255,255,255,.06); color: var(--text-inv-2); }
    .at input { border-radius: 0 var(--radius-md) var(--radius-md) 0; }
    .hint { font-size: 12px; color: var(--text-inv-2); margin-top: 6px; }
    .save { margin-top: 20px; min-height: 48px; padding: 0 24px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 26px rgba(231,171,46,.3); }
    .save:disabled { opacity: .7; cursor: default; }
    .err { margin-top: 14px; font-size: 13px; color: #ff8a8a; background: rgba(214,69,69,.1); padding: 10px 12px; border-radius: 10px; }
    .ok { margin-top: 14px; font-size: 13px; color: var(--gold-soft); background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; }
    .status { margin-top: 18px; padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid var(--line-light); font-size: 13.5px; }
    .status.linked { color: #34e0a1; display: flex; align-items: center; gap: 9px; background: rgba(52,224,161,.08); border-color: rgba(52,224,161,.3); }
    .sdot { width: 9px; height: 9px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; }
    .status.pending { color: var(--text-inv-2); background: rgba(231,171,46,.06); border-color: rgba(231,171,46,.25); }
    .status-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .ghost-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border-radius: var(--radius-pill); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; font-weight: 600; font-size: 13px; cursor: pointer; }
    .ghost-btn:hover { border-color: rgba(231,171,46,.4); }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 560px) {
      .wrap { padding: 30px 16px 32px; }
      .card { padding: 18px 16px; }
      .ch-info { gap: 10px; }
      .save { width: 100%; }
      .status-actions { flex-direction: column; }
      .status-actions .ghost-btn { width: 100%; justify-content: center; }
    }
  `],
})
export class ChatbotHandoffComponent implements OnInit {
  private readonly s = inject(ChatbotSessionService);
  private readonly sb = inject(SupabaseClientService).client;
  private readonly title = inject(Title);

  readonly enabled = signal(false);
  readonly open = signal(false);   // acordeón: solo se puede abrir si está habilitado
  readonly tokenV = signal('');
  readonly userV = signal('');
  readonly username = signal('');
  readonly chatId = signal('');
  readonly saving = signal(false);
  readonly checking = signal(false);
  readonly err = signal('');
  readonly okMsg = signal('');

  readonly connected = computed(() => !!this.chatId());
  readonly botLink = computed(() => this.username() ? 'https://t.me/' + this.username() + '?startgroup=true' : '');

  ngOnInit(): void {
    this.title.setTitle('Handoff a humano · Vectis AI ChatBot');
    const c = this.s.currentConfig();
    if (c) {
      this.enabled.set(!!c.handoffEnabled);
      this.open.set(!!c.handoffEnabled);   // si ya está habilitado, arranca abierto
      this.tokenV.set(c.telegramBotToken || '');
      this.userV.set(c.telegramBotUsername || '');
      this.username.set(c.telegramBotUsername || '');
      this.chatId.set(c.telegramChatId || '');
    }
  }

  private clientId(): string { return this.s.currentClientId(); }

  async toggle(): Promise<void> {
    const next = !this.enabled();
    this.enabled.set(next);
    this.open.set(next);   // al habilitar se abre; al deshabilitar se cierra
    // Al apagar, persistimos de una vez (desactiva el botón "Hablar con una persona").
    if (!next) await this.persist(false);
  }

  // Acordeón: solo se puede plegar/desplegar cuando está habilitado.
  toggleOpen(): void { if (this.enabled()) this.open.update((v) => !v); }

  async save(): Promise<void> {
    this.err.set(''); this.okMsg.set('');
    if (!this.clientId()) { this.err.set('Primero crea y guarda tu chatbot.'); return; }
    if (!this.tokenV().trim()) { this.err.set('Pega el token de tu bot de Telegram (BotFather).'); return; }
    this.saving.set(true);
    try { await this.persist(true); }
    finally { this.saving.set(false); }
  }

  private async persist(withSetup: boolean): Promise<void> {
    const id = this.clientId();
    if (!id) return;
    const patch: Record<string, unknown> = {
      handoff_enabled: this.enabled(),
      telegram_bot_token: this.tokenV().trim() || null,
      telegram_bot_username: this.userV().trim().replace(/^@/, '') || null,
    };
    const { error } = await this.sb.from('chatbots').update(patch).eq('id', id);
    if (error) { this.err.set(error.message); return; }

    if (withSetup && this.enabled() && this.tokenV().trim()) {
      // Registra el webhook del bot y obtiene su @username automáticamente.
      const at = (await this.sb.auth.getSession()).data.session?.access_token;
      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'handoff_setup', client_id: id, access_token: at }),
        });
        const j = await res.json();
        if (j && j.ok) {
          if (j.username) { this.username.set(j.username); this.userV.set(j.username); }
          this.chatId.set('');   // el webhook se reinició; hay que volver a enviar /start
          this.okMsg.set('Bot conectado. Ahora abre tu bot y envía /start para vincular tu Telegram.');
        } else {
          this.err.set('No pude conectar el bot: ' + ((j && j.error) || 'revisa el token'));
        }
      } catch (e) { this.err.set('No pude conectar el bot. Revisa el token e intenta de nuevo.'); }
    }
    this.syncLocal();
  }

  async checkStatus(): Promise<void> {
    const id = this.clientId(); if (!id) return;
    this.checking.set(true);
    try {
      const { data } = await this.sb.from('chatbots').select('telegram_chat_id,telegram_bot_username').eq('id', id).single();
      if (data) {
        this.chatId.set((data as any).telegram_chat_id || '');
        if ((data as any).telegram_bot_username) { this.username.set((data as any).telegram_bot_username); this.userV.set((data as any).telegram_bot_username); }
      }
      this.syncLocal();
    } finally { this.checking.set(false); }
  }

  /** Refleja el estado en el config en memoria para que no se pierda al navegar. */
  private syncLocal(): void {
    const cfgs = [...this.s.configs()];
    const i = this.s.current();
    if (cfgs[i]) {
      cfgs[i] = { ...cfgs[i], handoffEnabled: this.enabled(), telegramBotToken: this.tokenV().trim(), telegramBotUsername: this.username(), telegramChatId: this.chatId() };
      this.s.configs.set(cfgs);
    }
  }
}
