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

## 2. Acceder al widget (página completa por ruta)

Dentro del sitio Vectis, el asistente es una **página completa** accesible SOLO por estas rutas
(`{id}` = `public_key` del flujo). El JS del widget se carga lazy: solo en estas rutas.

```
https://wearevectis.com/discovery-assistant/da_vectis
https://wearevectis.com/asistente-de-descubrimiento/da_vectis
```

El layout: header con el **logo** (de la base de datos), fondo gradiente azul/dorado/blanco
difuminado (o la imagen/video del flujo si existe), preguntas que aparecen con transición y se
apilan, y footer “Producto desarrollado por Vectis”.

### Embeber en otra web (modo flotante o inline)

El widget también funciona como script embebible; el cliente solo pasa el `key`:

```html
<script src="https://wearevectis.com/assets/discovery/widget.js"></script>
<script>
  DiscoveryAssistant.init({ key: "da_vectis" });           // botón flotante
  // DiscoveryAssistant.init({ key: "da_vectis", target: "#box" });          // inline
  // DiscoveryAssistant.init({ key: "da_vectis", target: "#box", page: true }); // página completa
</script>
```

**Opciones de `init`:** `key` (req.) · `target` (selector) · `page` (full-page dentro del target) ·
`accentColor` · `position` (`bottom-right`/`bottom-left`) · opcional `supabaseUrl`/`supabaseAnonKey`.

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
