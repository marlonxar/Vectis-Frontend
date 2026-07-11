import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotAuthService } from './auth.service';

/** /reset — define una nueva contraseña (link del correo de recuperación). */
@Component({
  selector: 'app-chatbot-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <section class="cbp">
      <div class="glow" aria-hidden="true"></div>
      <div class="inner container">
        @if (!ready()) {
          <div class="auth"><p class="muted-sm">{{ 'AICHATBOT.RESET.LOADING' | translate }}</p></div>
        } @else if (!allowed()) {
          <div class="auth">
            <h1>{{ 'AICHATBOT.RESET.INVALID_TITLE' | translate }}</h1>
            <p class="muted-sm">{{ 'AICHATBOT.RESET.INVALID_BODY' | translate }}</p>
            <button type="button" class="submit" (click)="goLogin()">{{ 'AICHATBOT.RESET.GO_LOGIN' | translate }}</button>
          </div>
        } @else {
        <form class="auth" (ngSubmit)="submit()">
          <h1>{{ 'AICHATBOT.RESET.TITLE' | translate }}</h1>
          <p class="muted-sm">{{ 'AICHATBOT.RESET.HINT' | translate }}</p>

          @if (!done()) {
            <label for="r-new">{{ 'AICHATBOT.RESET.NEW_PASS' | translate }}</label>
            <div class="pass-wrap">
              <input id="r-new" [type]="showPass() ? 'text' : 'password'" name="np" autocomplete="new-password" [(ngModel)]="newPass" placeholder="••••••••" />
              <button type="button" class="eye" (click)="showPass.set(!showPass())" [attr.aria-label]="(showPass() ? 'AICHATBOT.LOGIN.HIDE_PASS' : 'AICHATBOT.LOGIN.SHOW_PASS') | translate" [attr.aria-pressed]="showPass()">
                @if (showPass()) {
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                } @else {
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <label for="r-cf">{{ 'AICHATBOT.RESET.CONFIRM' | translate }}</label>
            <input id="r-cf" [type]="showPass() ? 'text' : 'password'" name="cf" autocomplete="new-password" [(ngModel)]="confirm" placeholder="••••••••" />
            @if (err()) { <p class="err" role="alert">{{ err() }}</p> }
            <button type="submit" class="submit" [disabled]="loading()">
              {{ (loading() ? 'AICHATBOT.RESET.SAVING' : 'AICHATBOT.RESET.SUBMIT') | translate }}
            </button>
          } @else {
            <p class="okmsg" role="status" aria-live="polite">{{ 'AICHATBOT.RESET.SUCCESS' | translate }}</p>
            <button type="button" class="submit" (click)="goLogin()">{{ 'AICHATBOT.RESET.GO_LOGIN' | translate }}</button>
          }
        </form>
        }
      </div>
    </section>
  `,
  styles: [`
    .cbp { position: relative; overflow: hidden; background: var(--ink); color: var(--text-inv); min-height: 100vh; display: flex; align-items: center; padding: calc(var(--nav-h) + 40px) 0 64px; }
    .glow { position: absolute; top: -160px; right: -120px; width: 620px; height: 620px; pointer-events: none; background: radial-gradient(closest-side, rgba(231,171,46,.22), transparent 70%); filter: blur(6px); }
    .inner { position: relative; z-index: 1; display: flex; justify-content: center; width: 100%; }
    .auth { width: 100%; max-width: 420px; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 32px; box-shadow: 0 30px 70px rgba(0,0,0,.5); }
    .auth h1 { font-size: 24px; margin-bottom: 8px; }
    .muted-sm { font-size: 13.5px; color: var(--text-inv-2); margin-bottom: 8px; line-height: 1.5; }
    label { display: block; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin: 14px 0 6px; }
    input { width: 100%; padding: 13px 14px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease); }
    input::placeholder { color: rgba(255,255,255,.4); }
    input:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.22); }
    .submit { width: 100%; min-height: 52px; margin-top: 22px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 30px rgba(231,171,46,.3); transition: transform var(--dur) var(--ease); }
    .submit:hover { transform: translateY(-2px); }
    .submit:disabled { opacity: .7; cursor: default; transform: none; }
    .err { color: #ff8a8a; font-size: 13px; margin: 12px 0 0; }
    .pass-wrap { position: relative; }
    .pass-wrap input { padding-right: 46px; }
    .eye { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--text-inv-2); cursor: pointer; padding: 8px; display: grid; place-items: center; border-radius: 8px; }
    .eye:hover { color: var(--text-inv); background: rgba(255,255,255,.06); }
    .okmsg { color: var(--gold-soft); font-size: 14px; background: rgba(231,171,46,.1); padding: 12px 14px; border-radius: 10px; margin-top: 8px; }
  `],
})
export class ChatbotResetComponent implements OnInit {
  private auth = inject(ChatbotAuthService);
  private router = inject(Router);
  private title = inject(Title);

  newPass = '';
  confirm = '';
  loading = signal(false);
  done = signal(false);
  err = signal('');
  showPass = signal(false);
  ready = signal(false);    // terminó de verificar la sesión
  allowed = signal(false);  // hay sesión de recuperación válida

  ngOnInit(): void {
    this.title.setTitle('Restablecer contraseña — Vectis AI ChatBot');
    // Solo se permite si el enlace del correo abrió una sesión de recuperación.
    const check = () => {
      if (this.auth.authReady()) {
        this.allowed.set(this.auth.isLoggedIn());
        this.ready.set(true);
      } else {
        setTimeout(check, 40);
      }
    };
    check();
  }

  async submit(): Promise<void> {
    this.err.set('');
    if (this.newPass.length < 8) { this.err.set('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (this.newPass !== this.confirm) { this.err.set('Las contraseñas no coinciden.'); return; }
    this.loading.set(true);
    const { error } = await this.auth.updatePassword(this.newPass);
    this.loading.set(false);
    if (error) { this.err.set(error.message); return; }
    this.done.set(true);
  }

  goLogin(): void { this.router.navigateByUrl('/'); }
}
