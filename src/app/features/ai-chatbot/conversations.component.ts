import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { ChatbotSessionService } from './session.service';
import { SupabaseClientService } from './supabase.client';

interface Turn { id: string; user_message: string; bot_reply: string; created_at: string; channel: string; }
interface Lead { session_id: string; name: string; email: string; phone: string; note: string; }
interface Convo {
  sessionId: string; channel: string; lastAt: string; firstAt: string;
  turns: Turn[]; preview: string; lead: Lead | null;
  /** Todo el texto buscable de la conversación, ya normalizado (ver norm). */
  haystack: string;
}

/**
 * Normaliza texto para buscar: minúsculas y sin tildes ni diéresis.
 * En español la gente escribe "envio", "garantia" o "telefono" sin tilde,
 * y sin esto la búsqueda no encontraba nada aunque el texto estuviera ahí.
 * La ñ se conserva: "año" y "ano" no son lo mismo.
 */
export function norm(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, '')   // quita acentos; conserva U+0303, la tilde de la ñ
    .normalize('NFC')
    .trim();
}

/**
 * /conversations — Bandeja de conversaciones.
 * El dueño puede LEER lo que su bot conversó con cada cliente, en todos los canales,
 * con buscador, filtro por canal y los datos del lead si se capturaron.
 */
@Component({
  selector: 'app-chatbot-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <span class="eyebrow on-dark">{{ 'AICHATBOT.CONV.EYEBROW' | translate }}</span>
            <h1 class="ttl">{{ 'AICHATBOT.CONV.TITLE' | translate }}</h1>
            <p class="lead on-dark">{{ 'AICHATBOT.CONV.LEAD' | translate }}</p>

            <div class="tools">
              <div class="s-wrap">
                <input class="search" [ngModel]="search()" (ngModelChange)="search.set($event)" name="q" [attr.placeholder]="'AICHATBOT.CONV.SEARCH_PH' | translate" [attr.aria-label]="'AICHATBOT.CONV.SEARCH_PH' | translate" />
                @if (search()) {
                  <button type="button" class="s-x" (click)="search.set('')" [attr.aria-label]="'AICHATBOT.CONV.CLEAR' | translate">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                }
              </div>
              <div class="chips">
                <button type="button" class="chip" [class.on]="channel() === ''" (click)="channel.set('')">{{ 'AICHATBOT.CONV.ALL' | translate }}</button>
                @for (c of channelsPresent(); track c) {
                  <button type="button" class="chip" [class.on]="channel() === c" (click)="channel.set(c)">{{ chLabel(c) }}</button>
                }
              </div>
            </div>

            @if (loading()) {
              <p class="muted">{{ 'AICHATBOT.CONV.LOADING' | translate }}</p>
            } @else if (!convos().length) {
              <section class="card"><p class="muted">{{ 'AICHATBOT.CONV.EMPTY' | translate }}</p></section>
            } @else {
              @if (search() || channel()) {
                <p class="results" role="status" aria-live="polite">{{ resultText() }}</p>
              }
              <div class="inbox">
                <!-- Lista -->
                <ul class="list" [class.hide-mobile]="!!selected()">
                  @for (c of filtered(); track c.sessionId) {
                    <li>
                      <button type="button" class="item" [class.on]="selected()?.sessionId === c.sessionId" (click)="select(c)">
                        <div class="i-top">
                          <span class="badge" [attr.data-c]="c.channel">{{ chLabel(c.channel) }}</span>
                          @if (c.lead) { <span class="badge lead">{{ 'AICHATBOT.CONV.LEAD_BADGE' | translate }}</span> }
                          <span class="when">{{ shortDate(c.lastAt) }}</span>
                        </div>
                        <p class="i-prev">{{ c.preview }}</p>
                        <span class="i-meta">{{ msgCount(c.turns.length) }}</span>
                      </button>
                    </li>
                  }
                  @if (!filtered().length) { <li><p class="muted pad">{{ 'AICHATBOT.CONV.NO_MATCH' | translate }}</p></li> }
                </ul>

                <!-- Detalle -->
                <section class="detail" [class.hide-mobile]="!selected()">
                  @if (selected(); as c) {
                    <div class="d-head">
                      <button type="button" class="back" (click)="selected.set(null)" [attr.aria-label]="'AICHATBOT.CONV.BACK' | translate">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      <div>
                        <b>{{ chLabel(c.channel) }}</b>
                        <span class="d-sub">{{ fullDate(c.firstAt) }} · {{ msgCount(c.turns.length) }}</span>
                      </div>
                    </div>

                    @if (c.lead) {
                      <div class="leadbox">
                        <b>{{ 'AICHATBOT.CONV.LEAD_CAPTURED' | translate }}</b>
                        <p>
                          @if (c.lead.name) { {{ c.lead.name }} }
                          @if (c.lead.email) { · <a [href]="'mailto:' + c.lead.email">{{ c.lead.email }}</a> }
                          @if (c.lead.phone) { · {{ c.lead.phone }} }
                        </p>
                        @if (c.lead.note) { <p class="note">{{ c.lead.note }}</p> }
                      </div>
                    }

                    <div class="thread">
                      @for (t of c.turns; track t.id) {
                        @if (t.user_message) { <div class="msg user"><span>{{ t.user_message }}</span><i>{{ time(t.created_at) }}</i></div> }
                        @if (t.bot_reply) { <div class="msg bot"><span>{{ t.bot_reply }}</span><i>{{ time(t.created_at) }}</i></div> }
                      }
                    </div>
                  } @else {
                    <p class="muted pad">{{ 'AICHATBOT.CONV.PICK' | translate }}</p>
                  }
                </section>
              </div>
            }
          </div>
        </main>
      </div>
      <app-chatbot-version-footer></app-chatbot-version-footer>
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .layout { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 40px; max-width: 1100px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 20px 22px; margin-top: 20px; }
    .muted { color: var(--text-inv-2); font-size: 14px; line-height: 1.55; } .pad { padding: 18px; }
    .tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 22px; }
    input { padding: 11px 13px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; }
    input:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    .s-wrap { position: relative; flex: 1; min-width: 260px; display: flex; }
    .search { width: 100%; padding-right: 38px; }
    .s-x { position: absolute; top: 50%; right: 8px; transform: translateY(-50%); display: grid; place-items: center;
      width: 24px; height: 24px; border: none; border-radius: 50%; background: rgba(255,255,255,.08); color: var(--text-inv-2); cursor: pointer; }
    .s-x:hover { color: var(--text-inv); background: rgba(255,255,255,.16); }
    .results { margin-top: 14px; font-size: 13px; color: var(--text-inv-2); }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { padding: 9px 14px; border-radius: var(--radius-pill); border: 1px solid var(--line-light); background: rgba(255,255,255,.04);
      color: var(--text-inv-2); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .chip.on { border-color: var(--gold-bright); color: var(--gold-bright); }

    .inbox { display: grid; grid-template-columns: 340px 1fr; gap: 18px; margin-top: 20px; align-items: start; }
    .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; max-height: 68vh; overflow-y: auto; }
    .item { width: 100%; text-align: left; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-md);
      padding: 12px 14px; color: inherit; font: inherit; cursor: pointer; display: grid; gap: 6px; }
    .item:hover { border-color: rgba(231,171,46,.4); }
    .item.on { border-color: var(--gold-bright); background: rgba(231,171,46,.07); }
    .i-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .when { margin-left: auto; font-size: 11.5px; color: var(--text-inv-2); }
    .i-prev { font-size: 13.5px; line-height: 1.45; color: var(--text-inv); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .i-meta { font-size: 11.5px; color: var(--text-inv-2); }

    .detail { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); min-height: 300px; max-height: 68vh; overflow-y: auto; }
    .d-head { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--line-light); position: sticky; top: 0; background: var(--ink-soft); z-index: 1; }
    .d-head b { display: block; font-size: 15px; } .d-sub { font-size: 12.5px; color: var(--text-inv-2); }
    .back { display: none; background: transparent; border: 1px solid var(--line-light); border-radius: 8px; color: var(--text-inv); padding: 6px; cursor: pointer; }
    .leadbox { margin: 16px 18px 0; padding: 12px 14px; border-radius: var(--radius-md); background: rgba(231,171,46,.08); border: 1px solid rgba(231,171,46,.3); font-size: 13.5px; }
    .leadbox b { color: var(--gold-bright); } .leadbox p { margin-top: 5px; color: var(--text-inv-2); }
    .leadbox a { color: var(--gold-bright); } .leadbox .note { font-style: italic; }
    .thread { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
    .msg { max-width: 82%; padding: 10px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; position: relative; }
    .msg i { display: block; margin-top: 5px; font-style: normal; font-size: 10.5px; opacity: .65; }
    .msg.user { align-self: flex-end; background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); color: var(--ink); border-bottom-right-radius: 4px; }
    .msg.bot { align-self: flex-start; background: rgba(255,255,255,.06); border: 1px solid var(--line-light); color: var(--text-inv); border-bottom-left-radius: 4px; }

    .badge { font-size: 10.5px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); }
    .badge[data-c="whatsapp"] { color: #25D366; background: rgba(37,211,102,.12); border-color: rgba(37,211,102,.3); }
    .badge[data-c="telegram"] { color: #229ED9; background: rgba(34,158,217,.12); border-color: rgba(34,158,217,.3); }
    .badge[data-c="instagram"] { color: #E4405F; background: rgba(228,64,95,.12); border-color: rgba(228,64,95,.3); }
    .badge[data-c="messenger"] { color: #0084FF; background: rgba(0,132,255,.12); border-color: rgba(0,132,255,.3); }
    .badge.lead { color: #36c08b; background: rgba(54,192,139,.12); border-color: rgba(54,192,139,.3); }

    @media (max-width: 980px) {
      .inbox { grid-template-columns: 1fr; }
      .back { display: grid; place-items: center; }
      .hide-mobile { display: none; }
      .list, .detail { max-height: none; }
    }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 560px) { .wrap { padding: 30px 16px 32px; } .search { min-width: 0; width: 100%; } }
  `],
})
export class ChatbotConversationsComponent implements OnInit {
  private readonly s = inject(ChatbotSessionService);
  private readonly sb = inject(SupabaseClientService).client;
  private readonly title = inject(Title);
  private readonly i18n = inject(TranslateService);

  /**
   * Idioma vivo. Lo guardamos en una señal (y no leemos translate.currentLang directo)
   * para que las fechas y los textos que armamos en TypeScript se recalculen cuando
   * el usuario cambia el idioma desde su cuenta, sin recargar la página.
   */
  readonly lang = toSignal(this.i18n.onLangChange, { initialValue: null });
  private locale(): string {
    const l = (this.lang()?.lang || this.i18n.currentLang || this.i18n.defaultLang || 'es');
    return l === 'en' ? 'en-US' : 'es-CR';
  }

  readonly convos = signal<Convo[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<Convo | null>(null);
  readonly search = signal('');
  readonly channel = signal('');

  private readonly CH: Record<string, string> = {
    web: 'Web', whatsapp: 'WhatsApp', telegram: 'Telegram', instagram: 'Instagram', messenger: 'Messenger',
  };
  chLabel(c: string): string { return this.CH[c] || c || 'Web'; }

  readonly channelsPresent = computed(() => Array.from(new Set(this.convos().map((c) => c.channel))).sort());

  /**
   * Filtra por canal y por texto. La búsqueda usa el "haystack" que armamos al
   * cargar (mensajes + datos del lead + canal), ya normalizado: así "envio"
   * encuentra "envío" y "ANA" encuentra "Ana". Buscar con tildes exactas era
   * justo lo que hacía que el buscador pareciera roto.
   */
  readonly filtered = computed(() => {
    const q = norm(this.search()); const ch = this.channel();
    return this.convos().filter((c) => {
      if (ch && c.channel !== ch) return false;
      if (!q) return true;
      return c.haystack.includes(q);
    });
  });

  constructor() {
    // Si la conversación abierta deja de estar en la lista filtrada, se cierra:
    // antes quedaba en pantalla un chat que ya no aparecía en los resultados.
    effect(() => {
      const sel = this.selected();
      if (sel && !this.filtered().some((c) => c.sessionId === sel.sessionId)) this.selected.set(null);
    });
  }

  async ngOnInit(): Promise<void> {
    this.i18n.get('AICHATBOT.CONV.PAGE_TITLE').subscribe((t) => this.title.setTitle(t));
    this.i18n.onLangChange.subscribe(() => this.title.setTitle(this.i18n.instant('AICHATBOT.CONV.PAGE_TITLE')));
    await this.load();
  }

  /** "3 conversaciones encontradas" — confirma al usuario que el filtro sí corrió. */
  resultText(): string {
    this.lang();
    const n = this.filtered().length;
    return n === 1 ? this.i18n.instant('AICHATBOT.CONV.RESULT_ONE')
                   : this.i18n.instant('AICHATBOT.CONV.RESULT_MANY', { count: n });
  }

  /** "1 mensaje" / "12 mensajes" — el plural lo decide el archivo de idioma. */
  msgCount(n: number): string {
    this.lang();   // dependencia explícita: re-evalúa al cambiar de idioma
    return n === 1 ? this.i18n.instant('AICHATBOT.CONV.MSG_ONE')
                   : this.i18n.instant('AICHATBOT.CONV.MSG_MANY', { count: n });
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const id = this.s.currentClientId();
    if (!id) { this.loading.set(false); return; }
    try {
      const [{ data: rows }, { data: leads }] = await Promise.all([
        this.sb.from('chatbot_conversations')
          .select('id,session_id,user_message,bot_reply,created_at,channel')
          .eq('chatbot_id', id).order('created_at', { ascending: false }).limit(1000),
        this.sb.from('chatbot_leads').select('session_id,name,email,phone,note').eq('chatbot_id', id),
      ]);

      const leadBySession = new Map<string, Lead>();
      for (const l of ((leads as Lead[]) ?? [])) leadBySession.set(l.session_id, l);

      // Cada fila es un turno; agrupamos por sesión = una conversación.
      const bySession = new Map<string, Turn[]>();
      for (const r of ((rows as (Turn & { session_id: string })[]) ?? [])) {
        const sid = r.session_id || r.id;
        if (!bySession.has(sid)) bySession.set(sid, []);
        bySession.get(sid)!.push(r);
      }

      const out: Convo[] = [];
      bySession.forEach((turns, sessionId) => {
        turns.sort((a, b) => a.created_at.localeCompare(b.created_at));   // orden cronológico dentro del chat
        const first = turns[0], last = turns[turns.length - 1];
        const channel = first.channel || 'web';
        const lead = leadBySession.get(sessionId) || null;
        // El texto buscable se arma UNA vez al cargar, no en cada tecla.
        // Incluye los mensajes, el canal y los datos del lead: así se puede
        // buscar por el correo o el nombre de un cliente, no solo por lo dicho.
        const haystack = norm([
          ...turns.map((t) => (t.user_message || '') + ' ' + (t.bot_reply || '')),
          this.chLabel(channel),
          lead ? [lead.name, lead.email, lead.phone, lead.note].filter(Boolean).join(' ') : '',
        ].join(' '));
        out.push({
          sessionId,
          channel,
          firstAt: first.created_at,
          lastAt: last.created_at,
          turns,
          preview: (first.user_message || first.bot_reply || '').slice(0, 160),
          lead,
          haystack,
        });
      });
      out.sort((a, b) => b.lastAt.localeCompare(a.lastAt));   // conversaciones más recientes arriba
      this.convos.set(out);
    } catch { /* noop */ }
    this.loading.set(false);
  }

  select(c: Convo): void { this.selected.set(c); }

  shortDate(iso: string): string {
    try {
      const d = new Date(iso), now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      return sameDay ? d.toLocaleTimeString(this.locale(), { hour: 'numeric', minute: '2-digit' })
                     : d.toLocaleDateString(this.locale(), { day: 'numeric', month: 'short' });
    } catch { return ''; }
  }
  fullDate(iso: string): string {
    try { return new Date(iso).toLocaleString(this.locale(), { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
  }
  time(iso: string): string {
    try { return new Date(iso).toLocaleTimeString(this.locale(), { hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
  }
}
