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

export const PADDLE_CLIENT_TOKEN = 'test_ff2e38c401a5dceedba51bd0bd4'; // client-side token (público, seguro en frontend)

// IDs de PRICE (pri_...) del price mensual de cada producto (sandbox).
export const PADDLE_PRICE_IDS: Record<'basic' | 'pro' | 'business', string> = {
  basic: 'pri_01kx7csgs4hsgd4v314pz6ef52',
  pro: 'pri_01kx7crwa0zzk9g5qkzp96487e',
  business: 'pri_01kx7cpj7676k5qbb2gqb37w8g',
};
