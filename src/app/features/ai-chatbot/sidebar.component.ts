import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotSessionService } from './session.service';

/**
 * Menú lateral del área del chatbot (Dashboard / Configurar / Soporte Técnico).
 * Solo se muestra cuando el usuario YA creó al menos un chatbot (los nuevos deben
 * crear su primer chat antes de ver el menú).
 */
@Component({
  selector: 'app-chatbot-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <aside class="side">
      @if (s.companies().length > 0) {
        <a class="nav" routerLink="/ai-chatbot/dashboard" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          {{ 'AICHATBOT.DASH.NAV_DASHBOARD' | translate }}
        </a>
      }
      <a class="nav" routerLink="/ai-chatbot/configure" routerLinkActive="active">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        {{ 'AICHATBOT.DASH.NAV_CONFIGURE' | translate }}
      </a>

      @if (s.companies().length > 0) {
        <a class="nav support" routerLink="/ai-chatbot/support" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.2 4.2M14.9 14.9l4.2 4.2M14.9 9.1l4.2-4.2M9.1 14.9l-4.2 4.2"/></svg>
          {{ 'AICHATBOT.SUPPORT.NAV' | translate }}
        </a>
      }
    </aside>
  `,
  styles: [`
    :host { display: flex; align-self: stretch; }
    .side { width: 240px; flex-shrink: 0; border-right: 1px solid var(--line-light); padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .nav { display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: var(--radius-md); color: var(--text-inv-2); font-weight: 500; font-size: 14px; }
    .nav:hover { background: rgba(255,255,255,.05); color: var(--text-inv); }
    .nav.active { background: rgba(231,171,46,.14); color: var(--gold-bright); }
    .nav.support { margin-top: auto; border-top: 1px solid var(--line-light); padding-top: 16px; border-radius: 0; }
    @media (max-width: 860px) {
      .side { width: 100%; flex-direction: row; flex-wrap: wrap; border-right: none; border-bottom: 1px solid var(--line-light); padding: 10px; overflow-x: auto; }
      .nav { padding: 9px 12px; font-size: 13px; }
      .nav.support { margin-top: 0; border-top: none; padding-top: 9px; border-radius: var(--radius-md); }
    }
  `],
})
export class ChatbotSidebarComponent {
  readonly s = inject(ChatbotSessionService);
}
