import {
  Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

const COPY = {
  es: {
    cfgTag: 'Configuración', cfgTitle: 'Configura tu bot sin código',
    fName: 'Nombre del negocio', vName: 'Aurora Café',
    fWelcome: 'Mensaje de bienvenida', vWelcome: '¡Hola! Soy el asistente de Aurora Café ☕',
    fColor: 'Color de marca', fHours: 'Atención 24/7', save: 'Guardar cambios', saved: 'Guardado ✓',
    dashTag: 'Panel', dashTitle: 'Dashboard · Aurora Café', month: 'Julio 2026',
    mConv: 'Conversaciones', mMsg: 'Mensajes', mLead: 'Leads', mCsat: 'Satisfacción',
    vs: 'vs. mes anterior', week: 'Últimos 7 días',
  },
  en: {
    cfgTag: 'Setup', cfgTitle: 'Configure your bot, no code',
    fName: 'Business name', vName: 'Aurora Café',
    fWelcome: 'Welcome message', vWelcome: "Hi! I'm the Aurora Café assistant ☕",
    fColor: 'Brand color', fHours: '24/7 support', save: 'Save changes', saved: 'Saved ✓',
    dashTag: 'Dashboard', dashTitle: 'Dashboard · Aurora Café', month: 'July 2026',
    mConv: 'Conversations', mMsg: 'Messages', mLead: 'Leads', mCsat: 'Satisfaction',
    vs: 'vs. last month', week: 'Last 7 days',
  },
};

/** Demo animado del producto: panel de configuración → dashboard, con transiciones limpias en bucle. */
@Component({
  selector: 'app-cbdemo-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tw">
      <div class="tw-bar" aria-hidden="true"><span class="d r"></span><span class="d y"></span><span class="d g"></span><span class="tw-url">app.wearevectis.com</span></div>

      @if (screen() === 'cfg') {
        <div class="tw-screen cfg">
          <span class="tw-tag">{{ t().cfgTag }}</span>
          <h4 class="tw-h">{{ t().cfgTitle }}</h4>
          <div class="fld f1"><label>{{ t().fName }}</label><div class="inp">{{ t().vName }}</div></div>
          <div class="fld f2"><label>{{ t().fWelcome }}</label><div class="inp">{{ t().vWelcome }}</div></div>
          <div class="fld f3 row">
            <div class="col"><label>{{ t().fColor }}</label><div class="inp swatch"><i></i>#E7AB2E</div></div>
            <div class="col"><label>{{ t().fHours }}</label><div class="inp"><span class="tgl on"><i></i></span></div></div>
          </div>
          <button class="tw-save" type="button" [class.done]="saved()">{{ saved() ? t().saved : t().save }}</button>
        </div>
      } @else {
        <div class="tw-screen dash">
          <div class="dash-head">
            <div><span class="tw-tag">{{ t().dashTag }}</span><h4 class="tw-h">{{ t().dashTitle }}</h4></div>
            <span class="pill">{{ t().month }}</span>
          </div>
          <div class="mgrid">
            <div class="mc"><span class="ml">{{ t().mConv }}</span><span class="mv">{{ conv() | number }}</span><span class="mdelta up">▲ 12%</span></div>
            <div class="mc"><span class="ml">{{ t().mMsg }}</span><span class="mv">{{ msg() | number }}</span><span class="mdelta up">▲ 8%</span></div>
            <div class="mc"><span class="ml">{{ t().mLead }}</span><span class="mv">{{ lead() | number }}</span><span class="mdelta up">▲ 21%</span></div>
            <div class="mc"><span class="ml">{{ t().mCsat }}</span><span class="mv">{{ csat() }}%</span><span class="mdelta up">▲ 3%</span></div>
          </div>
          <div class="chart">
            <span class="ch-t">{{ t().week }}</span>
            <div class="bars">
              @for (b of bars; track $index) { <span class="bar" [style.height.%]="b"></span> }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tw { width: 100%; max-width: 560px; margin: 0 auto; height: 560px; display: flex; flex-direction: column; overflow: hidden;
      background: #0f0d0b; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; box-shadow: 0 30px 70px rgba(0,0,0,.45); color: #fff; }
    .tw-bar { display: flex; align-items: center; gap: 7px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); }
    .tw-bar .d { width: 11px; height: 11px; border-radius: 50%; }
    .d.r { background: #ff5f57; } .d.y { background: #febc2e; } .d.g { background: #28c840; }
    .tw-url { margin-left: 12px; font-size: 12px; color: rgba(255,255,255,.4); font-family: ui-monospace, Menlo, monospace; }

    .tw-screen { flex: 1; padding: 26px 28px; animation: tw-in .5s cubic-bezier(.2,.8,.2,1) both; overflow: hidden; }
    @keyframes tw-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    .tw-tag { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #E7AB2E; }
    .tw-h { font-size: 20px; margin: 8px 0 22px; color: #fff; }

    /* Configure */
    .fld { margin-bottom: 16px; opacity: 0; animation: fld-in .45s ease forwards; }
    .fld.f1 { animation-delay: .25s; } .fld.f2 { animation-delay: .6s; } .fld.f3 { animation-delay: .95s; }
    @keyframes fld-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .fld label { display: block; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.65); margin-bottom: 7px; }
    .inp { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 11px; padding: 12px 14px; font-size: 14px; color: #fff; min-height: 44px; display: flex; align-items: center; }
    .fld.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .swatch { gap: 10px; font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
    .swatch i { width: 20px; height: 20px; border-radius: 6px; background: #E7AB2E; box-shadow: 0 0 0 1px rgba(255,255,255,.15); }
    .tgl { width: 42px; height: 24px; border-radius: 999px; background: #E7AB2E; position: relative; display: inline-block; }
    .tgl i { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; }
    .tw-save { margin-top: 8px; min-height: 48px; padding: 0 24px; border: none; border-radius: 999px; font: inherit; font-weight: 700; color: #0A0A0A;
      background: linear-gradient(135deg, #F0C56A, #E7AB2E); box-shadow: 0 12px 30px rgba(231,171,46,.3); opacity: 0; animation: fld-in .45s ease 1.35s forwards; transition: transform .2s; }
    .tw-save.done { background: linear-gradient(135deg, #34e0a1, #16a34a); color: #04240f; }

    /* Dashboard */
    .dash-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
    .dash .tw-h { margin: 8px 0 0; font-size: 18px; }
    .pill { font-size: 12px; font-weight: 600; color: #E7AB2E; padding: 6px 12px; border-radius: 999px; background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.25); white-space: nowrap; }
    .mgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mc { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 13px; padding: 15px 16px; display: flex; flex-direction: column; gap: 4px;
      opacity: 0; animation: fld-in .45s ease forwards; }
    .mc:nth-child(1) { animation-delay: .1s; } .mc:nth-child(2) { animation-delay: .2s; }
    .mc:nth-child(3) { animation-delay: .3s; } .mc:nth-child(4) { animation-delay: .4s; }
    .ml { font-size: 12px; color: rgba(255,255,255,.6); }
    .mv { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .mdelta { font-size: 11.5px; font-weight: 600; }
    .mdelta.up { color: #34e0a1; }
    .chart { margin-top: 16px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 13px; padding: 14px 16px; opacity: 0; animation: fld-in .45s ease .5s forwards; }
    .ch-t { font-size: 11.5px; color: rgba(255,255,255,.55); }
    .bars { display: flex; align-items: flex-end; gap: 8px; height: 96px; margin-top: 12px; }
    .bar { flex: 1; border-radius: 6px 6px 0 0; background: linear-gradient(180deg, #F0C56A, #E7AB2E); transform-origin: bottom; animation: bar-up .6s cubic-bezier(.2,.8,.2,1) both; }
    .bar:nth-child(1){animation-delay:.5s}.bar:nth-child(2){animation-delay:.57s}.bar:nth-child(3){animation-delay:.64s}
    .bar:nth-child(4){animation-delay:.71s}.bar:nth-child(5){animation-delay:.78s}.bar:nth-child(6){animation-delay:.85s}.bar:nth-child(7){animation-delay:.92s}
    @keyframes bar-up { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    @media (max-width: 560px) { .tw-h { font-size: 17px; } .mv { font-size: 22px; } }
    @media (prefers-reduced-motion: reduce) { .tw-screen, .fld, .mc, .chart, .tw-save, .bar { animation: none; opacity: 1; } }
  `],
})
export class TourDemoComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly screen = signal<'cfg' | 'dash'>('cfg');
  readonly saved = signal(false);
  readonly t = signal(COPY.es);
  readonly conv = signal(1284);
  readonly msg = signal(8640);
  readonly lead = signal(96);
  readonly csat = signal(94);
  readonly bars = [42, 58, 50, 74, 63, 88, 70];

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

  private countUp(setter: (v: number) => void, target: number, ms = 1100): void {
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
      // Configure screen
      this.screen.set('cfg'); this.saved.set(false);
      await this.sleep(2200);
      this.saved.set(true);              // "Guardar" → "Guardado ✓"
      await this.sleep(1100);
      if (!this.alive) break;
      // Dashboard screen with counting metrics
      this.conv.set(0); this.msg.set(0); this.lead.set(0); this.csat.set(0);
      this.screen.set('dash');
      this.countUp((v) => this.conv.set(v), 1284);
      this.countUp((v) => this.msg.set(v), 8640);
      this.countUp((v) => this.lead.set(v), 96);
      this.countUp((v) => this.csat.set(v), 94);
      await this.sleep(4200);
    }
  }
}
