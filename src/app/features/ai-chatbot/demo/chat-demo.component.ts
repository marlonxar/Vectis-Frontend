import {
  Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

interface Msg { id: number; kind: 'bot' | 'user' | 'typing' | 'qr' | 'csat' | 'csatThanks'; html?: string; text?: string; chips?: string[]; picked?: number; }

const COPY = {
  es: {
    title: 'Aurora Café', online: 'En línea', ph: 'Escribe tu mensaje…',
    greet: '¡Hola! Soy el asistente de <strong>Aurora Café</strong> ☕ ¿En qué te ayudo?',
    qr: ['Horario', 'Menú', 'Reservar'],
    u1: '¿Tienen leche de avena?',
    b2: '¡Sí! Tenemos leche de <strong>avena</strong>, almendra y coco. Puedes pedir cualquier bebida con ellas, sin costo extra 🌱',
    u2: '¿Cuánto cuesta un latte?',
    b3: 'Un latte cuesta <strong>₡2.500</strong>. Con leche vegetal es el mismo precio. ¿Quieres que te reserve una mesa?',
    u3: '¡Gracias, muy útil!',
    csatQ: '¿Te resultó útil?', csatThanks: '¡Gracias por tu opinión!',
  },
  en: {
    title: 'Aurora Café', online: 'Online', ph: 'Type your message…',
    greet: "Hi! I'm the <strong>Aurora Café</strong> assistant ☕ How can I help?",
    qr: ['Hours', 'Menu', 'Book'],
    u1: 'Do you have oat milk?',
    b2: 'Yes! We have <strong>oat</strong>, almond and coconut milk. You can add any of them to any drink, at no extra cost 🌱',
    u2: 'How much is a latte?',
    b3: 'A latte is <strong>$4.50</strong>. Plant milk is the same price. Want me to book you a table?',
    u3: 'Thanks, very helpful!',
    csatQ: 'Was this helpful?', csatThanks: 'Thanks for your feedback!',
  },
};

/** Demo animado del chat en vivo (réplica del widget real: tema claro + gradiente dorado). Auto-reproduce en bucle. */
@Component({
  selector: 'app-cbdemo-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dc-win" role="img" [attr.aria-label]="t().title + ' — demo de chat'">
      <div class="dc-head">
        <span class="dc-ava">A</span>
        <div class="dc-meta">
          <div class="dc-title">{{ t().title }}</div>
          <div class="dc-sub"><span class="dc-dot"></span>{{ t().online }}</div>
        </div>
        <span class="dc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg></span>
        <span class="dc-ic dc-x" aria-hidden="true">&times;</span>
      </div>
      <div class="dc-body" #body>
        @for (m of messages(); track m.id) {
          @switch (m.kind) {
            @case ('bot') { <div class="dc-b dc-bot" [innerHTML]="m.html"></div> }
            @case ('user') { <div class="dc-b dc-user">{{ m.text }}</div> }
            @case ('typing') { <div class="dc-typing"><span></span><span></span><span></span></div> }
            @case ('qr') { <div class="dc-qr">@for (c of m.chips; track c) { <button class="dc-chip" type="button">{{ c }}</button> }</div> }
            @case ('csat') {
              <div class="dc-csat">
                <span class="dc-csat-q">{{ t().csatQ }}</span>
                <button class="dc-csat-b" type="button" [class.on]="m.picked === 1">👍</button>
                <button class="dc-csat-b" type="button">👎</button>
              </div>
            }
            @case ('csatThanks') { <div class="dc-csat"><span class="dc-csat-q">{{ t().csatThanks }}</span></div> }
          }
        }
      </div>
      <div class="dc-foot">
        <span class="dc-in" [class.empty]="!typed()">{{ typed() || t().ph }}<i class="dc-caret" [class.show]="caret()"></i></span>
        <span class="dc-send" aria-hidden="true"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dc-win { width: 100%; max-width: 380px; margin: 0 auto; height: 560px; display: flex; flex-direction: column;
      background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.08);
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    .dc-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; color: #fff;
      background: linear-gradient(135deg, #E7AB2E, #0A0A0A); }
    .dc-ava { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.92); color: #111; display: grid; place-items: center; font-weight: 800; font-size: 14px; flex-shrink: 0; }
    .dc-meta { display: flex; flex-direction: column; min-width: 0; line-height: 1.15; }
    .dc-title { font-weight: 700; font-size: 15px; }
    .dc-sub { font-size: 11px; opacity: .92; display: inline-flex; align-items: center; gap: 5px; }
    .dc-dot { width: 7px; height: 7px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 6px #34e0a1; }
    .dc-ic { margin-left: auto; opacity: .9; display: inline-flex; }
    .dc-ic.dc-x { margin-left: 8px; font-size: 20px; line-height: 1; }
    .dc-body { flex: 1; overflow: hidden; padding: 16px; background: #f6f6f8; display: flex; flex-direction: column; gap: 10px; }
    .dc-b { max-width: 84%; padding: 10px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; animation: dc-rise .26s ease both; }
    .dc-bot { align-self: flex-start; background: #fff; color: #1a1a1a; border: 1px solid #ececf0; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .dc-bot strong { font-weight: 700; }
    .dc-user { align-self: flex-end; color: #fff; background: linear-gradient(135deg, #E7AB2E, #0A0A0A); border-bottom-right-radius: 4px; }
    .dc-typing { align-self: flex-start; display: inline-flex; gap: 4px; padding: 13px 14px; background: #fff; border: 1px solid #ececf0; border-radius: 14px; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.05); animation: dc-rise .2s ease both; }
    .dc-typing span { width: 7px; height: 7px; border-radius: 50%; background: #bbb; animation: dc-bounce 1s infinite; }
    .dc-typing span:nth-child(2) { animation-delay: .15s; }
    .dc-typing span:nth-child(3) { animation-delay: .3s; }
    .dc-qr { display: flex; flex-wrap: wrap; gap: 7px; animation: dc-rise .26s ease both; }
    .dc-chip { font-size: 12.5px; font-weight: 600; padding: 7px 12px; border-radius: 999px; border: 1px solid #E7AB2E; color: #B4801A; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
    .dc-csat { align-self: center; display: flex; align-items: center; gap: 8px; margin: 4px 0; padding: 8px 12px; background: #fff; border: 1px solid #ececf0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.05); font-size: 12.5px; color: #555; animation: dc-rise .26s ease both; }
    .dc-csat-q { font-weight: 600; }
    .dc-csat-b { border: none; background: #f2f2f5; border-radius: 8px; font-size: 15px; line-height: 1; padding: 5px 9px; transition: transform .15s, background .15s; }
    .dc-csat-b.on { background: #E7AB2E; transform: scale(1.12); }
    .dc-foot { display: flex; align-items: center; gap: 8px; padding: 11px 12px; border-top: 1px solid #eee; background: #fff; }
    .dc-in { flex: 1; min-height: 42px; display: flex; align-items: center; border: 1px solid #e3e3e8; border-radius: 11px; padding: 0 13px; font-size: 14px; color: #1a1a1a; overflow: hidden; white-space: nowrap; }
    .dc-in.empty { color: #9a9aa2; }
    .dc-caret { width: 1.5px; height: 17px; margin-left: 1px; background: #E7AB2E; opacity: 0; }
    .dc-caret.show { opacity: 1; animation: dc-blink 1s step-end infinite; }
    .dc-send { border-radius: 11px; width: 42px; height: 42px; flex-shrink: 0; display: grid; place-items: center; background: linear-gradient(135deg, #E7AB2E, #0A0A0A); }

    @keyframes dc-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes dc-bounce { 0%,60%,100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-5px); opacity: 1; } }
    @keyframes dc-blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .dc-b, .dc-qr, .dc-csat, .dc-typing { animation: none; } .dc-caret.show { animation: none; } }
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

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => { this.timer = setTimeout(res, ms); });
  }
  private push(m: Omit<Msg, 'id'>): number { const id = ++this.uid; this.messages.update((a) => [...a, { ...m, id }]); this.scroll(); return id; }
  private removeLast(): void { this.messages.update((a) => a.slice(0, -1)); }
  private scroll(): void { queueMicrotask(() => { const el = this.bodyRef?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }); }

  private async typeInto(text: string): Promise<void> {
    this.caret.set(true);
    for (let i = 1; i <= text.length && this.alive; i++) { this.typed.set(text.slice(0, i)); await this.sleep(38); }
    await this.sleep(360);
    this.caret.set(false); this.typed.set('');
    this.push({ kind: 'user', text });
  }
  private async botTurn(html: string): Promise<void> {
    this.push({ kind: 'typing' }); await this.sleep(1100);
    if (!this.alive) return; this.removeLast(); this.push({ kind: 'bot', html });
  }

  private async play(): Promise<void> {
    const c = this.t();
    this.push({ kind: 'bot', html: c.greet }); await this.sleep(700);
    this.push({ kind: 'qr', chips: c.qr }); await this.sleep(1700);
    this.removeLast();
    await this.typeInto(c.u1); await this.sleep(300);
    await this.botTurn(c.b2); await this.sleep(1200);
    await this.typeInto(c.u2); await this.sleep(300);
    await this.botTurn(c.b3); await this.sleep(1300);
    await this.typeInto(c.u3); await this.sleep(600);
    const id = this.push({ kind: 'csat' }); await this.sleep(1500);
    this.messages.update((a) => a.map((m) => m.id === id ? { ...m, picked: 1 } : m)); await this.sleep(700);
    this.messages.update((a) => a.map((m) => m.id === id ? { ...m, kind: 'csatThanks' } : m)); await this.sleep(2600);
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
    this.messages.set([
      { id: 1, kind: 'bot', html: c.greet },
      { id: 2, kind: 'user', text: c.u1 },
      { id: 3, kind: 'bot', html: c.b2 },
      { id: 4, kind: 'user', text: c.u2 },
      { id: 5, kind: 'bot', html: c.b3 },
      { id: 6, kind: 'user', text: c.u3 },
      { id: 7, kind: 'csatThanks' },
    ]);
  }
}
