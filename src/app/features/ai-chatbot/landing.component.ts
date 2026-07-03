import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotSessionService, PlanId } from './session.service';
import { ChatbotAuthService } from './auth.service';
import { ScrollService } from '../../core/services/scroll.service';

type Mode = 'login' | 'signup' | 'forgot';

interface Plan {
  id: PlanId;
  popular: boolean;
  nameKey: string;
  price: string;
  taglineKey: string;
  features: string[];
}

/**
 * /ai-chatbot — Hero del producto (izquierda) + tarjeta de auth (derecha):
 * login / crear cuenta / recuperar contraseña. Pass-through: navega a /plans.
 */
@Component({
  selector: 'app-chatbot-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    @if (loggedIn()) {
      <section class="loadscreen">
        <div class="ls-inner">
          <span class="spinner" aria-hidden="true"></span>
          <p class="ls-text">{{ 'AICHATBOT.LANDING.SESSION_ACTIVE' | translate }}</p>
        </div>
      </section>
    } @else if (ready()) {
    <section class="cbp">
      <div class="grid" aria-hidden="true"></div>
      <div class="glow" aria-hidden="true"></div>

      <div class="inner container">
        <!-- HERO -->
        <div class="hero">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.HERO.EYEBROW' | translate }}</span>
          <h1 class="title">{{ 'AICHATBOT.HERO.TITLE' | translate }}</h1>
          <p class="lead on-dark">{{ 'AICHATBOT.HERO.SUBTITLE' | translate }}</p>
          <p class="sub2 on-dark">{{ 'AICHATBOT.HERO.SUBTITLE2' | translate }}</p>
          <ul class="feats">
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.HERO.B1' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.HERO.B2' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.HERO.B3' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.HERO.B4' | translate }}</li>
            <li><span class="dot" aria-hidden="true"></span>{{ 'AICHATBOT.HERO.B5' | translate }}</li>
          </ul>
          <div class="chips" aria-hidden="true">
            <span>{{ 'AICHATBOT.HERO.CHIP1' | translate }}</span>
            <span>{{ 'AICHATBOT.HERO.CHIP2' | translate }}</span>
            <span>{{ 'AICHATBOT.HERO.CHIP3' | translate }}</span>
            <span>{{ 'AICHATBOT.HERO.CHIP4' | translate }}</span>
          </div>
          <div class="preview" aria-hidden="true">
            <div class="bubble bot">{{ 'AICHATBOT.HERO.PREVIEW_BOT' | translate }}</div>
            <div class="bubble user">{{ 'AICHATBOT.HERO.PREVIEW_USER' | translate }}</div>
          </div>
        </div>

        <!-- AUTH -->
        <div class="auth-wrap">
          <!-- LOGIN -->
          @if (mode() === 'login') {
            <form class="auth" (ngSubmit)="login()">
              <h2>{{ 'AICHATBOT.LOGIN.TITLE' | translate }}</h2>
              <button type="button" class="google" [disabled]="googleBusy()" (click)="continueWithGoogle()">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 1 1 12 5.8a5.6 5.6 0 0 1 3.96 1.55l2.7-2.6A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.77 0 9.6-4.06 9.6-9.77 0-.66-.07-1.16-.16-1.66z"/></svg>
                {{ 'AICHATBOT.LOGIN.GOOGLE' | translate }}
              </button>
              <div class="sep"><span>{{ 'AICHATBOT.LOGIN.OR' | translate }}</span></div>
              <label for="l-email">{{ 'AICHATBOT.LOGIN.EMAIL' | translate }}</label>
              <input id="l-email" name="email" type="email" autocomplete="email" [(ngModel)]="email" placeholder="tu@correo.com" />
              <div class="row-label">
                <label for="l-pass">{{ 'AICHATBOT.LOGIN.PASSWORD' | translate }}</label>
                <a class="link" href="#" (click)="$event.preventDefault(); switchMode('forgot')">{{ 'AICHATBOT.LOGIN.FORGOT' | translate }}</a>
              </div>
              <div class="pass-wrap">
                <input id="l-pass" name="password" [type]="showPass() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="password" placeholder="••••••••" />
                <button type="button" class="eye" (click)="showPass.set(!showPass())" [attr.aria-label]="(showPass() ? 'AICHATBOT.LOGIN.HIDE_PASS' : 'AICHATBOT.LOGIN.SHOW_PASS') | translate" [attr.aria-pressed]="showPass()">
                  @if (showPass()) {
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              @if (errorMsg()) { <p class="err" role="alert">{{ errorMsg() }}</p> }
              @if (infoMsg()) { <p class="okmsg" role="status" aria-live="polite">{{ infoMsg() }}</p> }
              <button type="submit" class="submit" [disabled]="loading()">{{ (loading() ? 'AICHATBOT.LOGIN.LOADING' : 'AICHATBOT.LOGIN.SUBMIT') | translate }}</button>
              <p class="alt">{{ 'AICHATBOT.LOGIN.NOACCOUNT' | translate }}
                <a href="#" (click)="$event.preventDefault(); switchMode('signup')">{{ 'AICHATBOT.LOGIN.SIGNUP' | translate }}</a>
              </p>
            </form>
          }

          <!-- SIGNUP -->
          @if (mode() === 'signup') {
            <form class="auth" (ngSubmit)="signup()">
              <h2>{{ 'AICHATBOT.LOGIN.SIGNUP_TITLE' | translate }}</h2>
              <button type="button" class="google" [disabled]="googleBusy()" (click)="continueWithGoogle()">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 1 1 12 5.8a5.6 5.6 0 0 1 3.96 1.55l2.7-2.6A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.77 0 9.6-4.06 9.6-9.77 0-.66-.07-1.16-.16-1.66z"/></svg>
                {{ 'AICHATBOT.LOGIN.GOOGLE' | translate }}
              </button>
              <div class="sep"><span>{{ 'AICHATBOT.LOGIN.OR' | translate }}</span></div>
              <div class="two">
                <div><label for="s-first">{{ 'AICHATBOT.LOGIN.FIRST_NAME' | translate }}</label>
                  <input id="s-first" name="first" [(ngModel)]="firstName" placeholder="Marlon" /></div>
                <div><label for="s-last">{{ 'AICHATBOT.LOGIN.LAST_NAME' | translate }}</label>
                  <input id="s-last" name="last" [(ngModel)]="lastName" placeholder="Álvarez" /></div>
              </div>
              <label for="s-email">{{ 'AICHATBOT.LOGIN.EMAIL' | translate }}</label>
              <input id="s-email" name="semail" type="email" autocomplete="email" [(ngModel)]="email" placeholder="tu@correo.com" />
              <label for="s-pass">{{ 'AICHATBOT.LOGIN.PASSWORD' | translate }}</label>
              <div class="pass-wrap">
                <input id="s-pass" name="spass" [type]="showPass() ? 'text' : 'password'" autocomplete="new-password" [(ngModel)]="password" placeholder="••••••••" />
                <button type="button" class="eye" (click)="showPass.set(!showPass())" [attr.aria-label]="(showPass() ? 'AICHATBOT.LOGIN.HIDE_PASS' : 'AICHATBOT.LOGIN.SHOW_PASS') | translate" [attr.aria-pressed]="showPass()">
                  @if (showPass()) {
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              @if (errorMsg()) { <p class="err" role="alert">{{ errorMsg() }}</p> }
              <button type="submit" class="submit" [disabled]="loading()">{{ (loading() ? 'AICHATBOT.LOGIN.LOADING' : 'AICHATBOT.LOGIN.CREATE') | translate }}</button>
              <p class="alt">{{ 'AICHATBOT.LOGIN.HAVE_ACCOUNT' | translate }}
                <a href="#" (click)="$event.preventDefault(); switchMode('login')">{{ 'AICHATBOT.LOGIN.SIGNIN' | translate }}</a>
              </p>
            </form>
          }

          <!-- FORGOT -->
          @if (mode() === 'forgot') {
            <form class="auth" (ngSubmit)="forgot()">
              <h2>{{ 'AICHATBOT.LOGIN.FORGOT_TITLE' | translate }}</h2>
              <p class="muted-sm">{{ 'AICHATBOT.LOGIN.FORGOT_HINT' | translate }}</p>
              <label for="f-email">{{ 'AICHATBOT.LOGIN.EMAIL' | translate }}</label>
              <input id="f-email" name="femail" type="email" autocomplete="email" [(ngModel)]="email" placeholder="tu@correo.com" />
              @if (errorMsg()) { <p class="err" role="alert">{{ errorMsg() }}</p> }
              <button type="submit" class="submit" [disabled]="loading()">{{ (loading() ? 'AICHATBOT.LOGIN.LOADING' : 'AICHATBOT.LOGIN.FORGOT_SUBMIT') | translate }}</button>
              @if (forgotMsg()) { <p class="okmsg" role="status" aria-live="polite">{{ 'AICHATBOT.LOGIN.FORGOT_MSG' | translate }}</p> }
              <p class="alt"><a href="#" (click)="$event.preventDefault(); switchMode('login')">{{ 'AICHATBOT.LOGIN.BACK' | translate }}</a></p>
            </form>
          }
        </div>
      </div>
    </section>

    <!-- Banda de capacidades -->
    <section class="band" [attr.aria-label]="'AICHATBOT.HERO.BAND_TITLE' | translate">
      <div class="container">
        <div class="band-head">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.HERO.BAND_EYEBROW' | translate }}</span>
          <h2 class="band-title">{{ 'AICHATBOT.HERO.BAND_TITLE' | translate }}</h2>
          <p class="lead on-dark">{{ 'AICHATBOT.HERO.BAND_SUB' | translate }}</p>
        </div>
        <div class="cards">
          <div class="card">
            <span class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-6"/></svg></span>
            <h3>{{ 'AICHATBOT.HERO.C1_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C1_D' | translate }}</p>
          </div>
          <div class="card">
            <span class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg></span>
            <h3>{{ 'AICHATBOT.HERO.C2_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C2_D' | translate }}</p>
          </div>
          <div class="card">
            <span class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <h3>{{ 'AICHATBOT.HERO.C3_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C3_D' | translate }}</p>
          </div>
          <div class="card">
            <span class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
            <h3>{{ 'AICHATBOT.HERO.C4_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C4_D' | translate }}</p>
          </div>
          <div class="card">
            <span class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
            <h3>{{ 'AICHATBOT.HERO.C5_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C5_D' | translate }}</p>
          </div>
          <div class="card">
            <span class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg></span>
            <h3>{{ 'AICHATBOT.HERO.C6_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C6_D' | translate }}</p>
          </div>
        </div>

      </div>
    </section>

    <!-- Precios -->
    <section class="pricing" id="precios" [attr.aria-label]="'AICHATBOT.PRICING.TITLE' | translate">
      <div class="container">
        <div class="pricing-head">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.PRICING.EYEBROW' | translate }}</span>
          <h2 class="band-title">{{ 'AICHATBOT.PRICING.TITLE' | translate }}</h2>
          <p class="lead on-dark">{{ 'AICHATBOT.PRICING.SUBTITLE' | translate }}</p>
        </div>
        <div class="pcards">
          @for (p of plans; track p.id) {
            <article class="pplan" [class.popular]="p.popular">
              @if (p.popular) { <span class="pbadge">{{ 'AICHATBOT.PLANS.POPULAR' | translate }}</span> }
              <h3 class="pname">{{ p.nameKey | translate }}</h3>
              <p class="ptag">{{ p.taglineKey | translate }}</p>
              <div class="pprice"><span class="pamt">{{ p.price }}</span><span class="pper">{{ 'AICHATBOT.PLANS.PER_MONTH' | translate }}</span></div>
              <ul class="pfeat">
                @for (f of p.features; track f) {
                  <li>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
                    {{ f | translate }}
                  </li>
                }
              </ul>
            </article>
          }
        </div>
        <p class="pnote">
          {{ 'AICHATBOT.PRICING.NOTE' | translate }}
          <a routerLink="/refounds">{{ 'AICHATBOT.PRICING.REFUNDS_LINK' | translate }}</a>
          <span aria-hidden="true"> · </span>
          <a routerLink="/terms">{{ 'AICHATBOT.PRICING.TERMS_LINK' | translate }}</a>
          <span aria-hidden="true"> · </span>
          <a routerLink="/privacy">{{ 'AICHATBOT.PRICING.PRIVACY_LINK' | translate }}</a>
        </p>
      </div>
    </section>
    } @else {
      <section class="loadscreen"><div class="ls-inner"><span class="spinner" aria-hidden="true"></span></div></section>
    }
  `,
  styles: [`
    .loadscreen { min-height: 100vh; display: grid; place-items: center; background: var(--ink); color: var(--text-inv); padding: 24px; }
    .ls-inner { display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; }
    .spinner { width: 42px; height: 42px; border-radius: 50%; border: 3px solid rgba(231,171,46,.25); border-top-color: var(--gold-bright); animation: ls-spin .8s linear infinite; }
    @keyframes ls-spin { to { transform: rotate(360deg); } }
    .ls-text { font-size: 16px; color: var(--text-inv-2); max-width: 30ch; }

    .cbp { position: relative; overflow: hidden; background: var(--ink); color: var(--text-inv); min-height: 100vh; display: flex; align-items: center; padding: calc(var(--nav-h) + 40px) 0 64px; }
    .grid { position: absolute; inset: 0; opacity: .35; pointer-events: none;
      background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
      background-size: 46px 46px; mask-image: radial-gradient(120% 90% at 70% 10%, #000 30%, transparent 75%); }
    .glow { position: absolute; top: -160px; right: -120px; width: 620px; height: 620px; pointer-events: none; background: radial-gradient(closest-side, rgba(231,171,46,.22), transparent 70%); filter: blur(6px); }
    .inner { position: relative; z-index: 1; display: grid; grid-template-columns: 1.15fr .85fr; gap: 56px; align-items: center; width: 100%; }
    .title { font-size: clamp(38px, 5.4vw, 72px); line-height: .98; margin-top: 14px; }
    .hero .lead { margin-top: 20px; }
    .feats { list-style: none; padding: 0; margin: 26px 0 0; display: grid; gap: 12px; }
    .feats li { display: flex; align-items: center; gap: 12px; color: var(--text-inv-2); font-size: 15.5px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 10px var(--gold-bright); flex-shrink: 0; }
    .preview { margin-top: 34px; display: flex; flex-direction: column; gap: 10px; max-width: 360px; }
    .bubble { padding: 11px 15px; border-radius: 16px; font-size: 14px; line-height: 1.45; }
    .bubble.bot { align-self: flex-start; background: rgba(255,255,255,.07); border: 1px solid var(--line-light); border-bottom-left-radius: 5px; }
    .bubble.user { align-self: flex-end; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); border-bottom-right-radius: 5px; font-weight: 500; }

    .auth-wrap { display: flex; justify-content: flex-end; }
    .auth { width: 100%; max-width: 410px; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 30px; box-shadow: 0 30px 70px rgba(0,0,0,.5); }
    .auth h2 { font-size: 22px; margin-bottom: 18px; }
    .auth label { display: block; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin: 14px 0 6px; }
    .auth input { width: 100%; padding: 13px 14px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease); }
    .auth input::placeholder { color: rgba(255,255,255,.4); }
    .auth input:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.22); }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .two label { margin-top: 0; }
    .row-label { display: flex; align-items: flex-end; justify-content: space-between; }
    .row-label label { margin-bottom: 6px; }
    .link { color: var(--gold-bright); font-size: 12.5px; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .google { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; border-radius: var(--radius-pill); border: 1px solid var(--line-light); background: #fff; color: #1a1a1a; font: inherit; font-weight: 600; cursor: pointer; transition: transform var(--dur) var(--ease); }
    .google:hover { transform: translateY(-2px); }
    .sep { display: flex; align-items: center; gap: 12px; margin: 18px 0 4px; color: var(--text-inv-2); font-size: 12px; }
    .sep::before, .sep::after { content: ""; height: 1px; flex: 1; background: var(--line-light); }
    .submit { width: 100%; min-height: 52px; margin-top: 22px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 30px rgba(231,171,46,.3); transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease); }
    .submit:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(231,171,46,.45); }
    .alt { margin-top: 18px; font-size: 13.5px; color: var(--text-inv-2); text-align: center; }
    .alt a { color: var(--gold-bright); font-weight: 600; }
    .muted-sm { font-size: 13px; color: var(--text-inv-2); margin: -4px 0 4px; line-height: 1.5; }
    .okmsg { margin-top: 14px; font-size: 13px; color: var(--gold-soft); background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; }
    .err { margin-top: 14px; font-size: 13px; color: #ff8a8a; background: rgba(214,69,69,.1); padding: 10px 12px; border-radius: 10px; }
    .submit:disabled { opacity: .7; cursor: default; transform: none; }
    .pass-wrap { position: relative; }
    .pass-wrap input { padding-right: 46px; }
    .eye { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--text-inv-2); cursor: pointer; padding: 8px; display: grid; place-items: center; border-radius: 8px; }
    .eye:hover { color: var(--text-inv); background: rgba(255,255,255,.06); }

    .sub2 { margin-top: 14px; font-size: 16px; color: var(--text-inv-2); max-width: 50ch; }
    .chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 24px; }
    .chips span { font-size: 12.5px; font-weight: 600; color: var(--gold-bright); padding: 7px 13px; border-radius: var(--radius-pill);
      background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.25); }

    /* Banda de capacidades */
    .band { background: var(--ink); color: var(--text-inv); padding: clamp(56px, 8vw, 100px) 0; border-top: 1px solid var(--line-light); }
    .band-head { max-width: 640px; }
    .band-title { font-size: clamp(28px, 3.6vw, 44px); margin-top: 12px; }
    .band-head .lead { margin-top: 16px; }
    .cards { margin-top: clamp(36px, 5vw, 56px); display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .card { background: rgba(255,255,255,.03); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 26px 24px; transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease); }
    .card:hover { transform: translateY(-3px); border-color: rgba(231,171,46,.4); }
    .ic { display: inline-grid; place-items: center; width: 48px; height: 48px; border-radius: 13px; color: var(--gold-bright);
      background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.25); margin-bottom: 16px; }
    .card h3 { font-size: 17px; margin-bottom: 8px; }
    .card p { font-size: 14px; line-height: 1.6; color: var(--text-inv-2); }
    /* Precios */
    .pricing { background: var(--ink); color: var(--text-inv); padding: 0 0 clamp(64px, 9vw, 110px); }
    .pricing-head { text-align: center; max-width: 640px; margin: 0 auto clamp(36px, 5vw, 52px); }
    .pricing-head .band-title { margin-top: 12px; }
    .pricing-head .lead { margin: 16px auto 0; }
    .pcards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; align-items: stretch; }
    .pplan { position: relative; display: flex; flex-direction: column; background: rgba(255,255,255,.03);
      border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 30px 26px; transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease); }
    .pplan:hover { transform: translateY(-4px); }
    .pplan.popular { border-color: var(--gold-bright); box-shadow: 0 24px 60px rgba(231,171,46,.16); }
    .pbadge { position: absolute; top: -12px; left: 26px; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
      color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); padding: 5px 12px; border-radius: var(--radius-pill); }
    .pname { font-size: 22px; }
    .ptag { color: var(--text-inv-2); font-size: 14px; margin-top: 6px; min-height: 40px; }
    .pprice { display: flex; align-items: baseline; gap: 8px; margin: 14px 0 6px; }
    .pamt { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; }
    .pper { color: var(--text-inv-2); font-size: 14px; }
    .pfeat { list-style: none; padding: 18px 0 0; margin: 12px 0 0; display: grid; gap: 12px; border-top: 1px solid var(--line-light); flex: 1; }
    .pfeat li { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; color: var(--text-inv-2); }
    .pfeat li svg { color: var(--gold-bright); flex-shrink: 0; margin-top: 2px; }
    .pnote { text-align: center; color: var(--text-inv-2); font-size: 13.5px; margin-top: 30px; }
    .pnote a { color: var(--gold-bright); font-weight: 600; }
    .pnote a:hover { text-decoration: underline; }
    @media (max-width: 920px) { .pcards { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; } }

    @media (max-width: 940px) { .inner { grid-template-columns: 1fr; gap: 40px; } .auth-wrap { justify-content: stretch; } .auth { max-width: none; } .preview { display: none; } }
    @media (max-width: 860px) { .cards { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .cards { grid-template-columns: 1fr; } }
  `],
})
export class ChatbotLandingComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private meta = inject(Meta);
  private scroll = inject(ScrollService);
  private i18n = inject(TranslateService);

  private auth = inject(ChatbotAuthService);
  private session = inject(ChatbotSessionService);

  mode = signal<Mode>('login');
  forgotMsg = signal(false);
  loading = signal(false);
  errorMsg = signal('');
  infoMsg = signal('');
  showPass = signal(false);
  ready = signal(false);      // verificación de sesión terminada y sin sesión
  loggedIn = signal(false);   // hay sesión activa -> redirigir al panel

  email = '';
  password = '';
  firstName = '';
  lastName = '';

  switchMode(m: Mode): void {
    this.mode.set(m);
    this.errorMsg.set(''); this.infoMsg.set(''); this.forgotMsg.set(false);
  }

  private isEmail(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  private mapError(msg: string): string {
    if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
    if (/Email not confirmed/i.test(msg)) return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja.';
    if (/already registered/i.test(msg)) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
    return msg;
  }

  plans: Plan[] = [
    {
      id: 'basic', popular: false, nameKey: 'AICHATBOT.PLANS.BASIC.NAME', price: '$19',
      taglineKey: 'AICHATBOT.PLANS.BASIC.TAG',
      features: ['AICHATBOT.PLANS.BASIC.F1', 'AICHATBOT.PLANS.BASIC.F2', 'AICHATBOT.PLANS.BASIC.F3', 'AICHATBOT.PLANS.BASIC.F4', 'AICHATBOT.PLANS.BASIC.F5', 'AICHATBOT.PLANS.BASIC.F6'],
    },
    {
      id: 'pro', popular: true, nameKey: 'AICHATBOT.PLANS.PRO.NAME', price: '$49',
      taglineKey: 'AICHATBOT.PLANS.PRO.TAG',
      features: ['AICHATBOT.PLANS.PRO.F1', 'AICHATBOT.PLANS.PRO.F2', 'AICHATBOT.PLANS.PRO.F3', 'AICHATBOT.PLANS.PRO.F4', 'AICHATBOT.PLANS.PRO.F5', 'AICHATBOT.PLANS.PRO.F6', 'AICHATBOT.PLANS.PRO.F7', 'AICHATBOT.PLANS.PRO.F8'],
    },
    {
      id: 'business', popular: false, nameKey: 'AICHATBOT.PLANS.BUSINESS.NAME', price: '$99',
      taglineKey: 'AICHATBOT.PLANS.BUSINESS.TAG',
      features: ['AICHATBOT.PLANS.BUSINESS.F1', 'AICHATBOT.PLANS.BUSINESS.F2', 'AICHATBOT.PLANS.BUSINESS.F3', 'AICHATBOT.PLANS.BUSINESS.F4', 'AICHATBOT.PLANS.BUSINESS.F5', 'AICHATBOT.PLANS.BUSINESS.F6', 'AICHATBOT.PLANS.BUSINESS.F7'],
    },
  ];

  ngOnInit(): void {
    this.scroll.scrollToTop();

    // Aviso tras eliminar la cuenta.
    if (this.route.snapshot.queryParamMap.get('deleted') === '1') {
      this.infoMsg.set(this.i18n.instant('AICHATBOT.LANDING.ACCOUNT_DELETED'));
    }

    // Si ya hay sesión activa, no mostramos el login: avisamos y redirigimos al panel.
    const check = () => {
      if (this.auth.authReady()) {
        if (this.auth.isLoggedIn()) {
          this.loggedIn.set(true);
          const dest = !this.session.planExpiry()
            ? '/ai-chatbot/plans'
            : (this.session.companies().length > 0 ? '/ai-chatbot/dashboard' : '/ai-chatbot/configure');
          setTimeout(() => this.router.navigateByUrl(dest), 1300);
        } else {
          this.ready.set(true);
        }
      } else {
        setTimeout(check, 40);
      }
    };
    check();

    const t = 'Vectis AI ChatBot — Chatbot con IA para tu negocio';
    const d = 'Crea un chatbot con IA para tu sitio web en minutos: ventas, atención y captura de leads 24/7. Self-service, sin código. Vectis Automation Group.';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description', content: d });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });
    this.meta.updateTag({ property: 'og:title', content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  async login(): Promise<void> {
    this.errorMsg.set(''); this.infoMsg.set('');
    if (!this.isEmail(this.email)) { this.errorMsg.set('Ingresa un correo válido (ej. nombre@dominio.com).'); return; }
    if (!this.password) { this.errorMsg.set('Ingresa tu contraseña.'); return; }
    this.loading.set(true);
    const { error } = await this.auth.signIn(this.email.trim(), this.password);
    if (error) { this.loading.set(false); this.errorMsg.set(this.mapError(error.message)); return; }
    const path = await this.auth.routeAfterAuth();
    this.loading.set(false);
    this.router.navigateByUrl(path);
  }

  async signup(): Promise<void> {
    this.errorMsg.set(''); this.infoMsg.set('');
    if (!this.firstName.trim()) { this.errorMsg.set('Ingresa tu nombre.'); return; }
    if (!this.isEmail(this.email)) { this.errorMsg.set('Ingresa un correo válido (ej. nombre@dominio.com).'); return; }
    if (this.password.length < 8) { this.errorMsg.set('La contraseña debe tener al menos 8 caracteres.'); return; }
    this.loading.set(true);
    const { data, error } = await this.auth.signUp(this.email.trim(), this.password, this.firstName.trim(), this.lastName.trim());
    this.loading.set(false);
    if (error) { this.errorMsg.set(this.mapError(error.message)); return; }
    if (data.session) {
      // Sin confirmación de correo: ya hay sesión.
      this.router.navigateByUrl('/ai-chatbot/plans');
    } else {
      // Con confirmación de correo activada: avisar al usuario.
      this.infoMsg.set('Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.');
      this.mode.set('login');
    }
  }

  async forgot(): Promise<void> {
    this.errorMsg.set('');
    if (!this.isEmail(this.email)) { this.errorMsg.set('Ingresa un correo válido (ej. nombre@dominio.com).'); return; }
    this.loading.set(true);
    await this.auth.forgot(this.email.trim());
    this.loading.set(false);
    this.forgotMsg.set(true);   // siempre confirmamos (no revelamos si el correo existe)
  }

  googleBusy = signal(false);
  async continueWithGoogle(): Promise<void> {
    this.errorMsg.set(''); this.infoMsg.set('');
    this.googleBusy.set(true);
    const { error } = await this.auth.signInWithGoogle();
    // Si todo va bien, el navegador se redirige a Google; si hay error, lo mostramos.
    if (error) { this.googleBusy.set(false); this.errorMsg.set(this.mapError(error.message)); }
  }
}
