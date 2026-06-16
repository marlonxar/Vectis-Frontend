import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HeroComponent } from '../hero/hero.component';
import { ServicesSectionComponent } from '../services-section/services-section.component';
import { StatsComponent } from '../stats/stats.component';
import { PortfolioComponent } from '../portfolio/portfolio.component';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { FaqComponent } from '../faq/faq.component';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TranslateModule, RevealDirective,
    HeroComponent, ServicesSectionComponent, StatsComponent,
    PortfolioComponent, AboutComponent, ContactComponent, FaqComponent,
  ],
  template: `
    <main id="main-content">
      <app-hero></app-hero>
      <app-services-section></app-services-section>
      <app-stats></app-stats>

      <section class="philosophy sec-dark" aria-label="filosofía">
        <div class="container philo-inner" appReveal>
          <p class="eyebrow on-dark">{{ 'PHILOSOPHY.EYEBROW' | translate }}</p>
          <blockquote class="philo-quote">“{{ 'PHILOSOPHY.QUOTE' | translate }}”</blockquote>
          <p class="philo-sub">{{ 'PHILOSOPHY.SUB' | translate }}</p>
        </div>
      </section>

      <app-portfolio></app-portfolio>
      <app-about></app-about>
      <app-contact></app-contact>
      <app-faq></app-faq>
    </main>
  `,
  styles: [`
    .philosophy { background: var(--ink); padding: clamp(72px, 11vw, 132px) 0; text-align: center; }
    .philo-inner { max-width: 920px; margin: 0 auto; }
    .philo-quote { margin: 16px 0 0; border: 0; quotes: none;
      font-family: var(--font-sans); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06;
      font-size: clamp(30px, 5.4vw, 58px); color: var(--paper); }
    .philo-sub { margin-top: 20px; color: var(--gold-bright);
      font-family: var(--font-mono); font-size: clamp(14px, 1.8vw, 17px); letter-spacing: 0.02em; }
  `],
})
export class HomeComponent {}
