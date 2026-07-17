import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotSessionService, PlanId } from './session.service';
import { ChatbotAuthService } from './auth.service';
import { ScrollService } from '../../core/services/scroll.service';
import { ChatDemoComponent } from './demo/chat-demo.component';
import { TourDemoComponent } from './demo/tour-demo.component';

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
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ChatDemoComponent, TourDemoComponent],
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
        <div class="band-head center">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.HERO.BAND_EYEBROW' | translate }}</span>
          <h2 class="band-title">{{ 'AICHATBOT.HERO.BAND_TITLE' | translate }}</h2>
          <p class="lead on-dark">{{ 'AICHATBOT.HERO.BAND_SUB' | translate }}</p>
        </div>
        <div class="cap-list">
          <div class="cap">
            <span class="cap-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-6"/></svg></span>
            <div><h3>{{ 'AICHATBOT.HERO.C1_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C1_D' | translate }}</p></div>
          </div>
          <div class="cap">
            <span class="cap-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg></span>
            <div><h3>{{ 'AICHATBOT.HERO.C2_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C2_D' | translate }}</p></div>
          </div>
          <div class="cap">
            <span class="cap-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <div><h3>{{ 'AICHATBOT.HERO.C3_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C3_D' | translate }}</p></div>
          </div>
          <div class="cap">
            <span class="cap-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
            <div><h3>{{ 'AICHATBOT.HERO.C4_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C4_D' | translate }}</p></div>
          </div>
          <div class="cap">
            <span class="cap-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
            <div><h3>{{ 'AICHATBOT.HERO.C5_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C5_D' | translate }}</p></div>
          </div>
          <div class="cap">
            <span class="cap-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg></span>
            <div><h3>{{ 'AICHATBOT.HERO.C6_T' | translate }}</h3><p>{{ 'AICHATBOT.HERO.C6_D' | translate }}</p></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cómo funciona (self-serve) -->
    <section class="how" [attr.aria-label]="'AICHATBOT.GUIDE.HOW_TITLE' | translate">
      <div class="container">
        <div class="how-grid">
          <!-- Columna izquierda: explicación self-serve + cómo piensa -->
          <div class="how-intro">
            <span class="eyebrow on-dark">{{ 'AICHATBOT.GUIDE.HOW_EYEBROW' | translate }}</span>
            <h2 class="band-title">{{ 'AICHATBOT.GUIDE.HOW_TITLE' | translate }}</h2>
            <p class="lead on-dark">{{ 'AICHATBOT.GUIDE.HOW_SUB' | translate }}</p>
            <div class="how-chips">
              <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>{{ 'AICHATBOT.GUIDE.HOW_CHIP1' | translate }}</span>
              <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>{{ 'AICHATBOT.GUIDE.HOW_CHIP2' | translate }}</span>
              <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>{{ 'AICHATBOT.GUIDE.HOW_CHIP3' | translate }}</span>
            </div>

            <div class="think">
              <p class="think-title">{{ 'AICHATBOT.GUIDE.THINK_TITLE' | translate }}</p>
              <div class="think-row">
                <span class="tico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v14"/><path d="m6 11 6 6 6-6"/><path d="M5 21h14"/></svg></span>
                <div><h4>{{ 'AICHATBOT.GUIDE.TH1_T' | translate }}</h4><p>{{ 'AICHATBOT.GUIDE.TH1_D' | translate }}</p></div>
              </div>
              <div class="think-row">
                <span class="tico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span>
                <div><h4>{{ 'AICHATBOT.GUIDE.TH2_T' | translate }}</h4><p>{{ 'AICHATBOT.GUIDE.TH2_D' | translate }}</p></div>
              </div>
              <div class="think-row">
                <span class="tico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg></span>
                <div><h4>{{ 'AICHATBOT.GUIDE.TH3_T' | translate }}</h4><p>{{ 'AICHATBOT.GUIDE.TH3_D' | translate }}</p></div>
              </div>
            </div>
          </div>

          <!-- Columna derecha: timeline de pasos self-serve -->
          <ol class="flow">
            <li class="fstep">
              <span class="fnode"><span class="fnum">1</span></span>
              <div class="fbody">
                <div class="fhead"><span class="fico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.S1_T' | translate }}</h3></div>
                <p>{{ 'AICHATBOT.GUIDE.S1_D' | translate }}</p>
              </div>
            </li>
            <li class="fstep">
              <span class="fnode"><span class="fnum">2</span></span>
              <div class="fbody">
                <div class="fhead"><span class="fico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.S2_T' | translate }}</h3></div>
                <p>{{ 'AICHATBOT.GUIDE.S2_D' | translate }}</p>
              </div>
            </li>
            <li class="fstep">
              <span class="fnode"><span class="fnum">3</span></span>
              <div class="fbody">
                <div class="fhead"><span class="fico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.S3_T' | translate }}</h3></div>
                <p>{{ 'AICHATBOT.GUIDE.S3_D' | translate }}</p>
              </div>
            </li>
            <li class="fstep">
              <span class="fnode"><span class="fnum">4</span></span>
              <div class="fbody">
                <div class="fhead"><span class="fico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.S4_T' | translate }}</h3></div>
                <p>{{ 'AICHATBOT.GUIDE.S4_D' | translate }}</p>
              </div>
            </li>
            <li class="fstep">
              <span class="fnode"><span class="fnum">5</span></span>
              <div class="fbody">
                <div class="fhead"><span class="fico"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.S5_T' | translate }}</h3></div>
                <p>{{ 'AICHATBOT.GUIDE.S5_D' | translate }}</p>
                <code class="snippet2">&lt;script src="…/widget.js" data-client-id="…"&gt;&lt;/script&gt;</code>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- En acción: demos animados -->
    <section class="demos" [attr.aria-label]="'AICHATBOT.DEMO.TITLE' | translate">
      <div class="container">
        <div class="band-head center">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.DEMO.EYEBROW' | translate }}</span>
          <h2 class="band-title">{{ 'AICHATBOT.DEMO.TITLE' | translate }}</h2>
          <p class="lead on-dark">{{ 'AICHATBOT.DEMO.SUB' | translate }}</p>
        </div>
        <!-- Chat en vivo: texto + demo al lado -->
        <div class="demo-chat-row">
          <div class="demo-copy">
            <h3>{{ 'AICHATBOT.DEMO.CHAT_T' | translate }}</h3>
            <p>{{ 'AICHATBOT.DEMO.CHAT_D' | translate }}</p>
            <ul class="demo-bullets">
              <li>{{ 'AICHATBOT.DEMO.CHAT_B1' | translate }}</li>
              <li>{{ 'AICHATBOT.DEMO.CHAT_B2' | translate }}</li>
              <li>{{ 'AICHATBOT.DEMO.CHAT_B3' | translate }}</li>
            </ul>
          </div>
          <div class="demo-chat-wrap"><app-cbdemo-chat></app-cbdemo-chat></div>
        </div>

        <!-- Panel completo (desktop): configuración → dashboard -->
        <figure class="demo-tour">
          <figcaption class="tour-cap">
            <h3>{{ 'AICHATBOT.DEMO.TOUR_T' | translate }}</h3>
            <p>{{ 'AICHATBOT.DEMO.TOUR_D' | translate }}</p>
          </figcaption>
          <app-cbdemo-tour></app-cbdemo-tour>
        </figure>
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

    <!-- Qué puede manejar (features) -->
    <section class="feats2" [attr.aria-label]="'AICHATBOT.GUIDE.FEAT_TITLE' | translate">
      <div class="container">
        <div class="band-head">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.GUIDE.FEAT_EYEBROW' | translate }}</span>
          <h2 class="band-title">{{ 'AICHATBOT.GUIDE.FEAT_TITLE' | translate }}</h2>
          <p class="lead on-dark">{{ 'AICHATBOT.GUIDE.FEAT_SUB' | translate }}</p>
        </div>
        <div class="fgrid">
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F1_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F1_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F2_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F2_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F3_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F3_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F4_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F4_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F5_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F5_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r=".8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r=".8" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r=".8" fill="currentColor" stroke="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.6h1.9c3 0 5.6-2.5 5.6-5.6C21.9 6 17.5 2 12 2z"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F6_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F6_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F7_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F7_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F8_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F8_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F9_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F9_D' | translate }}</p></div>
          <div class="fcard"><span class="fico2"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-4a8 8 0 0 1 16 0v4"/><path d="M18 19a2 2 0 0 1-2 2h-3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.F10_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.F10_D' | translate }}</p></div>
        </div>
      </div>
    </section>

    <!-- Confidencialidad y seguridad -->
    <section class="trust" [attr.aria-label]="'AICHATBOT.GUIDE.TRUST_TITLE' | translate">
      <div class="container">
        <div class="band-head">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.GUIDE.TRUST_EYEBROW' | translate }}</span>
          <h2 class="band-title">{{ 'AICHATBOT.GUIDE.TRUST_TITLE' | translate }}</h2>
          <p class="lead on-dark">{{ 'AICHATBOT.GUIDE.TRUST_SUB' | translate }}</p>
        </div>
        <div class="tpanel">
          <div class="titem"><span class="tico3"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.T1_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.T1_D' | translate }}</p></div>
          <div class="titem"><span class="tico3"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.T2_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.T2_D' | translate }}</p></div>
          <div class="titem"><span class="tico3"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.T3_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.T3_D' | translate }}</p></div>
          <div class="titem"><span class="tico3"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></span><h3>{{ 'AICHATBOT.GUIDE.T4_T' | translate }}</h3><p>{{ 'AICHATBOT.GUIDE.T4_D' | translate }}</p></div>
        </div>
        <p class="tnote">{{ 'AICHATBOT.GUIDE.TRUST_NOTE' | translate }} <a routerLink="/privacy">{{ 'AICHATBOT.PRICING.PRIVACY_LINK' | translate }}</a></p>
      </div>
    </section>

    <!-- Soporte técnico -->
    <section class="support" [attr.aria-label]="'AICHATBOT.SUPPORT.TITLE' | translate">
      <div class="container">
        <div class="sup-grid">
          <div class="sup-copy">
            <span class="eyebrow on-dark">{{ 'AICHATBOT.SUPPORT.EYEBROW' | translate }}</span>
            <h2 class="band-title">{{ 'AICHATBOT.SUPPORT.TITLE' | translate }}</h2>
            <p class="lead on-dark">{{ 'AICHATBOT.SUPPORT.SUB' | translate }}</p>
            <!-- Mock de ticket -->
            <div class="ticket" aria-hidden="true">
              <div class="tk-top">
                <span class="tk-id">{{ 'AICHATBOT.SUPPORT.TK_ID' | translate }}</span>
                <span class="tk-badge">{{ 'AICHATBOT.SUPPORT.TK_STATUS' | translate }}</span>
              </div>
              <p class="tk-subject">{{ 'AICHATBOT.SUPPORT.TK_SUBJECT' | translate }}</p>
              <div class="tk-reply"><span class="tk-dot"></span>{{ 'AICHATBOT.SUPPORT.TK_REPLY' | translate }}</div>
            </div>
            <p class="sup-note">{{ 'AICHATBOT.SUPPORT.NOTE' | translate }}</p>
          </div>

          <ul class="sup-list">
            <li>
              <span class="sup-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H5.17L4 17.17z"/><path d="M8 9h8M8 12h5"/></svg></span>
              <div><h3>{{ 'AICHATBOT.SUPPORT.I1_T' | translate }}</h3><p>{{ 'AICHATBOT.SUPPORT.I1_D' | translate }}</p></div>
            </li>
            <li>
              <span class="sup-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg></span>
              <div><h3>{{ 'AICHATBOT.SUPPORT.I2_T' | translate }}</h3><p>{{ 'AICHATBOT.SUPPORT.I2_D' | translate }}</p></div>
            </li>
            <li>
              <span class="sup-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
              <div><h3>{{ 'AICHATBOT.SUPPORT.I3_T' | translate }}</h3><p>{{ 'AICHATBOT.SUPPORT.I3_D' | translate }}</p></div>
            </li>
            <li>
              <span class="sup-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></svg></span>
              <div><h3>{{ 'AICHATBOT.SUPPORT.I4_T' | translate }}</h3><p>{{ 'AICHATBOT.SUPPORT.I4_D' | translate }}</p></div>
            </li>
            <li>
              <span class="sup-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg></span>
              <div><h3>{{ 'AICHATBOT.SUPPORT.I5_T' | translate }}</h3><p>{{ 'AICHATBOT.SUPPORT.I5_D' | translate }}</p></div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Preguntas frecuentes -->
    <section class="faqs" [attr.aria-label]="'AICHATBOT.GUIDE.FAQ_TITLE' | translate">
      <div class="container">
        <div class="band-head">
          <span class="eyebrow on-dark">{{ 'AICHATBOT.GUIDE.FAQ_EYEBROW' | translate }}</span>
          <h2 class="band-title">{{ 'AICHATBOT.GUIDE.FAQ_TITLE' | translate }}</h2>
        </div>
        <div class="faq-list">
          @for (i of [1,2,3,4,5,6,7,8,9,10]; track i) {
            <details class="faq-item">
              <summary>{{ ('AICHATBOT.GUIDE.Q' + i) | translate }}</summary>
              <p>{{ ('AICHATBOT.GUIDE.A' + i) | translate }}</p>
            </details>
          }
        </div>
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
    @media (max-width: 480px) { .two { grid-template-columns: 1fr; } }
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
    .band-head.center { max-width: 680px; margin: 0 auto; text-align: center; }
    .band-title { font-size: clamp(28px, 3.6vw, 44px); margin-top: 12px; }
    .band-head .lead { margin-top: 16px; }
    .band-head.center .lead { margin-left: auto; margin-right: auto; }
    /* Lista editorial de capacidades (sin cajas) */
    .cap-list { margin-top: clamp(38px, 5vw, 60px); display: grid; grid-template-columns: 1fr 1fr; column-gap: clamp(40px, 6vw, 88px); }
    .cap { display: grid; grid-template-columns: 40px 1fr; gap: 18px; align-items: start; padding: 26px 0; border-top: 1px solid var(--line-light); }
    .cap-ic { color: var(--gold-bright); display: grid; place-items: center; width: 40px; height: 40px; }
    .cap h3 { font-size: 18px; margin-bottom: 6px; }
    .cap p { font-size: 14.5px; line-height: 1.6; color: var(--text-inv-2); }
    @media (max-width: 760px) { .cap-list { grid-template-columns: 1fr; column-gap: 0; } .cap { padding: 22px 0; } }

    /* Cómo funciona */
    .how { position: relative; background: var(--ink); color: var(--text-inv); padding: clamp(56px, 8vw, 100px) 0; border-top: 1px solid var(--line-light); }
    .how::before { content: ""; position: absolute; top: -80px; left: -140px; width: 520px; height: 520px; pointer-events: none;
      background: radial-gradient(closest-side, rgba(231,171,46,.14), transparent 70%); filter: blur(4px); }
    .how-grid { position: relative; display: grid; grid-template-columns: .92fr 1.08fr; gap: clamp(36px, 5vw, 72px); align-items: start; }
    .how-intro { position: sticky; top: calc(var(--nav-h) + 28px); }
    .how-intro .band-title { margin-top: 12px; }
    .how-intro .lead { margin-top: 16px; max-width: 42ch; }
    .how-chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 22px; }
    .how-chips span { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: var(--gold-bright);
      padding: 7px 13px 7px 11px; border-radius: var(--radius-pill); background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.25); }
    .how-chips svg { color: var(--gold-bright); }

    /* Cómo piensa el bot */
    .think { margin-top: 30px; padding: 22px; border-radius: var(--radius-lg); background: rgba(255,255,255,.03); border: 1px solid var(--line-light); }
    .think-title { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-inv-2); margin-bottom: 14px; }
    .think-row { display: grid; grid-template-columns: 40px 1fr; gap: 13px; align-items: start; }
    .think-row + .think-row { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line-light); }
    .think-row .tico { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 11px; color: var(--gold-bright);
      background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.25); }
    .think-row h4 { font-size: 14.5px; margin-bottom: 3px; }
    .think-row p { font-size: 13px; line-height: 1.5; color: var(--text-inv-2); }

    /* Timeline de pasos */
    .flow { position: relative; list-style: none; padding: 0; margin: 0; display: grid; gap: 0; }
    .fstep { position: relative; display: grid; grid-template-columns: 56px 1fr; gap: 20px; padding-bottom: 22px; }
    .fstep:last-child { padding-bottom: 0; }
    .fnode { position: relative; width: 56px; height: 56px; }
    .fnum { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 50%; font-weight: 800; font-size: 20px; color: var(--ink);
      background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 26px rgba(231,171,46,.32); z-index: 1; }
    .fstep:not(:last-child) .fnode::after { content: ""; position: absolute; top: 56px; left: 27px; bottom: -22px; width: 2px;
      background: linear-gradient(rgba(231,171,46,.6), rgba(231,171,46,.08)); }
    .fbody { background: rgba(255,255,255,.03); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 18px 22px;
      transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease); }
    .fbody:hover { transform: translateY(-2px); border-color: rgba(231,171,46,.4); }
    .fhead { display: flex; align-items: center; gap: 11px; margin-bottom: 7px; }
    .fhead .fico { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; color: var(--gold-bright);
      background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.22); }
    .fhead h3 { font-size: 16.5px; }
    .fbody p { font-size: 14px; line-height: 1.6; color: var(--text-inv-2); }
    .snippet2 { display: block; margin-top: 12px; font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 12px; color: var(--gold-soft);
      background: rgba(0,0,0,.35); border: 1px solid var(--line-light); border-radius: 10px; padding: 9px 12px; overflow-x: auto; white-space: nowrap; }
    @media (max-width: 900px) { .how-grid { grid-template-columns: 1fr; } .how-intro { position: static; } .how-intro .lead { max-width: none; } }
    @media (max-width: 560px) {
      .how { padding: clamp(40px, 10vw, 64px) 0; }
      .how-grid { gap: 28px; }
      .how-chips { gap: 7px; margin-top: 18px; }
      .how-chips span { font-size: 12px; padding: 6px 11px; }
      .think { padding: 16px; margin-top: 22px; }
      .fstep { grid-template-columns: 42px 1fr; gap: 13px; padding-bottom: 18px; }
      .fnode { width: 42px; height: 42px; }
      .fnum { font-size: 16px; }
      .fstep:not(:last-child) .fnode::after { top: 42px; left: 20px; bottom: -18px; }
      .fbody { padding: 14px 15px; }
      .fhead { gap: 9px; }
      .fhead h3 { font-size: 14.5px; }
      .fbody p { font-size: 13.5px; }
      .snippet2 { font-size: 11px; }
      .think-row { grid-template-columns: 34px 1fr; gap: 11px; }
      .think-row .tico { width: 34px; height: 34px; }
    }
    @media (max-width: 400px) {
      .fstep { grid-template-columns: 36px 1fr; gap: 11px; }
      .fnode { width: 36px; height: 36px; } .fnum { font-size: 15px; }
      .fstep:not(:last-child) .fnode::after { top: 36px; left: 17px; }
      .fbody { padding: 13px 13px; } .fhead h3 { font-size: 14px; }
    }

    /* Qué puede manejar — lista de iconos sin cajas */
    .feats2 { background: var(--ink); color: var(--text-inv); padding: clamp(52px, 7vw, 90px) 0; border-top: 1px solid var(--line-light); }
    .fgrid { margin-top: clamp(34px, 5vw, 54px); display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(28px, 3.5vw, 44px) clamp(32px, 4vw, 56px); }
    .fcard { display: grid; grid-template-columns: 42px 1fr; column-gap: 15px; align-items: start; }
    .fico2 { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; color: var(--gold-bright);
      background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.22); }
    .fcard h3 { font-size: 16px; margin-bottom: 5px; padding-top: 8px; }
    .fcard p { font-size: 13.5px; line-height: 1.55; color: var(--text-inv-2); grid-column: 1 / -1; }
    @media (max-width: 900px) { .fgrid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 520px) { .fgrid { grid-template-columns: 1fr; } }

    /* En acción — demos animados */
    .demos { background: var(--ink); color: var(--text-inv); padding: clamp(56px, 8vw, 100px) 0; border-top: 1px solid var(--line-light); }
    /* Chat: texto + demo al lado */
    .demo-chat-row { margin-top: clamp(38px, 5vw, 60px); display: grid; grid-template-columns: 1fr 330px; gap: clamp(32px, 5vw, 72px); align-items: center; }
    .demo-copy { max-width: 480px; }
    .demo-copy h3 { font-size: clamp(22px, 2.6vw, 30px); margin-bottom: 14px; }
    .demo-copy > p { font-size: 15.5px; line-height: 1.65; color: var(--text-inv-2); margin-bottom: 22px; }
    .demo-bullets { list-style: none; padding: 0; margin: 0; display: grid; gap: 13px; }
    .demo-bullets li { position: relative; padding-left: 28px; font-size: 14.5px; line-height: 1.5; color: var(--text-inv-2); }
    .demo-bullets li::before { content: ""; position: absolute; left: 0; top: 3px; width: 17px; height: 17px; border-radius: 50%;
      background: rgba(231,171,46,.15); border: 1px solid rgba(231,171,46,.4); }
    .demo-bullets li::after { content: ""; position: absolute; left: 5px; top: 8px; width: 6px; height: 3.5px; border-left: 1.6px solid var(--gold-bright); border-bottom: 1.6px solid var(--gold-bright); transform: rotate(-45deg); }
    .demo-chat-wrap { display: flex; justify-content: center; }
    @media (max-width: 820px) { .demo-chat-row { grid-template-columns: 1fr; gap: 40px; }
      .demo-copy { max-width: none; text-align: center; margin: 0 auto; }
      .demo-bullets { display: inline-grid; text-align: left; } }

    /* Tour: panel desktop, a lo ancho, encabezado arriba */
    .demo-tour { margin: clamp(56px, 7vw, 96px) 0 0; text-align: center; }
    .tour-cap { max-width: 60ch; margin: 0 auto 26px; }
    .tour-cap h3 { font-size: clamp(20px, 2.4vw, 26px); margin-bottom: 9px; }
    .tour-cap p { font-size: 14.5px; line-height: 1.6; color: var(--text-inv-2); }

    /* Soporte técnico */
    .support { background: var(--ink); color: var(--text-inv); padding: clamp(56px, 8vw, 100px) 0; border-top: 1px solid var(--line-light); }
    .sup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(36px, 5vw, 72px); align-items: center; }
    .sup-copy .band-title { margin-top: 12px; }
    .sup-copy .lead { margin-top: 16px; max-width: 44ch; }
    .ticket { margin-top: 26px; max-width: 340px; background: rgba(255,255,255,.04); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 16px 18px; }
    .tk-top { display: flex; align-items: center; justify-content: space-between; }
    .tk-id { font-size: 12px; font-weight: 700; color: var(--text-inv-2); font-family: ui-monospace, Menlo, monospace; }
    .tk-badge { font-size: 11px; font-weight: 700; color: #34e0a1; padding: 3px 9px; border-radius: 999px; background: rgba(52,224,161,.12); border: 1px solid rgba(52,224,161,.3); }
    .tk-subject { font-size: 14.5px; font-weight: 600; margin: 10px 0 12px; }
    .tk-reply { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-inv-2); }
    .tk-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 8px var(--gold-bright); }
    .sup-note { margin-top: 20px; font-size: 13px; color: var(--text-inv-2); }
    .sup-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
    .sup-list li { display: grid; grid-template-columns: 46px 1fr; gap: 16px; align-items: start; padding: 18px 0; }
    .sup-list li + li { border-top: 1px solid var(--line-light); }
    .sup-list li:first-child { padding-top: 0; }
    .sup-ic { display: inline-grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; color: var(--gold-bright);
      background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.25); }
    .sup-list h3 { font-size: 16.5px; margin-bottom: 5px; }
    .sup-list p { font-size: 14px; line-height: 1.55; color: var(--text-inv-2); }
    @media (max-width: 860px) { .sup-grid { grid-template-columns: 1fr; gap: 40px; } .sup-copy .lead { max-width: none; } }

    /* Confidencialidad y seguridad — panel único con divisores */
    .trust { background: var(--ink); color: var(--text-inv); padding: clamp(52px, 7vw, 90px) 0; border-top: 1px solid var(--line-light); }
    .tpanel { margin-top: clamp(32px, 5vw, 52px); display: grid; grid-template-columns: 1fr 1fr;
      background: linear-gradient(180deg, rgba(231,171,46,.05), rgba(255,255,255,.02));
      border: 1px solid var(--line-light); border-radius: var(--radius-lg); overflow: hidden; }
    .titem { display: grid; grid-template-columns: 46px 1fr; grid-template-rows: auto auto; column-gap: 16px; row-gap: 4px; padding: 28px 30px; }
    .titem:nth-child(odd) { border-right: 1px solid var(--line-light); }
    .titem:nth-child(-n+2) { border-bottom: 1px solid var(--line-light); }
    .tico3 { grid-row: 1 / 3; display: inline-grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; color: var(--gold-bright);
      background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.25); }
    .titem h3 { font-size: 16.5px; align-self: end; }
    .titem p { font-size: 13.5px; line-height: 1.55; color: var(--text-inv-2); }
    .tnote { margin-top: 20px; font-size: 13px; color: var(--text-inv-2); }
    .tnote a { color: var(--gold-bright); font-weight: 600; }
    .tnote a:hover { text-decoration: underline; }
    @media (max-width: 720px) { .tpanel { grid-template-columns: 1fr; }
      .titem:nth-child(odd) { border-right: none; }
      .titem:not(:last-child) { border-bottom: 1px solid var(--line-light); } }

    /* FAQ */
    .faqs { background: var(--ink); color: var(--text-inv); padding: clamp(52px, 7vw, 90px) 0; border-top: 1px solid var(--line-light); }
    .faq-list { margin-top: clamp(28px, 4vw, 44px); max-width: 820px; display: grid; gap: 12px; }
    .faq-item { background: rgba(255,255,255,.03); border: 1px solid var(--line-light); border-radius: var(--radius-md); padding: 4px 18px; }
    .faq-item summary { list-style: none; cursor: pointer; font-weight: 600; font-size: 15px; padding: 14px 24px 14px 0; position: relative; color: var(--text-inv); }
    .faq-item summary::-webkit-details-marker { display: none; }
    .faq-item summary::after { content: "+"; position: absolute; right: 0; top: 12px; font-size: 20px; color: var(--gold-bright); transition: transform var(--dur) var(--ease); }
    .faq-item[open] summary::after { content: "\\2013"; }
    .faq-item p { font-size: 14px; line-height: 1.6; color: var(--text-inv-2); margin: 0 0 14px; }

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
  private doc = inject(DOCUMENT);
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
      features: ['AICHATBOT.PLANS.BASIC.F1', 'AICHATBOT.PLANS.BASIC.F2', 'AICHATBOT.PLANS.BASIC.F3', 'AICHATBOT.PLANS.BASIC.F4', 'AICHATBOT.PLANS.BASIC.F5', 'AICHATBOT.PLANS.BASIC.F6', 'AICHATBOT.PLANS.HANDOFF'],
    },
    {
      id: 'pro', popular: true, nameKey: 'AICHATBOT.PLANS.PRO.NAME', price: '$49',
      taglineKey: 'AICHATBOT.PLANS.PRO.TAG',
      features: ['AICHATBOT.PLANS.PRO.F1', 'AICHATBOT.PLANS.PRO.F2', 'AICHATBOT.PLANS.PRO.F3', 'AICHATBOT.PLANS.PRO.F4', 'AICHATBOT.PLANS.PRO.F5', 'AICHATBOT.PLANS.PRO.F6', 'AICHATBOT.PLANS.PRO.F7', 'AICHATBOT.PLANS.PRO.F8', 'AICHATBOT.PLANS.HANDOFF'],
    },
    {
      id: 'business', popular: false, nameKey: 'AICHATBOT.PLANS.BUSINESS.NAME', price: '$99',
      taglineKey: 'AICHATBOT.PLANS.BUSINESS.TAG',
      features: ['AICHATBOT.PLANS.BUSINESS.F1', 'AICHATBOT.PLANS.BUSINESS.F2', 'AICHATBOT.PLANS.BUSINESS.F3', 'AICHATBOT.PLANS.BUSINESS.F4', 'AICHATBOT.PLANS.BUSINESS.F5', 'AICHATBOT.PLANS.BUSINESS.F6', 'AICHATBOT.PLANS.BUSINESS.F7', 'AICHATBOT.PLANS.HANDOFF', 'AICHATBOT.PLANS.WHITELABEL'],
    },
  ];

  ngOnInit(): void {
    this.scroll.scrollToTop();

    // Aviso tras eliminar la cuenta.
    if (this.route.snapshot.queryParamMap.get('deleted') === '1') {
      this.infoMsg.set(this.i18n.instant('AICHATBOT.LANDING.ACCOUNT_DELETED'));
    }
    // Aviso cuando la sesión expiró por caducidad.
    if (this.route.snapshot.queryParamMap.get('expired') === '1') {
      this.infoMsg.set(this.i18n.instant('AICHATBOT.LANDING.SESSION_EXPIRED'));
    }

    // Si ya hay sesión activa, no mostramos el login: avisamos y redirigimos al panel.
    const check = () => {
      if (this.auth.authReady()) {
        if (this.auth.isLoggedIn()) {
          this.loggedIn.set(true);
          const dest = !this.session.planExpiry()
            ? '/plans'
            : (this.session.companies().length > 0 ? '/dashboard' : '/configure');
          setTimeout(() => this.router.navigateByUrl(dest), 600);
        } else {
          this.ready.set(true);
        }
      } else {
        setTimeout(check, 40);
      }
    };
    check();

    const t = 'Vectis AI ChatBot — Chatbot con IA para tu negocio';
    const d = 'Crea un chatbot con IA para tu sitio web en minutos: ventas, atención y captura de leads 24/7. Self-service, sin código. Vectis Automation.';
    const url = 'https://www.aichatbot.wearevectis.com/';
    const img = 'https://www.wearevectis.com/assets/images/og-cover.jpg';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description', content: d });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Vectis AI ChatBot' });
    this.meta.updateTag({ property: 'og:title', content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: img });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
    this.meta.updateTag({ name: 'twitter:image', content: img });
    this.setCanonical(url);
    this.injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Vectis AI ChatBot',
      url,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: ['es', 'en'],
      description: d,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@type': 'Organization', name: 'Vectis Automation', url: 'https://www.wearevectis.com/' },
    });
  }

  private setCanonical(href: string): void {
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = this.doc.createElement('link'); link.rel = 'canonical'; this.doc.head.appendChild(link); }
    link.href = href;
    // og:locale hreflang alternates for the subdomain
    this.doc.querySelectorAll('link[rel="alternate"][data-da-alt]').forEach((n) => n.remove());
    const alt = (lang: string, h: string) => { const l = this.doc.createElement('link'); l.rel = 'alternate'; l.setAttribute('hreflang', lang); l.setAttribute('href', h); l.setAttribute('data-da-alt', ''); this.doc.head.appendChild(l); };
    alt('es', href); alt('x-default', href);
  }

  private injectJsonLd(data: unknown): void {
    this.doc.querySelectorAll('script[data-chatbot-jsonld]').forEach((n) => n.remove());
    const s = this.doc.createElement('script');
    s.type = 'application/ld+json'; s.setAttribute('data-chatbot-jsonld', '');
    s.textContent = JSON.stringify(data);
    this.doc.head.appendChild(s);
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
      this.router.navigateByUrl('/plans');
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
