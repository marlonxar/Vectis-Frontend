# Discovery Assistant Widget

Widget embebible (Shadow DOM, sin framework) que guía a un visitante por un flujo de
preguntas, guarda el progreso, y al terminar registra la respuesta en Supabase.

- **Aislado:** todo vive en un Shadow DOM → ni el CSS del sitio rompe el widget ni viceversa.
- **Embebible en cualquier web** (HTML estático, WordPress, Shopify, React, Vue, Angular…).
- **Sin backend propio:** habla directo con Supabase vía su API REST con la *anon key* pública.
- **Persistencia:** guarda el avance en `localStorage` (fallback `sessionStorage`) y ofrece “continuar donde quedaste”.
- Tamaño: ~24 KB minificado, un solo archivo.

> Esta fase: **solo guarda** la respuesta en Supabase. El email de notificación se agrega después
> (Edge Function + Resend) sin tocar el widget.

---

## 1. Configurar Supabase (una sola vez)

1. Entra a tu proyecto en **app.supabase.com**.
2. **SQL Editor → New query**, pega el contenido de `supabase/schema.sql` y dale **Run**.
   - Crea las tablas `flows`, `flow_questions`, `submissions`, `flow_views` y las **políticas RLS**.
   - La *anon key* es pública, así que la seguridad la dan las políticas: un visitante anónimo
     solo puede **leer flujos publicados** e **insertar** submissions/vistas; **nunca** puede leer submissions.
3. (Opcional, para probar ya) pega y ejecuta `supabase/sample-flow.sql` → crea un flujo
   `ACTIVE` con `public_key = da_demo_vectis` y 7 preguntas de ejemplo.
4. Copia tus credenciales públicas en **Project Settings → API**:
   - **Project URL** → `https://TUPROYECTO.supabase.co`
   - **anon public key** → la clave larga (es pública, puede ir en el HTML).

---

## 2. Insertar el widget en una página

```html
<script src="https://wearevectis.com/assets/discovery/widget.js"></script>
<script>
  DiscoveryAssistant.init({
    key: "da_demo_vectis",                       // public_key del flujo
    supabaseUrl: "https://TUPROYECTO.supabase.co",
    supabaseAnonKey: "TU_ANON_KEY_PUBLICA",
    launcherText: "Cuéntanos tu proyecto"        // texto del botón flotante (opcional)
  });
</script>
```

Solo se carga cuando la página incluye ese `<script>`. No forma parte del bundle del sitio
Vectis, así que no afecta el rendimiento de wearevectis.com.

**Opciones de `init`:**

| Campo | Req. | Descripción |
|---|---|---|
| `key` | sí | `public_key` del flujo en Supabase |
| `supabaseUrl` | sí | URL del proyecto |
| `supabaseAnonKey` | sí | anon key pública |
| `target` | no | selector CSS (ej. `"#discovery"`) → se monta **inline** ahí; si se omite, botón flotante |
| `launcherText` | no | texto del botón flotante |
| `position` | no | `"bottom-right"` (def.) o `"bottom-left"` |
| `accentColor` | no | color de acento; si se omite, usa el del flujo |

---

## 3. Crear tu propio flujo

Inserta una fila en `flows` y sus preguntas en `flow_questions` (ver `sample-flow.sql` como plantilla).

- `flows.status`: `ACTIVE` (visible), `INACTIVE` (muestra “no disponible”), `DRAFT` (oculto).
- `flow_questions.type`: `TEXT`, `TEXTAREA`, `EMAIL`, `PHONE`, `RADIO`, `CHECKBOX`, `SELECT`.
- `options` (jsonb) solo para `RADIO/CHECKBOX/SELECT`, ej: `["E-commerce","Landing"]`.
- `key` es el nombre con que se guarda la respuesta en `answers_json` (ej. `businessName`).
- `audio_url` (opcional) muestra un botón de audio en esa pregunta.
- `logo_url` / `background_url` del flujo personalizan el encabezado y el fondo (imagen o video).

Las respuestas llegan a la tabla **`submissions`** (`answers_json`). Las verás en
Supabase → Table editor → `submissions`.

---

## 4. Reconstruir el widget (si cambias el código)

```bash
cd discovery-widget
npm install      # solo la primera vez
npm run build    # genera dist/widget.js y lo copia a ../src/assets/discovery/widget.js
```

El archivo servido es `src/assets/discovery/widget.js` (queda en `https://wearevectis.com/assets/discovery/widget.js` tras el deploy).

---

## Pendiente (siguientes fases)
- Email de notificación al `notification_email` del flujo (Edge Function + Resend).
- Rate limiting / anti-spam.
- Empaquetar como Web Component / panel de administración de flujos.
