# Paddle webhook — Edge Function

Confirma los pagos de Paddle del lado servidor y fija el plan del usuario en `public.profiles`
(fuente de verdad para renovaciones, cancelaciones y vencimiento real).

## 1. Base de datos
Ejecuta `supabase/paddle-columns.sql` en Supabase (añade `paddle_customer_id` y
`paddle_subscription_id` a `profiles`).

## 2. Desplegar la función
Con la CLI de Supabase, desde la raíz del repo:

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase functions deploy paddle-webhook --no-verify-jwt
```

`--no-verify-jwt` es necesario: Paddle no envía un JWT de Supabase; la seguridad es la
verificación de la firma del webhook.

## 3. Secrets (NO van en el repo)
```bash
supabase secrets set PADDLE_WEBHOOK_SECRET=pdl_ntfset_...   # el "signing secret" del destino de notificaciones
```
`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente.

> Nota: la API key secreta de Paddle (`pdl_sdbx_apikey_...`) **no** se usa aquí. El webhook se
> valida con el *signing secret*, no con la API key. La API key solo haría falta si luego llamamos
> a la API de Paddle (p. ej. cancelar una suscripción desde el panel); ese día se agrega como otro secret.

## 4. Registrar el webhook en Paddle
Paddle (sandbox) → **Developer Tools → Notifications → New destination**:
- **URL:** `https://<PROJECT_REF>.functions.supabase.co/paddle-webhook`
- **Events:** `transaction.completed` (fulfillment) + `subscription.created`, `subscription.activated`,
  `subscription.updated`, `subscription.canceled` (ciclo de vida).
- Copia el **signing secret** (la "secret key" del destino, NO el `ntfset_` que es el ID) y ponlo en
  `PADDLE_WEBHOOK_SECRET` (paso 3).

El handler verifica la firma antes de procesar y responde 2xx en <5s. Guarda en `profiles`:
`plan`, `plan_expiry`, `subscription_status`, `cancel_at_period_end`, `paddle_subscription_id`,
`paddle_customer_id`, `paddle_price_id`, `paddle_product_id`. En `subscription.updated` detecta
upgrade/downgrade comparando el rango del plan.

## 6. Customer Portal (`paddle-portal`)
Página de Paddle donde el cliente gestiona pago, facturas y cancela. La Edge Function
`supabase/functions/paddle-portal` genera una sesión autenticada (`POST /customers/{id}/portal-sessions`)
y devuelve la URL; el botón **"Gestionar suscripción"** de la cuenta redirige ahí.

```bash
supabase functions deploy paddle-portal            # CON verificación de JWT (identifica al usuario)
supabase secrets set PADDLE_API_KEY=pdl_sdbx_apikey_...   # API key secreta (server-only)
```
> Esta función SÍ usa la API key de Paddle, pero vive como **secret** (nunca en el frontend ni en git),
> y solo genera el portal del propio `customer_id` del usuario autenticado.

## 5. Probar
1. Haz una compra de prueba en `…/plans` (tarjeta `4242 4242 4242 4242`, CVV `100`).
2. En Paddle → Notifications → tu destino, revisa que el evento salió **200**.
3. En Supabase, confirma que `profiles` del usuario tiene `plan`, `plan_expiry`,
   `paddle_subscription_id`.

## Cómo identifica al usuario
El checkout envía `custom_data.user_id` (el id de Supabase). El webhook lee ese `user_id` de la
suscripción y actualiza ese perfil. El plan se toma de `custom_data.plan` o del `price_id`.

## Después de validar
Cuando el webhook funcione, en `plans.component.ts` puedes quitar el `grantPlan(...)` que corre en
`checkout.completed` (el puente del cliente), para que el plan lo fije SOLO el servidor. Mientras
tanto, ambos coexisten sin problema (el webhook es idempotente).
