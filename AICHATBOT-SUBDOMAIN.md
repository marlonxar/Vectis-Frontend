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

## Verificación tras el deploy
1. `https://www.aichatbot.wearevectis.com/` → muestra el login del chatbot en la raíz.
2. `https://wearevectis.com/ai-chatbot` → **301** al subdominio.
3. Crear cuenta / login con Google / reset de contraseña → vuelven al subdominio.
4. En el subdominio, `ver código fuente`/inspector → `<link rel="canonical">` apunta a
   `https://www.aichatbot.wearevectis.com/` y hay un JSON-LD `SoftwareApplication`.
