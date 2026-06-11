import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollService } from '../../../core/services/scroll.service';
import { fadeScale } from '../../animations/page-animations';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './back-to-top.component.html',
  styleUrl: './back-to-top.component.scss',
  animations: [fadeScale],
})
export class BackToTopComponent {
  private readonly scroll = inject(ScrollService);
  readonly visible = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.scroll.isBrowser) return;
    this.visible.set(window.scrollY > 400);
  }

  toTop(): void { this.scroll.scrollToTop(); }
}
