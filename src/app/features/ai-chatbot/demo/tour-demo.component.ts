import {
  Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

/**
 * Textos del recorrido. Cada pantalla replica la del producto real:
 * mismo header, mismo menú lateral, mismas métricas y mismos módulos.
 */
const COPY = {
  es: {
    // Header
    of: 'AI ChatBot de', brand: 'TechToys', user: 'María Solís', initials: 'MS', plan: 'Plan Growth',
    // Menú lateral
    nDash: 'Dashboard', nConv: 'Conversaciones', nCfg: 'Configurar', nKb: 'Qué sabe tu bot',
    nHand: 'Handoff a humano', gChannels: 'Canales', nSup: 'Soporte Técnico',
    chWeb: 'Web', chWa: 'WhatsApp', chIg: 'Instagram', chMs: 'Messenger', chTg: 'Telegram',

    // ── Dashboard ──
    dashTitle: 'Dashboard', live: 'En vivo', month: 'Julio 2026',
    mConv: 'Conversaciones', mConvSub: 'activas ahora',
    mMsg: 'Mensajes a la IA', mLead: 'Leads capturados', mInsights: 'Insights registrados',
    mHandoff: 'Chats con agente', mHandoffSub: 'atendidos por tu equipo',
    mCsat: 'Satisfacción', mCsatSub: 'votos', mRes: 'Tasa de resolución', mResSub: 'Resueltas por el bot',
    mPeak: 'Hora pico', mPeakSub: 'Cuando más te escriben', mLeadRate: 'Conversión a lead',
    thisMonth: 'Este mes',
    byDay: 'Mensajes a la IA por día', byDaySub: '· por día',
    trending: 'Temas trending', byChannel: 'Conversaciones por canal',
    topics: [
      { t: 'Envíos y entregas', n: 148 },
      { t: 'Garantía', n: 106 },
      { t: 'Precios', n: 87 },
      { t: 'Agendar una demo', n: 51 },
    ],
    channelStats: [
      { t: 'WhatsApp', n: 812, c: '#25D366' },
      { t: 'Web', n: 574, c: '#E7AB2E' },
      { t: 'Instagram', n: 268, c: '#E4405F' },
      { t: 'Messenger', n: 193, c: '#0084FF' },
    ],

    // ── Conversaciones ──
    convTitle: 'Bandeja de conversaciones',
    convLead: 'Lee lo que tu bot conversó con cada cliente, en todos los canales.',
    searchPh: 'Buscar en las conversaciones…', chAll: 'Todos', leadTag: 'Lead',
    leadBox: 'Lead capturado', leadName: 'Ana Rodríguez · ana@correo.com',
    thread: [
      { me: true, x: '¿Hacen envíos a Guanacaste?' },
      { me: false, x: 'Sí, enviamos a todo el país. A Guanacaste llega en 2 a 3 días hábiles y el envío es gratis desde ₡35.000.' },
      { me: true, x: '¿El dron viene con garantía?' },
      { me: false, x: '2 años de garantía del fabricante y 30 días para devolución sin preguntas.' },
    ],
    convList: [
      { ch: 'WhatsApp', p: '¿Hacen envíos a Guanacaste?', lead: true, t: '10:24' },
      { ch: 'Web', p: '¿Cuánto cuesta el modelo Pro 4K?', lead: false, t: '9:58' },
      { ch: 'Instagram', p: 'Quiero agendar una demo', lead: true, t: 'ayer' },
    ],

    // ── Canal Web ──
    webEyebrow: 'Canal', webTitle: 'Sitio web',
    webLead: 'Pon el chatbot en tu página con una línea de código, y personaliza cómo se ve.',
    webInstall: 'Instálalo en tu sitio web', webCopy: 'Copiar',
    webAppearance: 'Apariencia',
    fTitle: 'Título del widget', vTitle: 'Asistente TechToys',
    fColor: 'Color principal', fPos: 'Posición de la burbuja', posLeft: 'Izquierda', posRight: 'Derecha',
    fWelcome: 'Mensaje de bienvenida', vWelcome: '¡Hola! ¿En qué puedo ayudarte hoy?',
    fQuick: 'Botones de respuesta rápida', quick: ['Ver precios', 'Envíos', 'Agendar demo'],
    preview: 'Vista previa', online: 'En línea',

    // ── Handoff ──
    hoTitle: 'Hablar con una persona', hoSub: 'Un solo destino para los chats en vivo de todos los canales.',
    hoWa: 'WhatsApp', hoWaSub: 'Recibe los chats en vivo en tu WhatsApp y responde desde ahí.',
    hoTg: 'Telegram', hoTgSub: 'Recibe los chats en vivo en un grupo de Telegram.',
    agents: '2 agentes reciben los chats en vivo',
    hoHours: 'Horario de atención', hoHoursV: 'Lun, Mar, Mié, Jue, Vie · 09:00–18:00', hoDone: 'Configurado',
    calTitle: 'Agendado automático de citas (Cal.com)', calOk: 'Conectado',
  },
  en: {
    of: 'AI ChatBot of', brand: 'TechToys', user: 'Maria Solis', initials: 'MS', plan: 'Growth plan',
    nDash: 'Dashboard', nConv: 'Conversations', nCfg: 'Configure', nKb: 'What your bot knows',
    nHand: 'Human handoff', gChannels: 'Channels', nSup: 'Support',
    chWeb: 'Web', chWa: 'WhatsApp', chIg: 'Instagram', chMs: 'Messenger', chTg: 'Telegram',

    dashTitle: 'Dashboard', live: 'Live', month: 'July 2026',
    mConv: 'Conversations', mConvSub: 'active now',
    mMsg: 'Messages to the AI', mLead: 'Leads captured', mInsights: 'Insights recorded',
    mHandoff: 'Chats with an agent', mHandoffSub: 'handled by your team',
    mCsat: 'Satisfaction', mCsatSub: 'votes', mRes: 'Resolution rate', mResSub: 'Solved by the bot',
    mPeak: 'Peak hour', mPeakSub: 'When they message you most', mLeadRate: 'Lead conversion',
    thisMonth: 'This month',
    byDay: 'Messages to the AI per day', byDaySub: '· per day',
    trending: 'Trending topics', byChannel: 'Conversations per channel',
    topics: [
      { t: 'Shipping and delivery', n: 148 },
      { t: 'Warranty', n: 106 },
      { t: 'Pricing', n: 87 },
      { t: 'Booking a demo', n: 51 },
    ],
    channelStats: [
      { t: 'WhatsApp', n: 812, c: '#25D366' },
      { t: 'Web', n: 574, c: '#E7AB2E' },
      { t: 'Instagram', n: 268, c: '#E4405F' },
      { t: 'Messenger', n: 193, c: '#0084FF' },
    ],

    convTitle: 'Conversation inbox',
    convLead: 'Read what your bot discussed with each customer, across every channel.',
    searchPh: 'Search the conversations…', chAll: 'All', leadTag: 'Lead',
    leadBox: 'Lead captured', leadName: 'Ana Rodriguez · ana@mail.com',
    thread: [
      { me: true, x: 'Do you ship to the coast?' },
      { me: false, x: 'Yes, we ship nationwide. It takes 2 to 3 business days and shipping is free over $70.' },
      { me: true, x: 'Does the drone come with a warranty?' },
      { me: false, x: '2 years of manufacturer warranty and 30 days for a no-questions return.' },
    ],
    convList: [
      { ch: 'WhatsApp', p: 'Do you ship to the coast?', lead: true, t: '10:24' },
      { ch: 'Web', p: 'How much is the Pro 4K model?', lead: false, t: '9:58' },
      { ch: 'Instagram', p: 'I would like to book a demo', lead: true, t: 'yesterday' },
    ],

    webEyebrow: 'Channel', webTitle: 'Website',
    webLead: 'Put the chatbot on your page with one line of code, and customise how it looks.',
    webInstall: 'Install it on your website', webCopy: 'Copy',
    webAppearance: 'Appearance',
    fTitle: 'Widget title', vTitle: 'TechToys Assistant',
    fColor: 'Primary colour', fPos: 'Bubble position', posLeft: 'Left', posRight: 'Right',
    fWelcome: 'Welcome message', vWelcome: 'Hi! How can I help you today?',
    fQuick: 'Quick reply buttons', quick: ['See pricing', 'Shipping', 'Book a demo'],
    preview: 'Preview', online: 'Online',

    hoTitle: 'Talk to a person', hoSub: 'One destination for the live chats from every channel.',
    hoWa: 'WhatsApp', hoWaSub: 'Get the live chats on your WhatsApp and answer from there.',
    hoTg: 'Telegram', hoTgSub: 'Get the live chats in a Telegram group.',
    agents: '2 agents receive the live chats',
    hoHours: 'Business hours', hoHoursV: 'Mon, Tue, Wed, Thu, Fri · 09:00–18:00', hoDone: 'Configured',
    calTitle: 'Automatic appointment booking (Cal.com)', calOk: 'Connected',
  },
};

/**
 * Recorrido del producto para la landing. Reproduce la aplicación real:
 * header con la empresa y el usuario, menú lateral completo (incluidos los
 * cinco canales y Soporte Técnico) y cuatro pantallas que van rotando —
 * Dashboard, Conversaciones, canal Web y Atención humana.
 */
@Component({
  selector: 'app-cbdemo-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tw">
      <div class="tw-bar" aria-hidden="true"><span class="d r"></span><span class="d y"></span><span class="d g"></span><span class="tw-url">app.wearevectis.com</span></div>

      <!-- Header de la aplicación: marca + empresa actual + usuario -->
      <div class="ah" aria-hidden="true">
        <span class="ah-brand"><span class="ah-logo">V</span>Vectis<i>.</i></span>
        <span class="ah-company"><span class="ah-of">{{ t().of }}</span><b>{{ t().brand }}</b>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
        <span class="ah-user"><span class="ah-name">{{ t().user }}</span><span class="ah-av">{{ t().initials }}</span></span>
      </div>

      <div class="app">
        <!-- Menú lateral: el mismo del producto -->
        <aside class="side" aria-hidden="true">
          <nav class="s-nav">
            <span class="s-item" [class.on]="screen() === 'dash'"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg></span>{{ t().nDash }}</span>
            <span class="s-item" [class.on]="screen() === 'conv'"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>{{ t().nConv }}</span>
            <span class="s-item"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 8"/></svg></span>{{ t().nCfg }}</span>
            <span class="s-item"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h6"/></svg></span>{{ t().nKb }}</span>
            <span class="s-item" [class.on]="screen() === 'hand'"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-4a8 8 0 0 1 16 0v4"/><path d="M18 19a2 2 0 0 1-2 2h-3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg></span>{{ t().nHand }}</span>

            <span class="s-group">{{ t().gChannels }}</span>
            <span class="s-item" [class.on]="screen() === 'web'"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg></span>{{ t().chWeb }}</span>
            <span class="s-item"><span class="s-ic br"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg></span>{{ t().chWa }}</span>
            <span class="s-item"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg></span>{{ t().chIg }}</span>
            <span class="s-item"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.36-.09.54-.04 1.06.29 2.19.45 3.35.45 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.93 4.65c-.47.74-1.47.93-2.17.4l-2.33-1.75a.6.6 0 0 0-.72 0l-3.15 2.39c-.42.32-.97-.18-.69-.63l2.93-4.65c.47-.74 1.47-.93 2.17-.4l2.33 1.75a.6.6 0 0 0 .72 0l3.15-2.39c.42-.32.97.18.69.63z"/></svg></span>{{ t().chMs }}</span>
            <span class="s-item"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg></span>{{ t().chTg }}</span>

            <span class="s-item sep"><span class="s-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.2 4.2M14.9 14.9l4.2 4.2M14.9 9.1l4.2-4.2M9.1 14.9l-4.2 4.2"/></svg></span>{{ t().nSup }}</span>
          </nav>
          <span class="s-plan">{{ t().plan }}</span>
        </aside>

        <main class="main">
          @switch (screen()) {
            <!-- ══════════ Dashboard ══════════ -->
            @case ('dash') {
              <div class="scr">
                <div class="d-head">
                  <h4 class="m-h">{{ t().dashTitle }} <span class="of">· {{ t().brand }}</span></h4>
                  <div class="d-right"><span class="pill">{{ t().month }}</span><span class="live"><span class="ldot"></span>{{ t().live }}</span></div>
                </div>

                <!-- Tarjetas de métricas (las mismas que el panel real) -->
                <div class="mgrid">
                  <div class="mc"><span class="ml">{{ t().mConv }}</span><span class="mv">{{ conv() }}</span><span class="mlive"><span class="ldot sm"></span>3 {{ t().mConvSub }}</span></div>
                  <div class="mc"><span class="ml">{{ t().mMsg }}</span><span class="mv">{{ msg() }}<i class="lim"> / 10 000</i></span><span class="ubar"><i style="width:44%"></i></span></div>
                  <div class="mc"><span class="ml">{{ t().mLead }}</span><span class="mv">{{ lead() }}</span><span class="mdelta up">▲ +38</span></div>
                  <div class="mc"><span class="ml">{{ t().mHandoff }}</span><span class="mv">37</span><span class="msub">{{ t().mHandoffSub }}</span></div>
                  <div class="mc"><span class="ml">{{ t().mInsights }}</span><span class="mv">642</span><span class="msub">{{ t().thisMonth }}</span></div>
                  <div class="mc"><span class="ml">{{ t().mCsat }}</span><span class="mv">{{ csat() }}<i class="lim">%</i></span><span class="msub">184 {{ t().mCsatSub }}</span></div>
                  <div class="mc"><span class="ml">{{ t().mRes }}</span><span class="mv">88<i class="lim">%</i></span><span class="msub">{{ t().mResSub }}</span></div>
                  <div class="mc"><span class="ml">{{ t().mPeak }}</span><span class="mv">18<i class="lim">:00</i></span><span class="msub">{{ t().mPeakSub }}</span></div>
                </div>

                <!-- Gráficos -->
                <div class="d-low">
                  <div class="panel">
                    <span class="p-t">{{ t().trending }}</span>
                    <div class="bars">
                      @for (tp of t().topics; track tp.t) {
                        <div class="brow"><span class="bl">{{ tp.t }}</span><span class="bt"><i [style.width.%]="pctTopic(tp.n)"></i></span><span class="bn">{{ tp.n }}</span></div>
                      }
                    </div>
                  </div>
                  <div class="panel">
                    <span class="p-t">{{ t().byChannel }}</span>
                    <div class="bars">
                      @for (c of t().channelStats; track c.t) {
                        <div class="brow"><span class="bl">{{ c.t }}</span><span class="bt"><i [style.width.%]="pctChan(c.n)" [style.background]="c.c"></i></span><span class="bn">{{ c.n }}</span></div>
                      }
                    </div>
                  </div>
                </div>
                <div class="panel wide">
                  <span class="p-t">{{ t().byDay }} <i class="p-sub">{{ t().byDaySub }}</i></span>
                  <div class="cols">@for (b of bars; track $index) { <span class="col" [style.height.%]="b"></span> }</div>
                </div>
              </div>
            }

            <!-- ══════════ Bandeja de conversaciones ══════════ -->
            @case ('conv') {
              <div class="scr">
                <span class="eyebrow">{{ t().nConv }}</span>
                <h4 class="m-h">{{ t().convTitle }}</h4>
                <p class="m-sub">{{ t().convLead }}</p>
                <div class="tools">
                  <span class="search">{{ t().searchPh }}</span>
                  <span class="chip on">{{ t().chAll }}</span><span class="chip">WhatsApp</span><span class="chip">Web</span><span class="chip">Instagram</span>
                </div>
                <div class="inbox">
                  <div class="ilist">
                    @for (c of t().convList; track c.p; let i = $index) {
                      <div class="irow" [class.on]="i === 0">
                        <div class="itop">
                          <span class="cbadge" [attr.data-c]="c.ch">{{ c.ch }}</span>
                          @if (c.lead) { <span class="cbadge lead">{{ t().leadTag }}</span> }
                          <span class="iwhen">{{ c.t }}</span>
                        </div>
                        <span class="iprev">{{ c.p }}</span>
                      </div>
                    }
                  </div>
                  <div class="ipane">
                    <div class="leadbox"><b>{{ t().leadBox }}</b><span>{{ t().leadName }}</span></div>
                    <div class="ithread">
                      @for (m of t().thread; track m.x) { <div class="bub" [class.me]="m.me">{{ m.x }}</div> }
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- ══════════ Canal Web ══════════ -->
            @case ('web') {
              <div class="scr">
                <div class="ch-head"><span class="ch-logo"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg></span><span class="eyebrow">{{ t().webEyebrow }}</span></div>
                <h4 class="m-h">{{ t().webTitle }}</h4>
                <p class="m-sub">{{ t().webLead }}</p>

                <div class="card">
                  <b class="c-h">{{ t().webInstall }}</b>
                  <div class="code"><code>&lt;script src="…/widget.js" data-client-id="c8f2…" defer&gt;&lt;/script&gt;</code><span class="copy">{{ t().webCopy }}</span></div>
                </div>

                <div class="web-grid">
                  <div class="card">
                    <b class="c-h">{{ t().webAppearance }}</b>
                    <div class="f"><label>{{ t().fTitle }}</label><span class="inp">{{ t().vTitle }}</span></div>
                    <div class="f2">
                      <div class="f"><label>{{ t().fColor }}</label><span class="inp sw"><i></i>#E7AB2E</span></div>
                      <div class="f"><label>{{ t().fPos }}</label><span class="seg"><i>{{ t().posLeft }}</i><i class="on">{{ t().posRight }}</i></span></div>
                    </div>
                    <div class="f"><label>{{ t().fWelcome }}</label><span class="inp">{{ t().vWelcome }}</span></div>
                    <div class="f"><label>{{ t().fQuick }}</label>
                      <div class="qrs">@for (q of t().quick; track q) { <span class="qr">{{ q }}</span> }</div>
                    </div>
                  </div>

                  <!-- Vista previa del widget, igual que en el producto -->
                  <div class="pv-col">
                    <span class="pv-lbl">{{ t().preview }}</span>
                    <div class="pv">
                      <div class="pv-head"><span class="pv-av">T</span><div class="pv-meta"><b>{{ t().vTitle }}</b><span>{{ t().online }}</span></div></div>
                      <div class="pv-body">
                        <div class="pv-bot">{{ t().vWelcome }}</div>
                        <div class="pv-chips">@for (q of t().quick; track q) { <span>{{ q }}</span> }</div>
                      </div>
                      <span class="pv-launch"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- ══════════ Atención humana ══════════ -->
            @default {
              <div class="scr">
                <span class="eyebrow">{{ t().nHand }}</span>
                <h4 class="m-h">{{ t().hoTitle }}</h4>
                <p class="m-sub">{{ t().hoSub }}</p>
                <div class="horow on">
                  <span class="ho-ic wa"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg></span>
                  <div class="chtl"><b>{{ t().hoWa }}</b><span>{{ t().hoWaSub }}</span></div>
                  <span class="tgl on"><i></i></span>
                </div>
                <div class="agents"><span class="odot"></span>{{ t().agents }}</div>
                <div class="horow">
                  <span class="ho-ic tg"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg></span>
                  <div class="chtl"><b>{{ t().hoTg }}</b><span>{{ t().hoTgSub }}</span></div>
                  <span class="tgl"><i></i></span>
                </div>
                <div class="horow done">
                  <span class="ho-ic hrs"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
                  <div class="chtl"><b>{{ t().hoHours }}</b><span>{{ t().hoHoursV }}</span></div>
                  <span class="ok-chip"><span class="odot"></span>{{ t().hoDone }}</span>
                </div>
                <div class="horow done">
                  <span class="ho-ic hrs"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
                  <div class="chtl"><b>{{ t().calTitle }}</b></div>
                  <span class="ok-chip"><span class="odot"></span>{{ t().calOk }}</span>
                </div>
              </div>
            }
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tw { width: 100%; max-width: 980px; margin: 0 auto; height: 640px; display: flex; flex-direction: column; overflow: hidden;
      background: #0f0d0b; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; box-shadow: 0 30px 70px rgba(0,0,0,.45); color: #fff; }
    .tw-bar { display: flex; align-items: center; gap: 7px; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); flex-shrink: 0; }
    .tw-bar .d { width: 10px; height: 10px; border-radius: 50%; }
    .d.r { background: #ff5f57; } .d.y { background: #febc2e; } .d.g { background: #28c840; }
    .tw-url { margin-left: 12px; font-size: 11.5px; color: rgba(255,255,255,.4); font-family: ui-monospace, Menlo, monospace; }

    /* Header de la app */
    .ah { display: flex; align-items: center; gap: 16px; padding: 10px 18px; border-bottom: 1px solid rgba(255,255,255,.08); flex-shrink: 0; }
    .ah-brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; }
    .ah-brand i { color: #E7AB2E; font-style: normal; }
    .ah-logo { width: 24px; height: 24px; border-radius: 7px; background: #E7AB2E; color: #0A0A0A; display: grid; place-items: center; font-weight: 900; font-size: 12px; }
    .ah-company { display: inline-flex; align-items: center; gap: 6px; margin-left: 6px; font-size: 12.5px; color: rgba(255,255,255,.85); }
    .ah-of { color: rgba(255,255,255,.45); }
    .ah-user { margin-left: auto; display: inline-flex; align-items: center; gap: 9px; font-size: 12.5px; color: rgba(255,255,255,.75); }
    .ah-av { width: 26px; height: 26px; border-radius: 50%; background: rgba(231,171,46,.16); border: 1px solid rgba(231,171,46,.35);
      color: #E7AB2E; display: grid; place-items: center; font-weight: 800; font-size: 10.5px; }

    .app { flex: 1; display: grid; grid-template-columns: 186px 1fr; min-height: 0; }

    /* Menú lateral */
    .side { border-right: 1px solid rgba(255,255,255,.08); padding: 14px 10px; display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,.02); }
    .s-nav { display: flex; flex-direction: column; gap: 1px; }
    .s-item { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,.6); }
    .s-item.on { background: rgba(231,171,46,.14); color: #E7AB2E; }
    .s-item.sep { margin-top: 8px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.07); border-radius: 0; }
    .s-ic { display: inline-flex; width: 15px; height: 15px; flex-shrink: 0; }
    .s-ic svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
    .s-ic.br svg { fill: currentColor; stroke: none; }
    .s-group { font-size: 9px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: rgba(255,255,255,.3); padding: 12px 10px 4px; }
    .s-plan { margin-top: auto; font-size: 10.5px; font-weight: 700; color: #E7AB2E; text-align: center; padding: 6px; border-radius: 8px; background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.25); }

    .main { padding: 20px 24px; overflow: hidden; }
    .scr { animation: tw-in .5s cubic-bezier(.2,.8,.2,1) both; }
    @keyframes tw-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @keyframes fld-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .eyebrow { display: block; font-size: 9.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #E7AB2E; }
    .m-h { font-size: 19px; margin-top: 6px; }
    .m-h .of { font-weight: 400; color: rgba(255,255,255,.45); font-size: 14px; }
    .m-sub { font-size: 12px; color: rgba(255,255,255,.55); margin: 5px 0 14px; }

    /* ── Dashboard ── */
    .d-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 13px; }
    .d-right { display: flex; align-items: center; gap: 9px; }
    .live { font-size: 11px; font-weight: 700; color: #34e0a1; display: inline-flex; align-items: center; gap: 5px; }
    .ldot { width: 7px; height: 7px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; animation: pulse 1.4s ease-in-out infinite; }
    .ldot.sm { width: 6px; height: 6px; }
    @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.8); } }
    .pill { font-size: 11px; font-weight: 600; color: #E7AB2E; padding: 5px 11px; border-radius: 999px; background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); white-space: nowrap; }
    .mgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
    .mc { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 11px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px;
      opacity: 0; animation: fld-in .4s ease forwards; }
    .mc:nth-child(1){animation-delay:.04s}.mc:nth-child(2){animation-delay:.09s}.mc:nth-child(3){animation-delay:.14s}.mc:nth-child(4){animation-delay:.19s}
    .mc:nth-child(5){animation-delay:.24s}.mc:nth-child(6){animation-delay:.29s}.mc:nth-child(7){animation-delay:.34s}.mc:nth-child(8){animation-delay:.39s}
    .ml { font-size: 10px; color: rgba(255,255,255,.6); }
    .mv { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.15; }
    .mv .lim { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.4); font-style: normal; }
    .msub, .mdelta, .mlive { font-size: 9.5px; color: rgba(255,255,255,.5); }
    .mdelta.up { color: #34e0a1; font-weight: 600; }
    .mlive { color: #34e0a1; display: inline-flex; align-items: center; gap: 5px; }
    .ubar { display: block; height: 4px; border-radius: 999px; background: rgba(255,255,255,.1); overflow: hidden; margin-top: 4px; }
    .ubar i { display: block; height: 100%; background: #E7AB2E; }
    .d-low { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 9px; }
    .panel { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 11px; padding: 11px 13px; opacity: 0; animation: fld-in .45s ease .42s forwards; }
    .panel.wide { margin-top: 9px; animation-delay: .5s; }
    .p-t { font-size: 10.5px; color: rgba(255,255,255,.55); } .p-sub { font-style: normal; color: rgba(255,255,255,.35); }
    .bars { margin-top: 9px; display: flex; flex-direction: column; gap: 7px; }
    .brow { display: grid; grid-template-columns: 96px 1fr 30px; align-items: center; gap: 8px; }
    .bl { font-size: 10.5px; color: rgba(255,255,255,.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bt { height: 6px; border-radius: 999px; background: rgba(255,255,255,.09); overflow: hidden; }
    .bt i { display: block; height: 100%; border-radius: 999px; background: #E7AB2E; animation: grow .7s cubic-bezier(.2,.8,.2,1) both .5s; transform-origin: left; }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    .bn { font-size: 10.5px; color: rgba(255,255,255,.5); text-align: right; font-variant-numeric: tabular-nums; }
    .cols { display: flex; align-items: flex-end; gap: 4px; height: 58px; margin-top: 10px; }
    .col { flex: 1; border-radius: 3px 3px 0 0; background: #E7AB2E; transform-origin: bottom; animation: bar-up .6s cubic-bezier(.2,.8,.2,1) both .55s; }
    @keyframes bar-up { from { transform: scaleY(0); } to { transform: scaleY(1); } }

    /* ── Conversaciones ── */
    .tools { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 11px; }
    .search { font-size: 11px; color: rgba(255,255,255,.35); padding: 7px 11px; border-radius: 9px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); min-width: 180px; }
    .chip { font-size: 10.5px; font-weight: 600; padding: 5px 11px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.6); }
    .chip.on { border-color: #E7AB2E; color: #E7AB2E; }
    .inbox { display: grid; grid-template-columns: 210px 1fr; gap: 10px; }
    .ilist { display: flex; flex-direction: column; gap: 6px; }
    .irow { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 9px 11px; display: flex; flex-direction: column; gap: 5px;
      opacity: 0; animation: fld-in .4s ease forwards; }
    .irow:nth-child(1){animation-delay:.08s}.irow:nth-child(2){animation-delay:.16s}.irow:nth-child(3){animation-delay:.24s}
    .irow.on { border-color: #E7AB2E; background: rgba(231,171,46,.07); }
    .itop { display: flex; align-items: center; gap: 5px; }
    .iwhen { margin-left: auto; font-size: 9.5px; color: rgba(255,255,255,.4); }
    .iprev { font-size: 11px; color: rgba(255,255,255,.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cbadge { font-size: 8.5px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; padding: 3px 6px; border-radius: 999px;
      color: #E7AB2E; background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); }
    .cbadge[data-c="WhatsApp"] { color: #25D366; background: rgba(37,211,102,.12); border-color: rgba(37,211,102,.3); }
    .cbadge[data-c="Instagram"] { color: #E4405F; background: rgba(228,64,95,.12); border-color: rgba(228,64,95,.3); }
    .cbadge.lead { color: #36c08b; background: rgba(54,192,139,.12); border-color: rgba(54,192,139,.3); }
    .ipane { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 11px; padding: 12px; opacity: 0; animation: fld-in .45s ease .3s forwards; }
    .leadbox { padding: 8px 11px; border-radius: 9px; background: rgba(231,171,46,.08); border: 1px solid rgba(231,171,46,.3); margin-bottom: 11px; }
    .leadbox b { display: block; font-size: 10.5px; color: #E7AB2E; } .leadbox span { font-size: 10.5px; color: rgba(255,255,255,.6); }
    .ithread { display: flex; flex-direction: column; gap: 7px; }
    .bub { max-width: 84%; padding: 8px 11px; border-radius: 12px; font-size: 11px; line-height: 1.45;
      align-self: flex-start; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-bottom-left-radius: 4px; }
    .bub.me { align-self: flex-end; background: #E7AB2E; color: #0A0A0A; border: none; border-bottom-right-radius: 4px; border-bottom-left-radius: 12px; }

    /* ── Canal Web ── */
    .ch-head { display: flex; align-items: center; gap: 10px; }
    .ch-logo { display: inline-flex; width: 20px; height: 20px; color: rgba(255,255,255,.9); }
    .ch-logo svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
    .ch-head .eyebrow { margin: 0; }
    .card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 11px; padding: 12px 14px; opacity: 0; animation: fld-in .4s ease .1s forwards; }
    .c-h { display: block; font-size: 12.5px; margin-bottom: 8px; }
    .code { position: relative; background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 9px 66px 9px 11px; }
    .code code { font-family: ui-monospace, Menlo, monospace; font-size: 9.5px; color: #F0C868; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
    .copy { position: absolute; top: 6px; right: 7px; font-size: 10px; font-weight: 600; padding: 4px 9px; border-radius: 7px; border: 1px solid rgba(255,255,255,.14); color: rgba(255,255,255,.8); }
    .web-grid { display: grid; grid-template-columns: 1fr 200px; gap: 10px; margin-top: 9px; }
    .web-grid .card { animation-delay: .2s; }
    .f { margin-bottom: 9px; } .f:last-child { margin-bottom: 0; }
    .f label { display: block; font-size: 10px; font-weight: 600; color: rgba(255,255,255,.6); margin-bottom: 5px; }
    .inp { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 8px 11px; font-size: 11px; }
    .inp.sw { font-family: ui-monospace, Menlo, monospace; font-size: 10.5px; }
    .inp.sw i { width: 14px; height: 14px; border-radius: 4px; background: #E7AB2E; box-shadow: 0 0 0 1px rgba(255,255,255,.15); }
    .f2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 9px; }
    .f2 .f { margin-bottom: 0; }
    .seg { display: inline-flex; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; overflow: hidden; }
    .seg i { font-style: normal; font-size: 10.5px; font-weight: 600; padding: 7px 13px; color: rgba(255,255,255,.55); }
    .seg i.on { background: #E7AB2E; color: #0A0A0A; }
    .qrs { display: flex; gap: 6px; flex-wrap: wrap; }
    .qr { font-size: 10px; padding: 6px 10px; border-radius: 8px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); }
    .pv-col { opacity: 0; animation: fld-in .45s ease .3s forwards; }
    .pv-lbl { display: block; font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.45); margin-bottom: 7px; }
    .pv { background: #fff; border-radius: 13px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,.4); position: relative; }
    .pv-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: linear-gradient(135deg, #F0C868, #E7AB2E); color: #0A0A0A; }
    .pv-av { width: 26px; height: 26px; border-radius: 50%; background: rgba(255,255,255,.92); display: grid; place-items: center; font-weight: 800; font-size: 11px; flex-shrink: 0; }
    .pv-meta { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
    .pv-meta b { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .pv-meta span { font-size: 9px; opacity: .8; }
    .pv-body { padding: 12px; background: #f6f6f8; min-height: 104px; }
    .pv-bot { background: #fff; color: #1a1a1a; border: 1px solid #ececf0; border-radius: 11px; border-bottom-left-radius: 4px; padding: 8px 10px; font-size: 10.5px; max-width: 92%; }
    .pv-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
    .pv-chips span { font-size: 9.5px; font-weight: 600; padding: 5px 9px; border-radius: 999px; border: 1px solid #E7AB2E; color: #E7AB2E; background: #fff; }
    .pv-launch { position: absolute; bottom: 9px; right: 9px; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
      background: linear-gradient(135deg, #F0C868, #E7AB2E); box-shadow: 0 6px 16px rgba(0,0,0,.25); }

    /* ── Handoff ── */
    .horow { display: flex; align-items: center; gap: 11px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
      border-radius: 11px; padding: 11px 13px; margin-bottom: 8px; opacity: 0; animation: fld-in .4s ease .1s forwards; }
    .horow.on { border-color: rgba(37,211,102,.3); }
    .horow.done { border-color: rgba(52,224,161,.28); animation-delay: .3s; }
    .chtl { flex: 1; min-width: 0; } .chtl b { display: block; font-size: 12.5px; } .chtl span { font-size: 10.5px; color: rgba(255,255,255,.55); }
    .ho-ic { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; }
    .ho-ic.wa { color: #25D366; background: rgba(37,211,102,.14); border: 1px solid rgba(37,211,102,.3); }
    .ho-ic.tg { color: #229ED9; background: rgba(34,158,217,.14); border: 1px solid rgba(34,158,217,.3); }
    .ho-ic.hrs { color: #34e0a1; background: rgba(52,224,161,.12); border: 1px solid rgba(52,224,161,.3); }
    .tgl { width: 36px; height: 21px; border-radius: 999px; background: rgba(255,255,255,.12); position: relative; display: inline-block; flex-shrink: 0; }
    .tgl i { position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #fff; }
    .tgl.on { background: #E7AB2E; } .tgl.on i { left: auto; right: 3px; }
    .ok-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 700; color: #34e0a1; flex-shrink: 0; }
    .odot { width: 6px; height: 6px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 7px #34e0a1; }
    .agents { display: flex; align-items: center; gap: 7px; font-size: 10.5px; color: rgba(255,255,255,.55); margin: -2px 0 10px 4px;
      opacity: 0; animation: fld-in .4s ease .2s forwards; }

    @media (prefers-reduced-motion: reduce) {
      .scr, .mc, .panel, .irow, .ipane, .card, .pv-col, .horow, .agents, .bt i, .col { animation: none; opacity: 1; }
      .ldot { animation: none; }
    }
    /* Móvil: sin menú lateral y con los grids apilados */
    @media (max-width: 700px) {
      .tw { height: auto; min-height: 500px; }
      .app { grid-template-columns: 1fr; }
      .side { display: none; }
      .main { padding: 16px 14px; }
      .m-h { font-size: 16px; }
      .mgrid { grid-template-columns: 1fr 1fr; }
      .mgrid .mc:nth-child(n+7) { display: none; }
      .d-low, .inbox, .web-grid { grid-template-columns: 1fr; }
      .pv-col { display: none; }
      .ilist { display: none; }
      .ah-of, .ah-name, .tw-url { display: none; }
      .d-head { flex-wrap: wrap; }
    }
  `],
})
export class TourDemoComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  /** Pantallas del recorrido, en el orden en que se muestran. */
  private readonly SCREENS: Array<'dash' | 'conv' | 'web' | 'hand'> = ['dash', 'conv', 'web', 'hand'];
  readonly screen = signal<'dash' | 'conv' | 'web' | 'hand'>('dash');
  readonly t = signal(COPY.es);
  readonly conv = signal(1847);
  readonly msg = signal(4392);
  readonly lead = signal(214);
  readonly csat = signal(96);
  readonly bars = [40, 62, 48, 74, 55, 88, 66, 52, 79, 61, 92, 70, 58, 83];

  private alive = true;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private countTimers: ReturnType<typeof setInterval>[] = [];

  /** Barras relativas al valor más alto, igual que en el panel real. */
  pctTopic(n: number): number { return Math.round((n / Math.max(...this.t().topics.map((x) => x.n))) * 100); }
  pctChan(n: number): number { return Math.round((n / Math.max(...this.t().channelStats.map((x) => x.n))) * 100); }

  ngOnInit(): void {
    const lang = (this.translate.currentLang || this.translate.defaultLang || 'es') as 'es' | 'en';
    this.t.set(COPY[lang] || COPY.es);
    this.translate.onLangChange.subscribe((e) => this.t.set(COPY[(e.lang as 'es' | 'en')] || COPY.es));
    // Sin navegador (SSR) o si el usuario pidió menos animación: una sola pantalla, quieta.
    if (!isPlatformBrowser(this.platformId)) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    this.loop();
  }

  ngOnDestroy(): void {
    this.alive = false;
    if (this.timer) clearTimeout(this.timer);
    this.countTimers.forEach(clearInterval);
  }

  private sleep(ms: number): Promise<void> { return new Promise((res) => { this.timer = setTimeout(res, ms); }); }

  private countUp(setter: (v: number) => void, target: number, ms = 1200): void {
    const start = performance.now();
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setter(Math.round(target * eased));
      if (p >= 1) clearInterval(id);
    }, 40);
    this.countTimers.push(id);
  }

  private async loop(): Promise<void> {
    let i = 0;
    while (this.alive) {
      const s = this.SCREENS[i % this.SCREENS.length];
      this.screen.set(s);
      if (s === 'dash') {
        // Los contadores arrancan de cero cada vez que se vuelve al panel.
        this.conv.set(0); this.msg.set(0); this.lead.set(0); this.csat.set(0);
        this.countUp((v) => this.conv.set(v), 1847);
        this.countUp((v) => this.msg.set(v), 4392);
        this.countUp((v) => this.lead.set(v), 214);
        this.countUp((v) => this.csat.set(v), 96);
      }
      await this.sleep(s === 'dash' ? 5600 : 4600);
      i++;
    }
  }
}
