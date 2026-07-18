import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService, webConfigToDb, ChatbotConfig } from './session.service';
import { SupabaseClientService } from './supabase.client';

const WORKER_URL = 'https://chatbot.vectisauto.workers.dev';

/**
 * /channels/:channel — Canales donde puede operar el chatbot.
 * WEB: instrucciones de embed + apariencia + dominios + vista previa (guardado propio, no pisa el configure).
 * Otros (WhatsApp/Instagram/Messenger/Telegram): instrucciones / en preparación.
 * Visible SOLO para el admin (vectisauto@gmail.com) — el gating vive en el sidebar.
 */
@Component({
  selector: 'app-chatbot-channels',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatbotAppHeaderComponent, ChatbotSidebarComponent, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <app-chatbot-version-footer></app-chatbot-version-footer>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <div class="ch-logo" [attr.data-ch]="channel()" aria-hidden="true">
              @switch (channel()) {
                @case ('telegram') { <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg> }
                @case ('whatsapp') { <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg> }
                @case ('instagram') { <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg> }
                @case ('messenger') { <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.36-.09.54-.04 1.06.29 2.19.45 3.35.45 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.93 4.65c-.47.74-1.47.93-2.17.4l-2.33-1.75a.6.6 0 0 0-.72 0l-3.15 2.39c-.42.32-.97-.18-.69-.63l2.93-4.65c.47-.74 1.47-.93 2.17-.4l2.33 1.75a.6.6 0 0 0 .72 0l3.15-2.39c.42-.32.97.18.69.63z"/></svg> }
                @default { <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg> }
              }
            </div>
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
            } @else if (channel() === 'telegram') {
              <!-- Conexión del bot (una sola vez; sirve para el canal y para el handoff) -->
              <section class="card">
                <h3 class="ch">Conecta tu bot</h3>
                <p class="muted">Una sola conexión: el mismo bot responde a tus clientes en Telegram y también sirve para “hablar con un agente”.</p>

                @if (botConnected() && !editToken()) {
                  <div class="tg-connected">
                    <span class="status linked"><span class="sdot"></span>Bot conectado — &#64;{{ tgUsername() }}</span>
                    <button type="button" class="ghost-btn" (click)="editToken.set(true)">Cambiar token</button>
                  </div>
                  <p class="hint">Tus clientes le escriben a <a [href]="'https://t.me/' + tgUsername()" target="_blank" rel="noopener">&#64;{{ tgUsername() }}</a> en Telegram y el bot responde solo. Activa el canal abajo para encenderlo.</p>
                } @else {
                  <ol class="tg-steps">
                    <li>Abre <b>&#64;BotFather</b> en Telegram, envía <code>/newbot</code> y copia el <b>token</b> que te da.</li>
                    <li>Pégalo aquí y presiona <b>Conectar bot</b>: registramos el webhook automáticamente.</li>
                  </ol>
                  <div class="field">
                    <label for="tg-token">Token del bot (BotFather)</label>
                    <input id="tg-token" [ngModel]="tgToken()" (ngModelChange)="tgToken.set($event)" name="tgtoken" placeholder="123456:ABC-DEF…" autocomplete="off" spellcheck="false" />
                  </div>
                  <div class="field">
                    <label for="tg-user">Usuario del bot (opcional)</label>
                    <div class="at"><span>&#64;</span><input id="tg-user" [ngModel]="tgUser()" (ngModelChange)="tgUser.set($event)" name="tguser" placeholder="mi_negocio_bot" autocomplete="off" spellcheck="false" /></div>
                  </div>
                  <div class="save-row">
                    <button type="button" class="save" [disabled]="tgSaving()" (click)="connectBot()">{{ tgSaving() ? 'Conectando…' : 'Conectar bot' }}</button>
                    @if (botConnected()) { <button type="button" class="ghost-btn" (click)="editToken.set(false)">Cancelar</button> }
                  </div>
                }
                @if (tgOk()) { <p class="ok-line">{{ tgOk() }}</p> }
                @if (tgErr()) { <p class="err-line">{{ tgErr() }}</p> }
              </section>

              <!-- Canal + agente + citas -->
              <section class="card">
                <h3 class="ch">Activa el canal y las citas</h3>
                <div class="tg-toggle">
                  <div class="tg-tl"><b>El bot responde en Telegram</b><span class="ch-sub">Tus clientes le escriben al bot en un chat privado y contesta con la información de tu negocio.</span></div>
                  <button type="button" class="tgl" [class.on]="channelOn()" (click)="channelOn.set(!channelOn())" [attr.aria-pressed]="channelOn()" aria-label="Activar el bot en Telegram"><span></span></button>
                </div>
                <div class="tg-toggle">
                  <div class="tg-tl"><b>Permitir hablar con un agente</b><span class="ch-sub">Cuando el cliente lo pida, el bot lo conecta con una persona de tu equipo.</span></div>
                  <button type="button" class="tgl" [class.on]="handoffOn()" (click)="handoffOn.set(!handoffOn())" [attr.aria-pressed]="handoffOn()" aria-label="Permitir hablar con un agente"><span></span></button>
                </div>
                @if (handoffOn()) {
                  <p class="hint">Para recibir los chats en vivo: crea un grupo en Telegram, agrega a {{ tgUsername() ? '@' + tgUsername() : 'tu bot' }} y envía <code>/start</code> dentro del grupo. Los clientes seguirán en su chat privado; tú les respondes desde el grupo.</p>
                }

                <p class="hint mt">Citas por Cal.com: con estos datos el bot pregunta día y hora según tu disponibilidad real y <b>agenda la cita solo</b>. Sin ellos, solo comparte tu enlace de reservas (el de <a routerLink="/configure">Configurar</a>).</p>
                <div class="two">
                  <div class="field">
                    <label for="cal-key">Cal.com — API key</label>
                    <input id="cal-key" [ngModel]="calKey()" (ngModelChange)="calKey.set($event)" name="calkey" placeholder="cal_live_…" autocomplete="off" spellcheck="false" />
                  </div>
                  <div class="field">
                    <label for="cal-ev">Cal.com — URL de tu evento</label>
                    <input id="cal-ev" [ngModel]="calEvent()" (ngModelChange)="calEvent.set($event)" name="calev" placeholder="https://cal.com/tu-usuario/30min" autocomplete="off" spellcheck="false" />
                  </div>
                </div>
                <p class="hint">Pega la URL pública de tu evento (la que compartes para reservar); nosotros sacamos el resto. También sirve el ID numérico si lo tienes.</p>
                <div class="save-row">
                  <button type="button" class="save" [disabled]="tgSaving()" (click)="saveTelegram()">{{ tgSaving() ? 'Guardando…' : 'Guardar canal' }}</button>
                  @if (tgOk()) { <span class="ok-msg">{{ tgOk() }}</span> }
                  @if (tgErr()) { <span class="err-msg">{{ tgErr() }}</span> }
                </div>
              </section>
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
    .ch-logo { display: block; color: var(--text-inv); margin-bottom: 18px; opacity: .92; }
    .ch-logo svg { width: 30px; height: 30px; }
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
    .two .field { margin-top: 0; }
    .two > .field label { min-height: 18px; }
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

    .tg-steps { margin: 0 0 6px; padding-left: 20px; display: grid; gap: 8px; }
    .tg-steps li { font-size: 14px; line-height: 1.55; color: var(--text-inv-2); }
    .tg-steps b { color: var(--text-inv); }
    .at { display: flex; align-items: center; }
    .at span { padding: 11px 12px; border: 1px solid var(--line-light); border-right: none; border-radius: var(--radius-md) 0 0 var(--radius-md); background: rgba(255,255,255,.06); color: var(--text-inv-2); }
    .at input { border-radius: 0 var(--radius-md) var(--radius-md) 0; }
    .tg-connected { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin: 4px 0 8px; }
    .tg-toggle { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--line-light); }
    .tg-toggle:first-of-type { padding-top: 0; }
    .tg-tl { min-width: 0; } .tg-tl b { display: block; font-size: 14.5px; } .ch-sub { font-size: 12.5px; color: var(--text-inv-2); }
    .tgl { width: 46px; height: 26px; border-radius: 999px; border: 1px solid var(--line-light); background: rgba(255,255,255,.08); position: relative; cursor: pointer; flex-shrink: 0; transition: background var(--dur, .2s) var(--ease, ease); }
    .tgl span { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform var(--dur, .2s) var(--ease, ease); }
    .tgl.on { background: var(--gold-bright); border-color: var(--gold-bright); } .tgl.on span { transform: translateX(20px); }
    .hint.mt { margin-top: 16px; }
    .status.linked { display: inline-flex; align-items: center; gap: 8px; color: #34e0a1; font-size: 13.5px; font-weight: 600; }
    .sdot { width: 9px; height: 9px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; }
    .ok-line { margin-top: 12px; font-size: 13px; color: var(--gold-soft); background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; }
    .err-line { margin-top: 12px; font-size: 13px; color: #ff8a8a; background: rgba(214,69,69,.1); padding: 10px 12px; border-radius: 10px; }
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

  // Telegram (conexión del bot + canal + Cal.com)
  readonly tgToken = signal('');
  readonly tgUser = signal('');
  readonly tgUsername = signal('');
  readonly tgChatId = signal('');
  readonly channelOn = signal(false);
  readonly handoffOn = signal(false);
  readonly calKey = signal('');
  readonly calEvent = signal('');
  readonly tgSaving = signal(false);
  readonly tgOk = signal('');
  readonly tgErr = signal('');
  readonly editToken = signal(false);
  readonly botConnected = computed(() => !!this.tgUsername() || !!this.tgChatId());

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
    this.tgToken.set(c.telegramBotToken || '');
    this.tgUser.set(c.telegramBotUsername || '');
    this.tgUsername.set(c.telegramBotUsername || '');
    this.tgChatId.set(c.telegramChatId || '');
    this.channelOn.set(!!c.telegramChannelEnabled);
    this.handoffOn.set(!!c.handoffEnabled);
    this.calKey.set(c.calApiKey || '');
    this.calEvent.set(c.calEventType || '');
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

  /** Guarda el token y registra el webhook del bot en el worker (igual que la página de handoff). */
  async connectBot(): Promise<void> {
    this.tgErr.set(''); this.tgOk.set('');
    const id = this.s.currentClientId();
    if (!id) { this.tgErr.set('Primero crea y guarda tu chatbot en Configurar.'); return; }
    if (!this.tgToken().trim()) { this.tgErr.set('Pega el token de tu bot de Telegram (BotFather).'); return; }
    this.tgSaving.set(true);
    try {
      const patch: Record<string, unknown> = {
        telegram_bot_token: this.tgToken().trim(),
        telegram_bot_username: this.tgUser().trim().replace(/^@/, '') || null,
      };
      const { error } = await this.sb.from('chatbots').update(patch).eq('id', id);
      if (error) { this.tgErr.set(error.message); return; }
      const at = (await this.sb.auth.getSession()).data.session?.access_token;
      const res = await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'handoff_setup', client_id: id, access_token: at }),
      });
      const j = await res.json();
      if (j && j.ok) {
        if (j.username) { this.tgUsername.set(j.username); this.tgUser.set(j.username); }
        this.tgChatId.set('');
        this.editToken.set(false);
        this.tgOk.set('Bot conectado. Activa el canal abajo para que responda a tus clientes.');
        this.syncLocal();
      } else {
        this.tgErr.set('No pude conectar el bot: ' + ((j && j.error) || 'revisa el token'));
      }
    } catch (e) {
      this.tgErr.set('No pude conectar el bot. Revisa el token e intenta de nuevo.');
    } finally { this.tgSaving.set(false); }
  }

  /** Activa/desactiva Telegram como canal, el handoff y guarda las credenciales de Cal.com. */
  async saveTelegram(): Promise<void> {
    this.tgErr.set(''); this.tgOk.set('');
    const id = this.s.currentClientId();
    if (!id) { this.tgErr.set('Primero crea y guarda tu chatbot en Configurar.'); return; }
    this.tgSaving.set(true);
    try {
      const patch: Record<string, unknown> = {
        telegram_channel_enabled: this.channelOn(),
        handoff_enabled: this.handoffOn(),
        cal_api_key: this.calKey().trim() || null,
        cal_event_type: this.calEvent().trim() || null,
      };
      const { error } = await this.sb.from('chatbots').update(patch).eq('id', id);
      if (error) { this.tgErr.set(error.message); return; }
      this.syncLocal();
      this.tgOk.set('Guardado ✓');
      setTimeout(() => this.tgOk.set(''), 2500);
    } finally { this.tgSaving.set(false); }
  }

  /** Refleja los cambios de Telegram en el config en memoria. */
  private syncLocal(): void {
    const cfgs = [...this.s.configs()]; const i = this.s.current();
    if (cfgs[i]) {
      cfgs[i] = {
        ...cfgs[i],
        telegramBotToken: this.tgToken().trim(),
        telegramBotUsername: this.tgUsername(),
        telegramChatId: this.tgChatId(),
        telegramChannelEnabled: this.channelOn(),
        handoffEnabled: this.handoffOn(),
        calApiKey: this.calKey().trim(),
        calEventType: this.calEvent().trim(),
      };
      this.s.configs.set(cfgs);
    }
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
