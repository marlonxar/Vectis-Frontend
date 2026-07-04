import {
  Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

const COPY = {
  es: {
    cfgTag: 'Configuración', cfgTitle: 'Configura tu bot sin código', plan: 'Plan Pro',
    fName: 'Nombre del negocio', vName: 'TechToys',
    fWelcome: 'Mensaje de bienvenida', vWelcome: '¡Hola! Bienvenido a TechToys 🚀',
    fColor: 'Color de marca', fHours: 'Atención 24/7',
    fKb: 'Base de conocimiento', vKb: '3 documentos', fInv: 'Inventario', vInv: 'Conectado ✓',
    save: 'Guardar cambios', saved: 'Guardado ✓',
    dashTag: 'Panel', dashTitle: 'Dashboard · TechToys', month: 'Julio 2026', live: 'activas ahora',
    mConv: 'Conversaciones', mMsg: 'Mensajes', mLead: 'Leads', mCsat: 'Satisfacción',
    week: 'Últimos 7 días', activeTitle: 'Conversaciones en vivo',
    active: [
      { n: 'Ana R.', s: 'escribiendo…' },
      { n: 'Carlos M.', s: 'viendo el catálogo' },
      { n: 'Lucía P.', s: 'nueva conversación' },
      { n: 'Diego F.', s: 'preguntando por envíos' },
    ],
  },
  en: {
    cfgTag: 'Setup', cfgTitle: 'Configure your bot, no code', plan: 'Pro plan',
    fName: 'Business name', vName: 'TechToys',
    fWelcome: 'Welcome message', vWelcome: 'Hi! Welcome to TechToys 🚀',
    fColor: 'Brand color', fHours: '24/7 support',
    fKb: 'Knowledge base', vKb: '3 documents', fInv: 'Inventory', vInv: 'Connected ✓',
    save: 'Save changes', saved: 'Saved ✓',
    dashTag: 'Dashboard', dashTitle: 'Dashboard · TechToys', month: 'July 2026', live: 'active now',
    mConv: 'Conversations', mMsg: 'Messages', mLead: 'Leads', mCsat: 'Satisfaction',
    week: 'Last 7 days', activeTitle: 'Live conversations',
    active: [
      { n: 'Ana R.', s: 'typing…' },
      { n: 'Carlos M.', s: 'browsing catalog' },
      { n: 'Lucía P.', s: 'new conversation' },
      { n: 'Diego F.', s: 'asking about shipping' },
    ],
  },
};

/** Demo del producto: configuración → dashboard (Plan Pro) con métricas y chats en vivo. Naranja liso. */
@Component({
  selector: 'app-cbdemo-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tw">
      <div class="tw-bar" aria-hidden="true"><span class="d r"></span><span class="d y"></span><span class="d g"></span><span class="tw-url">app.wearevectis.com</span></div>

      @if (screen() === 'cfg') {
        <div class="tw-screen cfg">
          <div class="tw-top"><span class="tw-tag">{{ t().cfgTag }}</span><span class="tw-plan">{{ t().plan }}</span></div>
          <h4 class="tw-h">{{ t().cfgTitle }}</h4>
          <div class="fld f1"><label>{{ t().fName }}</label><div class="inp">{{ t().vName }}</div></div>
          <div class="fld f2"><label>{{ t().fWelcome }}</label><div class="inp">{{ t().vWelcome }}</div></div>
          <div class="fld f3 row">
            <div class="col"><label>{{ t().fColor }}</label><div class="inp swatch"><i></i>#F97316</div></div>
            <div class="col"><label>{{ t().fHours }}</label><div class="inp"><span class="tgl on"><i></i></span></div></div>
          </div>
          <div class="fld f4 row">
            <div class="col"><label>{{ t().fKb }}</label><div class="inp">{{ t().vKb }}</div></div>
            <div class="col"><label>{{ t().fInv }}</label><div class="inp ok">{{ t().vInv }}</div></div>
          </div>
          <button class="tw-save" type="button" [class.done]="saved()">{{ saved() ? t().saved : t().save }}</button>
        </div>
      } @else {
        <div class="tw-screen dash">
          <div class="dash-head">
            <div>
              <div class="tw-top"><span class="tw-tag">{{ t().dashTag }}</span><span class="tw-plan">{{ t().plan }}</span></div>
              <h4 class="tw-h">{{ t().dashTitle }}</h4>
            </div>
            <div class="dash-right">
              <span class="live"><span class="ldot"></span>{{ activeCount() }} {{ t().live }}</span>
              <span class="pill">{{ t().month }}</span>
            </div>
          </div>

          <div class="mgrid">
            <div class="mc"><span class="ml">{{ t().mConv }}</span><span class="mv">{{ conv() | number }}</span><span class="mdelta up">▲ 14%</span></div>
            <div class="mc"><span class="ml">{{ t().mMsg }}</span><span class="mv">{{ msg() | number }}</span><span class="mdelta up">▲ 9%</span></div>
            <div class="mc"><span class="ml">{{ t().mLead }}</span><span class="mv">{{ lead() | number }}</span><span class="mdelta up">▲ 23%</span></div>
            <div class="mc"><span class="ml">{{ t().mCsat }}</span><span class="mv">{{ csat() }}%</span><span class="mdelta up">▲ 4%</span></div>
          </div>

          <div class="dash-low">
            <div class="chart">
              <span class="ch-t">{{ t().week }}</span>
              <div class="bars">@for (b of bars; track $index) { <span class="bar" [style.height.%]="b"></span> }</div>
            </div>
            <div class="active">
              <span class="ch-t">{{ t().activeTitle }}</span>
              <div class="alist">
                @for (a of t().active; track a.n) {
                  <div class="arow">
                    <span class="aav">{{ a.n.charAt(0) }}</span>
                    <div class="ainfo"><b>{{ a.n }}</b><span>{{ a.s }}</span></div>
                    <span class="agdot"></span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tw { width: 100%; max-width: 720px; margin: 0 auto; height: 620px; display: flex; flex-direction: column; overflow: hidden;
      background: #0f0d0b; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; box-shadow: 0 30px 70px rgba(0,0,0,.45); color: #fff; }
    .tw-bar { display: flex; align-items: center; gap: 7px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); }
    .tw-bar .d { width: 11px; height: 11px; border-radius: 50%; }
    .d.r { background: #ff5f57; } .d.y { background: #febc2e; } .d.g { background: #28c840; }
    .tw-url { margin-left: 12px; font-size: 12px; color: rgba(255,255,255,.4); font-family: ui-monospace, Menlo, monospace; }

    .tw-screen { flex: 1; padding: 26px 30px; animation: tw-in .5s cubic-bezier(.2,.8,.2,1) both; overflow: hidden; }
    @keyframes tw-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    .tw-top { display: flex; align-items: center; gap: 10px; }
    .tw-tag { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #F97316; }
    .tw-plan { font-size: 11px; font-weight: 700; color: #F97316; padding: 3px 9px; border-radius: 999px; background: rgba(249,115,22,.14); border: 1px solid rgba(249,115,22,.35); }
    .tw-h { font-size: 20px; margin: 8px 0 20px; color: #fff; }

    /* Configure */
    .fld { margin-bottom: 15px; opacity: 0; animation: fld-in .45s ease forwards; }
    .fld.f1 { animation-delay: .2s; } .fld.f2 { animation-delay: .45s; } .fld.f3 { animation-delay: .7s; } .fld.f4 { animation-delay: .95s; }
    @keyframes fld-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .fld label { display: block; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.65); margin-bottom: 7px; }
    .inp { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 11px; padding: 12px 14px; font-size: 14px; color: #fff; min-height: 46px; display: flex; align-items: center; }
    .inp.ok { color: #34e0a1; }
    .fld.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .swatch { gap: 10px; font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
    .swatch i { width: 20px; height: 20px; border-radius: 6px; background: #F97316; box-shadow: 0 0 0 1px rgba(255,255,255,.15); }
    .tgl { width: 42px; height: 24px; border-radius: 999px; background: #F97316; position: relative; display: inline-block; }
    .tgl i { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; }
    .tw-save { margin-top: 6px; min-height: 48px; padding: 0 26px; border: none; border-radius: 999px; font: inherit; font-weight: 700; color: #fff;
      background: #F97316; box-shadow: 0 12px 30px rgba(249,115,22,.3); opacity: 0; animation: fld-in .45s ease 1.2s forwards; }
    .tw-save.done { background: #16a34a; }

    /* Dashboard */
    .dash-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    .dash .tw-h { margin: 8px 0 0; font-size: 19px; }
    .dash-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .live { font-size: 12px; font-weight: 700; color: #34e0a1; display: inline-flex; align-items: center; gap: 6px; }
    .ldot { width: 8px; height: 8px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 8px #34e0a1; animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.8); } }
    .pill { font-size: 12px; font-weight: 600; color: #F97316; padding: 6px 12px; border-radius: 999px; background: rgba(249,115,22,.12); border: 1px solid rgba(249,115,22,.3); white-space: nowrap; }
    .mgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .mc { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 13px; padding: 15px 16px; display: flex; flex-direction: column; gap: 4px;
      opacity: 0; animation: fld-in .45s ease forwards; }
    .mc:nth-child(1) { animation-delay: .08s; } .mc:nth-child(2) { animation-delay: .16s; }
    .mc:nth-child(3) { animation-delay: .24s; } .mc:nth-child(4) { animation-delay: .32s; }
    .ml { font-size: 12px; color: rgba(255,255,255,.6); }
    .mv { font-size: 25px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .mdelta { font-size: 11.5px; font-weight: 600; }
    .mdelta.up { color: #34e0a1; }

    .dash-low { display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; margin-top: 16px; }
    .chart, .active { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 13px; padding: 14px 16px; opacity: 0; animation: fld-in .45s ease .45s forwards; }
    .ch-t { font-size: 11.5px; color: rgba(255,255,255,.55); }
    .bars { display: flex; align-items: flex-end; gap: 8px; height: 118px; margin-top: 12px; }
    .bar { flex: 1; border-radius: 6px 6px 0 0; background: #F97316; transform-origin: bottom; animation: bar-up .6s cubic-bezier(.2,.8,.2,1) both; }
    .bar:nth-child(1){animation-delay:.5s}.bar:nth-child(2){animation-delay:.57s}.bar:nth-child(3){animation-delay:.64s}
    .bar:nth-child(4){animation-delay:.71s}.bar:nth-child(5){animation-delay:.78s}.bar:nth-child(6){animation-delay:.85s}.bar:nth-child(7){animation-delay:.92s}
    @keyframes bar-up { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    .alist { margin-top: 10px; display: flex; flex-direction: column; gap: 9px; }
    .arow { display: flex; align-items: center; gap: 10px; }
    .aav { width: 30px; height: 30px; border-radius: 50%; background: #F97316; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 12px; flex-shrink: 0; }
    .ainfo { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
    .ainfo b { font-size: 13px; }
    .ainfo span { font-size: 11.5px; color: rgba(255,255,255,.55); }
    .agdot { margin-left: auto; width: 8px; height: 8px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 7px #34e0a1; animation: pulse 1.4s ease-in-out infinite; }

    @media (max-width: 620px) {
      .tw-h { font-size: 17px; } .mv { font-size: 20px; }
      .mgrid { grid-template-columns: 1fr 1fr; } .dash-low { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) { .tw-screen, .fld, .mc, .chart, .active, .tw-save, .bar { animation: none; opacity: 1; } .ldot, .agdot { animation: none; } }
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
  readonly activeCount = signal(4);
  readonly bars = [48, 62, 55, 78, 68, 92, 74];

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
      await this.sleep(2600);
      this.saved.set(true);
      await this.sleep(1200);
      if (!this.alive) break;
      this.conv.set(0); this.msg.set(0); this.lead.set(0); this.csat.set(0);
      this.screen.set('dash');
      this.countUp((v) => this.conv.set(v), 1847);
      this.countUp((v) => this.msg.set(v), 4392);
      this.countUp((v) => this.lead.set(v), 214);
      this.countUp((v) => this.csat.set(v), 96);
      await this.sleep(5200);
    }
  }
}
