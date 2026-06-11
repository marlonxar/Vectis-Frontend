import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly scroll = inject(ScrollService);
  readonly year = new Date().getFullYear();
  readonly email = signal('');
  readonly subscribed = signal(false);
  readonly invalid = signal(false);

  readonly navLinks = [
    { id: 'inicio', key: 'NAV.HOME' },
    { id: 'servicios', key: 'NAV.SERVICES' },
    { id: 'portafolio', key: 'NAV.PORTFOLIO' },
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
