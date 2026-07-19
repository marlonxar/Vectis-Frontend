import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService } from './session.service';
import { SupabaseClientService } from './supabase.client';

const WORKER_URL = 'https://chatbot.vectisauto.workers.dev';

/**
 * /handoff — Atención humana. UN solo destino a la vez (WhatsApp o Telegram) donde el equipo
 * recibe y responde los chats en vivo de TODOS los canales. WhatsApp va primero salvo que
 * Telegram esté habilitado. Mutuamente excluyentes: nunca los dos a la vez.
 */
@Component({
  selector: 'app-chatbot-handoff',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <span class="eyebrow on-dark">Atención humana</span>
            <h1 class="ttl">Hablar con una persona</h1>
            <p class="lead on-dark">Elige <b>un solo destino</b> donde tu equipo recibe y responde los chats en vivo de todos los canales (web, WhatsApp, Telegram, Messenger e Instagram). Solo puede haber uno activo a la vez.</p>

            @for (opt of orderedOptions(); track opt) {
              @if (opt === 'whatsapp') {
                <!-- WhatsApp como destino del handoff -->
                <section class="card">
                  <div class="opt-head">
                    <span class="opt-ic wa"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg></span>
                    <div class="opt-tl"><b>WhatsApp</b><span>Recibe los chats en vivo en tu WhatsApp y responde desde ahí.</span></div>
                    <button type="button" class="tgl" [class.on]="active() === 'whatsapp'" (click)="toggle('whatsapp')" [attr.aria-pressed]="active() === 'whatsapp'" aria-label="Usar WhatsApp para el handoff"><span></span></button>
                  </div>
                  @if (active() === 'whatsapp') {
                    <div class="opt-body">
                      <ol class="steps">
                        <li>Usa la <b>WhatsApp Cloud API</b> de Meta (la misma configuración que el canal de WhatsApp). Consigue tu <b>Phone Number ID</b> y un <b>token de acceso permanente</b>.</li>
                        <li>Define un <b>token de verificación</b> e ingrésalo abajo. En el <b>Webhook</b> de tu app de Meta, pega la URL de callback + ese token y suscríbete a <b>messages</b>.</li>
                        <li>Ingresa el <b>número de WhatsApp del agente</b> (con código de país, solo dígitos): ahí llegan los chats en vivo. Desde ese WhatsApp respondes; escribe <code>/fin</code> para cerrar un chat.</li>
                      </ol>
                      <div class="field">
                        <label>URL de callback (webhook)</label>
                        <div class="code"><pre>{{ webhookUrl() }}</pre><button type="button" class="copy" (click)="copyUrl()">{{ copiedUrl() ? '¡Copiado!' : 'Copiar' }}</button></div>
                      </div>
                      <div class="two">
                        <div class="field"><label for="ho-wa-pnid">Phone Number ID</label><input id="ho-wa-pnid" [ngModel]="waPhoneId()" (ngModelChange)="waPhoneId.set($event)" name="howapnid" placeholder="123456789012345" autocomplete="off" spellcheck="false" /></div>
                        <div class="field"><label for="ho-wa-verify">Token de verificación</label><input id="ho-wa-verify" [ngModel]="waVerify()" (ngModelChange)="waVerify.set($event)" name="howaverify" placeholder="mi-palabra-secreta" autocomplete="off" spellcheck="false" /></div>
                      </div>
                      <div class="field"><label for="ho-wa-token">Token de acceso permanente</label><input id="ho-wa-token" [ngModel]="waToken()" (ngModelChange)="waToken.set($event)" name="howatoken" placeholder="EAAG…" autocomplete="off" spellcheck="false" /></div>
                      <div class="field">
                        <label for="ho-wa-owner">Números de WhatsApp de los agentes</label>
                        <input id="ho-wa-owner" [ngModel]="waOwner()" (ngModelChange)="waOwner.set($event)" name="howaowner" placeholder="50688887777, 50699998888" autocomplete="off" spellcheck="false" />
                        <p class="hint">Multi-agente: separa varios números con coma. Todos reciben los chats en vivo y cualquiera puede responder.</p>
                      </div>
                      <div class="field">
                        <label for="ho-wa-tpl">Plantilla de aviso (recomendado)</label>
                        <input id="ho-wa-tpl" [ngModel]="waTemplate()" (ngModelChange)="waTemplate.set($event)" name="howatpl" placeholder="nuevo_chat" autocomplete="off" spellcheck="false" />
                      </div>
                      <p class="hint"><b>Recomendado:</b> crea en Meta una <b>plantilla de mensaje aprobada</b> con un cuerpo tipo <code>🔔 Nuevo chat en vivo: {{ '{{' }}1{{ '}}' }}</code> (un solo parámetro) y pon aquí su <b>nombre</b>. Así el aviso al agente llega <b>aunque hayan pasado más de 24 h</b>. Sin plantilla, el aviso solo funciona si el agente le escribió al WhatsApp del negocio en las últimas 24 h.</p>
                      <button type="button" class="save" [disabled]="waSaving()" (click)="saveWhatsapp()">{{ waSaving() ? 'Guardando…' : 'Guardar' }}</button>
                      @if (waOk()) { <p class="ok">{{ waOk() }}</p> }
                      @if (waErr()) { <p class="err">{{ waErr() }}</p> }
                    </div>
                  }
                </section>
              } @else {
                <!-- Telegram como destino del handoff -->
                <section class="card">
                  <div class="opt-head">
                    <span class="opt-ic tg"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg></span>
                    <div class="opt-tl"><b>Telegram</b><span>Recibe los chats en vivo en un grupo de Telegram y responde desde ahí.</span></div>
                    <button type="button" class="tgl" [class.on]="active() === 'telegram'" (click)="toggle('telegram')" [attr.aria-pressed]="active() === 'telegram'" aria-label="Usar Telegram para el handoff"><span></span></button>
                  </div>
                  @if (active() === 'telegram') {
                    <div class="opt-body">
                      <ol class="steps">
                        <li>Abre <b>&#64;BotFather</b> en Telegram, envía <code>/newbot</code> y copia el <b>token</b>.</li>
                        <li>Pégalo aquí y presiona <b>Conectar bot</b>: registramos el webhook automáticamente.</li>
                        <li>Crea un <b>grupo</b> en Telegram, agrega tu bot y envía <code>/start</code> dentro del grupo para vincularlo. Ahí llegan los chats en vivo; responde citando el mensaje del cliente. <code>/fin</code> para cerrar.</li>
                      </ol>
                      @if (tgConnected() && !editToken()) {
                        <div class="tg-connected">
                          <span class="status linked"><span class="sdot"></span>Bot conectado{{ tgUsername() ? ' — @' + tgUsername() : '' }}</span>
                          <button type="button" class="ghost-btn" (click)="editToken.set(true)">Cambiar token</button>
                        </div>
                        @if (!tgChatId() && tgUsername()) {
                          <p class="hint">Abre <a [href]="'https://t.me/' + tgUsername() + '?startgroup=true'" target="_blank" rel="noopener">&#64;{{ tgUsername() }}</a> y envía <code>/start</code> en tu grupo. Luego <button type="button" class="linkbtn" [disabled]="checking()" (click)="checkStatus()">{{ checking() ? 'comprobando…' : 'comprobar vinculación' }}</button>.</p>
                        }
                      } @else {
                        <div class="field"><label for="ho-tg-token">Token del bot (BotFather)</label><input id="ho-tg-token" [ngModel]="tgToken()" (ngModelChange)="tgToken.set($event)" name="hotgtoken" placeholder="123456:ABC-DEF…" autocomplete="off" spellcheck="false" /></div>
                        <div class="field"><label for="ho-tg-user">Usuario del bot (opcional)</label><div class="at"><span>&#64;</span><input id="ho-tg-user" [ngModel]="tgUser()" (ngModelChange)="tgUser.set($event)" name="hotguser" placeholder="mi_negocio_bot" autocomplete="off" spellcheck="false" /></div></div>
                        <div class="save-row">
                          <button type="button" class="save" [disabled]="tgSaving()" (click)="connectTelegram()">{{ tgSaving() ? 'Conectando…' : 'Conectar bot' }}</button>
                          @if (tgConnected()) { <button type="button" class="ghost-btn" (click)="editToken.set(false)">Cancelar</button> }
                        </div>
                      }
                      @if (tgOk()) { <p class="ok">{{ tgOk() }}</p> }
                      @if (tgErr()) { <p class="err">{{ tgErr() }}</p> }
                    </div>
                  }
                </section>
              }
            }

            @if (active()) {
              <!-- Horario de atención del handoff -->
              <section class="card">
                <div class="opt-head">
                  <span class="opt-ic hrs"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
                  <div class="opt-tl"><b>Horario de atención</b><span>Cuándo hay alguien para atender los chats en vivo.</span></div>
                </div>
                <div class="opt-body">
                  <div class="hrs-row">
                    <div class="tg-tl"><b>Disponible 24 horas</b><span class="ch-sub">El botón de "hablar con una persona" está siempre activo.</span></div>
                    <button type="button" class="tgl" [class.on]="hoAlwaysOpen()" (click)="hoAlwaysOpen.set(!hoAlwaysOpen())" [attr.aria-pressed]="hoAlwaysOpen()" aria-label="Disponible 24 horas"><span></span></button>
                  </div>

                  @if (!hoAlwaysOpen()) {
                    <div class="two">
                      <div class="field"><label for="ho-open">Abre</label><input id="ho-open" type="time" [ngModel]="hoOpen()" (ngModelChange)="hoOpen.set($event)" name="hoopen" /></div>
                      <div class="field"><label for="ho-close">Cierra</label><input id="ho-close" type="time" [ngModel]="hoClose()" (ngModelChange)="hoClose.set($event)" name="hoclose" /></div>
                    </div>
                    <div class="field">
                      <label>Días de atención</label>
                      <div class="days" role="group" aria-label="Días de atención">
                        @for (d of dayList; track d.n) {
                          <button type="button" class="day" [class.on]="hasDay(d.n)" (click)="toggleDay(d.n)" [attr.aria-pressed]="hasDay(d.n)">{{ d.label }}</button>
                        }
                      </div>
                    </div>
                  }

                  <div class="field">
                    <label for="ho-away">Mensaje fuera de horario</label>
                    <input id="ho-away" [ngModel]="hoAway()" (ngModelChange)="hoAway.set($event)" name="hoaway" placeholder="Estamos fuera de horario. Te respondemos mañana a partir de las 9:00." autocomplete="off" />
                    <p class="hint">Si un cliente pide hablar con una persona fuera de horario, el bot le dice esto y sigue ayudándole. Horario en zona de Costa Rica.</p>
                  </div>

                  <button type="button" class="save" [disabled]="hoSaving()" (click)="saveHours()">{{ hoSaving() ? 'Guardando…' : 'Guardar horario' }}</button>
                  @if (hoOk()) { <p class="ok">{{ hoOk() }}</p> }
                  @if (hoErr()) { <p class="err">{{ hoErr() }}</p> }
                </div>
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
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 40px; max-width: 860px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 20px 22px; margin-top: 18px; }
    .opt-head { display: flex; align-items: center; gap: 13px; }
    .opt-ic { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; }
    .opt-ic.wa { color: #25D366; background: rgba(37,211,102,.12); border: 1px solid rgba(37,211,102,.3); }
    .opt-ic.tg { color: #229ED9; background: rgba(34,158,217,.12); border: 1px solid rgba(34,158,217,.3); }
    .opt-ic.hrs { color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); }
    .hrs-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--line-light); }
    .tg-tl { min-width: 0; } .tg-tl b { display: block; font-size: 14.5px; } .ch-sub { font-size: 12.5px; color: var(--text-inv-2); }
    .days { display: flex; flex-wrap: wrap; gap: 8px; }
    .day { min-width: 46px; padding: 9px 12px; border-radius: var(--radius-pill); border: 1px solid var(--line-light); background: rgba(255,255,255,.04);
      color: var(--text-inv-2); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .day.on { background: var(--gold-bright); border-color: var(--gold-bright); color: var(--ink); }
    .opt-tl { min-width: 0; flex: 1; } .opt-tl b { display: block; font-size: 15.5px; } .opt-tl span { font-size: 12.5px; color: var(--text-inv-2); }
    .tgl { width: 46px; height: 26px; border-radius: 999px; border: 1px solid var(--line-light); background: rgba(255,255,255,.08); position: relative; cursor: pointer; flex-shrink: 0; }
    .tgl span { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .2s ease; }
    .tgl.on { background: var(--gold-bright); border-color: var(--gold-bright); } .tgl.on span { transform: translateX(20px); }
    .opt-body { margin-top: 18px; border-top: 1px solid var(--line-light); padding-top: 18px; }
    .steps { margin: 0 0 4px; padding-left: 20px; display: grid; gap: 8px; } .steps li { font-size: 14px; line-height: 1.55; color: var(--text-inv-2); } .steps b { color: var(--text-inv); }
    .field { margin-top: 14px; } .two .field { margin-top: 0; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin-bottom: 7px; }
    input { width: 100%; padding: 11px 13px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; }
    input:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    .at { display: flex; align-items: center; } .at span { padding: 11px 12px; border: 1px solid var(--line-light); border-right: none; border-radius: var(--radius-md) 0 0 var(--radius-md); background: rgba(255,255,255,.06); color: var(--text-inv-2); } .at input { border-radius: 0 var(--radius-md) var(--radius-md) 0; }
    .code { position: relative; } .code pre { background: rgba(0,0,0,.35); border: 1px solid var(--line-light); border-radius: var(--radius-md); padding: 12px 14px; padding-right: 88px; font-family: ui-monospace, monospace; font-size: 12.5px; color: var(--gold-soft); overflow-x: auto; white-space: pre-wrap; word-break: break-all; margin: 0; }
    .copy { position: absolute; top: 8px; right: 8px; border: 1px solid var(--line-light); background: rgba(255,255,255,.06); color: var(--text-inv); border-radius: 8px; padding: 6px 12px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
    .save { margin-top: 18px; min-height: 46px; padding: 0 24px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 26px rgba(231,171,46,.3); }
    .save:disabled { opacity: .7; cursor: default; }
    .save-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; flex-wrap: wrap; }
    .ghost-btn { padding: 9px 15px; border-radius: var(--radius-pill); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; font-weight: 600; font-size: 13px; cursor: pointer; }
    .ghost-btn:hover { border-color: rgba(231,171,46,.4); }
    .linkbtn { background: none; border: none; color: var(--gold-bright); font: inherit; font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline; }
    .hint { font-size: 12.5px; color: var(--text-inv-2); margin-top: 12px; line-height: 1.5; } .hint a { color: var(--gold-bright); font-weight: 600; }
    .ok { margin-top: 14px; font-size: 13px; color: var(--gold-soft); background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; }
    .err { margin-top: 14px; font-size: 13px; color: #ff8a8a; background: rgba(214,69,69,.1); padding: 10px 12px; border-radius: 10px; }
    .tg-connected { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin: 6px 0 4px; }
    .status.linked { display: inline-flex; align-items: center; gap: 8px; color: #34e0a1; font-size: 13.5px; font-weight: 600; }
    .sdot { width: 9px; height: 9px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; }
    code { background: rgba(255,255,255,.08); border-radius: 5px; padding: 1px 6px; font-family: ui-monospace, monospace; font-size: 12.5px; }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 560px) { .wrap { padding: 30px 16px 32px; } .card { padding: 16px; } .two { grid-template-columns: 1fr; } .save { width: 100%; } }
  `],
})
export class ChatbotHandoffComponent implements OnInit {
  private readonly s = inject(ChatbotSessionService);
  private readonly sb = inject(SupabaseClientService).client;
  private readonly title = inject(Title);

  readonly active = signal<'' | 'telegram' | 'whatsapp'>('');
  // Telegram
  readonly tgToken = signal(''); readonly tgUser = signal(''); readonly tgUsername = signal(''); readonly tgChatId = signal('');
  readonly tgSaving = signal(false); readonly tgOk = signal(''); readonly tgErr = signal(''); readonly editToken = signal(false); readonly checking = signal(false);
  // WhatsApp
  readonly waPhoneId = signal(''); readonly waToken = signal(''); readonly waVerify = signal(''); readonly waOwner = signal(''); readonly waTemplate = signal('');
  readonly waSaving = signal(false); readonly waOk = signal(''); readonly waErr = signal('');
  readonly copiedUrl = signal(false);
  // Horario de atención del handoff
  readonly hoAlwaysOpen = signal(true);
  readonly hoOpen = signal('09:00');
  readonly hoClose = signal('18:00');
  readonly hoDays = signal<number[]>([1, 2, 3, 4, 5]);
  readonly hoAway = signal('');
  readonly hoSaving = signal(false); readonly hoOk = signal(''); readonly hoErr = signal('');
  readonly dayList = [
    { n: 1, label: 'Lun' }, { n: 2, label: 'Mar' }, { n: 3, label: 'Mié' }, { n: 4, label: 'Jue' },
    { n: 5, label: 'Vie' }, { n: 6, label: 'Sáb' }, { n: 0, label: 'Dom' },
  ];

  readonly tgConnected = computed(() => !!this.tgUsername() || !!this.tgChatId());
  readonly webhookUrl = computed(() => WORKER_URL + '/?c=' + (this.s.currentClientId() || 'TU-CLIENT-ID'));
  // WhatsApp primero, salvo que Telegram esté activo.
  readonly orderedOptions = computed<Array<'whatsapp' | 'telegram'>>(() => this.active() === 'telegram' ? ['telegram', 'whatsapp'] : ['whatsapp', 'telegram']);

  ngOnInit(): void {
    this.title.setTitle('Atención humana · Vectis AI ChatBot');
    const c = this.s.currentConfig();
    if (c) {
      this.active.set(c.handoffEnabled ? (c.handoffChannel === 'whatsapp' ? 'whatsapp' : 'telegram') : '');
      this.tgToken.set(c.telegramBotToken || ''); this.tgUser.set(c.telegramBotUsername || '');
      this.tgUsername.set(c.telegramBotUsername || ''); this.tgChatId.set(c.telegramChatId || '');
      this.waPhoneId.set(c.whatsappPhoneNumberId || ''); this.waToken.set(c.whatsappAccessToken || '');
      this.waVerify.set(c.whatsappVerifyToken || ''); this.waOwner.set(c.handoffWhatsappOwner || ''); this.waTemplate.set(c.handoffWhatsappTemplate || '');
      this.hoAlwaysOpen.set(c.handoffAlwaysOpen !== false);
      this.hoOpen.set(c.handoffOpen || '09:00'); this.hoClose.set(c.handoffClose || '18:00');
      this.hoDays.set(String(c.handoffDays || '1,2,3,4,5').split(',').map((d) => parseInt(d, 10)).filter((d) => !isNaN(d)));
      this.hoAway.set(c.handoffAwayMessage || '');
    }
  }

  private clientId(): string { return this.s.currentClientId(); }

  /** Activa/desactiva un destino. Al activar uno, el otro queda deshabilitado (excluyente). */
  async toggle(channel: 'telegram' | 'whatsapp'): Promise<void> {
    if (this.active() === channel) { this.active.set(''); await this.persist({ handoff_enabled: false }); return; }
    this.active.set(channel);
    await this.persist({ handoff_enabled: true, handoff_channel: channel });
  }

  private async persist(obj: Record<string, unknown>): Promise<boolean> {
    const id = this.clientId(); if (!id) return false;
    const { error } = await this.sb.from('chatbots').update(obj).eq('id', id);
    if (!error) this.syncLocal();
    return !error;
  }

  async saveWhatsapp(): Promise<void> {
    this.waErr.set(''); this.waOk.set('');
    if (!this.clientId()) { this.waErr.set('Primero crea y guarda tu chatbot.'); return; }
    if (!this.waPhoneId().trim() || !this.waToken().trim() || !this.waOwner().trim()) { this.waErr.set('Completa Phone Number ID, token de acceso y número del agente.'); return; }
    this.waSaving.set(true);
    try {
      const ok = await this.persist({
        handoff_enabled: true, handoff_channel: 'whatsapp',
        whatsapp_phone_number_id: this.waPhoneId().trim() || null,
        whatsapp_access_token: this.waToken().trim() || null,
        whatsapp_verify_token: this.waVerify().trim() || null,
        handoff_whatsapp_owner: this.waOwner().trim().replace(/\D/g, '') || null,
        handoff_whatsapp_template: this.waTemplate().trim() || null,
      });
      if (ok) { this.waOk.set('Guardado ✓'); setTimeout(() => this.waOk.set(''), 2500); }
      else this.waErr.set('No se pudo guardar. Intenta de nuevo.');
    } finally { this.waSaving.set(false); }
  }

  async connectTelegram(): Promise<void> {
    this.tgErr.set(''); this.tgOk.set('');
    const id = this.clientId();
    if (!id) { this.tgErr.set('Primero crea y guarda tu chatbot.'); return; }
    if (!this.tgToken().trim()) { this.tgErr.set('Pega el token de tu bot de Telegram (BotFather).'); return; }
    this.tgSaving.set(true);
    try {
      await this.sb.from('chatbots').update({
        handoff_enabled: true, handoff_channel: 'telegram',
        telegram_bot_token: this.tgToken().trim(),
        telegram_bot_username: this.tgUser().trim().replace(/^@/, '') || null,
      }).eq('id', id);
      const at = (await this.sb.auth.getSession()).data.session?.access_token;
      const res = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'handoff_setup', client_id: id, access_token: at }) });
      const j = await res.json();
      if (j && j.ok) {
        if (j.username) { this.tgUsername.set(j.username); this.tgUser.set(j.username); }
        this.tgChatId.set(''); this.editToken.set(false);
        this.tgOk.set('Bot conectado. Ahora abre tu bot y envía /start en tu grupo para vincularlo.');
        this.syncLocal();
      } else { this.tgErr.set('No pude conectar el bot: ' + ((j && j.error) || 'revisa el token')); }
    } catch (e) { this.tgErr.set('No pude conectar el bot. Revisa el token e intenta de nuevo.'); }
    finally { this.tgSaving.set(false); }
  }

  async checkStatus(): Promise<void> {
    const id = this.clientId(); if (!id) return;
    this.checking.set(true);
    try {
      const { data } = await this.sb.from('chatbots').select('telegram_chat_id,telegram_bot_username').eq('id', id).single();
      if (data) {
        this.tgChatId.set((data as Record<string, string>)['telegram_chat_id'] || '');
        const u = (data as Record<string, string>)['telegram_bot_username']; if (u) { this.tgUsername.set(u); this.tgUser.set(u); }
      }
      this.syncLocal();
    } finally { this.checking.set(false); }
  }

  copyUrl(): void { try { navigator.clipboard.writeText(this.webhookUrl()); } catch (e) { /* noop */ } this.copiedUrl.set(true); setTimeout(() => this.copiedUrl.set(false), 1800); }

  hasDay(n: number): boolean { return this.hoDays().indexOf(n) !== -1; }
  toggleDay(n: number): void {
    const d = this.hoDays();
    this.hoDays.set(this.hasDay(n) ? d.filter((x) => x !== n) : [...d, n].sort((a, b) => a - b));
  }

  async saveHours(): Promise<void> {
    this.hoErr.set(''); this.hoOk.set('');
    if (!this.clientId()) { this.hoErr.set('Primero crea y guarda tu chatbot.'); return; }
    if (!this.hoAlwaysOpen() && !this.hoDays().length) { this.hoErr.set('Elige al menos un día de atención.'); return; }
    this.hoSaving.set(true);
    try {
      const ok = await this.persist({
        handoff_always_open: this.hoAlwaysOpen(),
        handoff_open: this.hoOpen() || '09:00',
        handoff_close: this.hoClose() || '18:00',
        handoff_days: this.hoDays().join(',') || '1,2,3,4,5',
        handoff_away_message: this.hoAway().trim() || null,
      });
      if (ok) { this.hoOk.set('Guardado ✓'); setTimeout(() => this.hoOk.set(''), 2500); }
      else this.hoErr.set('No se pudo guardar. Intenta de nuevo.');
    } finally { this.hoSaving.set(false); }
  }

  private syncLocal(): void {
    const cfgs = [...this.s.configs()]; const i = this.s.current();
    if (cfgs[i]) {
      cfgs[i] = {
        ...cfgs[i],
        handoffEnabled: this.active() !== '', handoffChannel: this.active() || 'telegram', handoffWhatsappOwner: this.waOwner().trim(), handoffWhatsappTemplate: this.waTemplate().trim(),
        handoffAlwaysOpen: this.hoAlwaysOpen(), handoffOpen: this.hoOpen(), handoffClose: this.hoClose(),
        handoffDays: this.hoDays().join(','), handoffAwayMessage: this.hoAway().trim(),
        telegramBotToken: this.tgToken().trim(), telegramBotUsername: this.tgUsername(), telegramChatId: this.tgChatId(),
        whatsappPhoneNumberId: this.waPhoneId().trim(), whatsappAccessToken: this.waToken().trim(), whatsappVerifyToken: this.waVerify().trim(),
      };
      this.s.configs.set(cfgs);
    }
  }
}
