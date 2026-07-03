import { Routes } from '@angular/router';
import { chatbotAuthGuard } from './auth.guard';

/**
 * Producto "Vectis AI ChatBot".
 *   /ai-chatbot            → hero + login / registro / recuperar
 *   /ai-chatbot/reset      → definir nueva contraseña (desde el correo)
 *   /ai-chatbot/plans..    → área autenticada (protegida por chatbotAuthGuard)
 */
export const AI_CHATBOT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./landing.component').then((m) => m.ChatbotLandingComponent) },
  { path: 'reset', loadComponent: () => import('./reset.component').then((m) => m.ChatbotResetComponent) },
  { path: 'plans', canActivate: [chatbotAuthGuard], loadComponent: () => import('./plans.component').then((m) => m.ChatbotPlansComponent) },
  { path: 'configure', canActivate: [chatbotAuthGuard], loadComponent: () => import('./configure.component').then((m) => m.ChatbotConfigureComponent) },
  { path: 'dashboard', canActivate: [chatbotAuthGuard], loadComponent: () => import('./dashboard.component').then((m) => m.ChatbotDashboardComponent) },
  { path: 'support', canActivate: [chatbotAuthGuard], loadComponent: () => import('./support.component').then((m) => m.ChatbotSupportComponent) },
  { path: 'manage', canActivate: [chatbotAuthGuard], loadComponent: () => import('./manage-chatbots.component').then((m) => m.ChatbotManageComponent) },
  { path: 'account', canActivate: [chatbotAuthGuard], loadComponent: () => import('./account.component').then((m) => m.ChatbotAccountComponent) },
];
