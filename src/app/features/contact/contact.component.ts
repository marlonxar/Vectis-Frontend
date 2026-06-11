import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { stepTransition, fadeSwitch } from '../../shared/animations/page-animations';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { RouterLink } from '@angular/router';

type Mode = 'message' | 'appointment';
interface DayCell { date: Date | null; disabled: boolean; }

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RevealDirective, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  animations: [stepTransition, fadeSwitch],
})
export class ContactComponent {
  private readonly translate = inject(TranslateService);
  readonly mode = signal<Mode>('message');
  privacyPath(): string { return this.translate.currentLang === 'en' ? '/privacy' : '/privacidad'; }
  termsPath(): string { return this.translate.currentLang === 'en' ? '/terms' : '/terminos'; }

  // Message form (huecohouse field set)
  msg = { name: '', email: '', company: '', service: '', budget: '', subject: '', message: '', consent: false };
  readonly msgSent = signal(false);
  readonly msgError = signal(false);

  // Appointment wizard
  readonly step = signal(1);
  readonly apptSent = signal(false);
  appt = { service: '', date: null as Date | null, time: '', name: '', email: '', company: '', message: '' };

  readonly serviceKeys = ['AI', 'WEB', 'AUTOMATION', 'CUSTOM', 'API', 'DATA'];
  readonly budgetKeys = ['B1', 'B2', 'B3', 'B4'];
  readonly timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

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
    const first = new Date(y, m, 1);
    const startIdx = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: DayCell[] = [];
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    for (let i = 0; i < startIdx; i++) cells.push({ date: null, disabled: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      cells.push({ date, disabled: date < midnight || weekend });
    }
    return cells;
  });

  setMode(m: Mode): void { this.mode.set(m); }
  prevMonth(): void { let m = this.viewMonth() - 1, y = this.viewYear(); if (m < 0) { m = 11; y--; } this.viewMonth.set(m); this.viewYear.set(y); }
  nextMonth(): void { let m = this.viewMonth() + 1, y = this.viewYear(); if (m > 11) { m = 0; y++; } this.viewMonth.set(m); this.viewYear.set(y); }
  selectDate(c: DayCell): void { if (!c.disabled && c.date) this.appt.date = c.date; }
  isSelected(c: DayCell): boolean { return !!c.date && !!this.appt.date && c.date.toDateString() === this.appt.date.toDateString(); }

  next(): void { if (this.step() < 4 && this.canAdvance()) this.step.update((s) => s + 1); }
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

  submitMessage(): void {
    if (!this.validName(this.msg.name) || !this.validEmail(this.msg.email) ||
        !this.msg.subject.trim() || !this.msg.message.trim() || !this.msg.consent) {
      this.msgError.set(true); return;
    }
    this.msgError.set(false);
    this.msgSent.set(true);
    setTimeout(() => {
      this.msgSent.set(false);
      this.msg = { name: '', email: '', company: '', service: '', budget: '', subject: '', message: '', consent: false };
    }, 3500);
  }

  confirmAppointment(): void {
    this.apptSent.set(true);
    setTimeout(() => {
      this.apptSent.set(false); this.step.set(1);
      this.appt = { service: '', date: null, time: '', name: '', email: '', company: '', message: '' };
    }, 4000);
  }

  private validEmail(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  private validName(v: string): boolean { return v.trim().length >= 2; }
}
