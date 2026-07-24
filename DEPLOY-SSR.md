# Despliegue del sitio pre-renderizado (SSG)

Desde la v1.11.0 el sitio de marketing se **pre-renderiza**: en cada `ng build` se
genera un HTML estático por ruta, ya traducido. Eso es lo que ven Google y las IA
sin ejecutar JavaScript.

## Qué cambió

- El comando de build es el mismo: `npm run build` (o `ng build`).
- La carpeta a desplegar es la misma de siempre: **`dist/vectis-frontend/browser/`**.
- Ahora esa carpeta trae una subcarpeta con `index.html` por cada ruta:

  ```
  browser/
    index.html            → /            (home en español)
    en/index.html         → /en          (home en inglés)
    privacy/index.html    → /privacy
    privacidad/index.html → /privacidad
    terms/  terminos/  refunds/  refounds/  reembolsos/  404/
    index.csr.html        → fallback para rutas dinámicas (discovery-assistant/:id)
    assets/ …             → igual que antes
  ```

## Lo único que hay que revisar en el hosting

El host debe servir **primero el archivo estático** de cada ruta y, solo si no
existe, caer al fallback de la SPA. La mayoría ya lo hace (Netlify, Vercel,
Cloudflare Pages, o nginx con `try_files`).

- Regla correcta (ejemplo tipo `try_files`):
  `try_files $uri $uri/index.html /index.csr.html;`
- **Ojo con el error típico:** si el host está configurado para reescribir *todo*
  a `/index.html` (modo SPA a lo bruto), entonces `/privacy` mostraría el home en
  vez de su página. Con SSG queremos que `/privacy` sirva `privacy/index.html`.
  El fallback a la SPA (`index.csr.html`) es solo para las rutas con `:id`.

## Subdominio del ChatBot

`aichatbot.wearevectis.com` **no se pre-renderiza** (es la aplicación, detrás de
login) y sigue funcionando igual que hoy: se sirve como SPA. El prerender aplica
solo al sitio de marketing `wearevectis.com`.

## Notas técnicas (para el próximo que toque esto)

- Config: `angular.json` → `outputMode: "static"`, `server: "src/main.server.ts"`.
- Modo de render por ruta: `src/app/app.routes.server.ts` (todo `Prerender`, salvo
  las rutas `:id` que quedan en `Client`).
- El idioma en el HTML se decide con `PlatformLocation` (no con `location`), para
  que `/en` salga en inglés durante el prerender (ver `src/app/app.config.ts`).
- Las animaciones usan `provideAnimationsAsync()` (la versión *eager* rompía el
  prerender con NG0401).
- `main.server.ts` reenvía el `BootstrapContext` — sin él, el prerender falla con
  "Missing Platform" (NG0401).
