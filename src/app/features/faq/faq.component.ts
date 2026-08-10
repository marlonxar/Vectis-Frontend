import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent {
  readonly scroll = inject(ScrollService);
  // 16 preguntas (change order S2). En el home se ven las 5 primeras (comprador);
  // "Ver todas" revela el resto. Q2 (costo) y Q9 (post-lanzamiento) quedan sin
  // precios hasta que el equipo defina los montos.
  readonly keys = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16'];
  readonly preview = 5;   // las 5 preguntas de comprador (qué, costo, garantía, plazo, herramientas)
  readonly showAll = signal(false);
  readonly open = signal<number | null>(0);

  visible(): string[] { return this.showAll() ? this.keys : this.keys.slice(0, this.preview); }
  isOpen(i: number): boolean { return this.open() === i; }
  toggle(i: number): void { this.open.set(this.isOpen(i) ? null : i); }
  toggleAll(): void { this.showAll.update((v) => !v); }
}
