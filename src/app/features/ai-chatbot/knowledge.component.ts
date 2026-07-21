import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { ChatbotSessionService } from './session.service';
import { SupabaseClientService } from './supabase.client';

const WORKER_URL = 'https://chatbot.vectisauto.workers.dev';

interface Chunk { id: number; source: string; content: string; }
interface Match { content: string; source: string; similarity: number; }

/**
 * /knowledge — "Qué sabe mi bot".
 * Muestra EXACTAMENTE la información indexada que el bot puede usar para responder,
 * agrupada por fuente, con buscador y una prueba de pregunta que enseña qué
 * fragmentos recuperaría el bot. Sirve para detectar huecos (p. ej. el sitio web
 * que no se capturó completo).
 */
@Component({
  selector: 'app-chatbot-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap" (click)="routeLink($event)">
            <span class="eyebrow on-dark">{{ 'AICHATBOT.KB.EYEBROW' | translate }}</span>
            <h1 class="ttl">{{ 'AICHATBOT.KB.TITLE' | translate }}</h1>
            <p class="lead on-dark" [innerHTML]="'AICHATBOT.KB.LEAD' | translate"></p>

            <!-- Estado del índice -->
            <section class="card">
              <div class="st-row">
                <div>
                  <h3 class="ch">{{ 'AICHATBOT.KB.STATE_TITLE' | translate }}</h3>
                  @if (loading()) {
                    <p class="muted">{{ 'AICHATBOT.KB.LOADING' | translate }}</p>
                  } @else if (indexing()) {
                    <p class="muted indexing"><span class="spin" aria-hidden="true"></span>{{ 'AICHATBOT.KB.INDEXING' | translate }}</p>
                  } @else if (!chunks().length) {
                    <p class="muted" [innerHTML]="'AICHATBOT.KB.EMPTY' | translate"></p>
                  } @else {
                    <p class="muted"><span [innerHTML]="'AICHATBOT.KB.COUNT' | translate:{ n: chunks().length }"></span>@if (indexedAt()) { {{ 'AICHATBOT.KB.UPDATED' | translate:{ date: indexedAt() } }} }</p>
                  }
                </div>
                <div class="acts">
                  <button type="button" class="ghost-btn" [disabled]="indexing() || studying()" (click)="studySite()">{{ (studying() ? 'AICHATBOT.KB.STUDYING_BTN' : 'AICHATBOT.KB.STUDY') | translate }}</button>
                  <button type="button" class="save" [disabled]="indexing() || studying()" (click)="reindex()">{{ (indexing() ? 'AICHATBOT.KB.REINDEXING' : 'AICHATBOT.KB.REINDEX') | translate }}</button>
                </div>
              </div>
              @if (studying()) {
                <p class="muted indexing"><span class="spin" aria-hidden="true"></span>{{ 'AICHATBOT.KB.STUDYING' | translate }}</p>
              }
              <p class="muted note" [innerHTML]="'AICHATBOT.KB.NOTE' | translate"></p>
              @if (reindexMsg()) { <p class="ok">{{ reindexMsg() }}</p> }
              @if (!indexing() && lastError()) { <p class="warn" [innerHTML]="'AICHATBOT.KB.LAST_ERROR' | translate:{ reason: lastError() }"></p> }

              <!-- Desglose por fuente -->
              @if (chunks().length) {
                <div class="srcs">
                  @for (s of sourceStats(); track s.key) {
                    <button type="button" class="src" [class.on]="filter() === s.key" (click)="filter.set(filter() === s.key ? '' : s.key)">
                      <b>{{ s.label }}</b><span>{{ s.count }}</span>
                    </button>
                  }
                </div>
                @if (missingWeb()) {
                  <p class="warn">{{ 'AICHATBOT.KB.MISSING_WEB' | translate }}</p>
                }
              }
            </section>

            <!-- Fuentes que usa el bot -->
            <section class="card">
              <h3 class="ch">{{ 'AICHATBOT.KB.SOURCES_TITLE' | translate }}</h3>
              <p class="muted" [innerHTML]="'AICHATBOT.KB.SOURCES_SUB' | translate"></p>
              <ul class="srcsw">
                @for (s of allSources; track s.key) {
                  <li>
                    <div class="sw-tl"><b>{{ s.label | translate }}</b><span>{{ 'AICHATBOT.KB.FRAGMENTS' | translate:{ n: countOf(s.key) } }}</span></div>
                    <button type="button" class="tgl" [class.on]="isOn(s.key)" [disabled]="indexing()" (click)="toggleSource(s.key)"
                            [attr.aria-pressed]="isOn(s.key)" [attr.aria-label]="'AICHATBOT.KB.USE_SOURCE' | translate:{ name: (s.label | translate) }"><span></span></button>
                  </li>
                }
              </ul>
            </section>

            <!-- Prueba de pregunta -->
            @if (chunks().length) {
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.KB.TEST_TITLE' | translate }}</h3>
                <p class="muted">{{ 'AICHATBOT.KB.TEST_SUB' | translate }}</p>
                <div class="q-row">
                  <input [ngModel]="query()" (ngModelChange)="query.set($event)" name="q" [attr.placeholder]="'AICHATBOT.KB.TEST_PH' | translate" (keyup.enter)="testQuery()" />
                  <button type="button" class="save" [disabled]="testing()" (click)="testQuery()">{{ (testing() ? 'AICHATBOT.KB.TEST_BUSY' : 'AICHATBOT.KB.TEST_BTN') | translate }}</button>
                </div>
                @if (testErr()) { <p class="warn">{{ testErr() }}</p> }
                @if (tested()) {
                  @if (!matches().length) {
                    <p class="warn" [innerHTML]="'AICHATBOT.KB.TEST_NONE' | translate"></p>
                  } @else {
                    <ol class="matches">
                      @for (m of matches(); track $index) {
                        <li>
                          <div class="m-head"><span class="badge" [attr.data-s]="m.source">{{ label(m.source) | translate }}</span><span class="sim">{{ 'AICHATBOT.KB.MATCH' | translate:{ pct: pct(m.similarity) } }}</span></div>
                          <p class="m-txt">{{ m.content }}</p>
                        </li>
                      }
                    </ol>
                  }
                }
              </section>
            }

            <!-- Fragmentos -->
            @if (chunks().length) {
              <section class="card">
                <div class="st-row">
                  <h3 class="ch">{{ 'AICHATBOT.KB.CHUNKS_TITLE' | translate }}{{ filter() ? ' · ' + (label(filter()) | translate) : '' }}</h3>
                  <input class="search" [ngModel]="search()" (ngModelChange)="search.set($event)" name="s" [attr.placeholder]="'AICHATBOT.KB.SEARCH_PH' | translate" />
                </div>
                <p class="muted note" [innerHTML]="'AICHATBOT.KB.CHUNKS_NOTE' | translate"></p>
                @if (!visible().length) {
                  <p class="muted">{{ 'AICHATBOT.KB.NO_MATCH' | translate }}</p>
                } @else {
                  <ul class="chunks">
                    @for (c of visible(); track c.id) {
                      <li>
                        <span class="badge" [attr.data-s]="c.source">{{ label(c.source) | translate }}</span>
                        <p class="c-txt">{{ c.content }}</p>
                      </li>
                    }
                  </ul>
                  @if (visible().length < filtered().length) {
                    <button type="button" class="ghost-btn more" (click)="showAll.set(true)">{{ 'AICHATBOT.KB.SHOW_ALL' | translate:{ n: filtered().length } }}</button>
                  }
                }
              </section>
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
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 40px; max-width: 900px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 20px 22px; margin-top: 20px; }
    .ch { font-size: 16px; margin-bottom: 6px; }
    .note { margin-top: 10px; font-size: 12.5px; }
    .acts { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .srcsw { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 10px; }
    .srcsw li { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px;
      background: rgba(255,255,255,.03); border: 1px solid var(--line-light); border-radius: var(--radius-md); }
    .sw-tl b { display: block; font-size: 14px; } .sw-tl span { font-size: 12.5px; color: var(--text-inv-2); }
    .tgl { width: 46px; height: 26px; border-radius: 999px; border: 1px solid var(--line-light); background: rgba(255,255,255,.08); position: relative; cursor: pointer; flex-shrink: 0; }
    .tgl span { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .2s ease; }
    .tgl.on { background: var(--gold-bright); border-color: var(--gold-bright); } .tgl.on span { transform: translateX(20px); }
    .tgl:disabled { opacity: .6; cursor: default; }
    .muted { color: var(--text-inv-2); font-size: 14px; line-height: 1.55; } .muted a, .warn a { color: var(--gold-bright); font-weight: 600; }
    .st-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .save { min-height: 44px; padding: 0 22px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink);
      background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 26px rgba(231,171,46,.28); flex-shrink: 0; }
    .save:disabled { opacity: .7; cursor: default; }
    .indexing { display: flex; align-items: center; gap: 10px; }
    .spin { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(231,171,46,.3); border-top-color: var(--gold-bright); animation: kspin .8s linear infinite; flex-shrink: 0; }
    @keyframes kspin { to { transform: rotate(360deg); } }
    .ok { margin-top: 12px; font-size: 13px; color: var(--gold-soft); background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; }
    .warn { margin-top: 12px; font-size: 13px; color: #ffd9a8; background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.3); padding: 10px 12px; border-radius: 10px; line-height: 1.5; }
    .srcs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
    .src { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: var(--radius-pill); border: 1px solid var(--line-light);
      background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; font-size: 13px; cursor: pointer; }
    .src b { font-weight: 600; } .src span { color: var(--text-inv-2); font-variant-numeric: tabular-nums; }
    .src.on { border-color: var(--gold-bright); color: var(--gold-bright); } .src.on span { color: var(--gold-bright); }
    .q-row { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    .q-row input { flex: 1; min-width: 220px; }
    input { padding: 11px 13px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; }
    input:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    .search { min-width: 220px; }
    .matches, .chunks { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 12px; }
    .matches li, .chunks li { background: rgba(255,255,255,.03); border: 1px solid var(--line-light); border-radius: var(--radius-md); padding: 14px 16px; }
    .m-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
    .sim { font-size: 12px; color: var(--gold-bright); font-variant-numeric: tabular-nums; }
    .m-txt, .c-txt { font-size: 13.5px; line-height: 1.6; color: var(--text-inv-2); white-space: pre-wrap; overflow-wrap: anywhere; margin: 8px 0 0; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); }
    .badge[data-s="web"] { color: #6aa6ff; background: rgba(106,166,255,.12); border-color: rgba(106,166,255,.3); }
    .badge[data-s="doc"] { color: #c98bff; background: rgba(201,139,255,.12); border-color: rgba(201,139,255,.3); }
    .badge[data-s="inventory"] { color: #36c08b; background: rgba(54,192,139,.12); border-color: rgba(54,192,139,.3); }
    .badge[data-s="faq"] { color: #ef8a3c; background: rgba(239,138,60,.12); border-color: rgba(239,138,60,.3); }
    .ghost-btn { padding: 10px 16px; border-radius: var(--radius-pill); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; font-weight: 600; font-size: 13px; cursor: pointer; }
    .more { margin-top: 14px; }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 560px) { .wrap { padding: 30px 16px 32px; } .card { padding: 16px; } .save, .search { width: 100%; } .st-row { flex-direction: column; } }
  `],
})
export class ChatbotKnowledgeComponent implements OnInit, OnDestroy {
  private readonly s = inject(ChatbotSessionService);
  private readonly sb = inject(SupabaseClientService).client;
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslateService);

  readonly chunks = signal<Chunk[]>([]);
  readonly loading = signal(true);
  readonly indexedAt = signal('');
  readonly filter = signal('');
  readonly search = signal('');
  readonly showAll = signal(false);
  readonly indexing = signal(false);      // el worker está reindexando (bandera real en BD)
  readonly reindexMsg = signal('');
  readonly lastError = signal('');
  readonly sourcesOff = signal<string[]>([]);
  readonly studying = signal(false);
  private indexedAtRaw = '';
  readonly allSources = [
    { key: 'info', label: 'AICHATBOT.KB.S_INFO' }, { key: 'kb', label: 'AICHATBOT.KB.S_KB' },
    { key: 'doc', label: 'AICHATBOT.KB.S_DOC' }, { key: 'web', label: 'AICHATBOT.KB.S_WEB' },
    { key: 'inventory', label: 'AICHATBOT.KB.S_INVENTORY' }, { key: 'faq', label: 'AICHATBOT.KB.S_FAQ' },
  ];
  private poll: any = null;
  private polls = 0;
  readonly query = signal('');
  readonly matches = signal<Match[]>([]);
  readonly tested = signal(false);
  readonly testing = signal(false);
  readonly testErr = signal('');

  /** Devuelve la CLAVE de idioma de la fuente; la plantilla la pasa por | translate. */
  private readonly LABELS: Record<string, string> = {
    info: 'AICHATBOT.KB.S_INFO', kb: 'AICHATBOT.KB.S_KB', doc: 'AICHATBOT.KB.S_DOC',
    web: 'AICHATBOT.KB.S_WEB', inventory: 'AICHATBOT.KB.S_INVENTORY', faq: 'AICHATBOT.KB.S_FAQ',
  };
  label(k: string): string { return this.LABELS[k] || k; }
  pct(v: number): number { return Math.max(0, Math.round((Number(v) || 0) * 100)); }

  readonly sourceStats = computed(() => {
    const counts: Record<string, number> = {};
    for (const c of this.chunks()) counts[c.source] = (counts[c.source] || 0) + 1;
    return Object.keys(counts).sort().map((k) => ({ key: k, label: this.i18n.instant(this.label(k)), count: counts[k] }));
  });
  readonly missingWeb = computed(() => this.chunks().length > 0 && !this.chunks().some((c) => c.source === 'web'));
  readonly filtered = computed(() => {
    const f = this.filter(); const q = this.search().trim().toLowerCase();
    return this.chunks().filter((c) => (!f || c.source === f) && (!q || c.content.toLowerCase().includes(q)));
  });
  readonly visible = computed(() => this.showAll() ? this.filtered() : this.filtered().slice(0, 20));

  async ngOnInit(): Promise<void> {
    this.i18n.get('AICHATBOT.KB.PAGE_TITLE').subscribe((t) => this.title.setTitle(t));
    this.i18n.onLangChange.subscribe(() => this.title.setTitle(this.i18n.instant('AICHATBOT.KB.PAGE_TITLE')));
    await this.load();
  }

  /**
   * Los enlaces internos ahora viven dentro de los textos traducidos, así que son
   * <a href> normales y no routerLink. Sin esto recargarían toda la aplicación;
   * aquí los interceptamos y los pasamos al router, que es lo que hacía routerLink.
   */
  routeLink(e: MouseEvent): void {
    const a = (e.target as HTMLElement | null)?.closest?.('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/') || a.getAttribute('target') === '_blank') return;   // externos, tal cual
    e.preventDefault();
    this.router.navigateByUrl(href);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const id = this.s.currentClientId();
    if (!id) { this.loading.set(false); return; }
    try {
      const [{ data: rows }, { data: bot }] = await Promise.all([
        this.sb.from('chatbot_kb_chunks').select('id,source,content').eq('chatbot_id', id).order('id').limit(500),
        this.sb.from('chatbots').select('kb_indexed_at,kb_indexing,kb_last_error,kb_sources_off').eq('id', id).single(),
      ]);
      this.chunks.set((rows as Chunk[]) ?? []);
      const b = (bot || {}) as Record<string, unknown>;
      const at = (b['kb_indexed_at'] as string) || '';
      this.indexedAtRaw = at;
      this.indexedAt.set(at ? new Date(at).toLocaleString(this.i18n.currentLang === 'en' ? 'en-US' : 'es-CR') : '');
      // Si el worker está indexando (aunque se haya recargado la página), lo mostramos y esperamos solos.
      this.lastError.set((b['kb_last_error'] as string) || '');
      this.sourcesOff.set(String((b['kb_sources_off'] as string) || '').split(',').map((x) => x.trim()).filter(Boolean));
      if (b['kb_indexing'] === true) { this.indexing.set(true); this.startPolling(); }
      else this.indexing.set(false);
    } catch { /* noop */ }
    this.loading.set(false);
  }

  isOn(key: string): boolean { return this.sourcesOff().indexOf(key) === -1; }
  countOf(key: string): number { return this.chunks().filter((c) => c.source === key).length; }

  /** Enciende/apaga una fuente y reindexa: apagada, el bot deja de tener esa información. */
  async toggleSource(key: string): Promise<void> {
    const id = this.s.currentClientId();
    if (!id || this.indexing()) return;
    const off = this.isOn(key) ? [...this.sourcesOff(), key] : this.sourcesOff().filter((k) => k !== key);
    this.sourcesOff.set(off);
    try {
      await this.sb.from('chatbots').update({ kb_sources_off: off.join(',') || null }).eq('id', id);
      await this.reindex();   // aplica el cambio de inmediato
    } catch { /* noop */ }
  }

  /** Vuelve a LEER el sitio web (no solo reprocesar). Al terminar, el worker reindexa solo. */
  async studySite(): Promise<void> {
    const id = this.s.currentClientId();
    if (!id || this.studying() || this.indexing()) return;
    this.studying.set(true); this.reindexMsg.set('');
    const before = this.indexedAtRaw;
    try {
      const { data } = await this.sb.auth.getSession();
      await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'study', client_id: id, access_token: data.session?.access_token || '' }),
      });
      // El estudio corre en segundo plano y al terminar reindexa: esperamos a que cambie la marca.
      let tries = 0;
      const t = setInterval(async () => {
        tries++;
        try {
          const { data: row } = await this.sb.from('chatbots').select('kb_indexed_at').eq('id', id).single();
          const now = row ? ((row as Record<string, string>)['kb_indexed_at'] || '') : '';
          if (now && now !== before) {
            clearInterval(t); this.studying.set(false);
            await this.load();
            const w = this.countOf('web');
            this.reindexMsg.set(this.i18n.instant('AICHATBOT.KB.M_STUDIED', { n: w }));
            setTimeout(() => this.reindexMsg.set(''), 8000);
          }
        } catch { /* reintenta */ }
        if (tries > 40) {   // ~2 min
          clearInterval(t);
          await this.clearStuckFlag();
          this.studying.set(false);
          await this.load();
          this.reindexMsg.set(this.i18n.instant('AICHATBOT.KB.M_STUDY_TIMEOUT'));
        }
      }, 3000);
    } catch {
      this.studying.set(false);
      this.reindexMsg.set(this.i18n.instant('AICHATBOT.KB.M_STUDY_FAIL'));
    }
  }

  async reindex(): Promise<void> {
    const id = this.s.currentClientId();
    if (!id || this.indexing()) return;
    this.reindexMsg.set('');
    this.indexing.set(true);            // feedback inmediato
    try {
      const { data } = await this.sb.auth.getSession();
      await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kb_reindex', client_id: id, access_token: data.session?.access_token || '' }),
      });
      this.startPolling();              // la UI se actualiza sola al terminar
    } catch {
      this.indexing.set(false);
      this.reindexMsg.set('No pude iniciar el reindexado. Intenta de nuevo.');
    }
  }

  /** Consulta el estado cada 2 s hasta que el worker termina (máx. ~2 min) y recarga los fragmentos. */
  private startPolling(): void {
    this.stopPolling();
    this.polls = 0;
    // Damos un margen para que el worker marque kb_indexing y luego consultamos seguido.
    this.poll = setInterval(async () => {
      this.polls++;
      const id = this.s.currentClientId();
      if (!id) { this.stopPolling(); return; }
      try {
        const { data } = await this.sb.from('chatbots').select('kb_indexing,kb_chunks_count').eq('id', id).single();
        const busy = data ? (data as Record<string, unknown>)['kb_indexing'] === true : false;
        if (!busy) {
          this.stopPolling();
          this.indexing.set(false);     // explícito: no dependemos de que load() lo apague
          await this.load();            // trae los fragmentos ya indexados
          const n = this.chunks().length;
          this.reindexMsg.set(n ? this.i18n.instant('AICHATBOT.KB.M_DONE', { n }) : '');
          setTimeout(() => this.reindexMsg.set(''), 6000);
        }
      } catch { /* reintenta en el siguiente ciclo */ }
      if (this.polls > 40) {            // ~80 s: si no terminó, el proceso murió del lado del worker
        this.stopPolling();
        await this.clearStuckFlag();     // destraba el estado para poder reintentar
        this.indexing.set(false);
        await this.load();
        this.reindexMsg.set(this.i18n.instant('AICHATBOT.KB.M_TIMEOUT'));
      }
    }, 2000);
  }

  /** Si el worker murió a mitad, la bandera kb_indexing queda pegada: la limpiamos para poder reintentar. */
  private async clearStuckFlag(): Promise<void> {
    const id = this.s.currentClientId();
    if (!id) return;
    try { await this.sb.from('chatbots').update({ kb_indexing: false }).eq('id', id); } catch { /* noop */ }
  }

  private stopPolling(): void { if (this.poll) { clearInterval(this.poll); this.poll = null; } }

  ngOnDestroy(): void { this.stopPolling(); }

  async testQuery(): Promise<void> {
    const id = this.s.currentClientId();
    const q = this.query().trim();
    if (!id || !q) return;
    this.testing.set(true); this.testErr.set(''); this.tested.set(false);
    try {
      const { data } = await this.sb.auth.getSession();
      const res = await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kb_search', client_id: id, query: q, access_token: data.session?.access_token || '' }),
      });
      const j = await res.json();
      if (j && j.error === 'embed_failed') this.testErr.set(this.i18n.instant('AICHATBOT.KB.E_EMBED'));
      this.matches.set(Array.isArray(j?.matches) ? j.matches : []);
      this.tested.set(true);
    } catch { this.testErr.set(this.i18n.instant('AICHATBOT.KB.E_TEST')); }
    this.testing.set(false);
  }
}
