# AI ChatBot en subdominio — `www.aichatbot.wearevectis.com`

El producto **Vectis AI ChatBot** vive en su propio subdominio, servido por el **mismo
deploy de Vercel** que el sitio principal. El sitio de marketing sigue en
`https://wearevectis.com`.

- Sitio principal → `https://wearevectis.com` (home, portafolio, nosotros, contacto, legales…).
- AI ChatBot → `https://www.aichatbot.wearevectis.com` (login, planes, panel, soporte…).

---

## Cómo funciona (código)

Es una sola app Angular (CSR) que **elige el enrutado según el host** en tiempo de arranque:

- `src/app/app.config.ts` → `provideRouter(isChatbotHost() ? chatbotRoutes : routes)`.
- `src/app/app.routes.ts`:
  - `routes` → sitio de marketing (sin el chatbot).
  - `chatbotRoutes` → el chatbot montado en la **raíz** del subdominio: `''` (landing/login),
    `plans`, `configure`, `dashboard`, `handoff`, `support`, `manage`, `account`, `reset`,
    + páginas legales. Un `**` cae a la landing.
- `isChatbotHost()` = el hostname empieza por `aichatbot.` (cubre `aichatbot.` y `www.aichatbot.`).
- Los enlaces internos del chatbot y los redirects de Supabase Auth apuntan a rutas **raíz**
  (`/plans`, `/dashboard`, …), no a `/ai-chatbot/...`.
- En el subdominio, el sitio deja que el chatbot maneje su propio `title`, `description`,
  `canonical` y JSON-LD (SEO/GEO/AIO).

### Redirects del dominio viejo

`vercel.json` hace **301** desde el dominio principal al subdominio (solo cuando el host es
`wearevectis.com` / `www.wearevectis.com`, para no crear loops):

```
/ai-chatbot        → https://www.aichatbot.wearevectis.com/
/ai-chatbot/:path* → https://www.aichatbot.wearevectis.com/:path*
/chatbot           → https://www.aichatbot.wearevectis.com/
/chatbot/:path*    → https://www.aichatbot.wearevectis.com/:path*
```

Así, cualquier enlace viejo (o de Google) a `wearevectis.com/ai-chatbot/...` cae en el
subdominio con la ruta limpia.

---

## Pasos de infraestructura (una sola vez)

> El código ya está listo. Esto es configuración fuera del repo.

### 1) Vercel — agregar el dominio al MISMO proyecto
1. Vercel → tu proyecto → **Settings → Domains → Add**.
2. Agrega `www.aichatbot.wearevectis.com` **y** `aichatbot.wearevectis.com`.
3. Marca `www.aichatbot.wearevectis.com` como principal y deja que el apex
   (`aichatbot.wearevectis.com`) **redirija** a `www` (Vercel lo ofrece al agregarlo).

### 2) DNS — apuntar el subdominio a Vercel
En tu proveedor de DNS (donde administras `wearevectis.com`), crea:

```
CNAME   www.aichatbot   cname.vercel-dns.com.
CNAME   aichatbot       cname.vercel-dns.com.
```

(Usa exactamente el valor que te muestre Vercel en la pantalla de Domains; puede pedir un
registro A/ALIAS para el apex del subdominio en algunos proveedores.)

Espera a que Vercel muestre el dominio como **Valid Configuration** (SSL automático).

### 3) Supabase — permitir el nuevo host en Auth
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://www.aichatbot.wearevectis.com`
- **Redirect URLs** (agregar):
  - `https://www.aichatbot.wearevectis.com/`
  - `https://www.aichatbot.wearevectis.com/reset`

> Sin esto, los correos de confirmación, el reset de contraseña y el login con Google fallarán
> (redirigen a un host no permitido).

### 4) Google OAuth (si aplica)
En Google Cloud → **APIs & Services → Credentials → OAuth client**:
- **Authorized JavaScript origins**: agrega `https://www.aichatbot.wearevectis.com`
- **Authorized redirect URIs**: mantén el callback de Supabase
  (`https://<tu-proyecto>.supabase.co/auth/v1/callback`) — ese no cambia.

Todos los redirects de auth de la app apuntan a `https://www.aichatbot.wearevectis.com/`
(y `/reset` para recuperar contraseña).

### 5) Google Search Console (opcional, recomendado)
- Agrega y verifica la propiedad `https://www.aichatbot.wearevectis.com`.
- Envía el sitemap principal `https://wearevectis.com/sitemap.xml` (ya incluye la URL del
  chatbot en el subdominio).

---

## Caducidad de sesión

Por defecto Supabase renueva el token indefinidamente (la sesión no vence nunca). Añadimos una
caducidad **del lado cliente** en `src/app/features/ai-chatbot/auth.service.ts` con dos reglas:

```ts
const SESSION_IDLE_HOURS = 48;     // ← inactividad: cierra tras 48 h sin usar la app
const SESSION_ABSOLUTE_DAYS = 7;   // ← tope absoluto: cierra a los 7 días del login, siempre
```

- **Inactividad (48 h):** cada interacción del usuario (`click`, `keydown`, `scroll`, volver a la
  pestaña) renueva la marca `da_session_last`. Si pasan 48 h sin actividad, se cierra la sesión.
- **Tope absoluto (7 días):** desde el login (`da_session_started`), aunque el usuario siga activo.
- Se verifica al arrancar, en cada cambio de auth y **cada minuto**. Al vencer, cierra sesión y va
  a `/?expired=1` (muestra "Tu sesión expiró por seguridad").

Para cambiar los tiempos, edita las dos constantes de arriba. Para volver a **solo absoluta**,
pon `SESSION_IDLE_HOURS` muy alto (o quita la regla de inactividad).

**Recomendado a futuro (servidor):** en Supabase Pro, Auth → Sessions permite "time-box user
sessions" (absoluta) e "inactivity timeout" del lado servidor, que es más robusto que el cliente.

---

## Pasarela de pagos (Paddle Billing) — detalle técnico

Paddle es un **Merchant of Record**: cobra, factura y paga impuestos por nosotros. No tocamos datos
de tarjeta (PCI queda del lado de Paddle). Nuestra integración tiene tres partes: **Paddle.js**
(frontend), **webhook** (servidor, fuente de verdad) y **customer portal** (autoservicio).

### Piezas y archivos
| Pieza | Dónde | Rol |
|---|---|---|
| `paddle.config.ts` | frontend | `PADDLE_ENV`, client-side token (público) y `price_id` por plan |
| `paddle.service.ts` | frontend | init de Paddle.js, `PricePreview`, `Checkout.open`, `customerPortalUrl` |
| `plans.component.ts` | frontend | pinta precios localizados y dispara el checkout |
| `paddle-webhook` | Supabase Edge Function | **fuente de verdad**: verifica firma y fija el plan en `profiles` |
| `paddle-portal` | Supabase Edge Function | genera la sesión del portal de Paddle (usa la API key secreta) |

### Identidades y secretos (importante)
- **Client-side token** (`live_...` / `test_...`): PÚBLICO, va en `paddle.config.ts`. Solo permite abrir
  checkout y previews. Es lo único de Paddle que vive en el frontend.
- **API key** (`pdl_apikey_...` / `pdl_sdbx_apikey_...`): SECRETA, server-only. Solo en el secret
  `PADDLE_API_KEY` de la función `paddle-portal`. Nunca en el repo ni en el frontend.
- **Webhook signing secret** (`pdl_ntfset_...`): SECRETO, en `PADDLE_WEBHOOK_SECRET`. Es la "secret key"
  del destino de notificaciones (NO el `ntfset_...` que es el ID del destino).
- Sandbox y producción son entornos **separados** (catálogo, IDs, tokens y secrets distintos).

### 1) Precios (PricePreview)
`plans.component` llama `paddle.previewPrices()` → `Paddle.PricePreview({ items:[{priceId,quantity}] })`.
Paddle detecta el país del visitante y devuelve el total **ya formateado y localizado**
(`formattedTotals.total`, ej. `US$49.00`). No hacemos conversión de moneda. Si Paddle no está
configurado o falla, se muestran los precios fijos del componente.

### 2) Checkout (Checkout.open)
Al elegir un plan:
```ts
Paddle.Checkout.open({
  items: [{ priceId, quantity: 1 }],
  customer: { email },                       // prellena el correo (salta la pantalla de contacto)
  customData: { user_id, plan },             // ← clave: viaja a la transacción y a la suscripción
  settings: { displayMode: 'overlay', theme: 'dark' },
});
```
El `customData.user_id` (id de Supabase) es lo que después usa el webhook para saber **a qué usuario**
pertenece el pago. `plan` es un respaldo por si el mapa de precios no matchea.

### 3) Provisión del plan (webhook = fuente de verdad)
El plan **NO** se activa desde el cliente. Tras `checkout.completed`, `plans.component` solo muestra un
overlay "Confirmando pago…" y hace *polling* a `profiles` (`auth.reload()` hasta ~18 s) hasta que el
webhook haya fijado el plan; luego navega a `/configure` (o `/manage`).

La función **`paddle-webhook`** (deploy con `--no-verify-jwt`):
1. Lee el body **crudo** y verifica `Paddle-Signature`: `HMAC-SHA256(`​`${ts}:${rawBody}`​`)` con el
   signing secret, comparación en tiempo constante. Si no valida → **401** (no procesa nada).
2. Procesa `transaction.completed` (fulfillment) y `subscription.created|activated|updated|canceled`.
3. Identifica al usuario por `data.custom_data.user_id`; obtiene el plan de `custom_data.plan` o del
   `price_id` (mapa `PRICE_TO_PLAN`).
4. Con el **service-role** actualiza `profiles`: `plan`, `plan_expiry` (`current_billing_period.ends_at`),
   `subscription_status`, `cancel_at_period_end`, `paddle_subscription_id/customer_id/price_id/product_id`.
5. En `subscription.updated` compara el rango del plan (basic<pro<business) para detectar
   **upgrade/downgrade**. Responde **2xx en <5 s** (Paddle reintenta si no).

> Nota de seguridad: como el plan lo fija el servidor (validado por firma), el usuario no puede
> "auto-asignarse" un plan desde el navegador.

### 4) Gestión de suscripción (customer portal)
En la cuenta, "Gestionar suscripción" invoca la función **`paddle-portal`** (deploy con verificación de
JWT). La función:
1. Identifica al usuario por su JWT de Supabase (`auth.getUser`).
2. Lee **su** `paddle_customer_id` del perfil.
3. Llama `POST {api}/customers/{customer_id}/portal-sessions` con `PADDLE_API_KEY` (el `{api}` es
   `sandbox-api.paddle.com` o `api.paddle.com`, detectado por el prefijo de la key).
4. Devuelve `data.urls.general.overview` y el frontend redirige. Ahí el cliente actualiza pago, ve
   facturas y cancela — todo hosteado por Paddle.

### 5) Downgrade y límites
Los límites por plan (chatbots activos, dominios) se recalculan al cargar la sesión:
- `enforceActiveLimit()` desactiva chatbots que excedan el máximo del plan.
- `enforceOriginLimit()`: si el plan permite menos dominios que los guardados (p. ej. Business→Pro),
  recorta cada chatbot al **primer dominio**, lo persiste en `allowed_origins` y muestra un aviso
  (`originsTrimmed`) en el header.

### Mapa de precios (mantener sincronizado)
El `price_id → plan` vive en **dos** lugares y deben coincidir con el entorno activo:
- Frontend: `PADDLE_PRICE_IDS` en `paddle.config.ts`.
- Webhook: `PRICE_TO_PLAN` en `paddle-webhook`.

### Datos que guardamos en `profiles`
`plan`, `plan_expiry`, `subscription_status`, `cancel_at_period_end`, `paddle_customer_id`,
`paddle_subscription_id`, `paddle_price_id`, `paddle_product_id`.

### Prueba (sandbox)
`/plans` → elegir plan → tarjeta `4242 4242 4242 4242`, fecha futura, **CVV 100**. Verifica: evento
**200** en Notifications, transacción en **Transactions**, y `profiles` actualizado.

---

## Verificación tras el deploy
1. `https://www.aichatbot.wearevectis.com/` → muestra el login del chatbot en la raíz.
2. `https://wearevectis.com/ai-chatbot` → **301** al subdominio.
3. Crear cuenta / login con Google / reset de contraseña → vuelven al subdominio.
4. En el subdominio, `ver código fuente`/inspector → `<link rel="canonical">` apunta a
   `https://www.aichatbot.wearevectis.com/` y hay un JSON-LD `SoftwareApplication`.
