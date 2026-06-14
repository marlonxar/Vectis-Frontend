import { Component, computed, signal, inject, PLATFORM_ID, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { stepTransition, fadeSwitch } from '../../shared/animations/page-animations';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { RouterLink } from '@angular/router';

type Mode = 'message' | 'appointment';
interface DayCell { date: Date | null; disabled: boolean; }
interface Slot { label: string; iso: string; }

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
}
declare global { interface Window { turnstile?: TurnstileApi; } }

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RevealDirective, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  animations: [stepTransition, fadeSwitch],
})
export class ContactComponent implements AfterViewInit {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly mode = signal<Mode>('message');
  privacyPath(): string { return this.translate.currentLang === 'en' ? '/privacy' : '/privacidad'; }
  termsPath(): string { return this.translate.currentLang === 'en' ? '/terms' : '/terminos'; }

  // Message form (huecohouse field set)
  msg = { name: '', email: '', company: '', service: '', budget: '', subject: '', message: '', consent: false };
  hp = ''; // honeypot — must stay empty (bots fill it)
  readonly msgSent = signal(false);
  readonly msgError = signal(false);
  readonly msgCaptcha = signal(false);
  readonly msgSending = signal(false);

  /** True only when all required fields are valid and consent is checked. */
  canSendMessage(): boolean {
    return this.validName(this.msg.name) && this.validEmail(this.msg.email)
      && !!this.msg.subject.trim() && !!this.msg.message.trim() && this.msg.consent;
  }

  // Cloudflare Turnstile site key (pública) — de https://dash.cloudflare.com (Turnstile)
  readonly TURNSTILE_SITE_KEY = '0x4AAAAAADkeMa-48lr1Ewlc';
  @ViewChild('turnstileBox') private turnstileBox?: ElementRef<HTMLElement>;
  readonly turnstileToken = signal('');
  private turnstileId?: string;
  private turnstileScript?: Promise<void>;

  // Appointment wizard
  readonly step = signal(1);
  readonly apptSent = signal(false);
  readonly apptSending = signal(false);
  readonly apptError = signal(false);
  appt = { service: '', date: null as Date | null, time: '', slotIso: '', name: '', email: '', company: '', message: '' };

  readonly serviceKeys = ['AI', 'WEB', 'AUTOMATION', 'CUSTOM', 'API', 'DATA'];
  readonly budgetKeys = ['B1', 'B2', 'B3', 'B4'];
  // Shown only as a visual placeholder until Cal.com availability is configured/loaded
  readonly fallbackSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  // Cal.com real availability: 'YYYY-MM-DD' -> Slot[]
  readonly availability = signal<Record<string, Slot[]>>({});
  readonly loadingSlots = signal(false);
  private get tz(): string {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
  }

  private readonly today = new Date();
  readonly viewYear = signal(this.today.getFullYear());
  readonly viewMonth = signal(this.today.getMonth());

  readonly monthLabel = computed(() => {
    const d = new Date(this.viewYear(), this.viewMonth(), 1);
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'es-ES';
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  });
  readonly weekDays = computed(() =>
    this.translate.currentLang === 'en'
      ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      : ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']);

  readonly calendar = computed<DayCell[]>(() => {
    const y = this.viewYear(); const m = this.viewMonth();
    const avail = this.availability();
    const hasAvail = Object.keys(avail).length > 0;
    const first = new Date(y, m, 1);
    const startIdx = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: DayCell[] = [];
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    for (let i = 0; i < startIdx; i++) cells.push({ date: null, disabled: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const past = date < midnight;
      let disabled: boolean;
      if (hasAvail) {
        const slots = avail[this.dateKey(date)];
        disabled = past || !slots || slots.length === 0;
      } else {
        const weekend = date.getDay() === 0 || date.getDay() === 6;
        disabled = past || weekend; // placeholder rule until real availability loads
      }
      cells.push({ date, disabled });
    }
    return cells;
  });

  ngAfterViewInit(): void { if (this.mode() === 'message') this.mountTurnstile(); }

  setMode(m: Mode): void { this.mode.set(m); if (m === 'message') this.mountTurnstile(); }

  private loadTurnstileScript(): Promise<void> {
    if (this.turnstileScript) return this.turnstileScript;
    this.turnstileScript = new Promise<void>((resolve) => {
      if (window.turnstile) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://challenge.cdn.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.defer = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });
    return this.turnstileScript;
  }

  private mountTurnstile(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadTurnstileScript().then(() => {
      setTimeout(() => {
        const el = this.turnstileBox?.nativeElement;
        if (!el || !window.turnstile) return;
        el.innerHTML = '';
        this.turnstileToken.set('');
        this.turnstileId = window.turnstile.render(el, {
          sitekey: this.TURNSTILE_SITE_KEY,
          theme: 'dark',
          callback: (token: string) => this.turnstileToken.set(token),
          'expired-callback': () => this.turnstileToken.set(''),
          'error-callback': () => this.turnstileToken.set(''),
        });
      }, 60);
    });
  }

  private resetTurnstile(): void {
    this.turnstileToken.set('');
    try { window.turnstile?.reset(this.turnstileId); } catch { /* noop */ }
  }

  prevMonth(): void { let m = this.viewMonth() - 1, y = this.viewYear(); if (m < 0) { m = 11; y--; } this.viewMonth.set(m); this.viewYear.set(y); this.onMonthChange(); }
  nextMonth(): void { let m = this.viewMonth() + 1, y = this.viewYear(); if (m > 11) { m = 0; y++; } this.viewMonth.set(m); this.viewYear.set(y); this.onMonthChange(); }
  private onMonthChange(): void { this.appt.date = null; this.appt.time = ''; this.appt.slotIso = ''; if (this.step() === 2) this.loadAvailability(); }

  selectDate(c: DayCell): void { if (!c.disabled && c.date) { this.appt.date = c.date; this.appt.time = ''; this.appt.slotIso = ''; } }
  isSelected(c: DayCell): boolean { return !!c.date && !!this.appt.date && c.date.toDateString() === this.appt.date.toDateString(); }

  /** Slots for the selected day: real Cal.com slots if available, else placeholder labels. */
  slotsForSelected(): Slot[] {
    if (!this.appt.date) return [];
    const real = this.availability()[this.dateKey(this.appt.date)];
    if (real && real.length) return real;
    return this.fallbackSlots.map((t) => ({ label: t, iso: '' }));
  }
  selectTime(s: Slot): void { this.appt.time = s.label; this.appt.slotIso = s.iso; }

  next(): void {
    if (this.step() < 4 && this.canAdvance()) {
      const entering = this.step() + 1;
      this.step.set(entering);
      if (entering === 2) this.loadAvailability();
    }
  }
  back(): void { if (this.step() > 1) this.step.update((s) => s - 1); }
  canAdvance(): boolean {
    switch (this.step()) {
      case 1: return !!this.appt.service;
      case 2: return !!this.appt.date && !!this.appt.time;
      case 3: return this.validName(this.appt.name) && this.validEmail(this.appt.email);
      default: return true;
    }
  }
  formattedDate(): string {
    if (!this.appt.date) return '';
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'es-ES';
    return this.appt.date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  async submitMessage(): Promise<void> {
    // Honeypot: if filled, silently pretend success (don't tip off the bot, don't send).
    if (this.hp.trim()) { this.msgSent.set(true); return; }

    if (!this.canSendMessage()) { this.msgError.set(true); this.msgCaptcha.set(false); return; }
    if (!this.turnstileToken()) { this.msgError.set(false); this.msgCaptcha.set(true); return; }
    this.msgError.set(false);
    this.msgCaptcha.set(false);
    this.msgSending.set(true);

    const t = (k: string) => this.translate.instant(k);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.msg.name,
          email: this.msg.email,
          company: this.msg.company || '',
          service: this.msg.service ? t('SERVICES.' + this.msg.service + '.TITLE') : '',
          budget: this.msg.budget ? t('CONTACT.' + this.msg.budget) : '',
          subject: this.msg.subject,
          message: this.msg.message,
          token: this.turnstileToken(),
          hp: this.hp,
        }),
      });
      const data = await res.json();
      if (!data || !data.ok) throw new Error('contact');
      this.msgSending.set(false);
      this.msgSent.set(true);
      this.msg = { name: '', email: '', company: '', service: '', budget: '', subject: '', message: '', consent: false };
      setTimeout(() => { this.msgSent.set(false); this.mountTurnstile(); }, 4000);
    } catch {
      this.msgSending.set(false);
      this.msgError.set(true);
      this.resetTurnstile();
    }
  }

  // --- Cal.com integration (via our serverless /api proxy) ----------------
  private loadAvailability(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const y = this.viewYear(), m = this.viewMonth();
    const monthStart = new Date(y, m, 1);
    const now = new Date();
    const from = monthStart < now ? now : monthStart;
    const to = new Date(y, m + 1, 0, 23, 59, 59);
    this.loadingSlots.set(true);
    const url = `/api/cal-slots?start=${encodeURIComponent(from.toISOString())}`
      + `&end=${encodeURIComponent(to.toISOString())}&timeZone=${encodeURIComponent(this.tz)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('slots'))))
      .then((data: Record<string, Slot[]>) => this.availability.set(data || {}))
      .catch(() => this.availability.set({})) // keep placeholder UI
      .finally(() => this.loadingSlots.set(false));
  }

  async confirmAppointment(): Promise<void> {
    this.apptError.set(false);
    this.apptSending.set(true);
    const serviceTitle = this.appt.service
      ? this.translate.instant('SERVICES.' + this.appt.service + '.TITLE') : '';
    try {
      const res = await fetch('/api/cal-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: this.appt.slotIso || this.composeIso(),
          name: this.appt.name,
          email: this.appt.email,
          company: this.appt.company,
          notes: this.appt.message,
          service: serviceTitle,
          timeZone: this.tz,
          language: this.translate.currentLang,
        }),
      });
      if (!res.ok) throw new Error('book');
      this.apptSending.set(false);
      this.apptSent.set(true);
    } catch {
      this.apptSending.set(false);
      this.apptError.set(true);
    }
  }

  /** Fallback ISO from the picked date + label (used only if a real slot ISO is missing). */
  private composeIso(): string {
    if (!this.appt.date) return '';
    const [h, min] = (this.appt.time || '00:00').split(':').map(Number);
    const d = new Date(this.appt.date);
    d.setHours(h || 0, min || 0, 0, 0);
    return d.toISOString();
  }

  /** Local 'YYYY-MM-DD' key (matches Cal.com day grouping in the requested timezone). */
  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private validEmail(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  private validName(v: string): boolean { return v.trim().length >= 2; }
}
