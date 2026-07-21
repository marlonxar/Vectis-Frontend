import {
  Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

/**
 * Textos del recorrido. Reflejan las pantallas REALES del producto:
 * el menú, las métricas del dashboard, la bandeja de conversaciones,
 * los canales y la atención humana son los mismos que ve un cliente.
 */
const COPY = {
  es: {
    brand: 'TechToys', plan: 'Plan Growth',
    nDash: 'Dashboard', nConv: 'Conversaciones', nCfg: 'Configurar', nKb: 'Qué sabe tu bot',
    nHand: 'Handoff a humano', nChannels: 'Canales', nSup: 'Soporte',
    // Dashboard
    dashTitle: 'Dashboard', live: 'En vivo', month: 'Julio 2026',
    mConv: 'Conversaciones', mMsg: 'Mensajes a la IA', mLead: 'Leads capturados', mCsat: 'Satisfacción',
    byDay: 'Mensajes a la IA por día', byChannel: 'Conversaciones por canal',
    trending: 'Temas trending',
    topics: [
      { t: 'Envíos y entregas', p: 100 },
      { t: 'Garantía', p: 72 },
      { t: 'Precios', p: 58 },
      { t: 'Agendar una demo', p: 34 },
    ],
    sRes: 'Tasa de resolución', sLead: 'Conversión a lead', sPeak: 'Hora pico',
    // Conversaciones
    convTitle: 'Bandeja de conversaciones',
    convLead: 'Lee lo que tu bot conversó con cada cliente, en todos los canales.',
    chAll: 'Todos', leadTag: 'Lead',
    thread: [
      { me: true, x: '¿Hacen envíos a Guanacaste?' },
      { me: false, x: 'Sí, enviamos a todo el país. A Guanacaste llega en 2 a 3 días hábiles y el envío es gratis desde ₡35.000.' },
      { me: true, x: 'Perfecto. ¿El dron viene con garantía?' },
      { me: false, x: 'Sí, 2 años de garantía del fabricante y 30 días para devolución sin preguntas.' },
    ],
    convList: [
      { ch: 'WhatsApp', p: '¿Hacen envíos a Guanacaste?', lead: true },
      { ch: 'Web', p: '¿Cuánto cuesta el modelo Pro 4K?', lead: false },
      { ch: 'Instagram', p: 'Quiero agendar una demo', lead: true },
    ],
    // Canales
    chTitle: 'Canales', chSub: 'El mismo bot, con la misma información, en todos lados.',
    on: 'Activo', off: 'Sin conectar',
    channels: [
      { n: 'Sitio web', s: 'Widget instalado', on: true },
      { n: 'WhatsApp', s: 'Cloud API conectada', on: true },
      { n: 'Instagram', s: 'DM conectados', on: true },
      { n: 'Messenger', s: 'Página vinculada', on: true },
      { n: 'Telegram', s: 'Bot conectado', on: false },
    ],
    calTitle: 'Agendado automático (Cal.com)', calOk: 'Conectado',
    // Handoff
    hoTitle: 'Hablar con una persona', hoSub: 'Un solo destino para los chats en vivo de todos los canales.',
    hoWa: 'WhatsApp', hoWaSub: 'Los chats en vivo llegan a tu WhatsApp.',
    hoTg: 'Telegram', hoTgSub: 'Los chats en vivo llegan a tu grupo.',
    hoHours: 'Horario de atención', hoHoursV: 'Lun, Mar, Mié, Jue, Vie · 09:00–18:00', hoDone: 'Configurado',
    agents: '2 agentes reciben los chats',
  },
  en: {
    brand: 'TechToys', plan: 'Growth plan',
    nDash: 'Dashboard', nConv: 'Conversations', nCfg: 'Configure', nKb: 'What your bot knows',
    nHand: 'Human handoff', nChannels: 'Channels', nSup: 'Support',
    dashTitle: 'Dashboard', live: 'Live', month: 'July 2026',
    mConv: 'Conversations', mMsg: 'Messages to the AI', mLead: 'Leads captured', mCsat: 'Satisfaction',
    byDay: 'Messages to the AI per day', byChannel: 'Conversations per channel',
    trending: 'Trending topics',
    topics: [
      { t: 'Shipping and delivery', p: 100 },
      { t: 'Warranty', p: 72 },
      { t: 'Pricing', p: 58 },
      { t: 'Booking a demo', p: 34 },
    ],
    sRes: 'Resolution rate', sLead: 'Lead conversion', sPeak: 'Peak hour',
    convTitle: 'Conversation inbox',
    convLead: 'Read what your bot discussed with each customer, across every channel.',
    chAll: 'All', leadTag: 'Lead',
    thread: [
      { me: true, x: 'Do you ship to the coast?' },
      { me: false, x: 'Yes, we ship nationwide. It takes 2 to 3 business days and shipping is free over $70.' },
      { me: true, x: 'Great. Does the drone come with a warranty?' },
      { me: false, x: 'It does — 2 years of manufacturer warranty and 30 days for a no-questions return.' },
    ],
    convList: [
      { ch: 'WhatsApp', p: 'Do you ship to the coast?', lead: true },
      { ch: 'Web', p: 'How much is the Pro 4K model?', lead: false },
      { ch: 'Instagram', p: 'I would like to book a demo', lead: true },
    ],
    chTitle: 'Channels', chSub: 'The same bot, with the same information, everywhere.',
    on: 'Active', off: 'Not connected',
    channels: [
      { n: 'Website', s: 'Widget installed', on: true },
      { n: 'WhatsApp', s: 'Cloud API connected', on: true },
      { n: 'Instagram', s: 'DMs connected', on: true },
      { n: 'Messenger', s: 'Page linked', on: true },
      { n: 'Telegram', s: 'Bot connected', on: false },
    ],
    calTitle: 'Automatic booking (Cal.com)', calOk: 'Connected',
    hoTitle: 'Talk to a person', hoSub: 'One destination for the live chats from every channel.',
    hoWa: 'WhatsApp', hoWaSub: 'Live chats arrive on your WhatsApp.',
    hoTg: 'Telegram', hoTgSub: 'Live chats arrive in your group.',
    hoHours: 'Business hours', hoHoursV: 'Mon, Tue, Wed, Thu, Fri · 09:00–18:00', hoDone: 'Configured',
    agents: '2 agents receive the chats',
  },
};

/**
 * Recorrido del producto para la landing: ventana de navegador con el menú real
 * y cuatro pantallas que van rotando — Dashboard, Conversaciones, Canales y
 * Atención humana. Todo lo que se ve aquí existe en el producto.
 */
@Component({
  selector: 'app-cbdemo-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tw">
      <div class="tw-bar" aria-hidden="true"><span class="d r"></span><span class="d y"></span><span class="d g"></span><span class="tw-url">app.wearevectis.com</span></div>
      <div class="app">
        <aside class="side" aria-hidden="true">
          <div class="s-brand"><span class="s-logo">T</span>{{ t().brand }}</div>
          <nav class="s-nav">
            <span class="s-item" [class.on]="screen() === 'dash'"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>{{ t().nDash }}</span>
            <span class="s-item" [class.on]="screen() === 'conv'"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{{ t().nConv }}</span>
            <span class="s-item"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 8"/></svg>{{ t().nCfg }}</span>
            <span class="s-item"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h6"/></svg>{{ t().nKb }}</span>
            <span class="s-item" [class.on]="screen() === 'hand'"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-4a8 8 0 0 1 16 0v4"/><path d="M18 19a2 2 0 0 1-2 2h-3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>{{ t().nHand }}</span>
            <span class="s-group">{{ t().nChannels }}</span>
            <span class="s-item" [class.on]="screen() === 'chan'"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>Web</span>
            <span class="s-item"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg>WhatsApp</span>
          </nav>
          <span class="s-plan">{{ t().plan }}</span>
        </aside>

        <main class="main">
          @switch (screen()) {
            <!-- ───────── Dashboard ───────── -->
            @case ('dash') {
              <div class="scr">
                <div class="d-head">
                  <h4 class="m-h">{{ t().dashTitle }}</h4>
                  <div class="d-right"><span class="live"><span class="ldot"></span>{{ t().live }}</span><span class="pill">{{ t().month }}</span></div>
                </div>
                <div class="mgrid">
                  <div class="mc"><span class="ml">{{ t().mConv }}</span><span class="mv">{{ conv() | number }}</span><span class="mdelta up">▲ 14%</span></div>
                  <div class="mc"><span class="ml">{{ t().mMsg }}</span><span class="mv">{{ msg() | number }}</span><span class="mdelta up">▲ 9%</span></div>
                  <div class="mc"><span class="ml">{{ t().mLead }}</span><span class="mv">{{ lead() | number }}</span><span class="mdelta up">▲ 23%</span></div>
                  <div class="mc"><span class="ml">{{ t().mCsat }}</span><span class="mv">{{ csat() }}%</span><span class="mdelta up">▲ 4%</span></div>
                </div>
                <div class="d-low">
                  <div class="panel">
                    <span class="p-t">{{ t().byDay }}</span>
                    <div class="bars">@for (b of bars; track $index) { <span class="bar" [style.height.%]="b"></span> }</div>
                  </div>
                  <div class="panel">
                    <span class="p-t">{{ t().trending }}</span>
                    <div class="topics">
                      @for (tp of t().topics; track tp.t) {
                        <div class="tp"><span class="tp-n">{{ tp.t }}</span><span class="tp-bar"><i [style.width.%]="tp.p"></i></span></div>
                      }
                    </div>
                  </div>
                </div>
                <div class="d-stats">
                  <div class="st"><span class="stl">{{ t().sRes }}</span><span class="stv">88%</span></div>
                  <div class="st"><span class="stl">{{ t().sLead }}</span><span class="stv">12%</span></div>
                  <div class="st"><span class="stl">{{ t().sPeak }}</span><span class="stv">18:00</span></div>
                </div>
              </div>
            }

            <!-- ───────── Bandeja de conversaciones ───────── -->
            @case ('conv') {
              <div class="scr">
                <h4 class="m-h">{{ t().convTitle }}</h4>
                <p class="m-sub">{{ t().convLead }}</p>
                <div class="chips">
                  <span class="chip on">{{ t().chAll }}</span>
                  <span class="chip">WhatsApp</span><span class="chip">Web</span><span class="chip">Instagram</span>
                </div>
                <div class="inbox">
                  <div class="ilist">
                    @for (c of t().convList; track c.p; let i = $index) {
                      <div class="irow" [class.on]="i === 0">
                        <div class="itop">
                          <span class="cbadge" [attr.data-c]="c.ch">{{ c.ch }}</span>
                          @if (c.lead) { <span class="cbadge lead">{{ t().leadTag }}</span> }
                        </div>
                        <span class="iprev">{{ c.p }}</span>
                      </div>
                    }
                  </div>
                  <div class="ithread">
                    @for (m of t().thread; track m.x) {
                      <div class="bub" [class.me]="m.me">{{ m.x }}</div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- ───────── Canales ───────── -->
            @case ('chan') {
              <div class="scr">
                <h4 class="m-h">{{ t().chTitle }}</h4>
                <p class="m-sub">{{ t().chSub }}</p>
                <div class="chlist">
                  @for (c of t().channels; track c.n) {
                    <div class="chrow">
                      <div class="chtl"><b>{{ c.n }}</b><span>{{ c.on ? c.s : t().off }}</span></div>
                      <span class="tgl" [class.on]="c.on"><i></i></span>
                    </div>
                  }
                </div>
                <div class="calrow">
                  <div class="chtl"><b>{{ t().calTitle }}</b></div>
                  <span class="ok-chip"><span class="odot"></span>{{ t().calOk }}</span>
                </div>
              </div>
            }

            <!-- ───────── Atención humana ───────── -->
            @default {
              <div class="scr">
                <h4 class="m-h">{{ t().hoTitle }}</h4>
                <p class="m-sub">{{ t().hoSub }}</p>
                <div class="horow on">
                  <span class="ho-ic wa"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.95-4.69-4.13-.14-.19-1.13-1.5-1.13-2.87s.72-2.03.97-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17 0 .4-.06.62.48.24.55.8 1.92.87 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.18.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg></span>
                  <div class="chtl"><b>{{ t().hoWa }}</b><span>{{ t().hoWaSub }}</span></div>
                  <span class="tgl on"><i></i></span>
                </div>
                <div class="horow">
                  <span class="ho-ic tg"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg></span>
                  <div class="chtl"><b>{{ t().hoTg }}</b><span>{{ t().hoTgSub }}</span></div>
                  <span class="tgl"><i></i></span>
                </div>
                <div class="agents"><span class="odot"></span>{{ t().agents }}</div>
                <div class="horow done">
                  <span class="ho-ic hrs"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
                  <div class="chtl"><b>{{ t().hoHours }}</b><span>{{ t().hoHoursV }}</span></div>
                  <span class="ok-chip"><span class="odot"></span>{{ t().hoDone }}</span>
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
    .tw { width: 100%; max-width: 960px; margin: 0 auto; height: 600px; display: flex; flex-direction: column; overflow: hidden;
      background: #0f0d0b; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; box-shadow: 0 30px 70px rgba(0,0,0,.45); color: #fff; }
    .tw-bar { display: flex; align-items: center; gap: 7px; padding: 11px 16px; border-bottom: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); flex-shrink: 0; }
    .tw-bar .d { width: 11px; height: 11px; border-radius: 50%; }
    .d.r { background: #ff5f57; } .d.y { background: #febc2e; } .d.g { background: #28c840; }
    .tw-url { margin-left: 12px; font-size: 12px; color: rgba(255,255,255,.4); font-family: ui-monospace, Menlo, monospace; }
    .app { flex: 1; display: grid; grid-template-columns: 200px 1fr; min-height: 0; }

    /* Menú lateral (igual que el del producto) */
    .side { border-right: 1px solid rgba(255,255,255,.08); padding: 16px 12px; display: flex; flex-direction: column; gap: 14px; background: rgba(255,255,255,.02); }
    .s-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 15px; }
    .s-logo { width: 28px; height: 28px; border-radius: 8px; background: #E7AB2E; color: #0A0A0A; display: grid; place-items: center; font-weight: 900; font-size: 13px; }
    .s-nav { display: flex; flex-direction: column; gap: 2px; }
    .s-item { display: flex; align-items: center; gap: 10px; padding: 8px 11px; border-radius: 9px; font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,.6); }
    .s-item.on { background: rgba(231,171,46,.14); color: #E7AB2E; }
    .s-group { font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.32); padding: 10px 11px 4px; }
    .s-plan { margin-top: auto; font-size: 11px; font-weight: 700; color: #E7AB2E; text-align: center; padding: 7px; border-radius: 9px; background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.25); }

    .main { padding: 22px 26px; overflow: hidden; }
    .scr { animation: tw-in .5s cubic-bezier(.2,.8,.2,1) both; }
    @keyframes tw-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @keyframes fld-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .m-h { font-size: 20px; }
    .m-sub { font-size: 12.5px; color: rgba(255,255,255,.55); margin: 5px 0 16px; }

    /* Dashboard */
    .d-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
    .d-right { display: flex; align-items: center; gap: 10px; }
    .live { font-size: 12px; font-weight: 700; color: #34e0a1; display: inline-flex; align-items: center; gap: 6px; }
    .ldot { width: 8px; height: 8px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.8); } }
    .pill { font-size: 12px; font-weight: 600; color: #E7AB2E; padding: 6px 12px; border-radius: 999px; background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); white-space: nowrap; }
    .mgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11px; }
    .mc { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 13px 14px; display: flex; flex-direction: column; gap: 3px;
      opacity: 0; animation: fld-in .45s ease forwards; }
    .mc:nth-child(1){animation-delay:.06s}.mc:nth-child(2){animation-delay:.14s}.mc:nth-child(3){animation-delay:.22s}.mc:nth-child(4){animation-delay:.3s}
    .ml { font-size: 11px; color: rgba(255,255,255,.6); }
    .mv { font-size: 23px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .mdelta { font-size: 11px; font-weight: 600; } .mdelta.up { color: #34e0a1; }
    .d-low { display: grid; grid-template-columns: 1.15fr 1fr; gap: 11px; margin-top: 12px; }
    .panel { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 12px 14px; opacity: 0; animation: fld-in .45s ease .4s forwards; }
    .p-t { font-size: 11.5px; color: rgba(255,255,255,.55); }
    .bars { display: flex; align-items: flex-end; gap: 6px; height: 86px; margin-top: 12px; }
    .bar { flex: 1; border-radius: 4px 4px 0 0; background: #E7AB2E; transform-origin: bottom; animation: bar-up .6s cubic-bezier(.2,.8,.2,1) both; }
    .bar:nth-child(1){animation-delay:.45s}.bar:nth-child(2){animation-delay:.5s}.bar:nth-child(3){animation-delay:.55s}.bar:nth-child(4){animation-delay:.6s}
    .bar:nth-child(5){animation-delay:.65s}.bar:nth-child(6){animation-delay:.7s}.bar:nth-child(7){animation-delay:.75s}
    @keyframes bar-up { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    /* Temas trending: siempre con la primera letra en mayúscula, igual que el producto */
    .topics { margin-top: 12px; display: flex; flex-direction: column; gap: 9px; }
    .tp { display: grid; grid-template-columns: 1fr 74px; align-items: center; gap: 10px; }
    .tp-n { font-size: 12px; color: rgba(255,255,255,.82); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tp-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,.09); overflow: hidden; }
    .tp-bar i { display: block; height: 100%; border-radius: 999px; background: #E7AB2E; animation: grow .7s cubic-bezier(.2,.8,.2,1) both .5s; }
    @keyframes grow { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); } }
    .d-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 11px; margin-top: 11px; }
    .st { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 11px 14px; display: flex; align-items: center; justify-content: space-between;
      opacity: 0; animation: fld-in .45s ease .55s forwards; }
    .stl { font-size: 11.5px; color: rgba(255,255,255,.6); }
    .stv { font-size: 16px; font-weight: 800; color: #E7AB2E; font-variant-numeric: tabular-nums; }

    /* Bandeja de conversaciones */
    .chips { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 12px; }
    .chip { font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.6); }
    .chip.on { border-color: #E7AB2E; color: #E7AB2E; }
    .inbox { display: grid; grid-template-columns: 220px 1fr; gap: 11px; }
    .ilist { display: flex; flex-direction: column; gap: 7px; }
    .irow { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px;
      opacity: 0; animation: fld-in .4s ease forwards; }
    .irow:nth-child(1){animation-delay:.08s}.irow:nth-child(2){animation-delay:.16s}.irow:nth-child(3){animation-delay:.24s}
    .irow.on { border-color: #E7AB2E; background: rgba(231,171,46,.07); }
    .itop { display: flex; gap: 6px; }
    .iprev { font-size: 11.5px; color: rgba(255,255,255,.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cbadge { font-size: 9px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; padding: 3px 7px; border-radius: 999px;
      color: #E7AB2E; background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); }
    .cbadge[data-c="WhatsApp"] { color: #25D366; background: rgba(37,211,102,.12); border-color: rgba(37,211,102,.3); }
    .cbadge[data-c="Instagram"] { color: #E4405F; background: rgba(228,64,95,.12); border-color: rgba(228,64,95,.3); }
    .cbadge.lead { color: #36c08b; background: rgba(54,192,139,.12); border-color: rgba(54,192,139,.3); }
    .ithread { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 9px;
      opacity: 0; animation: fld-in .45s ease .3s forwards; }
    .bub { max-width: 84%; padding: 9px 12px; border-radius: 13px; font-size: 12px; line-height: 1.45;
      align-self: flex-start; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-bottom-left-radius: 4px; }
    .bub.me { align-self: flex-end; background: #E7AB2E; color: #0A0A0A; border: none; border-bottom-right-radius: 4px; border-bottom-left-radius: 13px; }

    /* Canales y handoff */
    .chlist { display: flex; flex-direction: column; gap: 8px; }
    .chrow, .horow, .calrow { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
      border-radius: 11px; padding: 11px 14px; opacity: 0; animation: fld-in .4s ease forwards; }
    .chrow:nth-child(1){animation-delay:.06s}.chrow:nth-child(2){animation-delay:.13s}.chrow:nth-child(3){animation-delay:.2s}
    .chrow:nth-child(4){animation-delay:.27s}.chrow:nth-child(5){animation-delay:.34s}
    .calrow { margin-top: 11px; animation-delay: .42s; }
    .horow { margin-bottom: 9px; animation-delay: .1s; }
    .horow.on { border-color: rgba(37,211,102,.3); }
    .horow.done { border-color: rgba(52,224,161,.28); animation-delay: .3s; }
    .chtl { flex: 1; min-width: 0; } .chtl b { display: block; font-size: 13px; } .chtl span { font-size: 11.5px; color: rgba(255,255,255,.55); }
    .ho-ic { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; }
    .ho-ic.wa { color: #25D366; background: rgba(37,211,102,.14); border: 1px solid rgba(37,211,102,.3); }
    .ho-ic.tg { color: #229ED9; background: rgba(34,158,217,.14); border: 1px solid rgba(34,158,217,.3); }
    .ho-ic.hrs { color: #34e0a1; background: rgba(52,224,161,.12); border: 1px solid rgba(52,224,161,.3); }
    .tgl { width: 38px; height: 22px; border-radius: 999px; background: rgba(255,255,255,.12); position: relative; display: inline-block; flex-shrink: 0; }
    .tgl i { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
    .tgl.on { background: #E7AB2E; } .tgl.on i { left: auto; right: 3px; }
    .ok-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: #34e0a1; flex-shrink: 0; }
    .odot { width: 7px; height: 7px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 7px #34e0a1; }
    .agents { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: rgba(255,255,255,.55); margin: 0 0 12px 4px;
      opacity: 0; animation: fld-in .4s ease .22s forwards; }

    @media (prefers-reduced-motion: reduce) {
      .scr, .mc, .panel, .st, .bar, .irow, .ithread, .chrow, .horow, .calrow, .agents, .tp-bar i { animation: none; opacity: 1; }
      .ldot { animation: none; }
    }
    /* Móvil: sin menú lateral y con los grids apilados */
    @media (max-width: 640px) {
      .tw { height: auto; min-height: 470px; }
      .app { grid-template-columns: 1fr; }
      .side { display: none; }
      .main { padding: 18px 16px; }
      .m-h { font-size: 17px; }
      .mgrid { grid-template-columns: 1fr 1fr; }
      .d-low, .d-stats, .inbox { grid-template-columns: 1fr; }
      .ilist { flex-direction: row; overflow: hidden; }
      .tw-url { display: none; }
      .d-head { flex-wrap: wrap; }
    }
  `],
})
export class TourDemoComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  /** Pantallas del recorrido, en el orden en que se muestran. */
  private readonly SCREENS: Array<'dash' | 'conv' | 'chan' | 'hand'> = ['dash', 'conv', 'chan', 'hand'];
  readonly screen = signal<'dash' | 'conv' | 'chan' | 'hand'>('dash');
  readonly t = signal(COPY.es);
  readonly conv = signal(1847);
  readonly msg = signal(4392);
  readonly lead = signal(214);
  readonly csat = signal(96);
  readonly bars = [46, 60, 52, 76, 66, 90, 72];

  private alive = true;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private countTimers: ReturnType<typeof setInterval>[] = [];

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
      await this.sleep(s === 'dash' ? 5200 : 4400);
      i++;
    }
  }
}
