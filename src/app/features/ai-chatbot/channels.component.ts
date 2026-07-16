import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService, webConfigToDb, ChatbotConfig } from './session.service';
import { SupabaseClientService } from './supabase.client';

/**
 * /channels/:channel — Canales donde puede operar el chatbot.
 * WEB: instrucciones de embed + apariencia + dominios + vista previa (guardado propio, no pisa el configure).
 * Otros (WhatsApp/Instagram/Messenger/Telegram): instrucciones / en preparación.
 * Visible SOLO para el admin (vectisauto@gmail.com) — el gating vive en el sidebar.
 */
@Component({
  selector: 'app-chatbot-channels',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatbotAppHeaderComponent, ChatbotSidebarComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <span class="eyebrow on-dark">Canal</span>
            <h1 class="ttl">{{ meta().title }}</h1>
            <p class="lead on-dark">{{ meta().lead }}</p>

            <div class="callout">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <div>
                <b>Antes de empezar:</b> el chatbot toma su información (negocio, documentos, inventario, sitio web, FAQs) desde
                <a routerLink="/configure">Configurar</a>. Configúralo primero — este canal usa esa misma información.
              </div>
            </div>

            @if (channel() === 'web') {
              <!-- Instalación -->
              <section class="card">
                <h3 class="ch">Instálalo en tu sitio web</h3>
                <p class="muted">Copia esta línea y pégala antes de <code>&lt;/body&gt;</code> en tu página.</p>
                <div class="code">
                  <pre>{{ embed() }}</pre>
                  <button type="button" class="copy" (click)="copy(embed())">{{ copied() ? '¡Copiado!' : 'Copiar' }}</button>
                </div>
                <p class="hint">Agrega tu dominio en <b>Dominios autorizados</b> (abajo); si no, el widget no carga por seguridad.</p>
              </section>

              <div class="cfg-grid">
                <div class="col-form">
                  <!-- Apariencia -->
                  <section class="card">
                    <h3 class="ch">Apariencia</h3>
                    <div class="two">
                      <div class="field">
                        <label for="w-title">Título del widget</label>
                        <input id="w-title" [ngModel]="widgetTitle()" (ngModelChange)="widgetTitle.set($event)" name="wtitle" placeholder="Asistente Virtual" />
                      </div>
                      <div class="field">
                        <label for="w-logo">Logo (URL)</label>
                        <input id="w-logo" [ngModel]="brandLogoUrl()" (ngModelChange)="brandLogoUrl.set($event)" name="logo" placeholder="https://tutienda.com/logo.png" />
                      </div>
                    </div>
                    <div class="two">
                      <div class="field">
                        <label>Color principal</label>
                        <div class="color">
                          <input [ngModel]="brandColor()" (ngModelChange)="brandColor.set($event)" name="color" placeholder="#E7AB2E" />
                          <input type="color" [ngModel]="brandColor() || '#E7AB2E'" (ngModelChange)="brandColor.set($event)" name="colorpick" aria-label="Color" />
                        </div>
                      </div>
                      <div class="field">
                        <label>Color secundario</label>
                        <div class="color">
                          <input [ngModel]="secondBrandColor()" (ngModelChange)="secondBrandColor.set($event)" name="color2" placeholder="#0A0A0A" />
                          <input type="color" [ngModel]="secondBrandColor() || '#0A0A0A'" (ngModelChange)="secondBrandColor.set($event)" name="colorpick2" aria-label="Color 2" />
                        </div>
                      </div>
                    </div>
                    <div class="field">
                      <label>Posición de la burbuja</label>
                      <div class="pos-seg" role="group" aria-label="Posición">
                        <button type="button" [class.on]="widgetPosition() === 'left'" (click)="widgetPosition.set('left')">Izquierda</button>
                        <button type="button" [class.on]="widgetPosition() === 'right'" (click)="widgetPosition.set('right')">Derecha</button>
                      </div>
                    </div>
                    <div class="field">
                      <label for="w-welcome">Mensaje de bienvenida</label>
                      <input id="w-welcome" [ngModel]="welcome()" (ngModelChange)="welcome.set($event)" name="welcome" placeholder="¡Hola! ¿En qué puedo ayudarte hoy?" />
                    </div>
                    <div class="field">
                      <label>Botones de respuesta rápida</label>
                      @for (q of quickReplies(); track $index) {
                        <div class="qr">
                          <input [ngModel]="q" (ngModelChange)="setQuick($index, $event)" [ngModelOptions]="{ standalone: true }" placeholder="Ej. Ver precios" />
                          <button type="button" class="x" (click)="removeQuick($index)" aria-label="Quitar"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                        </div>
                      }
                      @if (quickReplies().length < quickLimit()) {
                        <button type="button" class="ghost-btn" (click)="addQuick()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Agregar botón</button>
                      } @else if (s.plan() === 'basic') {
                        <p class="hint">El plan Basic permite hasta 3 botones. Sube de plan para más.</p>
                      }
                    </div>
                  </section>

                  <!-- Dominios autorizados -->
                  <section class="card">
                    <h3 class="ch">Dominios autorizados</h3>
                    <p class="muted">Solo estos dominios podrán cargar tu widget (seguridad). Deja vacío para permitir cualquiera (no recomendado).</p>
                    @for (o of origins(); track $index) {
                      <div class="qr">
                        <input [ngModel]="o" (ngModelChange)="setOrigin($index, $event)" [ngModelOptions]="{ standalone: true }" placeholder="https://tutienda.com" />
                        @if (origins().length > 1) {
                          <button type="button" class="x" (click)="removeOrigin($index)" aria-label="Quitar dominio"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                        }
                      </div>
                    }
                    @if (origins().length < originLimit()) {
                      <button type="button" class="ghost-btn" (click)="addOrigin()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Agregar dominio</button>
                    }
                    <p class="hint">{{ s.plan() === 'business' ? 'Tu plan permite hasta 3 dominios.' : 'Tu plan permite 1 dominio.' }}</p>
                  </section>

                  <div class="save-row">
                    <button type="button" class="save" [disabled]="saving()" (click)="save()">{{ saving() ? 'Guardando…' : 'Guardar apariencia y dominios' }}</button>
                    @if (savedMsg()) { <span class="ok-msg">{{ savedMsg() }}</span> }
                    @if (err()) { <span class="err-msg">{{ err() }}</span> }
                  </div>
                </div>

                <!-- Vista previa en vivo -->
                <div class="col-preview">
                  <div class="preview-sticky">
                    <p class="pv-label">Vista previa</p>
                    <div class="pv-win" [class.left]="widgetPosition() === 'left'">
                      <div class="pv-head" [style.background]="previewBar()">
                        @if (brandLogoUrl().trim()) { <img class="pv-ava" [src]="brandLogoUrl().trim()" alt="" /> }
                        @else { <span class="pv-ava" [style.color]="previewColor()">{{ previewInitial() }}</span> }
                        <div class="pv-meta"><b>{{ previewTitle() }}</b><span>En línea</span></div>
                      </div>
                      <div class="pv-body">
                        <div class="pv-bot">{{ previewWelcome() }}</div>
                        <div class="pv-chips">
                          @for (q of previewQuick(); track $index) { <span [style.border-color]="previewColor()" [style.color]="previewColor()">{{ q }}</span> }
                        </div>
                      </div>
                      <div class="pv-launch" [style.background]="previewBar()">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <section class="card soon-card">
                <span class="soon">En preparación</span>
                <h3 class="ch">{{ meta().title }} para tu chatbot</h3>
                <p class="muted">{{ meta().soon }}</p>
                <ul class="bullets">
                  @for (b of meta().points; track b) { <li><span class="dot"></span>{{ b }}</li> }
                </ul>
                <p class="hint">Recuerda: la información que responderá el bot en {{ meta().title }} es la misma que configuras en <a routerLink="/configure">Configurar</a>.</p>
              </section>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .layout { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 60px; max-width: 1120px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .callout { display: flex; align-items: flex-start; gap: 12px; margin: 22px 0 0; padding: 14px 16px; border-radius: var(--radius-md);
      background: rgba(231,171,46,.08); border: 1px solid rgba(231,171,46,.3); font-size: 14px; color: var(--text-inv-2); }
    .callout > svg { color: var(--gold-bright); flex-shrink: 0; margin-top: 1px; } .callout a { color: var(--gold-bright); font-weight: 600; }
    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 22px 24px; margin-top: 22px; position: relative; }
    .ch { font-size: 16px; margin-bottom: 8px; }
    .muted { color: var(--text-inv-2); font-size: 14px; margin-bottom: 6px; }
    .code { position: relative; margin: 14px 0; }
    .code pre { background: rgba(0,0,0,.35); border: 1px solid var(--line-light); border-radius: var(--radius-md); padding: 14px 16px; padding-right: 92px;
      font-family: var(--font-mono, ui-monospace), monospace; font-size: 12.5px; color: var(--gold-soft); overflow-x: auto; white-space: pre-wrap; word-break: break-all; margin: 0; }
    .copy { position: absolute; top: 10px; right: 10px; border: 1px solid var(--line-light); background: rgba(255,255,255,.06); color: var(--text-inv);
      border-radius: 8px; padding: 6px 12px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
    .copy:hover { border-color: var(--gold-bright); color: var(--gold-bright); }
    code { background: rgba(255,255,255,.08); border-radius: 5px; padding: 1px 6px; font-family: var(--font-mono, ui-monospace), monospace; font-size: 12.5px; }
    .hint { font-size: 12.5px; color: var(--text-inv-2); margin-top: 10px; } .hint a { color: var(--gold-bright); font-weight: 600; }

    .cfg-grid { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 24px; align-items: start; }
    .col-form { min-width: 0; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .field { margin-top: 14px; } .field:first-child { margin-top: 0; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin-bottom: 7px; }
    input, textarea { width: 100%; padding: 11px 13px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; }
    input:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    .color { display: flex; gap: 8px; } .color input[type=color] { width: 46px; padding: 2px; flex-shrink: 0; cursor: pointer; }
    .pos-seg { display: inline-flex; border: 1px solid var(--line-light); border-radius: var(--radius-pill); overflow: hidden; }
    .pos-seg button { background: transparent; border: none; color: var(--text-inv-2); font: inherit; font-size: 13px; font-weight: 600; padding: 9px 18px; cursor: pointer; }
    .pos-seg button.on { background: var(--gold-bright); color: var(--ink); }
    .qr { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 8px; }
    .qr .x { width: 40px; border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv-2); border-radius: var(--radius-md); cursor: pointer; display: grid; place-items: center; }
    .qr .x:hover { color: #ff8a8a; border-color: rgba(214,69,69,.4); }
    .ghost-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border-radius: var(--radius-pill); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; font-weight: 600; font-size: 13px; cursor: pointer; }
    .ghost-btn:hover { border-color: rgba(231,171,46,.4); }
    .save-row { display: flex; align-items: center; gap: 14px; margin-top: 22px; flex-wrap: wrap; }
    .save { min-height: 48px; padding: 0 26px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink);
      background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 26px rgba(231,171,46,.3); }
    .save:disabled { opacity: .7; cursor: default; }
    .ok-msg { color: var(--gold-soft); font-size: 14px; font-weight: 600; } .err-msg { color: #ff8a8a; font-size: 14px; }

    .preview-sticky { position: sticky; top: 16px; }
    .pv-label { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-inv-2); margin-bottom: 10px; }
    .pv-win { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.4); position: relative; }
    .pv-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; color: #fff; }
    .pv-ava { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.92); display: grid; place-items: center; font-weight: 800; font-size: 14px; object-fit: cover; flex-shrink: 0; }
    .pv-meta { display: flex; flex-direction: column; line-height: 1.15; } .pv-meta b { font-size: 14px; } .pv-meta span { font-size: 11px; opacity: .92; }
    .pv-body { padding: 16px; background: #f6f6f8; min-height: 130px; }
    .pv-bot { background: #fff; color: #1a1a1a; border: 1px solid #ececf0; border-radius: 14px; border-bottom-left-radius: 4px; padding: 10px 13px; font-size: 13.5px; max-width: 85%; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .pv-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
    .pv-chips span { font-size: 12px; font-weight: 600; padding: 6px 11px; border-radius: 999px; border: 1px solid; background: #fff; }
    .pv-launch { position: absolute; bottom: 12px; right: 12px; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 8px 20px rgba(0,0,0,.25); }
    .pv-win.left .pv-launch { right: auto; left: 12px; }

    .soon { position: absolute; top: 16px; right: 16px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); border-radius: 999px; padding: 4px 10px; }
    .soon-card { padding-top: 26px; }
    .bullets { list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 10px; }
    .bullets li { display: flex; align-items: flex-start; gap: 11px; color: var(--text-inv-2); font-size: 14px; line-height: 1.5; }
    .dot { width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 10px var(--gold-bright); flex-shrink: 0; }

    @media (max-width: 980px) { .cfg-grid { grid-template-columns: 1fr; } .col-preview { order: -1; } .preview-sticky { position: static; } .pv-win { max-width: 360px; } }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 560px) { .wrap { padding: 30px 16px 40px; } .card { padding: 18px 16px; } .two { grid-template-columns: 1fr; } .save { width: 100%; } }
  `],
})
export class ChatbotChannelsComponent {
  private readonly route = inject(ActivatedRoute);
  readonly s = inject(ChatbotSessionService);
  private readonly sb = inject(SupabaseClientService).client;

  readonly channel = toSignal(this.route.paramMap.pipe(map((p) => (p.get('channel') || 'web').toLowerCase())), { initialValue: 'web' });
  readonly copied = signal(false);

  // Campos editables (apariencia + dominios)
  readonly widgetTitle = signal('');
  readonly brandColor = signal('');
  readonly secondBrandColor = signal('');
  readonly brandLogoUrl = signal('');
  readonly welcome = signal('');
  readonly widgetPosition = signal<'right' | 'left'>('right');
  readonly quickReplies = signal<string[]>(['']);
  readonly origins = signal<string[]>(['']);
  readonly saving = signal(false);
  readonly savedMsg = signal('');
  readonly err = signal('');

  readonly quickLimit = computed(() => (this.s.plan() === 'basic' ? 3 : 20));
  readonly originLimit = computed(() => (this.s.plan() === 'business' ? 3 : 1));

  private initialized = false;
  constructor() {
    // Carga los valores del chatbot actual una sola vez (cuando la config esté disponible).
    effect(() => {
      const c = this.s.currentConfig();
      if (c && !this.initialized) { this.initialized = true; this.loadFrom(c); }
    });
  }

  private loadFrom(c: ChatbotConfig): void {
    this.widgetTitle.set(c.widgetTitle || '');
    this.brandColor.set(c.brandColor || '');
    this.secondBrandColor.set(c.secondBrandColor || '');
    this.brandLogoUrl.set(c.brandLogoUrl || '');
    this.welcome.set(c.welcome || '');
    this.widgetPosition.set(c.widgetPosition === 'left' ? 'left' : 'right');
    this.quickReplies.set(c.quickReplies && c.quickReplies.length ? [...c.quickReplies] : ['']);
    this.origins.set(c.origins && c.origins.length ? [...c.origins] : ['']);
  }

  readonly embed = computed(() => {
    const id = this.s.currentClientId() || 'TU-CLIENT-ID';
    return '<script src="https://www.wearevectis.com/assets/chatbot/widget.js"\n  data-client-id="' + id + '"\n  defer></script>';
  });

  // Vista previa
  previewColor(): string { return this.brandColor().trim() || '#E7AB2E'; }
  previewColor2(): string { return this.secondBrandColor().trim() || '#0A0A0A'; }
  previewBar(): string { return `linear-gradient(135deg, ${this.previewColor()}, ${this.previewColor2()})`; }
  previewTitle(): string { return this.widgetTitle().trim() || 'Asistente'; }
  previewInitial(): string { return (this.previewTitle().trim()[0] || 'A').toUpperCase(); }
  previewWelcome(): string { return this.welcome().trim() || '¡Hola! ¿En qué puedo ayudarte hoy?'; }
  previewQuick(): string[] { return this.quickReplies().filter((q) => q.trim()); }

  setQuick(i: number, v: string): void { const a = [...this.quickReplies()]; a[i] = v; this.quickReplies.set(a); }
  addQuick(): void { if (this.quickReplies().length < this.quickLimit()) this.quickReplies.set([...this.quickReplies(), '']); }
  removeQuick(i: number): void { const a = this.quickReplies().filter((_, x) => x !== i); this.quickReplies.set(a.length ? a : ['']); }
  setOrigin(i: number, v: string): void { const a = [...this.origins()]; a[i] = v; this.origins.set(a); }
  addOrigin(): void { if (this.origins().length < this.originLimit()) this.origins.set([...this.origins(), '']); }
  removeOrigin(i: number): void { if (this.origins().length > 1) this.origins.set(this.origins().filter((_, x) => x !== i)); }

  async save(): Promise<void> {
    this.err.set(''); this.savedMsg.set('');
    const id = this.s.currentClientId();
    if (!id) { this.err.set('Primero crea y guarda tu chatbot en Configurar.'); return; }
    const base = this.s.currentConfig();
    if (!base) { this.err.set('No pude cargar tu configuración. Recarga la página.'); return; }
    const merged: ChatbotConfig = {
      ...base,
      widgetTitle: this.widgetTitle().trim(),
      widgetPosition: this.widgetPosition(),
      brandColor: this.brandColor().trim(),
      secondBrandColor: this.secondBrandColor().trim(),
      brandLogoUrl: this.brandLogoUrl().trim(),
      welcome: this.welcome().trim(),
      quickReplies: this.quickReplies().filter((q) => q.trim()),
      origins: this.origins().map((o) => o.trim()).filter(Boolean),
    };
    this.saving.set(true);
    const { error } = await this.sb.from('chatbots').update(webConfigToDb(merged)).eq('id', id);
    this.saving.set(false);
    if (error) { this.err.set(error.message); return; }
    // Refleja el cambio en memoria para que no se pierda al navegar.
    const cfgs = [...this.s.configs()]; const i = this.s.current();
    if (cfgs[i]) { cfgs[i] = merged; this.s.configs.set(cfgs); }
    this.savedMsg.set('Guardado ✓');
    setTimeout(() => this.savedMsg.set(''), 2500);
  }

  copy(text: string): void {
    try { navigator.clipboard.writeText(text); } catch (e) { /* noop */ }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }

  private readonly META: Record<string, { title: string; lead: string; soon: string; points: string[] }> = {
    web: { title: 'Sitio web', lead: 'Pon el chatbot en tu página con una línea de código, y personaliza cómo se ve.', soon: '', points: [] },
    whatsapp: {
      title: 'WhatsApp',
      lead: 'Conecta tu chatbot a WhatsApp para que responda a tus clientes desde su app favorita.',
      soon: 'Estamos preparando la integración con WhatsApp (Cloud API). Pronto podrás vincular tu número y el bot contestará automáticamente con la información de tu negocio.',
      points: ['El bot responde en los chats de WhatsApp de tu negocio.', 'Usa la misma información y reglas que ya configuraste.', 'Requiere una cuenta de WhatsApp Business y un paso de conexión guiado.'],
    },
    instagram: {
      title: 'Instagram',
      lead: 'Deja que el chatbot conteste los mensajes directos (DM) de tu cuenta de Instagram.',
      soon: 'Estamos preparando la integración con los DM de Instagram. Pronto podrás vincular tu cuenta profesional y el bot responderá automáticamente.',
      points: ['El bot responde los DM de tu cuenta de Instagram.', 'Usa la misma información y reglas que ya configuraste.', 'Requiere cuenta profesional vinculada a una página de Facebook.'],
    },
    messenger: {
      title: 'Messenger',
      lead: 'Conecta el chatbot a Facebook Messenger para atender a quienes escriben a tu página.',
      soon: 'Estamos preparando la integración con Facebook Messenger. Pronto podrás vincular tu página y el bot contestará automáticamente.',
      points: ['El bot responde los mensajes de tu página de Facebook.', 'Usa la misma información y reglas que ya configuraste.', 'Requiere una página de Facebook y un paso de conexión guiado.'],
    },
    telegram: {
      title: 'Telegram',
      lead: 'Pon a tu chatbot a responder en Telegram con el bot de tu negocio.',
      soon: 'Estamos preparando que el bot conteste directamente en Telegram (hoy ya se usa para el handoff a un agente). Pronto podrás activarlo como canal de atención automática.',
      points: ['El bot responde en el chat de Telegram de tu negocio.', 'Usa la misma información y reglas que ya configuraste.', 'Se conecta con el bot de Telegram de tu negocio (BotFather).'],
    },
  };
  readonly meta = computed(() => this.META[this.channel()] || this.META['web']);
}
