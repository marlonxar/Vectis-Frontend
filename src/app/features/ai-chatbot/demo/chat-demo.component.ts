import {
  Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

interface Msg { id: number; kind: 'bot' | 'user' | 'typing' | 'qr' | 'csat' | 'csatThanks'; html?: string; text?: string; chips?: string[]; picked?: number; }

const COPY = {
  es: {
    title: 'TechToys', online: 'En línea', ph: 'Escribe tu mensaje…',
    greet: '¡Hola! Bienvenido a <strong>TechToys</strong> 🚀 ¿Buscas un dron en particular?',
    qr: ['Drones 4K', 'Ofertas', 'Envíos'],
    turns: [
      { u: 'Busco un dron para grabar video 4K', b: '¡Perfecto! Para 4K te recomiendo el <strong>SkyPro X4</strong>: cámara 4K estabilizada, 34 min de vuelo y 8 km de alcance. Precio: <strong>$899</strong>.' },
      { u: '¿Trae garantía?', b: 'Sí ✅ Incluye <strong>2 años de garantía</strong> y 30 días para devolución. Viene con estuche rígido y 2 baterías extra.' },
      { u: '¿Me pueden hacer un descuento?', b: 'Puedo darte un <strong>10% hoy</strong>: quedaría en <strong>$809</strong> con envío gratis. 🎁' },
      { u: '¿En cuánto me llega?', b: 'El envío gratis tarda <strong>2–3 días hábiles</strong>. Si confirmas hoy, lo despacho de una vez.' },
      { u: 'Perfecto, lo quiero', b: '¡Excelente elección! 🎉 Te paso el enlace de pago seguro. ¿Quieres una <strong>llamada gratis</strong> para configurarlo?' },
      { u: 'Sí, ¡gracias!', b: '¡Genial! Para agendarla, ¿me compartes tu <strong>nombre</strong>?' },
      { u: 'Marlon Vargas', b: 'Gracias, Marlon 🙌 ¿A qué <strong>correo o teléfono</strong> te contactamos?' },
      { u: 'marlon@correo.com', b: '¡Perfecto! ¿Qué <strong>día y hora</strong> te viene mejor?' },
      { u: 'Mañana a las 3 pm', b: 'Listo ✅ Llamada agendada para <strong>mañana 3:00 pm</strong>. Te enviaré la confirmación a marlon@correo.com. ¡Gracias por tu compra! 🎉' },
    ],
    csatQ: '¿Te resultó útil?', csatThanks: '¡Gracias por tu opinión!',
  },
  en: {
    title: 'TechToys', online: 'Online', ph: 'Type your message…',
    greet: 'Hi! Welcome to <strong>TechToys</strong> 🚀 Looking for a specific drone?',
    qr: ['4K drones', 'Deals', 'Shipping'],
    turns: [
      { u: "I'm looking for a drone to shoot 4K video", b: 'Great! For 4K I recommend the <strong>SkyPro X4</strong>: stabilized 4K camera, 34 min flight time and 8 km range. Price: <strong>$899</strong>.' },
      { u: 'Does it have a warranty?', b: 'Yes ✅ It includes a <strong>2-year warranty</strong> and 30-day returns. Comes with a hard case and 2 extra batteries.' },
      { u: 'Can you give me a discount?', b: 'I can offer you <strong>10% off today</strong>: that brings it to <strong>$809</strong> with free shipping. 🎁' },
      { u: 'How long is delivery?', b: 'Free shipping takes <strong>2–3 business days</strong>. If you confirm today, I ship it right away.' },
      { u: 'Perfect, I want it', b: 'Excellent choice! 🎉 Here is your secure payment link. Want a <strong>free call</strong> to set it up?' },
      { u: 'Yes, thanks!', b: 'Great! To book it, could you share your <strong>name</strong>?' },
      { u: 'Marlon Vargas', b: 'Thanks, Marlon 🙌 What <strong>email or phone</strong> should we reach you at?' },
      { u: 'marlon@mail.com', b: 'Perfect! What <strong>day and time</strong> works best for you?' },
      { u: 'Tomorrow at 3 pm', b: 'Done ✅ Call booked for <strong>tomorrow 3:00 pm</strong>. I\'ll send the confirmation to marlon@mail.com. Thanks for your purchase! 🎉' },
    ],
    csatQ: 'Was this helpful?', csatThanks: 'Thanks for your feedback!',
  },
};

/** Demo animado del chat en vivo (réplica del widget, color #E7AB2E liso). Auto-reproduce en bucle. */
@Component({
  selector: 'app-cbdemo-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dc-win" role="img" [attr.aria-label]="t().title + ' — demo de chat'">
      <div class="dc-head">
        <span class="dc-ava">T</span>
        <div class="dc-meta">
          <div class="dc-title">{{ t().title }}</div>
          <div class="dc-sub"><span class="dc-dot"></span>{{ t().online }}</div>
        </div>
        <span class="dc-ic dc-first" aria-hidden="true" title="Hablar con un agente"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-4a8 8 0 0 1 16 0v4"/><path d="M18 19a2 2 0 0 1-2 2h-3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg></span>
        <span class="dc-ic" aria-hidden="true" title="Agendar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></svg></span>
        <span class="dc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg></span>
        <span class="dc-ic dc-x" aria-hidden="true">&times;</span>
      </div>
      <div class="dc-body" #body>
        @for (m of messages(); track m.id) {
          @switch (m.kind) {
            @case ('bot') { <div class="dc-b dc-bot" [innerHTML]="m.html"></div> }
            @case ('user') { <div class="dc-b dc-user">{{ m.text }}</div> }
            @case ('typing') { <div class="dc-typing"><span></span><span></span><span></span></div> }
            @case ('qr') { <div class="dc-qr">@for (c of m.chips; track c) { <button class="dc-chip" type="button">{{ c }}</button> }<button class="dc-chip dc-chip-agent" type="button"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-4a8 8 0 0 1 16 0v4"/><path d="M18 19a2 2 0 0 1-2 2h-3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>Hablar con un agente</button></div> }
            @case ('csat') {
              <div class="dc-csat">
                <span class="dc-csat-q">{{ t().csatQ }}</span>
                <button class="dc-csat-b" type="button" [class.on]="m.picked === 1">👍</button>
                <button class="dc-csat-b" type="button">👎</button>
              </div>
            }
            @case ('csatThanks') { <div class="dc-csat dc-csat-done"><span class="dc-csat-q">✓ {{ t().csatThanks }}</span></div> }
          }
        }
      </div>
      <div class="dc-foot">
        <span class="dc-in" [class.empty]="!typed()">{{ typed() || t().ph }}<i class="dc-caret" [class.show]="caret()"></i></span>
        <span class="dc-send" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dc-win { width: 100%; max-width: 330px; margin: 0 auto; height: 500px; display: flex; flex-direction: column;
      background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 26px 60px rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.08);
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    .dc-head { display: flex; align-items: center; gap: 9px; padding: 13px 15px; color: #fff; background: #E7AB2E; }
    .dc-ava { width: 32px; height: 32px; border-radius: 50%; background: #fff; color: #E7AB2E; display: grid; place-items: center; font-weight: 800; font-size: 14px; flex-shrink: 0; }
    .dc-meta { display: flex; flex-direction: column; min-width: 0; line-height: 1.15; }
    .dc-title { font-weight: 700; font-size: 14.5px; }
    .dc-sub { font-size: 10.5px; opacity: .95; display: inline-flex; align-items: center; gap: 5px; }
    .dc-dot { width: 6px; height: 6px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 6px #34e0a1; }
    .dc-ic { margin-left: auto; opacity: .9; display: inline-flex; }
    .dc-ic.dc-x { margin-left: 7px; font-size: 19px; line-height: 1; }
    .dc-body { flex: 1; overflow-y: auto; padding: 14px; background: #f6f6f8; display: flex; flex-direction: column; gap: 9px; scrollbar-width: none; scroll-behavior: smooth; }
    .dc-body::-webkit-scrollbar { display: none; }
    .dc-b { max-width: 85%; padding: 9px 12px; border-radius: 14px; font-size: 13px; line-height: 1.45; animation: dc-rise .26s ease both; }
    .dc-bot { align-self: flex-start; background: #fff; color: #1a1a1a; border: 1px solid #ececf0; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .dc-bot strong { font-weight: 700; color: #0f0f10; }
    .dc-user { align-self: flex-end; color: #fff; background: #E7AB2E; border-bottom-right-radius: 4px; }
    .dc-typing { align-self: flex-start; display: inline-flex; gap: 4px; padding: 12px 13px; background: #fff; border: 1px solid #ececf0; border-radius: 14px; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.05); animation: dc-rise .2s ease both; }
    .dc-typing span { width: 6px; height: 6px; border-radius: 50%; background: #bbb; animation: dc-bounce 1s infinite; }
    .dc-typing span:nth-child(2) { animation-delay: .15s; }
    .dc-typing span:nth-child(3) { animation-delay: .3s; }
    .dc-qr { display: flex; flex-wrap: wrap; gap: 6px; animation: dc-rise .26s ease both; }
    .dc-chip { font-size: 12px; font-weight: 600; padding: 6px 11px; border-radius: 999px; border: 1px solid #E7AB2E; color: #B4801A; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
    .dc-chip-agent { background: #E7AB2E; color: #fff; border-color: #E7AB2E; display: inline-flex; align-items: center; gap: 5px; }
    .dc-csat { align-self: center; display: flex; align-items: center; gap: 8px; margin: 4px 0; padding: 7px 11px; background: #fff; border: 1px solid #ececf0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.05); font-size: 12px; color: #555; animation: dc-rise .3s ease both; }
    .dc-csat-done { border-color: #f5e2b8; background: #fdf7e8; color: #8a6412; }
    .dc-csat-q { font-weight: 600; }
    .dc-csat-b { border: none; background: #f2f2f5; border-radius: 8px; font-size: 14px; line-height: 1; padding: 5px 8px; transition: transform .15s, background .15s; }
    .dc-csat-b.on { background: #E7AB2E; transform: scale(1.14); }
    .dc-foot { display: flex; align-items: center; gap: 7px; padding: 10px 11px; border-top: 1px solid #eee; background: #fff; }
    .dc-in { flex: 1; min-height: 38px; display: flex; align-items: center; border: 1px solid #e3e3e8; border-radius: 10px; padding: 0 12px; font-size: 13px; color: #1a1a1a; background: #fff; overflow: hidden; white-space: nowrap; }
    .dc-in.empty { color: #9a9aa2; }
    .dc-caret { width: 1.5px; height: 15px; margin-left: 1px; background: #E7AB2E; opacity: 0; }
    .dc-caret.show { opacity: 1; animation: dc-blink 1s step-end infinite; }
    .dc-send { border-radius: 10px; width: 38px; height: 38px; flex-shrink: 0; display: grid; place-items: center; background: #E7AB2E; }

    @keyframes dc-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes dc-bounce { 0%,60%,100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-5px); opacity: 1; } }
    @keyframes dc-blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .dc-b, .dc-qr, .dc-csat, .dc-typing { animation: none; } .dc-caret.show { animation: none; } .dc-body { scroll-behavior: auto; } }
  `],
})
export class ChatDemoComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('body') bodyRef?: ElementRef<HTMLElement>;

  readonly messages = signal<Msg[]>([]);
  readonly typed = signal('');
  readonly caret = signal(false);
  readonly t = signal(COPY.es);

  private uid = 0;
  private alive = true;
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const lang = (this.translate.currentLang || this.translate.defaultLang || 'es') as 'es' | 'en';
    this.t.set(COPY[lang] || COPY.es);
    this.translate.onLangChange.subscribe((e) => this.t.set(COPY[(e.lang as 'es' | 'en')] || COPY.es));
    if (!isPlatformBrowser(this.platformId)) { this.staticState(); return; }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.staticState(); return; }
    this.loop();
  }

  ngOnDestroy(): void { this.alive = false; if (this.timer) clearTimeout(this.timer); }

  private sleep(ms: number): Promise<void> { return new Promise((res) => { this.timer = setTimeout(res, ms); }); }
  private push(m: Omit<Msg, 'id'>): number { const id = ++this.uid; this.messages.update((a) => [...a, { ...m, id }]); this.scroll(); return id; }
  private removeLast(): void { this.messages.update((a) => a.slice(0, -1)); }
  private scroll(): void { queueMicrotask(() => { const el = this.bodyRef?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }); }

  private async typeInto(text: string): Promise<void> {
    this.caret.set(true);
    for (let i = 1; i <= text.length && this.alive; i++) { this.typed.set(text.slice(0, i)); await this.sleep(32); }
    await this.sleep(320);
    this.caret.set(false); this.typed.set('');
    this.push({ kind: 'user', text });
  }
  private async botTurn(html: string): Promise<void> {
    this.push({ kind: 'typing' }); await this.sleep(1050);
    if (!this.alive) return; this.removeLast(); this.push({ kind: 'bot', html });
  }

  private async play(): Promise<void> {
    const c = this.t();
    this.push({ kind: 'bot', html: c.greet }); await this.sleep(650);
    this.push({ kind: 'qr', chips: c.qr }); await this.sleep(1600);
    this.removeLast();
    for (let i = 0; i < c.turns.length && this.alive; i++) {
      await this.typeInto(c.turns[i].u); await this.sleep(240);
      await this.botTurn(c.turns[i].b); await this.sleep(i === c.turns.length - 1 ? 650 : 1050);
    }
    const id = this.push({ kind: 'csat' }); await this.sleep(1800);
    this.messages.update((a) => a.map((m) => m.id === id ? { ...m, picked: 1 } : m)); await this.sleep(850);
    this.messages.update((a) => a.map((m) => m.id === id ? { ...m, kind: 'csatThanks' } : m)); await this.sleep(3400);
  }

  private async loop(): Promise<void> {
    while (this.alive) {
      this.messages.set([]); this.typed.set(''); this.caret.set(false);
      await this.sleep(500);
      await this.play();
    }
  }

  private staticState(): void {
    const c = this.t();
    const msgs: Msg[] = [{ id: ++this.uid, kind: 'bot', html: c.greet }];
    for (const turn of c.turns) { msgs.push({ id: ++this.uid, kind: 'user', text: turn.u }); msgs.push({ id: ++this.uid, kind: 'bot', html: turn.b }); }
    msgs.push({ id: ++this.uid, kind: 'csatThanks' });
    this.messages.set(msgs);
  }
}
