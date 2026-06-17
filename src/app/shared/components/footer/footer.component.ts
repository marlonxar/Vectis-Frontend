import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly scroll = inject(ScrollService);
  private readonly translate = inject(TranslateService);

  privacyPath(): string { return this.translate.currentLang === 'en' ? '/privacy' : '/privacidad'; }
  termsPath(): string { return this.translate.currentLang === 'en' ? '/terms' : '/terminos'; }
  readonly year = new Date().getFullYear();
  readonly email = signal('');
  hp = ''; // honeypot — must stay empty
  readonly subscribed = signal(false);
  readonly invalid = signal(false);
  readonly subError = signal(false);
  readonly sending = signal(false);

  readonly navLinks = [
    { id: 'inicio', key: 'NAV.HOME' },
    { id: 'servicios', key: 'NAV.SERVICES' },
    { id: 'works', key: 'NAV.PORTFOLIO' },
    { id: 'nosotros', key: 'NAV.ABOUT' },
    { id: 'contacto', key: 'NAV.CONTACT' },
  ];

  go(id: string): void { this.scroll.scrollToId(id); }

  async subscribe(): Promise<void> {
    if (this.hp.trim()) { this.subscribed.set(true); return; } // honeypot
    const v = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { this.invalid.set(true); this.subError.set(false); return; }
    this.invalid.set(false); this.subError.set(false); this.sending.set(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v, hp: this.hp }),
      });
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      this.sending.set(false);
      if (!res.ok || !data['ok']) { this.subError.set(true); return; }
      this.subscribed.set(true); this.email.set('');
      setTimeout(() => this.subscribed.set(false), 6000);
    } catch {
      this.sending.set(false); this.subError.set(true);
    }
  }
}
