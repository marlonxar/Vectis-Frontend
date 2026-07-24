import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { ServicesSectionComponent } from '../services-section/services-section.component';
import { StatsComponent } from '../stats/stats.component';
import { PortfolioComponent } from '../portfolio/portfolio.component';
import { HowItWorksComponent } from '../how-it-works/how-it-works.component';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { FaqComponent } from '../faq/faq.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent, ServicesSectionComponent, StatsComponent,
    PortfolioComponent, HowItWorksComponent, AboutComponent, ContactComponent, FaqComponent,
  ],
  template: `
    <main id="main-content">
      <app-hero></app-hero>
      <app-services-section></app-services-section>
      <app-stats></app-stats>
      <app-portfolio></app-portfolio>
      <app-how-it-works></app-how-it-works>
      <app-about></app-about>
      <app-contact></app-contact>
      <app-faq></app-faq>
    </main>
  `,
})
export class HomeComponent {}
