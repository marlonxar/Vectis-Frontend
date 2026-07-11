import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { PrivacyComponent } from './features/privacy/privacy.component';
import { TermsComponent } from './features/terms/terms.component';
import { RefoundsComponent } from './features/refounds/refounds.component';
import { AI_CHATBOT_ROUTES } from './features/ai-chatbot/ai-chatbot.routes';

// Legal pages are shared by the marketing site and the chatbot subdomain.
const legalRoutes: Routes = [
  { path: 'privacidad', component: PrivacyComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terminos', component: TermsComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'refounds', component: RefoundsComponent },
  { path: 'refunds', component: RefoundsComponent },
  { path: 'reembolsos', component: RefoundsComponent },
];

/** Marketing site — wearevectis.com. The AI ChatBot now lives on its own subdomain. */
export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'en', component: HomeComponent, pathMatch: 'full' },
  ...legalRoutes,
  // Discovery Assistant — full-page, lazy-loaded (widget JS only loads on these paths)
  { path: 'discovery-assistant/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: 'discovery-assistent/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: 'asistente-de-descubrimiento/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent },
];

/**
 * AI ChatBot subdomain — aichatbot.wearevectis.com.
 * The chatbot lives at the ROOT of this host (/, /plans, /support, /dashboard…).
 * Old prefixed links (/ai-chatbot/...) redirect to the clean root paths.
 */
export const chatbotRoutes: Routes = [
  ...AI_CHATBOT_ROUTES,
  ...legalRoutes,
  { path: 'ai-chatbot', redirectTo: '' },   // back-compat for old /ai-chatbot/* links
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '' },
];
