import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
 * Otros (WhatsApp/Instagram/Messenger/Telegram): conexión, activación y Cal.com.
 * Disponible para todos los usuarios (GA). El enlace vive en el sidebar.
 */
@Component({
  selector: 'app-chatbot-channels',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <app-chatbot-version-footer></app-chatbot-version-footer>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <!-- El logo va EN LÍNEA con la palabra "Canal", no encima. -->
            <div class="ch-head">
            <span class="ch-logo" [attr.data-ch]="channel()" aria-hidden="true">
              @switch (channel()) {
                @case ('telegram') { <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg> }
                @case ('whatsapp') { <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg> }
                @case ('instagram') { <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg> }
                @case ('messenger') { <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.36-.09.54-.04 1.06.29 2.19.45 3.35.45 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.93 4.65c-.47.74-1.47.93-2.17.4l-2.33-1.75a.6.6 0 0 0-.72 0l-3.15 2.39c-.42.32-.97-.18-.69-.63l2.93-4.65c.47-.74 1.47-.93 2.17-.4l2.33 1.75a.6.6 0 0 0 .72 0l3.15-2.39c.42-.32.97.18.69.63z"/></svg> }
                @default { <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg> }
              }
            </span>
            <span class="eyebrow on-dark">{{ 'AICHATBOT.CHANNELS.PAGE_EYEBROW' | translate }}</span>
            </div>
            <h1 class="ttl">{{ meta().title | translate }}</h1>
            <p class="lead on-dark">{{ meta().lead | translate }}</p>

            <div class="callout">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <div [innerHTML]="'AICHATBOT.CHANNELS.CALLOUT' | translate"></div>
            </div>

            @if (channel() === 'web') {
              <!-- Instalación -->
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.W_INSTALL' | translate }}</h3>
                <p class="muted" [innerHTML]="'AICHATBOT.CHANNELS.W_INSTALL_SUB' | translate"></p>
                <div class="code">
                  <pre>{{ embed() }}</pre>
                  <button type="button" class="copy" (click)="copy(embed())">{{ (copied() ? 'AICHATBOT.CHANNELS.COPIED' : 'AICHATBOT.CHANNELS.COPY') | translate }}</button>
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.W_INSTALL_HINT' | translate"></p>
              </section>

              <div class="cfg-grid">
                <div class="col-form">
                  <!-- Apariencia -->
                  <section class="card">
                    <h3 class="ch">{{ 'AICHATBOT.CHANNELS.W_APPEARANCE' | translate }}</h3>
                    <div class="two">
                      <div class="field">
                        <label for="w-title">{{ 'AICHATBOT.CHANNELS.W_TITLE' | translate }}</label>
                        <input id="w-title" [ngModel]="widgetTitle()" (ngModelChange)="widgetTitle.set($event)" name="wtitle" [attr.placeholder]="'AICHATBOT.CHANNELS.W_TITLE_PH' | translate" />
                      </div>
                      <div class="field">
                        <label for="w-logo">{{ 'AICHATBOT.CHANNELS.W_LOGO' | translate }}</label>
                        <input id="w-logo" [ngModel]="brandLogoUrl()" (ngModelChange)="brandLogoUrl.set($event)" name="logo" placeholder="https://tutienda.com/logo.png" />
                      </div>
                    </div>
                    <div class="two">
                      <div class="field">
                        <label>{{ 'AICHATBOT.CHANNELS.W_COLOR' | translate }}</label>
                        <div class="color">
                          <input [ngModel]="brandColor()" (ngModelChange)="brandColor.set($event)" name="color" placeholder="#E7AB2E" />
                          <input type="color" [ngModel]="brandColor() || '#E7AB2E'" (ngModelChange)="brandColor.set($event)" name="colorpick" aria-label="Color" />
                        </div>
                      </div>
                      <div class="field">
                        <label>{{ 'AICHATBOT.CHANNELS.W_COLOR2' | translate }}</label>
                        <div class="color">
                          <input [ngModel]="secondBrandColor()" (ngModelChange)="secondBrandColor.set($event)" name="color2" placeholder="#0A0A0A" />
                          <input type="color" [ngModel]="secondBrandColor() || '#0A0A0A'" (ngModelChange)="secondBrandColor.set($event)" name="colorpick2" aria-label="Color 2" />
                        </div>
                      </div>
                    </div>
                    <div class="field">
                      <label>{{ 'AICHATBOT.CHANNELS.W_POSITION' | translate }}</label>
                      <div class="pos-seg" role="group" [attr.aria-label]="'AICHATBOT.CHANNELS.W_POSITION' | translate">
                        <button type="button" [class.on]="widgetPosition() === 'left'" (click)="widgetPosition.set('left')">{{ 'AICHATBOT.CHANNELS.W_LEFT' | translate }}</button>
                        <button type="button" [class.on]="widgetPosition() === 'right'" (click)="widgetPosition.set('right')">{{ 'AICHATBOT.CHANNELS.W_RIGHT' | translate }}</button>
                      </div>
                    </div>
                    <div class="field">
                      <label for="w-welcome">{{ 'AICHATBOT.CHANNELS.W_WELCOME' | translate }}</label>
                      <input id="w-welcome" [ngModel]="welcome()" (ngModelChange)="welcome.set($event)" name="welcome" [attr.placeholder]="'AICHATBOT.CHANNELS.W_WELCOME_PH' | translate" />
                    </div>
                    <div class="field">
                      <label>{{ 'AICHATBOT.CHANNELS.W_QUICK' | translate }}</label>
                      @for (q of quickReplies(); track $index) {
                        <div class="qr">
                          <input [ngModel]="q" (ngModelChange)="setQuick($index, $event)" [ngModelOptions]="{ standalone: true }" [attr.placeholder]="'AICHATBOT.CHANNELS.W_QUICK_PH' | translate" />
                          <button type="button" class="x" (click)="removeQuick($index)" [attr.aria-label]="'AICHATBOT.CHANNELS.W_REMOVE' | translate"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                        </div>
                      }
                      @if (quickReplies().length < quickLimit()) {
                        <button type="button" class="ghost-btn" (click)="addQuick()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>{{ 'AICHATBOT.CHANNELS.W_ADD_QUICK' | translate }}</button>
                      } @else if (s.plan() === 'basic') {
                        <p class="hint">{{ 'AICHATBOT.CHANNELS.W_QUICK_LIMIT' | translate }}</p>
                      }
                    </div>
                  </section>

                  <!-- Dominios autorizados -->
                  <section class="card">
                    <h3 class="ch">{{ 'AICHATBOT.CHANNELS.W_DOMAINS' | translate }}</h3>
                    <p class="muted">{{ 'AICHATBOT.CHANNELS.W_DOMAINS_SUB' | translate }}</p>
                    @for (o of origins(); track $index) {
                      <div class="qr">
                        <input [ngModel]="o" (ngModelChange)="setOrigin($index, $event)" [ngModelOptions]="{ standalone: true }" placeholder="https://tutienda.com" />
                        @if (origins().length > 1) {
                          <button type="button" class="x" (click)="removeOrigin($index)" [attr.aria-label]="'AICHATBOT.CHANNELS.W_REMOVE_DOMAIN' | translate"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                        }
                      </div>
                    }
                    @if (origins().length < originLimit()) {
                      <button type="button" class="ghost-btn" (click)="addOrigin()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>{{ 'AICHATBOT.CHANNELS.W_ADD_DOMAIN' | translate }}</button>
                    }
                    <p class="hint">{{ (s.plan() === 'business' ? 'AICHATBOT.CHANNELS.W_DOMAIN_LIMIT_3' : 'AICHATBOT.CHANNELS.W_DOMAIN_LIMIT_1') | translate }}</p>
                  </section>

                  <div class="save-row">
                    <button type="button" class="save" [disabled]="saving()" (click)="save()">{{ (saving() ? 'AICHATBOT.CHANNELS.SAVING' : 'AICHATBOT.CHANNELS.W_SAVE') | translate }}</button>
                    @if (savedMsg()) { <span class="ok-msg">{{ savedMsg() }}</span> }
                    @if (err()) { <span class="err-msg">{{ err() }}</span> }
                  </div>
                </div>

                <!-- Vista previa en vivo -->
                <div class="col-preview">
                  <div class="preview-sticky">
                    <p class="pv-label">{{ 'AICHATBOT.CHANNELS.W_PREVIEW' | translate }}</p>
                    <div class="pv-win" [class.left]="widgetPosition() === 'left'">
                      <div class="pv-head" [style.background]="previewBar()">
                        @if (brandLogoUrl().trim()) { <img class="pv-ava" [src]="brandLogoUrl().trim()" alt="" /> }
                        @else { <span class="pv-ava" [style.color]="previewColor()">{{ previewInitial() }}</span> }
                        <div class="pv-meta"><b>{{ previewTitle() }}</b><span>{{ 'AICHATBOT.CHANNELS.W_ONLINE' | translate }}</span></div>
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
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.T_CONNECT_TITLE' | translate }}</h3>
                <p class="muted">{{ 'AICHATBOT.CHANNELS.T_CONNECT_SUB' | translate }}</p>

                @if (botConnected() && !editToken()) {
                  <div class="tg-connected">
                    <span class="status linked"><span class="sdot"></span>{{ 'AICHATBOT.CHANNELS.T_CONNECTED' | translate }} — &#64;{{ tgUsername() }}</span>
                    <button type="button" class="ghost-btn" (click)="editToken.set(true)">{{ 'AICHATBOT.CHANNELS.T_CHANGE_TOKEN' | translate }}</button>
                  </div>
                  <p class="hint">{{ 'AICHATBOT.CHANNELS.T_CONNECTED_HINT_1' | translate }} <a [href]="'https://t.me/' + tgUsername()" target="_blank" rel="noopener">&#64;{{ tgUsername() }}</a> {{ 'AICHATBOT.CHANNELS.T_CONNECTED_HINT_2' | translate }}</p>
                } @else {
                  <ol class="tg-steps">
                    <li [innerHTML]="'AICHATBOT.CHANNELS.T_S1' | translate"></li>
                    <li [innerHTML]="'AICHATBOT.CHANNELS.T_S2' | translate"></li>
                  </ol>
                  <div class="field">
                    <label for="tg-token">{{ 'AICHATBOT.CHANNELS.T_F_TOKEN' | translate }}</label>
                    <input id="tg-token" [ngModel]="tgToken()" (ngModelChange)="tgToken.set($event)" name="tgtoken" placeholder="123456:ABC-DEF…" autocomplete="off" spellcheck="false" />
                  </div>
                  <div class="field">
                    <label for="tg-user">{{ 'AICHATBOT.CHANNELS.T_F_USER' | translate }}</label>
                    <div class="at"><span>&#64;</span><input id="tg-user" [ngModel]="tgUser()" (ngModelChange)="tgUser.set($event)" name="tguser" [attr.placeholder]="'AICHATBOT.CHANNELS.T_F_USER_PH' | translate" autocomplete="off" spellcheck="false" /></div>
                  </div>
                  <div class="save-row">
                    <button type="button" class="save" [disabled]="tgSaving()" (click)="connectBot()">{{ (tgSaving() ? 'AICHATBOT.CHANNELS.T_CONNECTING' : 'AICHATBOT.CHANNELS.T_CONNECT') | translate }}</button>
                    @if (botConnected()) { <button type="button" class="ghost-btn" (click)="editToken.set(false)">{{ 'AICHATBOT.CHANNELS.CANCEL' | translate }}</button> }
                  </div>
                }
                @if (tgOk()) { <p class="ok-line">{{ tgOk() }}</p> }
                @if (tgErr()) { <p class="err-line">{{ tgErr() }}</p> }
              </section>

              <!-- Canal + agente + citas -->
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.ENABLE_TITLE' | translate }}</h3>
                <div class="tg-toggle only">
                  <div class="tg-tl"><b>{{ 'AICHATBOT.CHANNELS.T_TOGGLE' | translate }}</b><span class="ch-sub">{{ 'AICHATBOT.CHANNELS.T_TOGGLE_SUB' | translate }}</span></div>
                  <button type="button" class="tgl" [class.on]="channelOn()" (click)="channelOn.set(!channelOn())" [attr.aria-pressed]="channelOn()" [attr.aria-label]="'AICHATBOT.CHANNELS.T_TOGGLE_ARIA' | translate"><span></span></button>
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.HANDOFF_HINT' | translate"></p>

                <div class="save-row">
                  <button type="button" class="save" [disabled]="tgSaving()" (click)="saveTelegram()">{{ (tgSaving() ? 'AICHATBOT.CHANNELS.SAVING' : 'AICHATBOT.CHANNELS.SAVE_CHANNEL') | translate }}</button>
                  @if (tgOk()) { <span class="ok-msg">{{ tgOk() }}</span> }
                  @if (tgErr()) { <span class="err-msg">{{ tgErr() }}</span> }
                </div>
              </section>
              <ng-container [ngTemplateOutlet]="calCard"></ng-container>
            } @else if (channel() === 'whatsapp') {
              <!-- Conexión con Meta WhatsApp Cloud API -->
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.WA_CONNECT_TITLE' | translate }}</h3>
                <p class="muted" [innerHTML]="'AICHATBOT.CHANNELS.WA_CONNECT_SUB' | translate"></p>
                <ol class="tg-steps">
                  <li [innerHTML]="'AICHATBOT.CHANNELS.WA_S1' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.WA_S2' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.WA_S3' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.WA_S4' | translate"></li>
                </ol>

                <div class="field">
                  <label>{{ 'AICHATBOT.CHANNELS.F_CALLBACK' | translate }}</label>
                  <div class="code">
                    <pre>{{ waWebhookUrl() }}</pre>
                    <button type="button" class="copy" (click)="waCopy()">{{ (waCopied() ? 'AICHATBOT.CHANNELS.COPIED' : 'AICHATBOT.CHANNELS.COPY') | translate }}</button>
                  </div>
                </div>
                <div class="two">
                  <div class="field">
                    <label for="wa-pnid">{{ 'AICHATBOT.CHANNELS.F_PNID' | translate }}</label>
                    <input id="wa-pnid" [ngModel]="waPhoneId()" (ngModelChange)="waPhoneId.set($event)" name="wapnid" placeholder="123456789012345" autocomplete="off" spellcheck="false" />
                  </div>
                  <div class="field">
                    <label for="wa-verify">{{ 'AICHATBOT.CHANNELS.F_VERIFY' | translate }}</label>
                    <input id="wa-verify" [ngModel]="waVerifyTok()" (ngModelChange)="waVerifyTok.set($event)" name="waverify" [attr.placeholder]="'AICHATBOT.CHANNELS.F_VERIFY_PH' | translate" autocomplete="off" spellcheck="false" />
                  </div>
                </div>
                <div class="field">
                  <label for="wa-token">{{ 'AICHATBOT.CHANNELS.F_ACCESS' | translate }}</label>
                  <input id="wa-token" [ngModel]="waToken()" (ngModelChange)="waToken.set($event)" name="watoken" placeholder="EAAG…" autocomplete="off" spellcheck="false" />
                </div>
                <div class="field">
                  <label for="wa-secret">{{ 'AICHATBOT.CHANNELS.F_SECRET' | translate }}</label>
                  <input id="wa-secret" [ngModel]="metaSecret()" (ngModelChange)="metaSecret.set($event)" name="wasecret" [attr.placeholder]="'AICHATBOT.CHANNELS.F_SECRET_PH' | translate" autocomplete="off" spellcheck="false" />
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.SECRET_HINT' | translate"></p>
              </section>

              <!-- Canal + agente + citas -->
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.ENABLE_TITLE' | translate }}</h3>
                <div class="tg-toggle only">
                  <div class="tg-tl"><b>{{ 'AICHATBOT.CHANNELS.WA_TOGGLE' | translate }}</b><span class="ch-sub">{{ 'AICHATBOT.CHANNELS.WA_TOGGLE_SUB' | translate }}</span></div>
                  <button type="button" class="tgl" [class.on]="waChannelOn()" (click)="waChannelOn.set(!waChannelOn())" [attr.aria-pressed]="waChannelOn()" [attr.aria-label]="'AICHATBOT.CHANNELS.WA_TOGGLE_ARIA' | translate"><span></span></button>
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.HANDOFF_HINT' | translate"></p>

                <div class="save-row">
                  <button type="button" class="save" [disabled]="waSaving()" (click)="saveWhatsApp()">{{ (waSaving() ? 'AICHATBOT.CHANNELS.SAVING' : 'AICHATBOT.CHANNELS.SAVE_CHANNEL') | translate }}</button>
                  @if (waOk()) { <span class="ok-msg">{{ waOk() }}</span> }
                  @if (waErr()) { <span class="err-msg">{{ waErr() }}</span> }
                </div>
              </section>
              <ng-container [ngTemplateOutlet]="calCard"></ng-container>
            } @else if (channel() === 'messenger') {
              <!-- Conexión con Facebook Messenger -->
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.MS_CONNECT_TITLE' | translate }}</h3>
                <p class="muted" [innerHTML]="'AICHATBOT.CHANNELS.MS_CONNECT_SUB' | translate"></p>
                <ol class="tg-steps">
                  <li [innerHTML]="'AICHATBOT.CHANNELS.MS_S1' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.MS_S2' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.WA_S3' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.MS_S4' | translate"></li>
                </ol>
                <div class="field">
                  <label>{{ 'AICHATBOT.CHANNELS.F_CALLBACK' | translate }}</label>
                  <div class="code"><pre>{{ waWebhookUrl() }}</pre><button type="button" class="copy" (click)="waCopy()">{{ (waCopied() ? 'AICHATBOT.CHANNELS.COPIED' : 'AICHATBOT.CHANNELS.COPY') | translate }}</button></div>
                </div>
                <div class="two">
                  <div class="field">
                    <label for="ms-pid">{{ 'AICHATBOT.CHANNELS.MS_F_PAGE' | translate }}</label>
                    <input id="ms-pid" [ngModel]="msPageId()" (ngModelChange)="msPageId.set($event)" name="mspid" placeholder="1234567890" autocomplete="off" spellcheck="false" />
                  </div>
                  <div class="field">
                    <label for="ms-verify">{{ 'AICHATBOT.CHANNELS.F_VERIFY' | translate }}</label>
                    <input id="ms-verify" [ngModel]="msVerifyTok()" (ngModelChange)="msVerifyTok.set($event)" name="msverify" [attr.placeholder]="'AICHATBOT.CHANNELS.F_VERIFY_PH' | translate" autocomplete="off" spellcheck="false" />
                  </div>
                </div>
                <div class="field">
                  <label for="ms-token">{{ 'AICHATBOT.CHANNELS.F_PAGE_TOKEN' | translate }}</label>
                  <input id="ms-token" [ngModel]="msToken()" (ngModelChange)="msToken.set($event)" name="mstoken" placeholder="EAAG…" autocomplete="off" spellcheck="false" />
                </div>
                <div class="field">
                  <label for="ms-secret">{{ 'AICHATBOT.CHANNELS.F_SECRET' | translate }}</label>
                  <input id="ms-secret" [ngModel]="metaSecret()" (ngModelChange)="metaSecret.set($event)" name="mssecret" [attr.placeholder]="'AICHATBOT.CHANNELS.F_SECRET_PH' | translate" autocomplete="off" spellcheck="false" />
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.SECRET_HINT' | translate"></p>
              </section>
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.ENABLE_TITLE' | translate }}</h3>
                <div class="tg-toggle only">
                  <div class="tg-tl"><b>{{ 'AICHATBOT.CHANNELS.MS_TOGGLE' | translate }}</b><span class="ch-sub">{{ 'AICHATBOT.CHANNELS.MS_TOGGLE_SUB' | translate }}</span></div>
                  <button type="button" class="tgl" [class.on]="msOn()" (click)="msOn.set(!msOn())" [attr.aria-pressed]="msOn()" [attr.aria-label]="'AICHATBOT.CHANNELS.MS_TOGGLE_ARIA' | translate"><span></span></button>
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.HANDOFF_HINT' | translate"></p>
                <div class="save-row">
                  <button type="button" class="save" [disabled]="msSaving()" (click)="saveMessenger()">{{ (msSaving() ? 'AICHATBOT.CHANNELS.SAVING' : 'AICHATBOT.CHANNELS.SAVE_CHANNEL') | translate }}</button>
                  @if (msOk()) { <span class="ok-msg">{{ msOk() }}</span> }
                  @if (msErr()) { <span class="err-msg">{{ msErr() }}</span> }
                </div>
              </section>
              <ng-container [ngTemplateOutlet]="calCard"></ng-container>
            } @else if (channel() === 'instagram') {
              <!-- Conexión con Instagram -->
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.IG_CONNECT_TITLE' | translate }}</h3>
                <p class="muted" [innerHTML]="'AICHATBOT.CHANNELS.IG_CONNECT_SUB' | translate"></p>
                <ol class="tg-steps">
                  <li [innerHTML]="'AICHATBOT.CHANNELS.IG_S1' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.IG_S2' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.IG_S3' | translate"></li>
                  <li [innerHTML]="'AICHATBOT.CHANNELS.IG_S4' | translate"></li>
                </ol>
                <div class="field">
                  <label>{{ 'AICHATBOT.CHANNELS.F_CALLBACK' | translate }}</label>
                  <div class="code"><pre>{{ waWebhookUrl() }}</pre><button type="button" class="copy" (click)="waCopy()">{{ (waCopied() ? 'AICHATBOT.CHANNELS.COPIED' : 'AICHATBOT.CHANNELS.COPY') | translate }}</button></div>
                </div>
                <div class="two">
                  <div class="field">
                    <label for="ig-id">{{ 'AICHATBOT.CHANNELS.IG_F_ID' | translate }}</label>
                    <input id="ig-id" [ngModel]="igId()" (ngModelChange)="igId.set($event)" name="igid" placeholder="17841400000000000" autocomplete="off" spellcheck="false" />
                  </div>
                  <div class="field">
                    <label for="ig-verify">{{ 'AICHATBOT.CHANNELS.F_VERIFY' | translate }}</label>
                    <input id="ig-verify" [ngModel]="igVerifyTok()" (ngModelChange)="igVerifyTok.set($event)" name="igverify" [attr.placeholder]="'AICHATBOT.CHANNELS.F_VERIFY_PH' | translate" autocomplete="off" spellcheck="false" />
                  </div>
                </div>
                <div class="field">
                  <label for="ig-token">{{ 'AICHATBOT.CHANNELS.F_PAGE_TOKEN' | translate }}</label>
                  <input id="ig-token" [ngModel]="igToken()" (ngModelChange)="igToken.set($event)" name="igtoken" placeholder="EAAG…" autocomplete="off" spellcheck="false" />
                </div>
                <div class="field">
                  <label for="ig-secret">{{ 'AICHATBOT.CHANNELS.F_SECRET' | translate }}</label>
                  <input id="ig-secret" [ngModel]="metaSecret()" (ngModelChange)="metaSecret.set($event)" name="igsecret" [attr.placeholder]="'AICHATBOT.CHANNELS.F_SECRET_PH' | translate" autocomplete="off" spellcheck="false" />
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.SECRET_HINT' | translate"></p>
              </section>
              <section class="card">
                <h3 class="ch">{{ 'AICHATBOT.CHANNELS.ENABLE_TITLE' | translate }}</h3>
                <div class="tg-toggle only">
                  <div class="tg-tl"><b>{{ 'AICHATBOT.CHANNELS.IG_TOGGLE' | translate }}</b><span class="ch-sub">{{ 'AICHATBOT.CHANNELS.IG_TOGGLE_SUB' | translate }}</span></div>
                  <button type="button" class="tgl" [class.on]="igOn()" (click)="igOn.set(!igOn())" [attr.aria-pressed]="igOn()" [attr.aria-label]="'AICHATBOT.CHANNELS.IG_TOGGLE_ARIA' | translate"><span></span></button>
                </div>
                <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.HANDOFF_HINT' | translate"></p>
                <div class="save-row">
                  <button type="button" class="save" [disabled]="igSaving()" (click)="saveInstagram()">{{ (igSaving() ? 'AICHATBOT.CHANNELS.SAVING' : 'AICHATBOT.CHANNELS.SAVE_CHANNEL') | translate }}</button>
                  @if (igOk()) { <span class="ok-msg">{{ igOk() }}</span> }
                  @if (igErr()) { <span class="err-msg">{{ igErr() }}</span> }
                </div>
              </section>
              <ng-container [ngTemplateOutlet]="calCard"></ng-container>
            }
          </div>
        </main>
      </div>
    </div>

    <!--
      Tarjeta de Cal.com, compartida por todos los canales (los datos son los mismos).
      Si ya está configurada arranca CERRADA y con el distintivo verde de "Conectado";
      si falta algo, arranca abierta para que el usuario la complete.
    -->
    <ng-template #calCard>
      <section class="card acc" [class.done]="calConfigured()">
        <button type="button" class="acc-head" (click)="calOpen.set(!calOpen())" [attr.aria-expanded]="calOpen()">
          <span class="acc-ic cal" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </span>
          <span class="acc-tl">
            <b>{{ 'AICHATBOT.CHANNELS.CAL_TITLE' | translate }}</b>
            <span>{{ 'AICHATBOT.CHANNELS.CAL_SUB' | translate }}</span>
          </span>
          @if (calConfigured()) {
            <span class="status linked"><span class="sdot"></span>{{ 'AICHATBOT.CHANNELS.CAL_CONNECTED' | translate }}</span>
          } @else {
            <span class="status pending">{{ 'AICHATBOT.CHANNELS.CAL_PENDING' | translate }}</span>
          }
          <svg class="chev" [class.up]="calOpen()" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>

        @if (calOpen()) {
          <div class="acc-body">
            <p class="muted" [innerHTML]="'AICHATBOT.CHANNELS.CAL_INTRO' | translate"></p>

            <h4 class="sub">{{ 'AICHATBOT.CHANNELS.CAL_H_KEY' | translate }}</h4>
            <ol class="tg-steps">
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_K1' | translate"></li>
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_K2' | translate"></li>
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_K3' | translate"></li>
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_K4' | translate"></li>
            </ol>

            <h4 class="sub">{{ 'AICHATBOT.CHANNELS.CAL_H_EVENT' | translate }}</h4>
            <ol class="tg-steps">
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_E1' | translate"></li>
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_E2' | translate"></li>
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_E3' | translate"></li>
              <li [innerHTML]="'AICHATBOT.CHANNELS.CAL_E4' | translate"></li>
            </ol>
            <p class="hint" [innerHTML]="'AICHATBOT.CHANNELS.CAL_HINT' | translate"></p>

            <div class="two">
              <div class="field">
                <label for="cal-key">{{ 'AICHATBOT.CHANNELS.CAL_F_KEY' | translate }}</label>
                <input id="cal-key" [ngModel]="calKey()" (ngModelChange)="calKey.set($event)" name="calkey" placeholder="cal_live_…" autocomplete="off" spellcheck="false" />
              </div>
              <div class="field">
                <label for="cal-ev">{{ 'AICHATBOT.CHANNELS.CAL_F_EVENT' | translate }}</label>
                <input id="cal-ev" [ngModel]="calEvent()" (ngModelChange)="calEvent.set($event)" name="calev" placeholder="https://cal.com/tu-usuario/30min" autocomplete="off" spellcheck="false" />
              </div>
            </div>

            <div class="save-row">
              <button type="button" class="save" [disabled]="calTesting()" (click)="connectCal()">{{ (calTesting() ? 'AICHATBOT.CHANNELS.CAL_SAVING' : 'AICHATBOT.CHANNELS.CAL_SAVE') | translate }}</button>
              @if (calConfigured()) { <button type="button" class="ghost-btn" (click)="calOpen.set(false)">{{ 'AICHATBOT.CHANNELS.CLOSE' | translate }}</button> }
            </div>
            @if (calTestMsg()) { <p [class.ok-line]="calTestOk()" [class.err-line]="!calTestOk()">{{ calTestMsg() }}</p> }
          </div>
        }
      </section>
    </ng-template>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .layout { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 60px; max-width: 1120px; }
    .ch-head { display: flex; align-items: center; gap: 12px; }
    .ch-logo { display: inline-flex; color: var(--text-inv); opacity: .92; }
    .ch-logo svg { width: 26px; height: 26px; }
    .ch-head .eyebrow { margin: 0; }
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
    .tg-toggle.only { border-bottom: none; padding-bottom: 6px; }
    .tg-tl { min-width: 0; } .tg-tl b { display: block; font-size: 14.5px; } .ch-sub { font-size: 12.5px; color: var(--text-inv-2); }
    .tgl { width: 46px; height: 26px; border-radius: 999px; border: 1px solid var(--line-light); background: rgba(255,255,255,.08); position: relative; cursor: pointer; flex-shrink: 0; transition: background var(--dur, .2s) var(--ease, ease); }
    .tgl span { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform var(--dur, .2s) var(--ease, ease); }
    .tgl.on { background: var(--gold-bright); border-color: var(--gold-bright); } .tgl.on span { transform: translateX(20px); }
    .hint.mt { margin-top: 16px; }
    .status.linked { display: inline-flex; align-items: center; gap: 8px; color: #34e0a1; font-size: 13.5px; font-weight: 600; }
    .sdot { width: 9px; height: 9px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; }
    .ok-line { margin-top: 12px; font-size: 13px; color: var(--gold-soft); background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; }
    .err-line { margin-top: 12px; font-size: 13px; color: #ff8a8a; background: rgba(214,69,69,.1); padding: 10px 12px; border-radius: 10px; }
    /* Acordeón (Cal.com): cabecera clicable + cuerpo desplegable */
    .acc { padding: 0; overflow: hidden; }
    .acc.done { border-color: rgba(52,224,161,.28); }
    .acc-head { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: transparent; border: none;
      color: inherit; font: inherit; padding: 18px 22px; cursor: pointer; }
    .acc-head:hover { background: rgba(255,255,255,.02); }
    .acc-ic { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); }
    .acc.done .acc-ic { color: #34e0a1; background: rgba(52,224,161,.12); border-color: rgba(52,224,161,.3); }
    .acc-tl { flex: 1; min-width: 0; } .acc-tl b { display: block; font-size: 15px; } .acc-tl span { font-size: 12.5px; color: var(--text-inv-2); }
    .status.pending { font-size: 12.5px; font-weight: 600; color: var(--text-inv-2); }
    .chev { color: var(--text-inv-2); flex-shrink: 0; transition: transform .2s var(--ease, ease); }
    .chev.up { transform: rotate(180deg); }
    .acc-body { padding: 0 22px 22px; border-top: 1px solid var(--line-light); padding-top: 18px; }
    .sub { font-size: 13.5px; font-weight: 700; margin: 18px 0 8px; color: var(--text-inv); }
    .acc-body .two { margin-top: 18px; }

    @media (max-width: 980px) { .cfg-grid { grid-template-columns: 1fr; } .col-preview { order: -1; } .preview-sticky { position: static; } .pv-win { max-width: 360px; } }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 560px) { .wrap { padding: 30px 16px 40px; } .card { padding: 18px 16px; } .two { grid-template-columns: 1fr; } .save { width: 100%; } }
  `],
})
export class ChatbotChannelsComponent {
  private readonly route = inject(ActivatedRoute);
  readonly s = inject(ChatbotSessionService);
  private readonly sb = inject(SupabaseClientService).client;
  private readonly i18n = inject(TranslateService);

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
  readonly calKey = signal('');
  readonly calEvent = signal('');
  readonly tgSaving = signal(false);
  readonly tgOk = signal('');
  readonly tgErr = signal('');
  readonly editToken = signal(false);
  readonly botConnected = computed(() => !!this.tgUsername() || !!this.tgChatId());
  readonly calTesting = signal(false);
  readonly calTestMsg = signal('');
  readonly calTestOk = signal(false);
  /** Acordeón de Cal.com: cerrado cuando ya está configurado, abierto cuando falta algo. */
  readonly calOpen = signal(false);
  readonly calConfigured = computed(() => {
    const c = this.s.currentConfig();
    return !!(c && (c.calApiKey || '').trim() && (c.calEventType || '').trim());
  });
  // WhatsApp (Meta Cloud API)
  readonly waPhoneId = signal('');
  readonly waToken = signal('');
  readonly waVerifyTok = signal('');
  readonly waChannelOn = signal(false);
  readonly waSaving = signal(false);
  readonly waOk = signal('');
  readonly waErr = signal('');
  readonly waCopied = signal(false);
  readonly waWebhookUrl = computed(() => WORKER_URL + '/?c=' + (this.s.currentClientId() || 'TU-CLIENT-ID'));
  // Messenger (Facebook Page)
  readonly msPageId = signal('');
  readonly msToken = signal('');
  readonly msVerifyTok = signal('');
  readonly msOn = signal(false);
  readonly msSaving = signal(false);
  readonly msOk = signal('');
  readonly msErr = signal('');
  // Instagram
  readonly igId = signal('');
  readonly igToken = signal('');
  readonly igVerifyTok = signal('');
  readonly igOn = signal(false);
  readonly igSaving = signal(false);
  readonly igOk = signal('');
  readonly igErr = signal('');
  // App Secret de Meta (compartido por los canales de Meta; verifica la firma de los webhooks)
  readonly metaSecret = signal('');

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
    this.calKey.set(c.calApiKey || '');
    this.calEvent.set(c.calEventType || '');
    this.calOpen.set(!((c.calApiKey || '').trim() && (c.calEventType || '').trim()));
    this.waPhoneId.set(c.whatsappPhoneNumberId || '');
    this.waToken.set(c.whatsappAccessToken || '');
    this.waVerifyTok.set(c.whatsappVerifyToken || '');
    this.waChannelOn.set(!!c.whatsappChannelEnabled);
    this.msPageId.set(c.messengerPageId || '');
    this.msToken.set(c.messengerAccessToken || '');
    this.msVerifyTok.set(c.messengerVerifyToken || '');
    this.msOn.set(!!c.messengerChannelEnabled);
    this.igId.set(c.instagramAccountId || '');
    this.igToken.set(c.instagramAccessToken || '');
    this.igVerifyTok.set(c.instagramVerifyToken || '');
    this.igOn.set(!!c.instagramChannelEnabled);
    this.metaSecret.set(c.metaAppSecret || '');
  }

  readonly embed = computed(() => {
    const id = this.s.currentClientId() || 'TU-CLIENT-ID';
    return '<script src="https://www.wearevectis.com/assets/chatbot/widget.js"\n  data-client-id="' + id + '"\n  defer></script>';
  });

  // Vista previa
  previewColor(): string { return this.brandColor().trim() || '#E7AB2E'; }
  previewColor2(): string { return this.secondBrandColor().trim() || '#0A0A0A'; }
  previewBar(): string { return `linear-gradient(135deg, ${this.previewColor()}, ${this.previewColor2()})`; }
  previewTitle(): string { return this.widgetTitle().trim() || this.i18n.instant('AICHATBOT.CHANNELS.W_ASSISTANT'); }
  previewInitial(): string { return (this.previewTitle().trim()[0] || 'A').toUpperCase(); }
  previewWelcome(): string { return this.welcome().trim() || this.i18n.instant('AICHATBOT.CHANNELS.W_WELCOME_PH'); }
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
    if (!id) { this.err.set(this.i18n.instant('AICHATBOT.CHANNELS.E_SAVE_FIRST')); return; }
    const base = this.s.currentConfig();
    if (!base) { this.err.set(this.i18n.instant('AICHATBOT.CHANNELS.E_NO_CONFIG')); return; }
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
    this.savedMsg.set(this.i18n.instant('AICHATBOT.CHANNELS.SAVED'));
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
    if (!id) { this.tgErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_SAVE_FIRST')); return; }
    if (!this.tgToken().trim()) { this.tgErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_TG_TOKEN')); return; }
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
        this.tgOk.set(this.i18n.instant('AICHATBOT.CHANNELS.T_OK_CONNECTED'));
        this.syncLocal();
      } else {
        this.tgErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_TG_CONNECT') + ((j && j.error) || this.i18n.instant('AICHATBOT.CHANNELS.E_TG_CHECK_TOKEN')));
      }
    } catch (e) {
      this.tgErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_TG_CONNECT_GENERIC'));
    } finally { this.tgSaving.set(false); }
  }

  /** Activa/desactiva Telegram como canal, el handoff y guarda las credenciales de Cal.com. */
  async saveTelegram(): Promise<void> {
    this.tgErr.set(''); this.tgOk.set('');
    const id = this.s.currentClientId();
    if (!id) { this.tgErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_SAVE_FIRST')); return; }
    this.tgSaving.set(true);
    try {
      const patch: Record<string, unknown> = {
        telegram_channel_enabled: this.channelOn(),
        cal_api_key: this.calKey().trim() || null,
        cal_event_type: this.calEvent().trim() || null,
      };
      const { error } = await this.sb.from('chatbots').update(patch).eq('id', id);
      if (error) { this.tgErr.set(error.message); return; }
      this.syncLocal();
      this.tgOk.set(this.i18n.instant('AICHATBOT.CHANNELS.SAVED'));
      setTimeout(() => this.tgOk.set(''), 2500);
    } finally { this.tgSaving.set(false); }
  }

  /** Activa/guarda el canal de WhatsApp (credenciales de Meta) + credenciales de Cal.com. */
  async saveWhatsApp(): Promise<void> {
    this.waErr.set(''); this.waOk.set('');
    const id = this.s.currentClientId();
    if (!id) { this.waErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_SAVE_FIRST')); return; }
    this.waSaving.set(true);
    try {
      const patch: Record<string, unknown> = {
        whatsapp_channel_enabled: this.waChannelOn(),
        whatsapp_phone_number_id: this.waPhoneId().trim() || null,
        whatsapp_access_token: this.waToken().trim() || null,
        whatsapp_verify_token: this.waVerifyTok().trim() || null,
        meta_app_secret: this.metaSecret().trim() || null,
        cal_api_key: this.calKey().trim() || null,
        cal_event_type: this.calEvent().trim() || null,
      };
      const { error } = await this.sb.from('chatbots').update(patch).eq('id', id);
      if (error) { this.waErr.set(error.message); return; }
      this.syncLocal();
      this.waOk.set(this.i18n.instant('AICHATBOT.CHANNELS.SAVED'));
      setTimeout(() => this.waOk.set(''), 2500);
    } finally { this.waSaving.set(false); }
  }

  waCopy(): void {
    try { navigator.clipboard.writeText(this.waWebhookUrl()); } catch (e) { /* noop */ }
    this.waCopied.set(true);
    setTimeout(() => this.waCopied.set(false), 1800);
  }

  /** Activa/guarda el canal de Messenger (Facebook Page) + credenciales de Cal.com. */
  async saveMessenger(): Promise<void> {
    this.msErr.set(''); this.msOk.set('');
    const id = this.s.currentClientId();
    if (!id) { this.msErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_SAVE_FIRST')); return; }
    this.msSaving.set(true);
    try {
      const patch: Record<string, unknown> = {
        messenger_channel_enabled: this.msOn(),
        messenger_page_id: this.msPageId().trim() || null,
        messenger_access_token: this.msToken().trim() || null,
        messenger_verify_token: this.msVerifyTok().trim() || null,
        meta_app_secret: this.metaSecret().trim() || null,
        cal_api_key: this.calKey().trim() || null,
        cal_event_type: this.calEvent().trim() || null,
      };
      const { error } = await this.sb.from('chatbots').update(patch).eq('id', id);
      if (error) { this.msErr.set(error.message); return; }
      this.syncLocal();
      this.msOk.set(this.i18n.instant('AICHATBOT.CHANNELS.SAVED'));
      setTimeout(() => this.msOk.set(''), 2500);
    } finally { this.msSaving.set(false); }
  }

  /** Activa/guarda el canal de Instagram + credenciales de Cal.com. */
  async saveInstagram(): Promise<void> {
    this.igErr.set(''); this.igOk.set('');
    const id = this.s.currentClientId();
    if (!id) { this.igErr.set(this.i18n.instant('AICHATBOT.CHANNELS.E_SAVE_FIRST')); return; }
    this.igSaving.set(true);
    try {
      const patch: Record<string, unknown> = {
        instagram_channel_enabled: this.igOn(),
        instagram_account_id: this.igId().trim() || null,
        instagram_access_token: this.igToken().trim() || null,
        instagram_verify_token: this.igVerifyTok().trim() || null,
        meta_app_secret: this.metaSecret().trim() || null,
        cal_api_key: this.calKey().trim() || null,
        cal_event_type: this.calEvent().trim() || null,
      };
      const { error } = await this.sb.from('chatbots').update(patch).eq('id', id);
      if (error) { this.igErr.set(error.message); return; }
      this.syncLocal();
      this.igOk.set(this.i18n.instant('AICHATBOT.CHANNELS.SAVED'));
      setTimeout(() => this.igOk.set(''), 2500);
    } finally { this.igSaving.set(false); }
  }

  /**
   * Guarda las credenciales de Cal.com y comprueba la conexión de una vez.
   * Si la conexión queda bien, cierra el acordeón: el usuario ve el distintivo verde
   * y no tiene que volver a tocar esta sección.
   */
  async connectCal(): Promise<void> {
    const id = this.s.currentClientId();
    if (!id) { this.calTestOk.set(false); this.calTestMsg.set(this.i18n.instant('AICHATBOT.CHANNELS.E_SAVE_FIRST')); return; }
    this.calTesting.set(true); this.calTestMsg.set('');
    try {
      // Guarda exactamente lo que está en pantalla para probar eso.
      await this.sb.from('chatbots').update({ cal_api_key: this.calKey().trim() || null, cal_event_type: this.calEvent().trim() || null }).eq('id', id);
      this.syncLocal();
      const at = (await this.sb.auth.getSession()).data.session?.access_token;
      const res = await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cal_diag', client_id: id, access_token: at }),
      });
      const j = await res.json();
      if (!j || j.error) { this.calTestOk.set(false); this.calTestMsg.set(this.i18n.instant('AICHATBOT.CHANNELS.CAL_E_NO_VERIFY', { code: (j && j.error) || res.status })); }
      else if (!j.configured) { this.calTestOk.set(false); this.calTestMsg.set(this.i18n.instant(j.hasApiKey ? 'AICHATBOT.CHANNELS.CAL_E_NO_EVENT' : 'AICHATBOT.CHANNELS.CAL_E_NO_KEY')); }
      else if (!j.slotCount) { this.calTestOk.set(false); this.calTestMsg.set(this.i18n.instant('AICHATBOT.CHANNELS.CAL_E_NO_SLOTS')); }
      else {
        this.calTestOk.set(true);
        this.calTestMsg.set(this.i18n.instant('AICHATBOT.CHANNELS.CAL_OK', { n: j.slotCount, sample: (j.sample || []).join(' · ') }));
        setTimeout(() => this.calOpen.set(false), 1200);   // deja ver el mensaje y cierra
      }
    } catch (e) {
      this.calTestOk.set(false); this.calTestMsg.set(this.i18n.instant('AICHATBOT.CHANNELS.CAL_E_GENERIC'));
    } finally { this.calTesting.set(false); }
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
        calApiKey: this.calKey().trim(),
        calEventType: this.calEvent().trim(),
        whatsappChannelEnabled: this.waChannelOn(),
        whatsappPhoneNumberId: this.waPhoneId().trim(),
        whatsappAccessToken: this.waToken().trim(),
        whatsappVerifyToken: this.waVerifyTok().trim(),
        metaAppSecret: this.metaSecret().trim(),
        messengerChannelEnabled: this.msOn(),
        messengerPageId: this.msPageId().trim(),
        messengerAccessToken: this.msToken().trim(),
        messengerVerifyToken: this.msVerifyTok().trim(),
        instagramChannelEnabled: this.igOn(),
        instagramAccountId: this.igId().trim(),
        instagramAccessToken: this.igToken().trim(),
        instagramVerifyToken: this.igVerifyTok().trim(),
      };
      this.s.configs.set(cfgs);
    }
  }

  /**
   * Título y descripción de cada canal. Guardamos CLAVES de idioma, no texto:
   * la plantilla las pasa por | translate. Todos los canales están operativos,
   * así que ya no hay textos de "en preparación".
   */
  private readonly META: Record<string, { title: string; lead: string }> = {
    web: { title: 'AICHATBOT.CHANNELS.M_WEB_T', lead: 'AICHATBOT.CHANNELS.M_WEB_L' },
    whatsapp: { title: 'AICHATBOT.CHANNELS.M_WA_T', lead: 'AICHATBOT.CHANNELS.M_WA_L' },
    instagram: { title: 'AICHATBOT.CHANNELS.M_IG_T', lead: 'AICHATBOT.CHANNELS.M_IG_L' },
    messenger: { title: 'AICHATBOT.CHANNELS.M_MS_T', lead: 'AICHATBOT.CHANNELS.M_MS_L' },
    telegram: { title: 'AICHATBOT.CHANNELS.M_TG_T', lead: 'AICHATBOT.CHANNELS.M_TG_L' },
  };
  readonly meta = computed(() => this.META[this.channel()] || this.META['web']);
}
