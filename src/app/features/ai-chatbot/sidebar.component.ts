import { Component, inject, signal } from '@angular/core';
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
    <aside class="side" [class.open]="menuOpen()">
      <button type="button" class="burger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-label="Abrir menú">
        @if (menuOpen()) {
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        }
        <span>Menú</span>
      </button>
      <nav class="items" (click)="menuOpen.set(false)">
      @if (s.companies().length > 0) {
        <a class="nav" routerLink="/dashboard" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          {{ 'AICHATBOT.DASH.NAV_DASHBOARD' | translate }}
        </a>
      }
      <a class="nav" routerLink="/configure" routerLinkActive="active">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        {{ 'AICHATBOT.DASH.NAV_CONFIGURE' | translate }}
      </a>

      @if (s.companies().length > 0) {
        <a class="nav" routerLink="/knowledge" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h6"/></svg>
          Qué sabe tu bot
        </a>
      }

      @if (s.companies().length > 0) {
        <a class="nav" routerLink="/handoff" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15v-4a8 8 0 0 1 16 0v4"/><path d="M18 19a2 2 0 0 1-2 2h-3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>
          {{ 'AICHATBOT.HANDOFF.NAV' | translate }}
        </a>
      }

      <!-- Canales donde opera el chatbot (disponible para todos) -->
      @if (s.companies().length > 0) {
        <span class="group-title">Canales</span>
        <a class="nav" routerLink="/channels/web" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>
          Web
        </a>
        <a class="nav" routerLink="/channels/whatsapp" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg>
          WhatsApp
        </a>
        <a class="nav" routerLink="/channels/instagram" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>
          Instagram
        </a>
        <a class="nav" routerLink="/channels/messenger" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.36-.09.54-.04 1.06.29 2.19.45 3.35.45 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.93 4.65c-.47.74-1.47.93-2.17.4l-2.33-1.75a.6.6 0 0 0-.72 0l-3.15 2.39c-.42.32-.97-.18-.69-.63l2.93-4.65c.47-.74 1.47-.93 2.17-.4l2.33 1.75a.6.6 0 0 0 .72 0l3.15-2.39c.42-.32.97.18.69.63z"/></svg>
          Messenger
        </a>
        <a class="nav" routerLink="/channels/telegram" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg>
          Telegram
        </a>
      }

      @if (s.companies().length > 0) {
        <a class="nav support" routerLink="/support" routerLinkActive="active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.2 4.2M14.9 14.9l4.2 4.2M14.9 9.1l4.2-4.2M9.1 14.9l-4.2 4.2"/></svg>
          {{ 'AICHATBOT.SUPPORT.NAV' | translate }}
        </a>
      }
      </nav>
    </aside>
  `,
  styles: [`
    :host { display: flex; align-self: stretch; }
    .side { width: 240px; flex-shrink: 0; border-right: 1px solid var(--line-light); padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .items { display: flex; flex-direction: column; gap: 4px; flex: 1; min-height: 0; }
    .burger { display: none; }
    .nav { display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: var(--radius-md); color: var(--text-inv-2); font-weight: 500; font-size: 14px; }
    .nav:hover { background: rgba(255,255,255,.05); color: var(--text-inv); }
    .nav.active { background: rgba(231,171,46,.14); color: var(--gold-bright); }
    .nav.support { margin-top: auto; border-top: 1px solid var(--line-light); padding-top: 16px; border-radius: 0; }
    .group-title { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-inv-2);
      opacity: .7; padding: 14px 13px 6px; margin-top: 6px; border-top: 1px solid var(--line-light); }
    @media (max-width: 860px) {
      :host { width: 100%; }
      .side { width: 100%; flex-direction: column; gap: 0; border-right: none; border-bottom: 1px solid var(--line-light); padding: 10px; overflow: visible; }
      .burger { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 13px; border-radius: var(--radius-md);
        border: 1px solid var(--line-light); background: rgba(255,255,255,.05); color: var(--text-inv); font: inherit; font-weight: 600; font-size: 14px; cursor: pointer; }
      .burger:hover { border-color: rgba(231,171,46,.4); }
      .items { display: none; margin-top: 8px; }
      .side.open .items { display: flex; }
      .group-title { width: 100%; border-top: none; padding: 10px 8px 2px; margin-top: 4px; }
      .nav { padding: 12px 13px; font-size: 14px; }
      .nav.support { margin-top: 6px; border-top: 1px solid var(--line-light); padding-top: 12px; border-radius: var(--radius-md); }
    }
  `],
})
export class ChatbotSidebarComponent {
  readonly s = inject(ChatbotSessionService);
  // Menú colapsable en móvil (hamburger). En desktop siempre visible.
  readonly menuOpen = signal(false);
  // Solo el admin ve la sección de Canales mientras está en pruebas de producción.
}
