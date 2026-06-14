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
  readonly subscribed = signal(false);
  readonly invalid = signal(false);

  readonly navLinks = [
    { id: 'inicio', key: 'NAV.HOME' },
    { id: 'servicios', key: 'NAV.SERVICES' },
    { id: 'works', key: 'NAV.PORTFOLIO' },
    { id: 'nosotros', key: 'NAV.ABOUT' },
    { id: 'contacto', key: 'NAV.CONTACT' },
  ];

  go(id: string): void { this.scroll.scrollToId(id); }

  subscribe(): void {
    const v = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { this.invalid.set(true); return; }
    this.invalid.set(false); this.subscribed.set(true); this.email.set('');
    setTimeout(() => this.subscribed.set(false), 4000);
  }
}
