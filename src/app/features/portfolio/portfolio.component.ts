import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IntersectionObserverDirective } from '../../core/directives/intersection-observer.directive';

interface Project { key: string; img: string; tags: string[]; }
interface Testimonial { key: string; photo: string; }

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, TranslateModule, IntersectionObserverDirective],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
})
export class PortfolioComponent {
  readonly clients = [
    'FINTECH LATAM', 'RETAIL PRO', 'HEALTHTECH CR', 'LOGISTICS360', 'ECOMMERCE HUB',
    'PROPTECH MX', 'EDTECH GLOBAL', 'INSURTECH SA', 'CLOUD VENTURES', 'AGRO DIGITAL',
  ];
  readonly clientsLoop = [...this.clients, ...this.clients];
  readonly clientsLoop2 = [...this.clients].reverse().concat([...this.clients].reverse());

  /** 8 dummy projects — edit/extend freely. */
  readonly projects: Project[] = [
    { key: 'FINTECH',     img: 'https://picsum.photos/seed/vx-fintech/800/560',  tags: ['Web', 'APIs'] },
    { key: 'HEALTHAPP',   img: 'https://picsum.photos/seed/vx-health/800/560',   tags: ['Mobile', 'AI'] },
    { key: 'LOGISTICS',   img: 'https://picsum.photos/seed/vx-logistics/800/560',tags: ['Automation'] },
    { key: 'AIAGENT',     img: 'https://picsum.photos/seed/vx-ai/800/560',       tags: ['LLM', 'Agents'] },
    { key: 'ANALYTICS',   img: 'https://picsum.photos/seed/vx-data/800/560',     tags: ['Data', 'BI'] },
    { key: 'ECOMMERCE',   img: 'https://picsum.photos/seed/vx-ecom/800/560',     tags: ['Web', 'Shopify'] },
    { key: 'SAAS',        img: 'https://picsum.photos/seed/vx-saas/800/560',     tags: ['SaaS', 'Cloud'] },
    { key: 'INTEGRATION', img: 'https://picsum.photos/seed/vx-api/800/560',      tags: ['APIs', 'ETL'] },
  ];

  readonly testimonials: Testimonial[] = [
    { key: 'T1', photo: 'https://i.pravatar.cc/120?img=12' },
    { key: 'T2', photo: 'https://i.pravatar.cc/120?img=47' },
    { key: 'T3', photo: 'https://i.pravatar.cc/120?img=33' },
    { key: 'T4', photo: 'https://i.pravatar.cc/120?img=5' },
    { key: 'T5', photo: 'https://i.pravatar.cc/120?img=68' },
    { key: 'T6', photo: 'https://i.pravatar.cc/120?img=24' },
  ];

  readonly shownW = signal(false);
  readonly shownT = signal(false);
  revealW(): void { this.shownW.set(true); }
  revealT(): void { this.shownT.set(true); }
}
