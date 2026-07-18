import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService } from './session.service';
import { ChatbotAuthService } from './auth.service';
import { SupabaseClientService } from './supabase.client';
import { PaddleService } from './paddle.service';
import { FocusTrapDirective } from './focus-trap.directive';

/**
 * /account — Administrar cuenta (UI). Información básica, editar perfil,
 * reset de contraseña y eliminar cuenta.
 */
@Component({
  selector: 'app-chatbot-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, FocusTrapDirective, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <app-chatbot-version-footer></app-chatbot-version-footer>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <h1 class="ttl">{{ 'AICHATBOT.ACCOUNT.TITLE' | translate }}</h1>

            <!-- INFORMACIÓN -->
            <section class="card">
              <div class="card-head">
                <h3>{{ 'AICHATBOT.ACCOUNT.INFO' | translate }}</h3>
                @if (!editing()) {
                  <button type="button" class="pencil" (click)="startEdit()" [attr.aria-label]="'AICHATBOT.ACCOUNT.EDIT' | translate">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                    {{ 'AICHATBOT.ACCOUNT.EDIT' | translate }}
                  </button>
                }
              </div>

              @if (saveErr()) { <p class="err">{{ 'AICHATBOT.ACCOUNT.SAVE_FAIL' | translate }}</p> }
              @if (saveOk() && !editing()) { <p class="okmsg" role="status">{{ 'AICHATBOT.ACCOUNT.SAVED' | translate }}</p> }
              @if (!editing()) {
                <div class="rows">
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.FIRST_NAME' | translate }}</span><span class="v">{{ s.firstName() }}</span></div>
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.LAST_NAME' | translate }}</span><span class="v">{{ s.lastName() }}</span></div>
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.EMAIL' | translate }}</span><span class="v">{{ s.email() }}</span></div>
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.PHONE' | translate }}</span><span class="v">{{ s.phone() || '—' }}</span></div>
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.LANGUAGE' | translate }}</span><span class="v">{{ (s.preferredLang() === 'es' ? 'AICHATBOT.ACCOUNT.LANG_ES' : 'AICHATBOT.ACCOUNT.LANG_EN') | translate }}</span></div>
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.PLAN' | translate }}</span><span class="v">@if (s.hasPlan()) { <span class="tag">{{ s.planName() }}</span> } @else { <span class="muted-v">{{ 'AICHATBOT.ACCOUNT.NO_PLAN_TAG' | translate }}</span> }</span></div>
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.CREATED' | translate }}</span><span class="v">{{ s.createdAt() }}</span></div>
                  <div class="r"><span class="k">{{ 'AICHATBOT.ACCOUNT.EXPIRY' | translate }}</span><span class="v">{{ s.hasPlan() ? s.planExpiry() : '—' }}</span></div>
                </div>
              } @else {
                <form class="rows edit" (ngSubmit)="saveEdit()">
                  <div class="two">
                    <div class="field"><label>{{ 'AICHATBOT.ACCOUNT.FIRST_NAME' | translate }}</label><input name="fn" [(ngModel)]="fn" /></div>
                    <div class="field"><label>{{ 'AICHATBOT.ACCOUNT.LAST_NAME' | translate }}</label><input name="ln" [(ngModel)]="ln" /></div>
                  </div>
                  <div class="two">
                    <div class="field"><label>{{ 'AICHATBOT.ACCOUNT.PHONE' | translate }}</label>
                      <div class="phone-row">
                        <select name="pcode" [(ngModel)]="phoneCode" class="pcode" aria-label="Código de país">
                          <option value="">{{ 'AICHATBOT.ACCOUNT.PHONE_CODE_PH' | translate }}</option>
                          @for (c of phoneCodes; track c.code) { <option [value]="c.code">{{ c.flag }} {{ c.code }}</option> }
                        </select>
                        <input name="ph" type="tel" inputmode="tel" [ngModel]="phoneNum" (ngModelChange)="onPhone($event)" placeholder="8888 8888" />
                      </div>
                      @if (phoneErr()) { <p class="err">{{ 'AICHATBOT.ACCOUNT.PHONE_CODE_REQ' | translate }}</p> }
                    </div>
                    <div class="field"><label>{{ 'AICHATBOT.ACCOUNT.LANGUAGE' | translate }}</label>
                      <select name="lg" [(ngModel)]="lg">
                        <option value="es">{{ 'AICHATBOT.ACCOUNT.LANG_ES' | translate }}</option>
                        <option value="en">{{ 'AICHATBOT.ACCOUNT.LANG_EN' | translate }}</option>
                      </select></div>
                  </div>
                  @if (saveErr()) { <p class="err">{{ 'AICHATBOT.ACCOUNT.SAVE_FAIL' | translate }}</p> }
                  <div class="form-actions">
                    <button type="button" class="btn-ghost sm" (click)="editing.set(false)">{{ 'AICHATBOT.ACCOUNT.CANCEL' | translate }}</button>
                    <button type="submit" class="btn-gold sm" [disabled]="saving()">{{ 'AICHATBOT.ACCOUNT.SAVE' | translate }}</button>
                  </div>
                </form>
              }
            </section>

            <!-- CHATBOTS ACTIVOS -->
            <section class="card">
              <h3>{{ 'AICHATBOT.ACCOUNT.CHATBOTS' | translate }}</h3>
              @if (s.companies().length) {
                <ul class="chats">
                  @for (c of s.companies(); track $index) {
                    <li><span class="chip" [class.paused]="!s.subscriptionActive() || !s.isActiveAt($index)">
                      {{ c }}
                      @if (!s.subscriptionActive()) { <span class="pz">· {{ 'AICHATBOT.ACCOUNT.PAUSED_TAG' | translate }}</span> }
                      @else if (!s.isActiveAt($index)) { <span class="pz">· {{ 'AICHATBOT.ACCOUNT.INACTIVE_TAG' | translate }}</span> }
                      @else { <span class="az">· {{ 'AICHATBOT.ACCOUNT.ACTIVE_TAG' | translate }}</span> }
                    </span></li>
                  }
                </ul>
                <a class="btn-ghost sm manage-link" routerLink="/manage">{{ 'AICHATBOT.ACCOUNT.MANAGE_CHATBOTS' | translate }}</a>
              } @else { <p class="empty">{{ 'AICHATBOT.ACCOUNT.NO_CHATBOTS' | translate }}</p> }
            </section>

            <!-- SUSCRIPCIÓN -->
            <section class="card">
              <h3>{{ 'AICHATBOT.ACCOUNT.SUBSCRIPTION' | translate }}</h3>
              @if (!s.hasPlan()) {
                <!-- Sin plan elegido todavía -->
                <p class="sub-info">{{ 'AICHATBOT.ACCOUNT.NO_PLAN' | translate }}</p>
                <a class="btn-gold sm resub" routerLink="/plans">{{ 'AICHATBOT.ACCOUNT.CHOOSE_PLAN' | translate }}</a>
              } @else if (s.cancelAtPeriodEnd()) {
                <p class="sub-info">{{ 'AICHATBOT.ACCOUNT.SUB_INFO' | translate:{ plan: s.planName(), date: s.planExpiry() } }}</p>
                <p class="okmsg" role="status" aria-live="polite">{{ 'AICHATBOT.ACCOUNT.CANCELLED_MSG' | translate:{ date: s.planExpiry() } }}</p>
                <a class="btn-gold sm resub" routerLink="/plans">{{ 'AICHATBOT.ACCOUNT.RESUBSCRIBE' | translate }}</a>
              } @else if (s.planExpired()) {
                <!-- Plan vencido -->
                <p class="sub-info expired">{{ 'AICHATBOT.ACCOUNT.SUB_EXPIRED' | translate:{ plan: s.planName(), date: s.planExpiry() } }}</p>
                <a class="btn-gold sm resub" routerLink="/plans">{{ 'AICHATBOT.ACCOUNT.RENEW_PLAN' | translate }}</a>
              } @else {
                <p class="sub-info">{{ 'AICHATBOT.ACCOUNT.SUB_INFO' | translate:{ plan: s.planName(), date: s.planExpiry() } }}</p>
                <div class="sub-actions">
                  <a class="btn-gold sm resub" routerLink="/plans">{{ 'AICHATBOT.ACCOUNT.CHANGE_PLAN' | translate }}</a>
                  @if (paddle.configured()) {
                    <button type="button" class="btn-ghost sm" (click)="openBillingPortal()" [disabled]="portalBusy()">{{ (portalBusy() ? 'AICHATBOT.ACCOUNT.PORTAL_LOADING' : 'AICHATBOT.ACCOUNT.BILLING_PORTAL') | translate }}</button>
                  }
                  <button type="button" class="btn-ghost sm" (click)="confirmKind.set('cancel')">{{ 'AICHATBOT.ACCOUNT.CANCEL_SUB' | translate }}</button>
                </div>
                @if (portalErr()) { <p class="err">{{ portalErr() }}</p> }
              }
            </section>

            <!-- SEGURIDAD -->
            <section class="card">
              <h3>{{ 'AICHATBOT.ACCOUNT.SECURITY' | translate }}</h3>
              @if (!pwdOpen()) {
                <button type="button" class="btn-ghost sm" (click)="pwdOpen.set(true)">{{ 'AICHATBOT.ACCOUNT.RESET_PASSWORD' | translate }}</button>
              } @else {
                <form class="rows" (ngSubmit)="savePwd()">
                  <div class="field"><label>{{ 'AICHATBOT.ACCOUNT.CURRENT_PASS' | translate }}</label>
                    <div class="pass-wrap">
                      <input [type]="showPwd() ? 'text' : 'password'" name="cp" [(ngModel)]="curPass" />
                      <button type="button" class="eye" (click)="showPwd.set(!showPwd())" [class.on]="showPwd()" [attr.aria-label]="(showPwd() ? 'AICHATBOT.LOGIN.HIDE_PASS' : 'AICHATBOT.LOGIN.SHOW_PASS') | translate" [attr.aria-pressed]="showPwd()">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="two">
                    <div class="field"><label>{{ 'AICHATBOT.ACCOUNT.NEW_PASS' | translate }}</label>
                      <div class="pass-wrap">
                        <input [type]="showPwd() ? 'text' : 'password'" name="np" [(ngModel)]="newPass" />
                        <button type="button" class="eye" (click)="showPwd.set(!showPwd())" [class.on]="showPwd()" [attr.aria-label]="(showPwd() ? 'AICHATBOT.LOGIN.HIDE_PASS' : 'AICHATBOT.LOGIN.SHOW_PASS') | translate" [attr.aria-pressed]="showPwd()">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                    </div>
                    <div class="field"><label>{{ 'AICHATBOT.ACCOUNT.CONFIRM_PASS' | translate }}</label>
                      <div class="pass-wrap">
                        <input [type]="showPwd() ? 'text' : 'password'" name="cf" [(ngModel)]="confirmPass" />
                        <button type="button" class="eye" (click)="showPwd.set(!showPwd())" [class.on]="showPwd()" [attr.aria-label]="(showPwd() ? 'AICHATBOT.LOGIN.HIDE_PASS' : 'AICHATBOT.LOGIN.SHOW_PASS') | translate" [attr.aria-pressed]="showPwd()">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  @if (pwdErr()) { <p class="err">{{ pwdErr() }}</p> }
                  @if (pwdOk()) { <p class="okmsg">{{ 'AICHATBOT.ACCOUNT.PASS_SUCCESS' | translate }}</p> }
                  <div class="form-actions">
                    <button type="button" class="btn-ghost sm" (click)="closePwd()">{{ 'AICHATBOT.ACCOUNT.PASS_CLOSE' | translate }}</button>
                    <button type="submit" class="btn-gold sm" [disabled]="pwdBusy()">{{ (pwdBusy() ? 'AICHATBOT.ACCOUNT.PASS_SAVING' : 'AICHATBOT.ACCOUNT.PASS_SAVE') | translate }}</button>
                  </div>
                </form>
              }

              <div class="danger-zone">
                <button type="button" class="btn-danger sm" (click)="confirmKind.set('delete')">{{ 'AICHATBOT.ACCOUNT.DELETE' | translate }}</button>
              </div>
            </section>

            <p class="legal-links">
              {{ 'AICHATBOT.ACCOUNT.LEGAL_INTRO' | translate }}
              <a routerLink="/privacy">{{ 'AICHATBOT.ACCOUNT.PRIVACY_LINK' | translate }}</a>
              <span aria-hidden="true"> · </span>
              <a routerLink="/terms">{{ 'AICHATBOT.ACCOUNT.TERMS_LINK' | translate }}</a>
              <span aria-hidden="true"> · </span>
              <a routerLink="/refounds">{{ 'AICHATBOT.ACCOUNT.REFUNDS_LINK' | translate }}</a>
            </p>
          </div>
        </main>
      </div>

      <!-- Confirmación destructiva -->
      @if (confirmKind(); as kind) {
        <div class="modal-bg" (click)="confirmKind.set(null)">
          <div class="modal" role="alertdialog" aria-modal="true" appFocusTrap (dismiss)="confirmKind.set(null)" (click)="$event.stopPropagation()">
            <div class="warn-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 22h20L12 2z"/><path d="M12 9v5M12 18h.01"/></svg></div>
            <h3>{{ (kind === 'delete' ? 'AICHATBOT.ACCOUNT.CONFIRM_DELETE_TITLE' : 'AICHATBOT.ACCOUNT.CONFIRM_CANCEL_TITLE') | translate }}</h3>
            <p>{{ (kind === 'delete' ? 'AICHATBOT.ACCOUNT.CONFIRM_DELETE_BODY' : 'AICHATBOT.ACCOUNT.CONFIRM_CANCEL_BODY') | translate }}</p>
            @if (confirmErr()) { <p class="err">{{ confirmErr() }}</p> }
            <div class="form-actions center">
              <button type="button" class="btn-ghost sm" (click)="confirmKind.set(null)">{{ 'AICHATBOT.ACCOUNT.CONFIRM_NO' | translate }}</button>
              <button type="button" class="btn-danger sm" [disabled]="confirmBusy()" (click)="confirmYes(kind)">{{ (kind === 'delete' ? 'AICHATBOT.ACCOUNT.CONFIRM_DELETE_YES' : 'AICHATBOT.ACCOUNT.CONFIRM_CANCEL_YES') | translate }}</button>
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
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 60px; max-width: 820px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-bottom: 22px; }

    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 22px; margin-bottom: 18px; }
    .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .card h3 { font-size: 16px; margin-bottom: 16px; }
    .pencil { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv); border-radius: var(--radius-pill); padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .pencil:hover { background: rgba(255,255,255,.1); }
    .pencil svg { color: var(--gold-bright); }

    .rows { display: grid; gap: 2px; margin-top: 10px; }
    .r { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid var(--line-light); }
    .r:last-child { border-bottom: none; }
    .k { color: var(--text-inv-2); font-size: 13.5px; }
    .v { font-size: 14.5px; font-weight: 500; text-align: right; }
    .tag { font-size: 11px; padding: 3px 10px; border-radius: 999px; background: rgba(231,171,46,.16); color: var(--gold-bright); }

    .edit { gap: 14px; margin-top: 14px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin-bottom: 6px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    input, select { width: 100%; padding: 11px 13px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; }
    input:focus, select:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    select option { color: #111; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }

    .chats { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 10px; }
    .chip { display: inline-block; padding: 8px 14px; border-radius: var(--radius-pill); background: rgba(255,255,255,.05); border: 1px solid var(--line-light); font-size: 14px; }
    .chip.paused { border-color: rgba(214,69,69,.45); color: var(--text-inv-2); }
    .resub { display: inline-block; margin-top: 12px; padding: 10px 18px; text-decoration: none; }
    .chip .pz { color: #ff8a8a; font-size: 12px; font-weight: 600; margin-left: 4px; }
    .chip .az { color: #34e0a1; font-size: 12px; font-weight: 600; margin-left: 4px; }
    .manage-link { display: inline-block; margin-top: 14px; padding: 9px 16px; text-decoration: none; }
    .sub-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .sub-actions .resub { margin-top: 0; }
    .empty { color: var(--text-inv-2); font-size: 14px; margin: 12px 0 0; }

    .btn-gold { border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 6px 18px rgba(231,171,46,.3); }
    .btn-ghost { background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv); border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 600; }
    .btn-danger { background: rgba(214,69,69,.12); border: 1px solid rgba(214,69,69,.5); color: #ff8a8a; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 600; }
    .btn-danger:hover { background: rgba(214,69,69,.2); }
    .legal-links { margin: 24px 0 8px; font-size: 13px; color: var(--text-inv-2); }
    .legal-links a { color: var(--gold-bright); font-weight: 600; }
    .legal-links a:hover { text-decoration: underline; }
    .sm { padding: 9px 16px; font-size: 13.5px; }
    .err { color: #ff8a8a; font-size: 13px; margin: 0; }
    .okmsg { font-size: 13px; color: var(--gold-soft); background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; margin: 0; }
    .danger-zone { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line-light); }
    .sub-info { color: var(--text-inv-2); font-size: 14px; margin: 0 0 14px; }
    .sub-info.expired { color: #ff8a8a; font-weight: 600; }
    .muted-v { color: var(--text-inv-2); font-size: 13px; }
    .phone-row { display: flex; gap: 8px; }
    .phone-row .pcode { width: 110px; flex-shrink: 0; }
    .pass-wrap { position: relative; }
    .pass-wrap input { padding-right: 44px; }
    .eye { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--text-inv-2); cursor: pointer; padding: 7px; display: grid; place-items: center; border-radius: 8px; }
    .eye:hover { color: var(--text-inv); background: rgba(255,255,255,.06); }
    .eye.on { color: var(--gold-bright); }

    /* modal confirmación */
    .modal-bg { position: absolute; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(3px); display: grid; place-items: center; padding: 20px; z-index: 60; }
    .modal { position: relative; width: 100%; max-width: 460px; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 28px; box-shadow: 0 30px 80px rgba(0,0,0,.6); text-align: center; }
    .modal h3 { font-size: 20px; margin: 14px 0 8px; }
    .modal p { color: var(--text-inv-2); font-size: 14.5px; line-height: 1.6; }
    .warn-ic { width: 54px; height: 54px; margin: 0 auto; border-radius: 50%; display: grid; place-items: center; color: #ff8a8a; background: rgba(214,69,69,.12); border: 1px solid rgba(214,69,69,.4); }
    .form-actions.center { justify-content: center; margin-top: 22px; }

    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 600px) { .two { grid-template-columns: 1fr; } }
  `],
})
export class ChatbotAccountComponent implements OnInit {
  private title = inject(Title);
  private router = inject(Router);
  private auth = inject(ChatbotAuthService);
  private sb = inject(SupabaseClientService).client;
  private i18n = inject(TranslateService);
  readonly s = inject(ChatbotSessionService);
  readonly paddle = inject(PaddleService);

  portalBusy = signal(false);
  portalErr = signal('');
  editing = signal(false);
  pwdOpen = signal(false);
  pwdErr = signal('');     // mensaje de error (vacío = sin error)
  pwdOk = signal(false);
  pwdBusy = signal(false);
  confirmKind = signal<'delete' | 'cancel' | null>(null);
  confirmBusy = signal(false);
  confirmErr = signal('');
  showPwd = signal(false);

  /** Abre el portal de Paddle (pago/facturas/cancelar) en una sesión autenticada. */
  async openBillingPortal(): Promise<void> {
    if (this.portalBusy()) return;
    this.portalErr.set('');
    this.portalBusy.set(true);
    const url = await this.paddle.customerPortalUrl();
    this.portalBusy.set(false);
    if (url) { window.location.href = url; }
    else { this.portalErr.set(this.i18n.instant('AICHATBOT.ACCOUNT.PORTAL_FAIL')); }
  }

  fn = ''; ln = ''; lg: 'es' | 'en' = 'es';
  phoneCode = ''; phoneNum = '';
  phoneErr = signal(false);
  saveErr = signal(false);
  saveOk = signal(false);
  saving = signal(false);
  curPass = ''; newPass = ''; confirmPass = '';

  readonly phoneCodes = [
    { code: '+506', flag: '🇨🇷' }, { code: '+1', flag: '🇺🇸' }, { code: '+52', flag: '🇲🇽' },
    { code: '+57', flag: '🇨🇴' }, { code: '+51', flag: '🇵🇪' }, { code: '+56', flag: '🇨🇱' },
    { code: '+54', flag: '🇦🇷' }, { code: '+593', flag: '🇪🇨' }, { code: '+502', flag: '🇬🇹' },
    { code: '+503', flag: '🇸🇻' }, { code: '+504', flag: '🇭🇳' }, { code: '+505', flag: '🇳🇮' },
    { code: '+507', flag: '🇵🇦' }, { code: '+34', flag: '🇪🇸' },
  ];

  ngOnInit(): void { this.title.setTitle('Mi cuenta — Vectis AI ChatBot'); }

  onPhone(v: string): void { this.phoneNum = v.replace(/[^\d\s]/g, ''); }

  startEdit(): void {
    this.fn = this.s.firstName(); this.ln = this.s.lastName(); this.lg = this.s.preferredLang();
    this.phoneErr.set(false); this.saveErr.set(false); this.saveOk.set(false);
    // Detecta el código de país por prefijo (el más largo primero, p. ej. +506 antes de +1).
    const full = this.s.phone().trim();
    const found = [...this.phoneCodes].sort((a, b) => b.code.length - a.code.length).find((c) => full.startsWith(c.code));
    if (found) { this.phoneCode = found.code; this.phoneNum = full.slice(found.code.length).replace(/[^\d\s]/g, '').trim(); }
    else { this.phoneCode = ''; this.phoneNum = full.replace(/[^\d\s]/g, '').trim(); }
    this.editing.set(true);
  }
  async saveEdit(): Promise<void> {
    const num = this.phoneNum.trim();
    // Si hay número, exige código de país. (Sin número se guarda vacío.)
    if (num && !this.phoneCode) { this.phoneErr.set(true); return; }
    this.phoneErr.set(false); this.saveErr.set(false); this.saveOk.set(false);
    const phone = num ? `${this.phoneCode} ${num}` : '';

    // 1) UX inmediata: refleja en la sesión y cambia el idioma YA (no depende de la base).
    this.s.setAccount({ firstName: this.fn.trim(), lastName: this.ln.trim(), phone, lang: this.lg });
    this.auth.applyLang(this.lg);
    this.editing.set(false);

    // 2) Persiste en la base. Detecta si RLS/permiso rechaza el cambio (0 filas o error).
    const uid = this.auth.user()?.id;
    if (!uid) { this.saveErr.set(true); return; }
    this.saving.set(true);
    try {
      const { data, error } = await this.sb.from('profiles')
        .update({ first_name: this.fn.trim(), last_name: this.ln.trim(), phone, preferred_lang: this.lg })
        .eq('id', uid)
        .select('id');
      if (error || !data || !data.length) this.saveErr.set(true);
      else this.saveOk.set(true);
    } catch { this.saveErr.set(true); }
    this.saving.set(false);
  }

  async savePwd(): Promise<void> {
    this.pwdOk.set(false); this.pwdErr.set('');
    if (this.newPass.length < 8) { this.pwdErr.set('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (this.newPass !== this.confirmPass) { this.pwdErr.set('Las contraseñas no coinciden.'); return; }
    this.pwdBusy.set(true);
    // Verificar la contraseña actual reautenticando.
    const { error: signErr } = await this.auth.signIn(this.s.email(), this.curPass);
    if (signErr) { this.pwdBusy.set(false); this.pwdErr.set('La contraseña actual es incorrecta.'); return; }
    const { error } = await this.auth.updatePassword(this.newPass);
    this.pwdBusy.set(false);
    if (error) {
      const m = error.message || '';
      if (/current password required|reauthentication|reauthenticate/i.test(m)) {
        this.pwdErr.set('No se pudo cambiar la contraseña por una configuración de seguridad de Supabase ("Secure password change"). Desactívala en Authentication → Email.');
      } else if (/different from the old password|should be different/i.test(m)) {
        this.pwdErr.set('La nueva contraseña debe ser distinta a la actual.');
      } else {
        this.pwdErr.set(m);
      }
      return;
    }
    this.pwdOk.set(true);
    this.curPass = ''; this.newPass = ''; this.confirmPass = '';
  }
  closePwd(): void { this.pwdOpen.set(false); this.pwdErr.set(''); this.pwdOk.set(false); }

  async confirmYes(kind: 'delete' | 'cancel'): Promise<void> {
    if (kind === 'delete') {
      // Elimina la cuenta de verdad (datos + auth), luego cierra sesión.
      this.confirmBusy.set(true);
      this.confirmErr.set('');
      const { error } = await this.sb.rpc('delete_my_account');
      if (error) {
        this.confirmBusy.set(false);
        this.confirmErr.set(this.i18n.instant('AICHATBOT.ACCOUNT.DELETE_FAIL'));
        return;
      }
      try { await this.auth.signOut(); } catch { /* noop */ }
      this.s.reset();
      this.confirmBusy.set(false);
      this.confirmKind.set(null);
      this.router.navigate(['/'], { queryParams: { deleted: '1' } });
    } else {
      // Cancelar suscripción al final del período: el acceso sigue hasta el vencimiento.
      this.confirmBusy.set(true);
      this.confirmErr.set('');
      let ok = false;
      if (this.paddle.configured()) {
        // Cancela DE VERDAD en Paddle (agenda el fin al próximo período → frena el cobro).
        try {
          const { data, error } = await this.sb.functions.invoke('paddle-cancel', { body: {} });
          ok = !error && !!(data as { ok?: boolean } | null)?.ok;
        } catch { ok = false; }
      } else {
        // Sin Paddle configurado (desarrollo): solo marca local.
        const uid = this.auth.user()?.id;
        if (uid) { const { error } = await this.sb.from('profiles').update({ cancel_at_period_end: true }).eq('id', uid); ok = !error; }
      }
      if (ok) {
        this.s.cancelAtPeriodEnd.set(true);
        this.confirmBusy.set(false);
        this.confirmKind.set(null);
      } else {
        this.confirmBusy.set(false);
        this.confirmErr.set(this.i18n.instant('AICHATBOT.ACCOUNT.CANCEL_FAIL'));
      }
    }
  }
}
