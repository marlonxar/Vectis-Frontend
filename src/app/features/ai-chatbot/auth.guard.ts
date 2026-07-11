import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ChatbotAuthService } from './auth.service';
import { ChatbotSessionService } from './session.service';

/** Protege las rutas del área autenticada. Si no hay sesión, manda al login. */
export const chatbotAuthGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(ChatbotAuthService);
  const session = inject(ChatbotSessionService);
  const router = inject(Router);

  // Espera a que termine la verificación inicial de sesión (getSession + carga de datos).
  if (!auth.authReady()) {
    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (auth.authReady()) { clearInterval(timer); resolve(); }
      }, 30);
    });
  }

  if (!auth.isLoggedIn()) return router.createUrlTree(['/']);

  // Si excedió el límite de chatbots activos del plan, obliga a resolverlo primero.
  if (session.needsActiveReview() && !state.url.startsWith('/manage')) {
    return router.createUrlTree(['/manage']);
  }

  // Aún no elige plan: lo primero es elegir uno (permite /plans y /account).
  if (!session.planExpiry() && !/^\/(plans|account)/.test(state.url)) {
    return router.createUrlTree(['/plans']);
  }

  // Sin chatbots configurados: no puede entrar a dashboard ni soporte -> a configurar.
  if (session.companies().length === 0 && /^\/(dashboard|support)/.test(state.url)) {
    return router.createUrlTree(['/configure']);
  }

  return true;
};
