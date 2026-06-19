import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { PrivacyComponent } from './features/privacy/privacy.component';
import { TermsComponent } from './features/terms/terms.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'en', component: HomeComponent, pathMatch: 'full' },
  { path: 'privacidad', component: PrivacyComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terminos', component: TermsComponent },
  { path: 'terms', component: TermsComponent },
  // Discovery Assistant — full-page, lazy-loaded (widget JS only loads on these paths)
  { path: 'discovery-assistant/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: 'discovery-assistent/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: 'asistente-de-descubrimiento/:id', loadComponent: () => import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent) },
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent },
];
