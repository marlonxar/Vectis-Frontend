/**
 * Configuración de Paddle (Billing).
 *
 * 1) PADDLE_ENV: 'sandbox' para pruebas, 'production' cuando salgas a producción.
 * 2) PADDLE_CLIENT_TOKEN: token DE CLIENTE (no la API key secreta). Es público y seguro en el
 *    frontend. Paddle → Developer Tools → Authentication → "Client-side tokens".
 *    En sandbox empieza con `test_...`; en producción con `live_...`.
 * 3) PADDLE_PRICE_IDS: el ID del PRICE de cada plan (empieza con `pri_...`).
 *    Paddle → Catalog → Products → tu producto → el Price mensual → copia su ID.
 *
 * Mientras estén vacíos, la página de planes sigue funcionando con el flujo anterior
 * (sin cobro), así puedes desarrollar sin Paddle configurado.
 */
export type PaddleEnv = 'sandbox' | 'production';

export const PADDLE_ENV: PaddleEnv = 'sandbox';

export const PADDLE_CLIENT_TOKEN = ''; // ← pega tu client-side token (test_... / live_...)

// OJO: Paddle necesita el ID del PRICE (empieza con `pri_...`), NO el del PRODUCT (`pro_...`).
// Los valores de abajo son PRODUCT IDs; reemplázalos por el `pri_...` del price mensual de cada
// producto (Catalog → Products → tu producto → el Price mensual → copia su ID) o el checkout fallará.
export const PADDLE_PRICE_IDS: Record<'basic' | 'pro' | 'business', string> = {
  basic: 'pro_01kx7cfh1vnwjatfg4mw5ns27q',     // ⚠ PRODUCT id — cambiar por el pri_... de Basic
  pro: 'pro_01kx7chkwrhjzjc1b5e3bh2btp',       // ⚠ PRODUCT id — cambiar por el pri_... de Pro
  business: 'pro_01kx7ckav84fn7n47a6xt9fwam',  // ⚠ PRODUCT id — cambiar por el pri_... de Business
};
