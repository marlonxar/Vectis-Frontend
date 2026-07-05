import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ContactComponent } from '../contact/contact.component';
import { ChatbotSessionService, SupportTicket } from './session.service';
import { SupabaseClientService } from './supabase.client';
import { FocusTrapDirective } from './focus-trap.directive';

/**
 * /ai-chatbot/support — Soporte Técnico: leyenda, tickets de soporte (crear + seguimiento)
 * y contacto de Vectis (desplegable).
 */
@Component({
  selector: 'app-chatbot-support',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, ContactComponent, FocusTrapDirective],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <span class="eyebrow on-dark">{{ 'AICHATBOT.SUPPORT.EYEBROW' | translate }}</span>
            <h1 class="ttl">{{ 'AICHATBOT.SUPPORT.TITLE' | translate }}</h1>
            <p class="lead on-dark">{{ 'AICHATBOT.SUPPORT.LEGEND' | translate }}</p>
            <ul class="bullets">
              <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.SUPPORT.B1' | translate }}</li>
              <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.SUPPORT.B2' | translate }}</li>
              <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.SUPPORT.B3' | translate }}</li>
            </ul>

            <!-- TICKETS -->
            <section class="card">
              <div class="card-head">
                <h3>{{ 'AICHATBOT.SUPPORT.TICKETS_TITLE' | translate }}</h3>
                <button type="button" class="btn-gold sm" (click)="ticketFormOpen.set(!ticketFormOpen())">
                  {{ 'AICHATBOT.SUPPORT.CREATE_TICKET' | translate }}
                </button>
              </div>

              @if (ticketFormOpen()) {
                <form class="ticket-form" (ngSubmit)="createTicket()">
                  <div class="field"><label for="t-bot">{{ 'AICHATBOT.SUPPORT.TICKET_CHATBOT' | translate }}</label>
                    <select id="t-bot" name="bot" [(ngModel)]="chatbotId">
                      @for (c of s.companies(); track $index) {
                        <option [value]="s.clientIds()[$index]">{{ c }}</option>
                      }
                    </select>
                  </div>
                  <div class="two">
                    <div class="field"><label for="t-sub">{{ 'AICHATBOT.SUPPORT.TICKET_SUBJECT' | translate }}</label>
                      <input id="t-sub" name="sub" [(ngModel)]="subject" [attr.placeholder]="'AICHATBOT.SUPPORT.TICKET_SUBJECT_PH' | translate" /></div>
                    <div class="field"><label for="t-cat">{{ 'AICHATBOT.SUPPORT.TICKET_CATEGORY' | translate }}</label>
                      <select id="t-cat" name="cat" [(ngModel)]="category">
                        <option value="db">{{ 'AICHATBOT.SUPPORT.CAT_DB' | translate }}</option>
                        <option value="calendar">{{ 'AICHATBOT.SUPPORT.CAT_CAL' | translate }}</option>
                        <option value="docs">{{ 'AICHATBOT.SUPPORT.CAT_DOC' | translate }}</option>
                        <option value="other">{{ 'AICHATBOT.SUPPORT.CAT_OTHER' | translate }}</option>
                      </select></div>
                  </div>
                  <div class="field"><label for="t-desc">{{ 'AICHATBOT.SUPPORT.TICKET_DESC' | translate }}</label>
                    <textarea id="t-desc" rows="3" name="desc" [(ngModel)]="description" [attr.placeholder]="'AICHATBOT.SUPPORT.TICKET_DESC_PH' | translate"></textarea></div>
                  @if (err()) { <p class="err">{{ 'AICHATBOT.SUPPORT.TICKET_REQUIRED' | translate }}</p> }
                  <div class="form-actions">
                    <button type="button" class="btn-ghost sm" (click)="ticketFormOpen.set(false)">{{ 'AICHATBOT.SUPPORT.TICKET_CANCEL' | translate }}</button>
                    <button type="submit" class="btn-gold sm" [disabled]="saving()">{{ (saving() ? 'AICHATBOT.SUPPORT.SENDING' : 'AICHATBOT.SUPPORT.TICKET_SUBMIT') | translate }}</button>
                  </div>
                </form>
              }

              @if (loading()) {
                <p class="empty">{{ 'AICHATBOT.SUPPORT.LOADING' | translate }}</p>
              } @else if (tickets().length) {
                <p class="hint">{{ 'AICHATBOT.SUPPORT.OPEN_HINT' | translate }}</p>
                <div class="tbl">
                  <table>
                    <thead><tr><th>{{ 'AICHATBOT.SUPPORT.COL_ID' | translate }}</th><th>{{ 'AICHATBOT.SUPPORT.COL_CHATBOT' | translate }}</th><th>{{ 'AICHATBOT.SUPPORT.COL_SUBJECT' | translate }}</th><th>{{ 'AICHATBOT.SUPPORT.COL_STATUS' | translate }}</th><th>{{ 'AICHATBOT.SUPPORT.COL_DATE' | translate }}</th><th></th></tr></thead>
                    <tbody>
                      @for (t of tickets(); track t.id) {
                        <tr class="row-click" (click)="selected.set(t)" tabindex="0" (keydown.enter)="selected.set(t)">
                          <td class="mono">{{ ticketCode(t) }}</td><td>{{ t.chatbotName }}</td><td>{{ t.subject }}</td>
                          <td><span class="tag" [class.prog]="t.status==='in_progress'" [class.closed]="t.status==='closed'">{{ ('AICHATBOT.SUPPORT.STATUS_' + t.status) | translate }}</span></td>
                          <td>{{ t.date }}</td>
                          <td class="view">{{ 'AICHATBOT.SUPPORT.VIEW' | translate }} ›</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="empty">{{ 'AICHATBOT.SUPPORT.NO_TICKETS' | translate }}</p>
              }
            </section>

            <!-- CONTACTO VECTIS (desplegable) -->
            <section class="card">
              <button type="button" class="contact-toggle" (click)="contactOpen.set(!contactOpen())" [attr.aria-expanded]="contactOpen()">
                {{ 'AICHATBOT.SUPPORT.CONTACT_TOGGLE' | translate }}
                <svg [class.up]="contactOpen()" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </section>

            <p class="legal-links">
              {{ 'AICHATBOT.SUPPORT.LEGAL_INTRO' | translate }}
              <a routerLink="/privacy">{{ 'AICHATBOT.SUPPORT.PRIVACY_LINK' | translate }}</a>
              <span aria-hidden="true"> · </span>
              <a routerLink="/terms">{{ 'AICHATBOT.SUPPORT.TERMS_LINK' | translate }}</a>
              <span aria-hidden="true"> · </span>
              <a routerLink="/refounds">{{ 'AICHATBOT.SUPPORT.REFUNDS_LINK' | translate }}</a>
            </p>
          </div>

          @if (contactOpen()) { <app-contact></app-contact> }
        </main>
      </div>

      <!-- Detalle de ticket -->
      @if (selected(); as t) {
        <div class="modal-bg" (click)="selected.set(null)">
          <div class="modal" role="dialog" aria-modal="true" appFocusTrap (dismiss)="selected.set(null)" (click)="$event.stopPropagation()">
            <button type="button" class="x" (click)="selected.set(null)" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <span class="m-eyebrow">{{ 'AICHATBOT.SUPPORT.TICKET_DETAIL' | translate }}</span>
            <h3 class="m-title">{{ t.subject }}</h3>
            <div class="m-meta">
              <span class="mono">{{ ticketCode(t) }}</span>
              <span class="tag" [class.prog]="t.status==='in_progress'" [class.closed]="t.status==='closed'">{{ ('AICHATBOT.SUPPORT.STATUS_' + t.status) | translate }}</span>
              <span class="m-cat">{{ catLabel(t.category) | translate }}</span>
              @if (t.chatbotName) { <span class="m-cat">{{ t.chatbotName }}</span> }
              <span class="m-date">{{ t.date }}</span>
            </div>

            <div class="m-block">
              <h4>{{ 'AICHATBOT.SUPPORT.TICKET_DESC' | translate }}</h4>
              <p>{{ t.description || ('AICHATBOT.SUPPORT.NO_DESC' | translate) }}</p>
            </div>

            <div class="m-block resp">
              <h4>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {{ 'AICHATBOT.SUPPORT.TICKET_RESPONSE' | translate }}
              </h4>
              @if (t.response) {
                <div class="resp-from">{{ 'AICHATBOT.SUPPORT.RESP_FROM' | translate }}@if (t.respondedAt) { <span> · {{ t.respondedAt.slice(0, 10) }}</span> }</div>
                <p>{{ t.response }}</p>
              } @else {
                <p class="muted">{{ 'AICHATBOT.SUPPORT.NO_RESPONSE' | translate }}</p>
              }
            </div>

            <div class="m-actions">
              <button type="button" class="btn-ghost sm" (click)="selected.set(null)">{{ 'AICHATBOT.SUPPORT.TICKET_CLOSE' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .layout { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 8px; max-width: 1000px; }
    .ttl { font-size: clamp(30px, 4.4vw, 50px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .bullets { list-style: none; padding: 0; margin: 22px 0 6px; display: grid; gap: 10px; }
    .bullets li { display: flex; align-items: center; gap: 11px; color: var(--text-inv-2); font-size: 15px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 10px var(--gold-bright); flex-shrink: 0; }

    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 22px; margin-top: 22px; }
    .card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .card-head h3 { font-size: 16px; }
    .btn-gold { border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink);
      background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 6px 18px rgba(231,171,46,.3); }
    .btn-ghost { background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv); border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 600; }
    .sm { padding: 9px 16px; font-size: 13.5px; }

    .ticket-form { margin: 18px 0; display: grid; gap: 12px; border-top: 1px solid var(--line-light); padding-top: 18px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin-bottom: 6px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    input, textarea, select { width: 100%; padding: 11px 13px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; }
    input:focus, textarea:focus, select:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    select option { color: #111; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .err { color: #ff8a8a; font-size: 13px; margin: 0; }

    .tbl { overflow-x: auto; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line-light); }
    th { color: var(--text-inv-2); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
    .mono { font-family: var(--font-mono); font-size: 12.5px; }
    .tag { font-size: 10.5px; padding: 3px 9px; border-radius: 999px; background: rgba(231,171,46,.16); color: var(--gold-bright); white-space: nowrap; }
    .tag.prog { background: rgba(110,168,254,.16); color: #9ec1ff; }
    .tag.closed { background: rgba(255,255,255,.1); color: var(--text-inv-2); }
    .empty { color: var(--text-inv-2); font-size: 14px; margin: 16px 0 0; }
    .hint { color: var(--text-inv-2); font-size: 12.5px; margin: 14px 0 0; }
    .row-click { cursor: pointer; transition: background var(--dur) var(--ease); }
    .row-click:hover, .row-click:focus-visible { background: rgba(255,255,255,.04); outline: none; }
    .view { color: var(--gold-bright); font-weight: 600; font-size: 12.5px; text-align: right; white-space: nowrap; }

    /* Modal detalle de ticket */
    .modal-bg { position: absolute; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(3px); display: grid; place-items: center; padding: 20px; z-index: 60; }
    .modal { position: relative; width: 100%; max-width: 540px; max-height: 86vh; overflow-y: auto; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 28px; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
    .x { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv-2); width: 34px; height: 34px; border-radius: 9px; cursor: pointer; display: grid; place-items: center; }
    .x:hover { background: rgba(255,255,255,.1); color: var(--text-inv); }
    .m-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--gold-bright); font-weight: 700; }
    .m-title { font-size: 21px; margin: 8px 50px 0 0; }
    .m-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 14px; font-size: 12.5px; color: var(--text-inv-2); }
    .m-block { margin-top: 22px; }
    .m-block h4 { font-size: 12.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-inv-2); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; }
    .m-block p { font-size: 14.5px; line-height: 1.6; color: var(--text-inv); }
    .m-block.resp { border-top: 1px solid var(--line-light); padding-top: 20px; }
    .m-block.resp h4 svg { color: var(--gold-bright); }
    .resp-from { font-size: 12.5px; font-weight: 700; color: var(--gold-bright); margin-bottom: 6px; }
    .muted { color: var(--text-inv-2); }
    .m-actions { display: flex; justify-content: flex-end; margin-top: 24px; }

    .contact-toggle { display: flex; align-items: center; gap: 8px; width: 100%; justify-content: space-between; background: transparent; border: none; color: var(--text-inv); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
    .contact-toggle svg { color: var(--gold-bright); transition: transform .2s var(--ease); }
    .contact-toggle svg.up { transform: rotate(180deg); }

    .legal-links { margin: 22px 0 4px; font-size: 13px; color: var(--text-inv-2); }
    .legal-links a { color: var(--gold-bright); font-weight: 600; }
    .legal-links a:hover { text-decoration: underline; }

    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 600px) { .two { grid-template-columns: 1fr; } }
    @media (max-width: 560px) {
      .wrap { padding: 30px 16px 8px; }
      .card { padding: 18px 16px; }
      .card-head { flex-wrap: wrap; }
      .form-actions { flex-direction: column; }
      .form-actions > * { width: 100%; }
      .modal { padding: 22px 18px; }
      .m-title { margin-right: 40px; font-size: 19px; }
    }
  `],
})
export class ChatbotSupportComponent implements OnInit {
  private title = inject(Title);
  private sb = inject(SupabaseClientService).client;
  readonly s = inject(ChatbotSessionService);

  ticketFormOpen = signal(false);
  contactOpen = signal(false);
  err = signal(false);
  saving = signal(false);
  loading = signal(true);
  tickets = signal<SupportTicket[]>([]);
  selected = signal<SupportTicket | null>(null);

  private readonly catKeys: Record<string, string> = {
    db: 'AICHATBOT.SUPPORT.CAT_DB',
    calendar: 'AICHATBOT.SUPPORT.CAT_CAL',
    docs: 'AICHATBOT.SUPPORT.CAT_DOC',
    other: 'AICHATBOT.SUPPORT.CAT_OTHER',
  };
  catLabel(c: string): string { return this.catKeys[c] ?? 'AICHATBOT.SUPPORT.CAT_OTHER'; }
  ticketCode(t: SupportTicket): string { return 'TK-' + t.id.slice(0, 8).toUpperCase(); }

  chatbotId = '';
  subject = '';
  category = 'db';
  description = '';

  ngOnInit(): void {
    this.title.setTitle('Soporte Técnico — Vectis AI ChatBot');
    this.chatbotId = this.s.currentClientId();
    void this.loadTickets();
  }

  async loadTickets(): Promise<void> {
    this.loading.set(true);
    try {
      const { data } = await this.sb
        .from('support_tickets')
        .select('id, chatbot_id, subject, category, description, status, response, responded_at, created_at, chatbots(company)')
        .order('created_at', { ascending: false });
      this.tickets.set((data ?? []).map((r: Record<string, any>) => ({
        id: r['id'],
        chatbotId: r['chatbot_id'],
        chatbotName: r['chatbots']?.['company'] ?? '',
        subject: r['subject'],
        category: r['category'],
        description: r['description'] ?? '',
        status: r['status'],
        response: r['response'] ?? null,
        respondedAt: r['responded_at'] ?? null,
        date: String(r['created_at'] ?? '').slice(0, 10),
      })));
    } catch { /* noop */ }
    this.loading.set(false);
  }

  async createTicket(): Promise<void> {
    if (!this.subject.trim() || !this.chatbotId) { this.err.set(true); return; }
    this.err.set(false);
    this.saving.set(true);
    const { error } = await this.sb.from('support_tickets').insert({
      chatbot_id: this.chatbotId,
      subject: this.subject.trim(),
      category: this.category,
      description: this.description.trim(),
    });
    this.saving.set(false);
    if (error) { this.err.set(true); return; }
    this.subject = ''; this.description = ''; this.category = 'db';
    this.ticketFormOpen.set(false);
    await this.loadTickets();
  }
}
