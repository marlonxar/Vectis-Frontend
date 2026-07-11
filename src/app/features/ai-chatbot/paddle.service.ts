import { Injectable, signal } from '@angular/core';
import { initializePaddle, type Paddle, type CheckoutEventsData } from '@paddle/paddle-js';
import { PADDLE_ENV, PADDLE_CLIENT_TOKEN, PADDLE_PRICE_IDS } from './paddle.config';
import { PlanId } from './session.service';

type PaddleEvent = { name?: string; data?: CheckoutEventsData };

/**
 * Envuelve Paddle.js: inicialización, precios localizados (PricePreview) y checkout.
 * Si no hay token/price configurados, `configured()` devuelve false y la app usa el flujo previo.
 */
@Injectable({ providedIn: 'root' })
export class PaddleService {
  private paddle: Paddle | undefined;
  private initPromise: Promise<Paddle | undefined> | null = null;
  private onEvent: ((e: PaddleEvent) => void) | null = null;
  readonly ready = signal(false);

  /** ¿Hay token y al menos un price configurado? */
  configured(): boolean { return !!PADDLE_CLIENT_TOKEN && Object.values(PADDLE_PRICE_IDS).some(Boolean); }

  priceId(plan: PlanId): string { return PADDLE_PRICE_IDS[plan] || ''; }

  /** Plan al que pertenece un price (para mapear el resultado del checkout/preview). */
  planForPrice(priceId: string): PlanId | null {
    const entry = (Object.entries(PADDLE_PRICE_IDS) as [PlanId, string][]).find(([, id]) => id === priceId);
    return entry ? entry[0] : null;
  }

  setEventHandler(fn: ((e: PaddleEvent) => void) | null): void { this.onEvent = fn; }

  async init(): Promise<Paddle | undefined> {
    if (this.paddle) return this.paddle;
    if (!PADDLE_CLIENT_TOKEN) return undefined;
    if (!this.initPromise) {
      this.initPromise = initializePaddle({
        environment: PADDLE_ENV,
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (e) => this.onEvent?.(e as PaddleEvent),
      }).then((p) => { this.paddle = p; this.ready.set(!!p); return p; });
    }
    return this.initPromise;
  }

  /** Precios localizados y formateados por Paddle (según el país del visitante). */
  async previewPrices(): Promise<Partial<Record<PlanId, string>>> {
    const p = await this.init();
    const items = (Object.keys(PADDLE_PRICE_IDS) as PlanId[])
      .filter((k) => PADDLE_PRICE_IDS[k])
      .map((k) => ({ priceId: PADDLE_PRICE_IDS[k], quantity: 1 }));
    if (!p || !items.length) return {};
    const res = await p.PricePreview({ items });
    const out: Partial<Record<PlanId, string>> = {};
    for (const li of res.data.details.lineItems) {
      const plan = this.planForPrice(li.price.id);
      if (plan) out[plan] = li.formattedTotals.total;   // p. ej. "US$19.00" ya localizado
    }
    return out;
  }

  /** Abre el checkout (overlay) para un plan, prellenando el email del usuario. */
  async openCheckout(plan: PlanId, email?: string): Promise<void> {
    const p = await this.init();
    const priceId = PADDLE_PRICE_IDS[plan];
    if (!p || !priceId) return;
    p.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(email ? { customer: { email } } : {}),
      settings: { displayMode: 'overlay', theme: 'dark', allowLogout: false },
    });
  }
}
