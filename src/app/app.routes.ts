import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { PrivacyComponent } from './features/privacy/privacy.component';
import { TermsComponent } from './features/terms/terms.component';
import { RefoundsComponent } from './features/refounds/refounds.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'en', component: HomeComponent, pathMatch: 'full' },
  { path: 'privacidad', component: PrivacyComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terminos', component: TermsComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'refounds', component: RefoundsComponent },
  { path: 'refunds', component: RefoundsComponent },
  { path: 'reembolsos', component: RefoundsComponent },
  // Discovery Assistant — full-page, lazy-loaded (widget JS only loads on these paths)
  { path: 'discovery-assistant/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: 'discovery-assistent/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: 'asistente-de-descubrimiento/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  // AI ChatBot — onboarding self-service (marketing + login + planes), parte de Vectis
  { path: 'ai-chatbot', loadChildren: () => import('./features/ai-chatbot/ai-chatbot.routes').then((m) => m.AI_CHATBOT_ROUTES) },
  // Rutas viejas /chatbot/* (versión de pruebas) → redirige todo el prefijo a la versión vigente.
  { path: 'chatbot', redirectTo: 'ai-chatbot' },
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent },
];
