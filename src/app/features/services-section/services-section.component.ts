import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IntersectionObserverDirective } from '../../core/directives/intersection-observer.directive';

interface Service { key: string; tags: string[]; icon: string; idx: number; }

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [CommonModule, TranslateModule, IntersectionObserverDirective],
  templateUrl: './services-section.component.html',
  styleUrl: './services-section.component.scss',
})
export class ServicesSectionComponent {
  readonly shown = signal(false);
  readonly active = signal(0);

  readonly services: Service[] = [
    { key: 'AI',         tags: ['OpenAI', 'Claude', 'ML'],      icon: 'ai',         idx: 0 },
    { key: 'WEB',        tags: ['Angular', 'React', 'Next.js'], icon: 'web',        idx: 1 },
    { key: 'AUTOMATION', tags: ['n8n', 'RPA', 'Workflows'],     icon: 'automation', idx: 2 },
    { key: 'CUSTOM',     tags: ['SaaS', 'ERP', 'Cloud'],        icon: 'custom',     idx: 3 },
    { key: 'API',        tags: ['REST', 'GraphQL', 'Webhooks'], icon: 'api',        idx: 4 },
    { key: 'DATA',       tags: ['ETL', 'BI', 'Dashboards'],     icon: 'data',       idx: 5 },
  ];
  readonly left = computed(() => this.services.slice(0, 3));
  readonly right = computed(() => this.services.slice(3));

  reveal(): void { this.shown.set(true); }
  setActive(i: number): void { this.active.set(i); }
}
