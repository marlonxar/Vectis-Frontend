import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService } from './session.service';

/**
 * /channels/:channel — Canales donde puede operar el chatbot (Web, WhatsApp, Instagram,
 * Messenger, Telegram). Cada uno muestra sus instrucciones. Visible SOLO para el admin
 * (vectisauto@gmail.com) mientras está en pruebas de producción — el gating vive en el sidebar.
 */
@Component({
  selector: 'app-chatbot-channels',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatbotAppHeaderComponent, ChatbotSidebarComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">
          <div class="wrap">
            <span class="eyebrow on-dark">Canal</span>
            <h1 class="ttl">{{ meta().title }}</h1>
            <p class="lead on-dark">{{ meta().lead }}</p>

            <!-- Aviso: hay que configurar primero en /configure -->
            <div class="callout">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <div>
                <b>Antes de empezar:</b> tu chatbot toma toda su información (negocio, documentos, inventario, sitio web, FAQs) desde
                <a routerLink="/configure">Configurar</a>. Si aún no lo has hecho, configúralo primero — este canal usa esa misma información.
              </div>
            </div>

            @switch (channel()) {
              @case ('web') {
                <section class="card">
                  <h3 class="ch">Instálalo en tu sitio web</h3>
                  <p class="muted">Copia esta línea y pégala justo antes de <code>&lt;/body&gt;</code> en tu página. La burbuja aparece sola.</p>
                  <div class="code">
                    <pre>{{ embed() }}</pre>
                    <button type="button" class="copy" (click)="copy(embed())">{{ copied() ? '¡Copiado!' : 'Copiar' }}</button>
                  </div>
                  <ol class="steps">
                    <li>Configura tu chatbot en <a routerLink="/configure">Configurar</a> (información, apariencia, dominios permitidos).</li>
                    <li>En <b>Dominios permitidos</b>, agrega el dominio donde vas a pegar el widget (si no, no cargará por seguridad).</li>
                    <li>Pega la línea de arriba en tu sitio, antes de <code>&lt;/body&gt;</code>.</li>
                    <li>Recarga tu página: la burbuja del chat aparece abajo a la derecha.</li>
                  </ol>
                  <p class="hint">¿No aparece? Revisa que el dominio esté en la lista de dominios permitidos y que el chatbot esté activo.</p>
                </section>
              }
              @default {
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
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 40px; max-width: 860px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .callout { display: flex; align-items: flex-start; gap: 12px; margin: 22px 0 0; padding: 14px 16px; border-radius: var(--radius-md);
      background: rgba(231,171,46,.08); border: 1px solid rgba(231,171,46,.3); font-size: 14px; color: var(--text-inv-2); }
    .callout > svg { color: var(--gold-bright); flex-shrink: 0; margin-top: 1px; }
    .callout a { color: var(--gold-bright); font-weight: 600; }
    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 22px 24px; margin-top: 22px; position: relative; }
    .ch { font-size: 16px; margin-bottom: 8px; }
    .muted { color: var(--text-inv-2); font-size: 14px; }
    .code { position: relative; margin: 14px 0; }
    .code pre { background: rgba(0,0,0,.35); border: 1px solid var(--line-light); border-radius: var(--radius-md); padding: 14px 16px; padding-right: 92px;
      font-family: var(--font-mono, ui-monospace), monospace; font-size: 12.5px; color: var(--gold-soft); overflow-x: auto; white-space: pre-wrap; word-break: break-all; margin: 0; }
    .copy { position: absolute; top: 10px; right: 10px; border: 1px solid var(--line-light); background: rgba(255,255,255,.06); color: var(--text-inv);
      border-radius: 8px; padding: 6px 12px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
    .copy:hover { border-color: var(--gold-bright); color: var(--gold-bright); }
    .steps { margin: 14px 0 0; padding-left: 20px; display: grid; gap: 9px; }
    .steps li { font-size: 14px; line-height: 1.55; color: var(--text-inv-2); }
    .steps b { color: var(--text-inv); }
    code { background: rgba(255,255,255,.08); border-radius: 5px; padding: 1px 6px; font-family: var(--font-mono, ui-monospace), monospace; font-size: 12.5px; }
    .hint { font-size: 12.5px; color: var(--text-inv-2); margin-top: 14px; }
    .hint a, .steps a { color: var(--gold-bright); font-weight: 600; }
    .soon { position: absolute; top: 16px; right: 16px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); border-radius: 999px; padding: 4px 10px; }
    .soon-card { padding-top: 26px; }
    .bullets { list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 10px; }
    .bullets li { display: flex; align-items: flex-start; gap: 11px; color: var(--text-inv-2); font-size: 14px; line-height: 1.5; }
    .dot { width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 10px var(--gold-bright); flex-shrink: 0; }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    @media (max-width: 560px) { .wrap { padding: 30px 16px 32px; } .card { padding: 18px 16px; } }
  `],
})
export class ChatbotChannelsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly s = inject(ChatbotSessionService);

  readonly channel = toSignal(this.route.paramMap.pipe(map((p) => (p.get('channel') || 'web').toLowerCase())), { initialValue: 'web' });
  readonly copied = signal(false);

  readonly embed = computed(() => {
    const id = this.s.currentClientId() || 'TU-CLIENT-ID';
    return '<script src="https://wearevectis.com/assets/chatbot/widget.js"\n  data-client-id="' + id + '"\n  defer></script>';
  });

  private readonly META: Record<string, { title: string; lead: string; soon: string; points: string[] }> = {
    web: {
      title: 'Sitio web',
      lead: 'Pon el chatbot en tu página con una sola línea de código. Atiende a tus visitantes 24/7.',
      soon: '', points: [],
    },
    whatsapp: {
      title: 'WhatsApp',
      lead: 'Conecta tu chatbot a WhatsApp para que responda a tus clientes desde su app favorita.',
      soon: 'Estamos preparando la integración con WhatsApp (WhatsApp Business / Cloud API). Pronto podrás vincular tu número y el bot contestará automáticamente con la información de tu negocio.',
      points: ['El bot responde en los chats de WhatsApp de tu negocio.', 'Usa la misma información y reglas que ya configuraste.', 'Requiere una cuenta de WhatsApp Business y un paso de conexión guiado.'],
    },
    instagram: {
      title: 'Instagram',
      lead: 'Deja que el chatbot conteste los mensajes directos (DM) de tu cuenta de Instagram.',
      soon: 'Estamos preparando la integración con los mensajes directos de Instagram. Pronto podrás vincular tu cuenta profesional y el bot responderá los DM automáticamente.',
      points: ['El bot responde los DM de tu cuenta de Instagram.', 'Usa la misma información y reglas que ya configuraste.', 'Requiere una cuenta profesional de Instagram vinculada a una página de Facebook.'],
    },
    messenger: {
      title: 'Messenger',
      lead: 'Conecta el chatbot a Facebook Messenger para atender a quienes te escriben desde tu página.',
      soon: 'Estamos preparando la integración con Facebook Messenger. Pronto podrás vincular tu página y el bot contestará los mensajes automáticamente.',
      points: ['El bot responde los mensajes de tu página de Facebook.', 'Usa la misma información y reglas que ya configuraste.', 'Requiere una página de Facebook y un paso de conexión guiado.'],
    },
    telegram: {
      title: 'Telegram',
      lead: 'Pon a tu chatbot a responder en Telegram con el bot de tu negocio.',
      soon: 'Estamos preparando que el bot conteste directamente en Telegram (hoy Telegram ya se usa para el handoff a un agente). Pronto podrás activarlo como canal de atención automática.',
      points: ['El bot responde en el chat de Telegram de tu negocio.', 'Usa la misma información y reglas que ya configuraste.', 'Se conecta con el bot de Telegram de tu negocio (BotFather).'],
    },
  };
  readonly meta = computed(() => this.META[this.channel()] || this.META['web']);

  copy(text: string): void {
    try { navigator.clipboard.writeText(text); } catch (e) { /* noop */ }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }
}
