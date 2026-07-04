import {
  Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

const COPY = {
  es: {
    brand: 'TechToys', plan: 'Plan Pro',
    nDash: 'Dashboard', nCfg: 'Configurar', nHand: 'Handoff', nAcc: 'Cuenta', nSup: 'Soporte',
    secHo: 'Atención humana', hoCh: 'Telegram', hoStatus: 'Bot vinculado ✓', hoSoon: 'Más canales pronto',
    cfgTitle: 'Configura tu chatbot', cfgSub: 'Cuéntanos sobre tu negocio.',
    secId: 'Identidad', secAp: 'Apariencia', secKn: 'Conocimiento del negocio',
    fName: 'Nombre de la empresa', vName: 'TechToys',
    fDesc: '¿A qué se dedica tu negocio?', vDesc: 'Tienda de drones y gadgets 4K',
    fColor: 'Color de marca', fHours: 'Horario · Atención 24/7',
    fInfo: 'Información del negocio', vInfo: 'Envíos gratis, 2 años de garantía, 30 días de devolución…',
    fKb: 'Base de conocimiento', vKb: '3 documentos', fInv: 'Inventario', vInv: 'Conectado ✓',
    save: 'Guardar cambios', saved: 'Guardado ✓',
    dashTitle: 'Dashboard', live: 'En vivo', month: 'Julio 2026',
    mConv: 'Conversaciones', mMsg: 'Mensajes este mes', mLead: 'Leads capturados', mCsat: 'Satisfacción',
    vs: 'vs. mes anterior', byDay: 'Mensajes por día', activeTitle: 'Conversaciones en vivo',
    sRes: 'Tasa de resolución', sLead: 'Conversión a lead', sPeak: 'Hora pico',
    active: [
      { n: 'Ana R.', s: 'escribiendo…' },
      { n: 'Carlos M.', s: 'viendo el catálogo' },
      { n: 'Lucía P.', s: 'nueva conversación' },
    ],
  },
  en: {
    brand: 'TechToys', plan: 'Pro plan',
    nDash: 'Dashboard', nCfg: 'Configure', nHand: 'Handoff', nAcc: 'Account', nSup: 'Support',
    secHo: 'Human support', hoCh: 'Telegram', hoStatus: 'Bot linked ✓', hoSoon: 'More channels soon',
    cfgTitle: 'Configure your chatbot', cfgSub: 'Tell us about your business.',
    secId: 'Identity', secAp: 'Appearance', secKn: 'Business knowledge',
    fName: 'Company name', vName: 'TechToys',
    fDesc: 'What does your business do?', vDesc: '4K drones and gadgets store',
    fColor: 'Brand color', fHours: 'Hours · 24/7 support',
    fInfo: 'Business information', vInfo: 'Free shipping, 2-year warranty, 30-day returns…',
    fKb: 'Knowledge base', vKb: '3 documents', fInv: 'Inventory', vInv: 'Connected ✓',
    save: 'Save changes', saved: 'Saved ✓',
    dashTitle: 'Dashboard', live: 'Live', month: 'July 2026',
    mConv: 'Conversations', mMsg: 'Messages this month', mLead: 'Leads captured', mCsat: 'Satisfaction',
    vs: 'vs. last month', byDay: 'Messages per day', activeTitle: 'Live conversations',
    sRes: 'Resolution rate', sLead: 'Lead conversion', sPeak: 'Peak hour',
    active: [
      { n: 'Ana R.', s: 'typing…' },
      { n: 'Carlos M.', s: 'browsing catalog' },
      { n: 'Lucía P.', s: 'new conversation' },
    ],
  },
};

/** Demo del producto tipo app de escritorio: sidebar + Configurar/Dashboard (Plan Pro). Color #E7AB2E. */
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
            <span class="s-item" [class.on]="screen() === 'dash'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>{{ t().nDash }}</span>
            <span class="s-item" [class.on]="screen() === 'cfg'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 8"/></svg>{{ t().nCfg }}</span>
            <span class="s-item"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-4a8 8 0 0 1 16 0v4"/><path d="M18 19a2 2 0 0 1-2 2h-3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>{{ t().nHand }}</span>
            <span class="s-item"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>{{ t().nAcc }}</span>
            <span class="s-item"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>{{ t().nSup }}</span>
          </nav>
          <span class="s-plan">{{ t().plan }}</span>
        </aside>

        <main class="main">
          @if (screen() === 'cfg') {
            <div class="scr cfg">
              <h4 class="m-h">{{ t().cfgTitle }}</h4>
              <p class="m-sub">{{ t().cfgSub }}</p>
              <div class="sec f1"><span class="sec-t">{{ t().secId }}</span>
                <div class="fld"><label>{{ t().fName }}</label><div class="inp">{{ t().vName }}</div></div>
                <div class="fld"><label>{{ t().fDesc }}</label><div class="inp">{{ t().vDesc }}</div></div>
              </div>
              <div class="sec f2"><span class="sec-t">{{ t().secAp }}</span>
                <div class="grid2">
                  <div class="fld"><label>{{ t().fColor }}</label><div class="inp swatch"><i></i>#E7AB2E</div></div>
                  <div class="fld"><label>{{ t().fHours }}</label><div class="inp"><span class="tgl on"><i></i></span></div></div>
                </div>
              </div>
              <div class="sec f3"><span class="sec-t">{{ t().secKn }}</span>
                <div class="fld"><label>{{ t().fInfo }}</label><div class="inp">{{ t().vInfo }}</div></div>
                <div class="grid2">
                  <div class="fld"><label>{{ t().fKb }}</label><div class="inp">{{ t().vKb }}</div></div>
                  <div class="fld"><label>{{ t().fInv }}</label><div class="inp ok">{{ t().vInv }}</div></div>
                </div>
              </div>
              <div class="sec f4"><span class="sec-t">{{ t().secHo }}</span>
                <div class="ho-row">
                  <div class="ho-ch"><span class="ho-ic"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.35 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.36 1.47z"/></svg></span><div><b>{{ t().hoCh }}</b><span class="ho-ok">{{ t().hoStatus }}</span></div></div>
                  <span class="tgl on"><i></i></span>
                </div>
                <span class="ho-soon">{{ t().hoSoon }}</span>
              </div>
              <button class="tw-save f5" type="button" [class.done]="saved()">{{ saved() ? t().saved : t().save }}</button>
            </div>
          } @else {
            <div class="scr dash">
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
                <div class="panel chart">
                  <span class="p-t">{{ t().byDay }}</span>
                  <div class="bars">@for (b of bars; track $index) { <span class="bar" [style.height.%]="b"></span> }</div>
                </div>
                <div class="panel active">
                  <span class="p-t">{{ t().activeTitle }}</span>
                  <div class="alist">
                    @for (a of t().active; track a.n) {
                      <div class="arow"><span class="aav">{{ a.n.charAt(0) }}</span><div class="ainfo"><b>{{ a.n }}</b><span>{{ a.s }}</span></div><span class="agdot"></span></div>
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
    .app { flex: 1; display: grid; grid-template-columns: 194px 1fr; min-height: 0; }

    /* Sidebar */
    .side { border-right: 1px solid rgba(255,255,255,.08); padding: 18px 14px; display: flex; flex-direction: column; gap: 20px; background: rgba(255,255,255,.02); }
    .s-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 15px; }
    .s-logo { width: 30px; height: 30px; border-radius: 8px; background: #E7AB2E; color: #0A0A0A; display: grid; place-items: center; font-weight: 900; }
    .s-nav { display: flex; flex-direction: column; gap: 3px; }
    .s-item { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,.65); }
    .s-item.on { background: rgba(231,171,46,.14); color: #E7AB2E; }
    .s-plan { margin-top: auto; font-size: 11.5px; font-weight: 700; color: #E7AB2E; text-align: center; padding: 8px; border-radius: 10px; background: rgba(231,171,46,.1); border: 1px solid rgba(231,171,46,.25); }

    /* Main */
    .main { padding: 24px 28px; overflow: hidden; }
    .scr { animation: tw-in .5s cubic-bezier(.2,.8,.2,1) both; }
    @keyframes tw-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .m-h { font-size: 21px; }
    .m-sub { font-size: 13px; color: rgba(255,255,255,.55); margin: 5px 0 18px; }

    /* Configure */
    .sec { margin-bottom: 11px; opacity: 0; animation: fld-in .45s ease forwards; }
    .sec.f1 { animation-delay: .18s; } .sec.f2 { animation-delay: .42s; } .sec.f3 { animation-delay: .66s; } .sec.f4 { animation-delay: .9s; }
    /* Atención humana (handoff) */
    .ho-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 11px; padding: 12px 14px; }
    .ho-ch { display: flex; align-items: center; gap: 11px; }
    .ho-ic { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; color: #229ED9; background: rgba(34,158,217,.14); border: 1px solid rgba(34,158,217,.3); }
    .ho-ch b { display: block; font-size: 13.5px; }
    .ho-ok { font-size: 11.5px; color: #34e0a1; }
    .ho-soon { display: block; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,.5); }
    @keyframes fld-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .sec-t { display: block; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #E7AB2E; margin-bottom: 10px; }
    .fld { margin-bottom: 11px; }
    .fld label { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.62); margin-bottom: 6px; }
    .inp { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 10px 13px; font-size: 13.5px; color: #fff; min-height: 42px; display: flex; align-items: center; }
    .inp.ok { color: #34e0a1; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .swatch { gap: 10px; font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; }
    .swatch i { width: 18px; height: 18px; border-radius: 5px; background: #E7AB2E; box-shadow: 0 0 0 1px rgba(255,255,255,.15); }
    .tgl { width: 40px; height: 23px; border-radius: 999px; background: #E7AB2E; position: relative; display: inline-block; }
    .tgl i { position: absolute; top: 3px; right: 3px; width: 17px; height: 17px; border-radius: 50%; background: #fff; }
    .tw-save { margin-top: 4px; min-height: 44px; padding: 0 24px; border: none; border-radius: 999px; font: inherit; font-weight: 700; color: #0A0A0A;
      background: #E7AB2E; box-shadow: 0 10px 26px rgba(231,171,46,.3); opacity: 0; animation: fld-in .45s ease 1.15s forwards; }
    .tw-save.done { background: #16a34a; color: #fff; }

    /* Dashboard */
    .d-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
    .d-right { display: flex; align-items: center; gap: 10px; }
    .live { font-size: 12px; font-weight: 700; color: #34e0a1; display: inline-flex; align-items: center; gap: 6px; }
    .ldot { width: 8px; height: 8px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.8); } }
    .pill { font-size: 12px; font-weight: 600; color: #E7AB2E; padding: 6px 12px; border-radius: 999px; background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); white-space: nowrap; }
    .mgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .mc { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 14px 15px; display: flex; flex-direction: column; gap: 3px;
      opacity: 0; animation: fld-in .45s ease forwards; }
    .mc:nth-child(1){animation-delay:.06s}.mc:nth-child(2){animation-delay:.14s}.mc:nth-child(3){animation-delay:.22s}.mc:nth-child(4){animation-delay:.3s}
    .ml { font-size: 11.5px; color: rgba(255,255,255,.6); }
    .mv { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .mdelta { font-size: 11px; font-weight: 600; }
    .mdelta.up { color: #34e0a1; }
    .d-low { display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; margin-top: 14px; }
    .panel { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 13px 15px; opacity: 0; animation: fld-in .45s ease .4s forwards; }
    .p-t { font-size: 11.5px; color: rgba(255,255,255,.55); }
    .bars { display: flex; align-items: flex-end; gap: 7px; height: 92px; margin-top: 12px; }
    .bar { flex: 1; border-radius: 5px 5px 0 0; background: #E7AB2E; transform-origin: bottom; animation: bar-up .6s cubic-bezier(.2,.8,.2,1) both; }
    .bar:nth-child(1){animation-delay:.45s}.bar:nth-child(2){animation-delay:.5s}.bar:nth-child(3){animation-delay:.55s}.bar:nth-child(4){animation-delay:.6s}
    .bar:nth-child(5){animation-delay:.65s}.bar:nth-child(6){animation-delay:.7s}.bar:nth-child(7){animation-delay:.75s}
    @keyframes bar-up { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    .alist { margin-top: 10px; display: flex; flex-direction: column; gap: 9px; }
    .arow { display: flex; align-items: center; gap: 9px; }
    .aav { width: 28px; height: 28px; border-radius: 50%; background: #E7AB2E; color: #0A0A0A; display: grid; place-items: center; font-weight: 800; font-size: 12px; flex-shrink: 0; }
    .ainfo { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
    .ainfo b { font-size: 12.5px; }
    .ainfo span { font-size: 11px; color: rgba(255,255,255,.55); }
    .agdot { margin-left: auto; width: 8px; height: 8px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 7px #34e0a1; animation: pulse 1.4s ease-in-out infinite; }
    .d-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    .st { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between;
      opacity: 0; animation: fld-in .45s ease .55s forwards; }
    .stl { font-size: 12px; color: rgba(255,255,255,.6); }
    .stv { font-size: 17px; font-weight: 800; color: #E7AB2E; font-variant-numeric: tabular-nums; }

    @media (prefers-reduced-motion: reduce) { .scr, .sec, .mc, .panel, .st, .tw-save, .bar { animation: none; opacity: 1; } .ldot, .agdot { animation: none; } }
  `],
})
export class TourDemoComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly screen = signal<'cfg' | 'dash'>('cfg');
  readonly saved = signal(false);
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
    if (!isPlatformBrowser(this.platformId)) { this.screen.set('dash'); return; }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.screen.set('dash'); return; }
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
    while (this.alive) {
      this.screen.set('cfg'); this.saved.set(false);
      await this.sleep(3000);
      this.saved.set(true);
      await this.sleep(1200);
      if (!this.alive) break;
      this.conv.set(0); this.msg.set(0); this.lead.set(0); this.csat.set(0);
      this.screen.set('dash');
      this.countUp((v) => this.conv.set(v), 1847);
      this.countUp((v) => this.msg.set(v), 4392);
      this.countUp((v) => this.lead.set(v), 214);
      this.countUp((v) => this.csat.set(v), 96);
      await this.sleep(5400);
    }
  }
}
