# Discovery Assistant

Widget embebible (Shadow DOM, sin framework) que guía a un visitante por un flujo de
preguntas y guarda la respuesta en NUESTRA base de datos (Supabase).

- **Aislado:** todo vive en un Shadow DOM → ni el CSS del sitio rompe el widget ni viceversa.
- **Embebible en cualquier web** (HTML, WordPress, Shopify, React, Vue, Angular…).
- **El cliente solo pasa el `key` del flujo.** La URL y la anon key de Supabase van bakeadas
  en `src/config.ts` (son nuestras; recogemos todas las respuestas).
- **UI conversacional:** logo → “Discovery Assistant” → bienvenida → “Comenzar”. Al comenzar,
  las preguntas van **apareciendo una a una, flotando**, y las anteriores **se quedan en pantalla** (se apilan).
- **Persistencia:** guarda el avance en `localStorage` (fallback `sessionStorage`) y ofrece “continuar donde quedaste”.
- ~24 KB minificado, un solo archivo.

> Esta fase **solo guarda** en Supabase. El email de notificación es la siguiente fase.

---

## 1. Configurar Supabase (una sola vez)

1. En tu proyecto Supabase: **SQL Editor → New query**, pega `supabase/schema.sql` → **Run**.
   Crea las tablas (`flows`, `flow_questions`, `submissions`, `flow_views`) y las **políticas RLS**.
2. (Para probar) pega y ejecuta `supabase/sample-flow.sql` → flujo `ACTIVE` con `public_key = da_vectis`.
3. **Project Settings → API**: copia **Project URL** y **anon public key**.
4. Pégalas en **`src/config.ts`** y reconstruye con `npm run build`.

```ts
// src/config.ts
export const SUPABASE_URL = 'https://TUPROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'TU_ANON_KEY_PUBLICA';
```

---

## 2. Insertar el widget en una página

El cliente solo necesita el `key` del flujo (la URL/anon key ya van dentro del widget):

```html
<script src="https://wearevectis.com/assets/discovery/widget.js"></script>
<script>
  DiscoveryAssistant.init({ key: "da_vectis" });
</script>
```

Solo se carga cuando la página incluye ese `<script>`; no forma parte del bundle de Vectis.

**Opciones de `init`:** `key` (req.) · `target` (selector → montaje inline) ·
`accentColor` · `position` (`bottom-right`/`bottom-left`) · y opcionalmente `supabaseUrl`/`supabaseAnonKey` si quieres sobreescribir la config.

---

## 3. Crear tu propio flujo

Inserta una fila en `flows` y sus preguntas en `flow_questions` (usa `sample-flow.sql` de plantilla).

- `flows.status`: `ACTIVE` (visible), `INACTIVE` (“no disponible”), `DRAFT` (oculto).
- `flow_questions.type`: `TEXT`, `TEXTAREA`, `EMAIL`, `PHONE`, `RADIO`, `CHECKBOX`, `SELECT`.
- `options` (jsonb) para `RADIO/CHECKBOX/SELECT`, ej: `["E-commerce","Landing"]`.
- `key` = nombre con que se guarda en `answers_json` (ej. `businessName`).
- `audio_url` (opcional) muestra un botón de audio por pregunta.
- `logo_url` / `background_url` (imagen o video) personalizan el encabezado y el fondo.

Las respuestas llegan a la tabla **`submissions`** (`answers_json`).

---

## 4. Reconstruir el widget

```bash
cd discovery-widget
npm install     # solo la primera vez
npm run build   # genera dist/widget.js y lo copia a ../src/assets/discovery/widget.js
```

Servido en `https://wearevectis.com/assets/discovery/widget.js` tras el deploy.

---

## Pendiente (siguientes fases)
- Email de notificación (Edge Function + Resend).
- Rate limiting / anti-spam.
- Panel para administrar flujos.
