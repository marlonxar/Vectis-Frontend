import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotSessionService } from './session.service';
import { ChatbotAuthService } from './auth.service';

/**
 * Header del área autenticada del AI ChatBot.
 * Sin secciones de marketing: solo logo + "AI ChatBot de {empresa}" + selector
 * de empresa (dropdown) + usuario. (Business permite hasta 3 empresas.)
 */
@Component({
  selector: 'app-chatbot-app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    @if (s.showMembershipBanner()) {
      <div class="mbanner" role="alert">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
        <span class="mb-text">{{ (s.bannerReason() === 'expired' ? 'AICHATBOT.BANNER.TEXT_EXPIRED' : 'AICHATBOT.BANNER.TEXT') | translate }}
          <a routerLink="/ai-chatbot/plans">{{ (s.bannerReason() === 'expired' ? 'AICHATBOT.BANNER.CTA_EXPIRED' : 'AICHATBOT.BANNER.CTA') | translate }}</a>
        </span>
        <button type="button" class="mb-x" (click)="s.bannerDismissed.set(true)" [attr.aria-label]="'AICHATBOT.BANNER.CLOSE' | translate">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    }
    <header class="ah">
      <div class="ah-inner">
        <a class="brand" href="#" (click)="$event.preventDefault(); goHome()" aria-label="Vectis AI ChatBot">
          <img src="assets/images/logo.svg" alt="Vectis" width="30" height="30" />
          <span class="wm">Vectis<i>.</i></span>
        </a>

        <!-- Empresa actual + dropdown -->
        <div class="company" #companyMenu>
          <button type="button" class="company-btn" (click)="toggle()" [attr.aria-expanded]="open()"
                  [disabled]="s.companies().length === 0">
            @if (s.currentCompany()) {
              <span class="of">{{ 'AICHATBOT.HEADER.OF' | translate }}</span>
              <strong>{{ s.currentCompany() }}</strong>
              @if (!s.currentActive()) { <span class="inact">{{ 'AICHATBOT.HEADER.INACTIVE' | translate }}</span> }
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            } @else {
              <strong>{{ 'AICHATBOT.HEADER.WELCOME' | translate }}</strong>
            }
          </button>

          @if (open()) {
            <div class="menu" role="menu">
              @for (c of s.companies(); track $index) {
                <button type="button" role="menuitem" class="item" [class.active]="$index === s.current()" (click)="pick($index)">
                  <span class="item-name">{{ c }}@if (!s.isActiveAt($index)) { <span class="inact sm">{{ 'AICHATBOT.HEADER.INACTIVE' | translate }}</span> }</span>
                  @if ($index === s.current()) {
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
                  }
                </button>
              }
              @if (s.canAddCompany()) {
                <a class="add" routerLink="/ai-chatbot/configure" [queryParams]="{ new: 1 }" (click)="open.set(false)">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                  {{ 'AICHATBOT.HEADER.ADD_CHAT' | translate }}
                </a>
              }
            </div>
          }
        </div>

        <!-- Usuario -->
        <div class="user" #userMenu>
          <button type="button" class="user-btn" (click)="toggleUser()" [attr.aria-expanded]="userOpen()" aria-haspopup="menu">
            <span class="uname">{{ s.userName() }}</span>
            <span class="avatar" aria-hidden="true">{{ s.initials() }}</span>
            <svg class="chev" [class.up]="userOpen()" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          @if (userOpen()) {
            <div class="umenu" role="menu">
              <div class="uhead">
                <strong>{{ s.userName() }}</strong>
                <span class="uplan">{{ 'AICHATBOT.HEADER.HAS_PLAN' | translate }} {{ s.planName() }}</span>
              </div>
              <a class="uitem" role="menuitem" routerLink="/ai-chatbot/account" (click)="userOpen.set(false)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {{ 'AICHATBOT.HEADER.MANAGE' | translate }}
              </a>
              <button type="button" class="uitem danger" role="menuitem" (click)="logout()">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                {{ 'AICHATBOT.HEADER.LOGOUT' | translate }}
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .mbanner { position: relative; display: flex; align-items: center; justify-content: center; gap: 9px; text-align: center;
      padding: 10px clamp(44px, 8vw, 56px); background: linear-gradient(90deg, rgba(214,69,69,.22), rgba(214,69,69,.14)); border-bottom: 1px solid rgba(214,69,69,.4); color: #ffd9d9; font-size: 13.5px; }
    .mbanner > svg { color: #ff8a8a; flex-shrink: 0; }
    .mb-text { line-height: 1.4; }
    .mb-text a { color: #fff; font-weight: 700; text-decoration: underline; }
    .mb-x { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #ffd9d9; cursor: pointer; padding: 5px; border-radius: 7px; display: grid; place-items: center; }
    .mb-x:hover { background: rgba(255,255,255,.1); color: #fff; }

    .ah { position: sticky; top: 0; z-index: 50; background: rgba(10,10,10,.86); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line-light); }
    .ah-inner { display: flex; align-items: center; gap: 20px; height: 66px; padding: 0 clamp(18px, 4vw, 40px); }
    .brand { display: flex; align-items: center; gap: 9px; color: var(--text-inv); }
    .wm { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
    .wm i { color: var(--gold-bright); font-style: normal; }

    .company { position: relative; margin-left: 6px; }
    .company-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.05); border: 1px solid var(--line-light);
      color: var(--text-inv); border-radius: var(--radius-pill); padding: 9px 15px; font: inherit; font-size: 14px; cursor: pointer; transition: background var(--dur) var(--ease); }
    .company-btn:hover:not(:disabled) { background: rgba(255,255,255,.1); }
    .company-btn:disabled { cursor: default; opacity: .8; }
    .company-btn .of { color: var(--text-inv-2); }
    .company-btn strong { font-weight: 700; }
    .inact { font-size: 10.5px; font-weight: 700; color: #ff8a8a; background: rgba(214,69,69,.16); border: 1px solid rgba(214,69,69,.4); padding: 2px 7px; border-radius: 999px; white-space: nowrap; }
    .inact.sm { font-size: 9.5px; padding: 1px 6px; margin-left: 6px; }
    .item-name { display: inline-flex; align-items: center; }

    .menu { position: absolute; top: calc(100% + 8px); left: 0; min-width: 230px; background: var(--ink-soft); border: 1px solid var(--line-light);
      border-radius: var(--radius-md); padding: 6px; box-shadow: 0 20px 50px rgba(0,0,0,.5); display: flex; flex-direction: column; gap: 2px; }
    .item, .add { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left;
      background: transparent; border: none; color: var(--text-inv); font: inherit; font-size: 14px; padding: 10px 12px; border-radius: 9px; cursor: pointer; }
    .item:hover, .add:hover { background: rgba(255,255,255,.06); }
    .item.active { color: var(--gold-bright); }
    .add { color: var(--text-inv-2); border-top: 1px solid var(--line-light); margin-top: 4px; padding-top: 12px; justify-content: flex-start; }

    .user { margin-left: auto; position: relative; }
    .user-btn { display: flex; align-items: center; gap: 10px; background: transparent; border: none; cursor: pointer; padding: 6px 8px 6px 12px; border-radius: var(--radius-md); }
    .user-btn:hover { background: rgba(255,255,255,.07); }
    .chev { color: var(--text-inv-2); transition: transform .2s var(--ease); margin-right: 2px; }
    .chev.up { transform: rotate(180deg); }
    .uname { font-size: 14px; color: var(--text-inv); font-weight: 500; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 700;
      color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); }
    .umenu { position: absolute; top: calc(100% + 8px); right: 0; min-width: 230px; background: var(--ink-soft); border: 1px solid var(--line-light);
      border-radius: var(--radius-md); padding: 6px; box-shadow: 0 20px 50px rgba(0,0,0,.5); display: flex; flex-direction: column; gap: 2px; }
    .uhead { padding: 10px 12px 12px; border-bottom: 1px solid var(--line-light); margin-bottom: 4px; display: flex; flex-direction: column; gap: 3px; }
    .uhead strong { font-size: 14px; }
    .uplan { font-size: 12px; color: var(--gold-bright); }
    .uitem { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: transparent; border: none; color: var(--text-inv);
      font: inherit; font-size: 14px; padding: 10px 12px; border-radius: 9px; cursor: pointer; }
    .uitem:hover { background: rgba(255,255,255,.06); }
    .uitem.danger { color: #ff8a8a; }

    @media (max-width: 620px) { .uname { display: none; } .company-btn .of { display: none; } }
  `],
})
export class ChatbotAppHeaderComponent {
  readonly s = inject(ChatbotSessionService);
  private el: ElementRef<HTMLElement> = inject(ElementRef);
  private router = inject(Router);
  private auth = inject(ChatbotAuthService);
  open = signal(false);      // dropdown de empresa
  userOpen = signal(false);  // dropdown de usuario

  goHome(): void {
    this.open.set(false); this.userOpen.set(false);
    const dest = !this.s.planExpiry() ? '/ai-chatbot/plans'
      : (this.s.companies().length > 0 ? '/ai-chatbot/dashboard' : '/ai-chatbot/configure');
    this.router.navigateByUrl(dest);
  }
  toggle(): void { this.userOpen.set(false); if (this.s.companies().length) this.open.set(!this.open()); }
  pick(i: number): void { this.s.selectCompany(i); this.open.set(false); }
  toggleUser(): void { this.open.set(false); this.userOpen.set(!this.userOpen()); }
  manageAccount(): void { this.userOpen.set(false); /* (pantalla de cuenta: próxima fase) */ }
  async logout(): Promise<void> {
    this.userOpen.set(false);
    await this.auth.signOut();
    this.router.navigateByUrl('/ai-chatbot');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) { this.open.set(false); this.userOpen.set(false); }
  }
}
