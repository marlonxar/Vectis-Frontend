import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent {
  readonly keys = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10'];
  readonly preview = 5;   // las 5 preguntas de comprador (qué, precio, garantía, plazo, dónde)
  readonly showAll = signal(false);
  readonly open = signal<number | null>(0);

  visible(): string[] { return this.showAll() ? this.keys : this.keys.slice(0, this.preview); }
  isOpen(i: number): boolean { return this.open() === i; }
  toggle(i: number): void { this.open.set(this.isOpen(i) ? null : i); }
  toggleAll(): void { this.showAll.update((v) => !v); }
}
