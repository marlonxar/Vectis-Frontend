# Vectis Automation Group — Landing Page

Production-ready **Angular 17** landing page for Vectis Automation Group
(software development, automation & AI · San José, Costa Rica).

Built with standalone components, signals, `@ngx-translate` (ES default / EN),
an interactive mouse-reactive mesh hero background, and full SEO / WCAG 2.1 AA /
responsive support.

## Requirements
- Node.js 18.13+ (or 20+)
- npm 9+

## Run locally
```bash
npm install
npm start
# open http://localhost:4200
```

## Production build
```bash
npm run build
# output in dist/vectis-landing
```

## Replace the placeholder logo
A placeholder lives at `src/assets/images/logo.svg`. Drop in your real logo
(keep the same filename, or update the references in `index.html`,
`navbar.component.html`, `footer.component.html`, `hero.component.html`,
`about.component.html`). PNG works too — just update the `src` paths.

## Key features
- **i18n**: `src/assets/i18n/es.json` (default) and `en.json`. Toggle in the navbar; preference saved to `localStorage`.
- **Sections**: Hero (`#inicio`), Servicios (`#servicios`), Stats, Portafolio + clientes + testimonios (`#portafolio`), Nosotros (`#nosotros`), Contacto (`#contacto`).
- **Interactive hero background**: `core/services/mesh-background.service.ts` — deformable grid mesh, mouse repulsion, ambient wave. Auto-disables pointer tracking on touch devices and respects `prefers-reduced-motion`.
- **Contact form**: toggle between "Enviar mensaje" and a 4-step "Agendar cita" wizard with a custom calendar (no external lib).
- **Navbar**: glass on scroll, active-section highlight via IntersectionObserver, animated mobile menu.
- **Back-to-top** button appears after 400px scroll.
- **Page loader**: futuristic scan-line + progress bar in `index.html` (runs before Angular bootstraps).
- **SEO/AIO/GEO**: meta tags, Open Graph, Twitter cards, JSON-LD (`ProfessionalService` + `SoftwareApplication`), geo meta.










## Idiomas y rutas
- **Español por defecto.** Al visitar la ruta **`/en`** la página carga en **inglés** automáticamente. También se acepta `?lang=en` y se recuerda la última preferencia (localStorage).
- Prioridad de idioma: `/en` > `?lang=` > preferencia guardada > español.
- **Página 404:** cualquier ruta desconocida muestra una página *Not Found* con estilo de la marca, bilingüe, responsive, accesible (WCAG) y con `<meta robots="noindex">`.
- **Hosting (importante):** es una SPA; configura el servidor para reescribir todas las rutas a `index.html` (fallback SPA) para que `/en` y el 404 de Angular funcionen. En Netlify/Vercel: redirección `/* -> /index.html (200)`.

## Proyecto
- Nombre del paquete: **vectis-frontend** · Autor: **Marlon Alvarez**.
- Salida de build: `dist/vectis-frontend`.
- Puedes renombrar la carpeta del proyecto a **Vectis Frontend** desde tu computadora si lo deseas (el nombre interno ya es `vectis-frontend`).

## Seguridad / dependencias
- Proyecto en **Angular 20** (última línea estable) con `@ngx-translate` 16.
- Los avisos de `npm audit` restantes son: (a) **devDependencies** de build (Angular CLI, esbuild, vite, sigstore, tar…) que **no se incluyen** en el bundle de producción, y (b) avisos XSS de framework (innerHTML / i18n-attr / SVG-attr) que **este sitio estático no utiliza** (no hay binding de HTML/SVG no confiable). No afectan la web publicada.
- SEO/AIO/GEO: `robots.txt`, `sitemap.xml` con hreflang, JSON-LD (ProfessionalService, SoftwareApplication, FAQPage), Open Graph + Twitter, meta geo. WCAG: skip-link, foco visible, `aria-*`, `prefers-reduced-motion`.

## Diseño (v3)
- **Paleta monocromática** blanco/negro (como huecohouse.com) con el dorado reservado para la textura y acentos. Secciones que alternan negro/blanco/crema.
- **Tipografía**: una sola familia geométrica, `Outfit` (alternativa libre a Circular Std de huecohouse).
- **Textura del hero**: campo de filamentos dorados originales en canvas (curl-noise) sobre negro; reacciona al mouse con un vórtice/atracción. Archivo: `core/services/mesh-background.service.ts`. Sin imágenes externas.
- **Logo**: `assets/images/logo.svg` (recreado). Reemplázalo manteniendo el nombre para usar el PNG real.
- **Capacidades** (servicios): estilo "Our Capabilities" de rootstrap — tarjetas con icono, descripción y stack tecnológico.
- **Trusted by**: marquee de logos de clientes con movimiento continuo (pausa al hover).
- **Testimonios**: estilo rootstrap con foto, nombre y rol + empresa.
- **Contacto**: replica huecohouse.com/Contact (sección oscura a dos columnas, campos FULL NAME / EMAIL / COMPANY / SERVICE / BUDGET / SUBJECT / MESSAGE + consentimiento). Conserva el switch mensaje/cita y el wizard de 4 pasos.
- **Footer**: simple y oscuro como huecohouse.
- **Loader**: minimalista (wordmark Vectis + barra dorada).

## Notes
- Phone number `+506 8888-0000` is a placeholder.
- Client logos / testimonials / portfolio images are dummy data — replace in the components and `i18n` files.
- The production config disables build-time Google Fonts inlining so the build does not require network access; fonts load via `<link>` in `index.html`.
