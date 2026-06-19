/**
 * Discovery Assistant Widget
 * Embeddable, framework-agnostic, Shadow-DOM isolated guided discovery flow.
 *   <script src="https://wearevectis.com/assets/discovery/widget.js"></script>
 *   <script>DiscoveryAssistant.init({ key: "da_vectis" });</script>
 * Supabase URL + anon key are baked in (src/config.ts); the host only passes `key`.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

const DA_TITLE = 'Discovery Assistant';

type QType = 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'RADIO' | 'CHECKBOX' | 'SELECT';

interface Flow {
  id: string; public_key: string; name: string; language: 'en' | 'es';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  logo_url: string | null; background_url: string | null; accent_color: string | null;
  intro_title: string | null; intro_subtitle: string | null; avatar_url: string | null;
}
interface Question {
  id: string; type: QType; key: string; label: string;
  help_text: string | null; placeholder: string | null; audio_url: string | null;
  options: string[]; required: boolean; order_index: number;
}
interface Config {
  key: string; supabaseUrl?: string; supabaseAnonKey?: string;
  target?: string; accentColor?: string; position?: 'bottom-right' | 'bottom-left'; page?: boolean;
}
interface Progress { flowKey: string; currentStep: number; answers: Record<string, string | string[]>; updatedAt: string; }

/* ----------------------------------------------------------------- i18n -- */
const STRINGS = {
  es: {
    welcomeTitle: 'Bienvenido al Discovery Assistant',
    welcome: 'La captación de información es importante para nosotros: nos permite ofrecer servicios mucho más apegados a lo que tu proyecto realmente necesita.',
    during: 'Por favor responde a la pregunta con claridad.',
    begin: 'Comenzar', next: 'Siguiente', back: 'Atrás', step: 'Paso', of: 'de', finish: 'Enviar', sending: 'Enviando…',
    required: 'Este campo es obligatorio.', invalidEmail: 'Ingresa un correo válido.',
    selectOne: 'Selecciona una opción.', optional: 'opcional', themeToggle: 'Cambiar tema',
    resumeTitle: '¿Continuar donde quedaste?', resumeBody: 'Guardamos tus respuestas anteriores.',
    continue: 'Continuar', startAgain: 'Empezar de nuevo',
    unavailable: 'Este asistente no está disponible para su organización. Por favor contacte a un administrador para habilitarlo.',
    errorLoad: 'No pudimos cargar el asistente. Intenta de nuevo.',
    errorSend: 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.',
    successTitle: '¡Gracias!', successBody: 'Recibimos tu información. Te contactaremos pronto.',
    close: 'Cerrar', listen: 'Escuchar la pregunta', retry: 'Reintentar', selectPlaceholder: 'Selecciona…',
  },
  en: {
    welcomeTitle: 'Welcome to the Discovery Assistant',
    welcome: 'Capturing your information matters to us: it lets us tailor our services much more closely to what your project really needs.',
    during: 'Please answer the question clearly.',
    begin: 'Start', next: 'Next', back: 'Back', step: 'Step', of: 'of', finish: 'Submit', sending: 'Sending…',
    required: 'This field is required.', invalidEmail: 'Enter a valid email.',
    selectOne: 'Select an option.', optional: 'optional', themeToggle: 'Toggle theme',
    resumeTitle: 'Continue where you left off?', resumeBody: 'We saved your previous answers.',
    continue: 'Continue', startAgain: 'Start again',
    unavailable: 'This assistant is not available for your organization. Please contact an administrator to enable it.',
    errorLoad: 'We could not load the assistant. Please try again.',
    errorSend: 'Could not send. Check your connection and try again.',
    successTitle: 'Thank you!', successBody: 'We received your info. We will contact you soon.',
    close: 'Close', listen: 'Play the question', retry: 'Retry', selectPlaceholder: 'Select…',
  },
};

/* --------------------------------------------------------------- styles -- */
const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.da-root{ --da-accent:#E7AB2E; --da-ink:#14161c; --da-ink-2:#5b6170; --da-surface:#fff; --da-line:#e7e7ea; --da-radius:18px;
  --da-font:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-family:var(--da-font); color:var(--da-ink); line-height:1.5; }
@media (prefers-color-scheme: dark){ .da-root{ --da-ink:#f3f3f5; --da-ink-2:#a7adba; --da-surface:#15161b; --da-line:#2a2c34; } }

.da-launcher{ position:fixed; z-index:2147483000; bottom:22px; display:inline-flex; align-items:center; gap:10px; padding:14px 20px; border:none;
  border-radius:999px; cursor:pointer; background:var(--da-accent); color:#1a1205; font-weight:700; font-size:15px; font-family:var(--da-font);
  box-shadow:0 10px 30px -8px rgba(0,0,0,.45); transition:transform .2s ease; }
.da-launcher:hover{ transform:translateY(-2px); } .da-launcher.right{ right:22px; } .da-launcher.left{ left:22px; } .da-launcher svg{ width:20px; height:20px; }

.da-overlay{ position:fixed; inset:0; z-index:2147483001; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(10,11,16,.55);
  backdrop-filter:blur(4px); opacity:0; transition:opacity .22s ease; }
.da-overlay.open{ opacity:1; }
.da-panel{ position:relative; width:100%; max-width:560px; max-height:min(92vh,780px); display:flex; flex-direction:column; overflow:hidden;
  background:var(--da-surface); border-radius:var(--da-radius); box-shadow:0 30px 80px -20px rgba(0,0,0,.6);
  transform:translateY(14px) scale(.985); transition:transform .24s cubic-bezier(.2,.7,.2,1); }
.da-overlay.open .da-panel{ transform:none; }
.da-inline .da-panel{ box-shadow:0 1px 0 var(--da-line); border:1px solid var(--da-line); max-height:none; }

.da-bg{ position:absolute; inset:0; z-index:0; overflow:hidden; }
.da-bg img, .da-bg video{ width:100%; height:100%; object-fit:cover; }
.da-bg::after{ content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(8,9,13,.66),rgba(8,9,13,.86)); }
.da-onbg{ --da-ink:#fff; --da-ink-2:rgba(255,255,255,.78); --da-surface:transparent; --da-line:rgba(255,255,255,.18); }

.da-head{ position:relative; z-index:1; display:flex; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid var(--da-line); }
.da-logo{ height:28px; width:auto; border-radius:6px; }
.da-title{ font-size:15px; font-weight:800; margin:0; letter-spacing:-.01em; }
.da-close{ margin-left:auto; width:40px; height:40px; border-radius:10px; border:none; background:transparent; color:var(--da-ink-2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
.da-close:hover{ color:var(--da-ink); } .da-close svg{ width:20px; height:20px; }

.da-legend{ position:relative; z-index:1; padding:14px 22px 0; font-size:14px; color:var(--da-ink-2); }
.da-progress{ position:relative; z-index:1; height:4px; background:var(--da-line); border-radius:4px; margin:16px 22px 0; overflow:hidden; }
.da-progress > i{ display:block; height:100%; background:var(--da-accent); width:0; transition:width .4s cubic-bezier(.2,.7,.2,1); }
.da-stepno{ position:relative; z-index:1; padding:8px 22px 0; margin:0; font-size:12px; letter-spacing:.06em; text-transform:uppercase; font-weight:700; color:var(--da-ink-2); }

.da-body{ position:relative; z-index:1; padding:14px 22px 8px; overflow-y:auto; flex:1; }
.da-qstage{ position:relative; }

/* one question at a time */
.da-qblock{ display:flex; gap:14px; align-items:flex-start; }
.da-qblock.da-enter-fwd{ animation:da-in-fwd .4s cubic-bezier(.2,.7,.2,1) both; }
.da-qblock.da-enter-back{ animation:da-in-back .4s cubic-bezier(.2,.7,.2,1) both; }
.da-qblock.da-leave-fwd{ animation:da-out-fwd .22s ease-in both; }
.da-qblock.da-leave-back{ animation:da-out-back .22s ease-in both; }
@keyframes da-in-fwd{ from{ opacity:0; transform:translateX(34px); } to{ opacity:1; transform:none; } }
@keyframes da-out-fwd{ from{ opacity:1; transform:none; } to{ opacity:0; transform:translateX(-34px); } }
@keyframes da-in-back{ from{ opacity:0; transform:translateX(-34px); } to{ opacity:1; transform:none; } }
@keyframes da-out-back{ from{ opacity:1; transform:none; } to{ opacity:0; transform:translateX(34px); } }

.da-audiobtn{ flex:0 0 auto; width:46px; height:46px; border-radius:50%; border:none; cursor:pointer; margin-top:2px;
  background:var(--da-accent); color:#1a1205; display:inline-flex; align-items:center; justify-content:center;
  box-shadow:0 8px 20px -8px color-mix(in srgb, var(--da-accent) 75%, transparent); transition:transform .15s ease, filter .15s ease; }
.da-audiobtn:hover{ transform:scale(1.07); } .da-audiobtn:active{ transform:scale(.94); } .da-audiobtn svg{ width:20px; height:20px; }
.da-audiobtn.playing{ animation:da-pulse 1.1s ease-in-out infinite; }
@keyframes da-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.1); } }
.da-qbody{ flex:1 1 auto; min-width:0; }

.da-q{ font-size:21px; font-weight:700; margin:0 0 6px; letter-spacing:-.01em; }
.da-help{ font-size:14px; color:var(--da-ink-2); margin:0 0 14px; }

.da-field{ display:block; }
.da-input, .da-textarea, .da-select{ width:100%; font:inherit; font-size:16px; color:var(--da-ink);
  background:color-mix(in srgb,var(--da-surface) 100%,#888 6%); border:1.5px solid var(--da-line); border-radius:12px; padding:13px 14px; min-height:48px;
  transition:border-color .15s ease, box-shadow .15s ease; outline:none; }
.da-onbg .da-input, .da-onbg .da-textarea, .da-onbg .da-select{ background:rgba(255,255,255,.08); color:#fff; }
.da-textarea{ min-height:104px; resize:vertical; }
.da-input:focus, .da-textarea:focus, .da-select:focus{ border-color:var(--da-accent); box-shadow:0 0 0 4px color-mix(in srgb,var(--da-accent) 26%,transparent); }
.da-input::placeholder, .da-textarea::placeholder{ color:var(--da-ink-2); opacity:.8; }

.da-options{ display:grid; gap:10px; }
.da-opt{ display:flex; align-items:center; gap:12px; padding:13px 14px; cursor:pointer; border:1.5px solid var(--da-line); border-radius:12px; min-height:48px;
  transition:border-color .15s ease, background .15s ease, transform .12s ease; }
.da-opt:hover{ border-color:color-mix(in srgb,var(--da-accent) 60%,var(--da-line)); }
.da-opt:active{ transform:scale(.99); }
.da-opt.sel{ border-color:var(--da-accent); background:color-mix(in srgb,var(--da-accent) 12%,transparent); }
.da-opt .box{ width:20px; height:20px; flex:none; border:2px solid var(--da-line); display:inline-flex; align-items:center; justify-content:center; color:#1a1205; }
.da-opt.radio .box{ border-radius:50%; } .da-opt.check .box{ border-radius:6px; }
.da-opt.sel .box{ border-color:var(--da-accent); background:var(--da-accent); }
.da-opt .box svg{ width:13px; height:13px; opacity:0; } .da-opt.sel .box svg{ opacity:1; }
.da-opt span.lbl{ font-size:15px; }

.da-err{ color:#c0392b; font-size:13px; margin:8px 0 0; min-height:18px; }
.da-onbg .da-err{ color:#ff9b8a; }

.da-foot{ position:relative; z-index:1; display:flex; gap:10px; align-items:center; padding:16px 22px 22px; }
.da-btn{ font:inherit; font-size:15px; font-weight:700; border-radius:12px; padding:13px 22px; min-height:48px; cursor:pointer; border:1.5px solid transparent;
  transition:transform .15s ease, filter .15s ease, opacity .15s ease; }
.da-btn:active{ transform:translateY(1px); }
.da-btn-primary{ background:var(--da-accent); color:#1a1205; margin-left:auto; }
.da-btn-primary:hover{ filter:brightness(1.04); } .da-btn-primary:disabled{ opacity:.5; cursor:not-allowed; }
.da-btn-ghost{ background:transparent; color:var(--da-ink); border-color:var(--da-line); }
.da-btn-ghost:hover{ border-color:var(--da-ink-2); }
.da-btn[hidden]{ display:none; }

.da-center{ position:relative; z-index:1; text-align:center; padding:44px 26px; }
.da-center .da-logo-lg{ height:48px; width:auto; margin:0 auto 16px; display:block; border-radius:10px; }
.da-center h2{ font-size:26px; margin:0 0 10px; letter-spacing:-.01em; font-weight:800; }
.da-center p{ color:var(--da-ink-2); margin:0 auto 22px; max-width:42ch; }
.da-center .da-actions{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.da-badge{ width:56px; height:56px; border-radius:50%; margin:0 auto; display:inline-flex; align-items:center; justify-content:center;
  background:color-mix(in srgb,var(--da-accent) 18%,transparent); color:var(--da-accent); }
.da-badge svg{ width:28px; height:28px; }

/* HERO with interactive 3D nebula (split: text left, nebula centre-right) */
.da-hero{ position:relative; z-index:1; width:100%; display:grid; grid-template-columns:1.05fr .95fr; align-items:center; gap:clamp(20px,4vw,56px); padding:8px 4px; animation:da-fade .55s ease both; }
.da-hero-text{ text-align:left; }
.da-hero-title{ font-size:clamp(36px,5.4vw,62px); font-weight:800; letter-spacing:-.025em; line-height:1.0; margin:0 0 18px;
  background:linear-gradient(100deg,#ffffff,#E7AB2E 50%,#9db8ff); background-size:220% 100%;
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent;
  filter:drop-shadow(0 2px 26px rgba(120,140,255,.28)); animation:da-sheen 9s ease-in-out infinite; }
.da-theme-light .da-hero-title{ background:linear-gradient(100deg,#15171d,#B8881C 48%,#3a5bd0); background-size:220% 100%;
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 2px 16px rgba(58,91,208,.18)); }
@keyframes da-sheen{ 0%,100%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } }
.da-hero-sub{ color:var(--da-ink-2); font-size:clamp(15px,1.5vw,18px); line-height:1.6; margin:0 0 28px; max-width:50ch; }
.da-hero .da-actions{ display:flex; justify-content:flex-start; }
.da-hero .da-btn-primary{ margin-left:0; padding:15px 30px; font-size:16px; }
.da-hero-visual{ position:relative; display:flex; align-items:center; justify-content:center; }
.da-neb{ width:100%; max-width:480px; aspect-ratio:1/1; height:auto; display:block; }
@media (max-width:760px){
  .da-hero{ grid-template-columns:1fr; gap:6px; text-align:center; }
  .da-hero-text{ text-align:center; order:2; }
  .da-hero-visual{ order:1; }
  .da-hero-sub{ margin-left:auto; margin-right:auto; }
  .da-hero .da-actions{ justify-content:center; }
  .da-neb{ max-width:300px; }
}

.da-spin{ width:16px; height:16px; border:2px solid rgba(0,0,0,.25); border-top-color:#1a1205; border-radius:50%; display:inline-block; animation:da-rot .7s linear infinite; vertical-align:-2px; margin-right:6px; }
@keyframes da-rot{ to{ transform:rotate(360deg); } }
@keyframes da-fade{ from{ opacity:0; } to{ opacity:1; } }

@media (max-width:560px){ .da-overlay{ padding:0; } .da-panel{ max-width:100%; max-height:100%; height:100%; border-radius:0; } }

/* ---- full-page mode (day / night) ---- */
.da-page{ position:relative; height:100vh; height:100dvh; display:flex; flex-direction:column; overflow:hidden; transition:color .35s ease; }
.da-page.da-theme-dark{ --da-ink:#f3f3f5; --da-ink-2:#a7adba; --da-surface:#16171c; --da-line:#2a2c34; color:#fff; }
.da-page.da-theme-light{ --da-ink:#14161c; --da-ink-2:#5b6170; --da-surface:#ffffff; --da-line:#e7e7ea; color:#14161c; }
.da-grad{ position:absolute; inset:0; z-index:0; filter:blur(8px); transform:scale(1.06); transition:opacity .35s ease; }
.da-theme-dark .da-grad{ background:
  radial-gradient(42% 42% at 80% 28%, rgba(231,171,46,.42), transparent 70%),
  radial-gradient(46% 46% at 20% 72%, rgba(120,90,235,.30), transparent 70%),
  radial-gradient(52% 52% at 62% 52%, rgba(60,95,210,.26), transparent 72%),
  radial-gradient(50% 50% at 72% 96%, rgba(255,255,255,.07), transparent 72%),
  linear-gradient(150deg,#070710,#0c0c17 55%,#070710); }
.da-theme-light .da-grad{ background:
  radial-gradient(42% 42% at 80% 28%, rgba(231,171,46,.26), transparent 70%),
  radial-gradient(46% 46% at 20% 72%, rgba(120,90,235,.16), transparent 70%),
  radial-gradient(52% 52% at 62% 52%, rgba(60,95,210,.14), transparent 72%),
  linear-gradient(150deg,#f3f1ea,#ffffff 55%,#eceef6); }
/* futuristic grid, masked toward the centre so it fades out at the edges */
.da-grid{ position:absolute; inset:0; z-index:0; pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size:46px 46px;
  -webkit-mask-image:radial-gradient(circle at 60% 46%, #000 0%, rgba(0,0,0,.4) 45%, transparent 72%);
  mask-image:radial-gradient(circle at 60% 46%, #000 0%, rgba(0,0,0,.4) 45%, transparent 72%); }
.da-theme-light .da-grid{ background-image:linear-gradient(rgba(20,30,80,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,30,80,.05) 1px, transparent 1px); }
.da-page .da-bg::after{ background:linear-gradient(180deg,rgba(8,8,10,.5),rgba(8,8,10,.78)); }
.da-pagehead{ position:relative; z-index:2; flex:0 0 auto; padding:18px 26px 14px; display:flex; align-items:center; justify-content:center; animation:da-fade .5s ease both; }
.da-pagehead-c{ display:flex; flex-direction:column; align-items:center; gap:8px; }
.da-pagehead img{ height:40px; width:auto; border-radius:8px; }
.da-pagetitle{ margin:0; font-size:15px; font-weight:800; letter-spacing:.01em; }
.da-theme-btn{ position:absolute; right:18px; top:50%; transform:translateY(-50%); width:40px; height:40px; border-radius:10px; border:1px solid var(--da-line);
  background:transparent; color:inherit; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:border-color .2s ease, transform .2s ease; }
.da-theme-btn:hover{ border-color:var(--da-accent); } .da-theme-btn:active{ transform:translateY(-50%) scale(.92); } .da-theme-btn svg{ width:18px; height:18px; }
.da-pagebody{ position:relative; z-index:1; flex:1 1 auto; min-height:0; overflow-y:auto; width:100%; max-width:640px; margin:0 auto; padding:8px 22px 28px; display:flex; flex-direction:column; justify-content:flex-start; }
.da-pagebody-hero{ max-width:1080px; justify-content:center; padding:8px 30px 28px; }
.da-page-panel{ background:color-mix(in srgb, var(--da-surface) 90%, transparent); border:1px solid var(--da-line); border-radius:20px; overflow:visible; max-height:none;
  box-shadow:0 24px 70px -28px rgba(0,0,0,.55); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); animation:da-cardin .55s cubic-bezier(.2,.7,.2,1) both;
  transition:background-color .35s ease, border-color .35s ease; }
.da-page-panel .da-legend, .da-page-panel .da-stepno{ text-align:left; }
.da-page-panel .da-body{ overflow:visible; padding:14px 22px 8px; }
.da-page .da-center{ text-align:left; padding:36px 24px; }
.da-page .da-center .da-actions{ justify-content:flex-start; }
.da-page .da-center .da-badge{ margin:0 0 6px; }
.da-page .da-center p{ margin-left:0; margin-right:0; max-width:48ch; }
.da-pagefoot{ position:relative; z-index:2; flex:0 0 auto; padding:14px 24px 20px; text-align:center; font-size:13px; transition:color .35s ease; }
.da-theme-dark .da-pagefoot{ color:rgba(255,255,255,.8); } .da-theme-light .da-pagefoot{ color:rgba(20,22,28,.66); }
.da-pagefoot a{ color:var(--da-accent); text-decoration:none; font-weight:700; } .da-pagefoot a:hover{ text-decoration:underline; }
@keyframes da-cardin{ from{ opacity:0; transform:translateY(16px) scale(.99); } to{ opacity:1; transform:none; } }
@media (max-width:560px){ .da-page-panel{ border-radius:16px; } .da-pagehead img{ height:34px; } }

@media (prefers-reduced-motion: reduce){ .da-overlay,.da-panel,.da-btn{ transition:none; }
  .da-qblock,.da-page-panel,.da-pagehead,.da-hero,.da-hero-title,.da-audiobtn.playing{ animation:none; } }
`;

/* ------------------------------------------------------------- storage -- */
function store(): Storage | null {
  try { localStorage.setItem('__da', '1'); localStorage.removeItem('__da'); return localStorage; }
  catch { try { return sessionStorage; } catch { return null; } }
}
const PKEY = (k: string) => `da_progress_${k}`;
function loadProgress(k: string): Progress | null { const s = store(); if (!s) return null; try { const r = s.getItem(PKEY(k)); return r ? JSON.parse(r) as Progress : null; } catch { return null; } }
function saveProgress(k: string, p: Progress): void { const s = store(); if (!s) return; try { s.setItem(PKEY(k), JSON.stringify(p)); } catch { /* quota */ } }
function clearProgress(k: string): void { const s = store(); if (!s) return; try { s.removeItem(PKEY(k)); } catch { /* noop */ } }
function loadTheme(): 'dark' | 'light' {
  try { const v = store()?.getItem('da_theme'); if (v === 'light' || v === 'dark') return v; } catch { /* noop */ }
  try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch { return 'dark'; }
}
function saveTheme(t: string): void { try { store()?.setItem('da_theme', t); } catch { /* noop */ } }

/* ----------------------------------------------------------------- api -- */
class Api {
  constructor(private url: string, private anon: string) { this.url = url.replace(/\/$/, ''); }
  private h(extra: Record<string, string> = {}) { return { apikey: this.anon, Authorization: `Bearer ${this.anon}`, 'Content-Type': 'application/json', ...extra }; }
  async getFlow(k: string): Promise<Flow | null> {
    const r = await fetch(`${this.url}/rest/v1/flows?public_key=eq.${encodeURIComponent(k)}&select=*`, { headers: this.h() });
    if (!r.ok) throw new Error('flow'); const rows = await r.json() as Flow[]; return rows[0] || null;
  }
  async getQuestions(id: string): Promise<Question[]> {
    const r = await fetch(`${this.url}/rest/v1/flow_questions?flow_id=eq.${id}&order=order_index.asc&select=*`, { headers: this.h() });
    if (!r.ok) throw new Error('questions');
    const rows = await r.json() as Array<Question & { options: unknown }>;
    return rows.map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options as string[] : [] }));
  }
  recordView(id: string): void { fetch(`${this.url}/rest/v1/flow_views`, { method: 'POST', headers: this.h({ Prefer: 'return=minimal' }), body: JSON.stringify({ flow_id: id }) }).catch(() => { /* non-blocking */ }); }
  async submit(id: string, answers: Record<string, unknown>): Promise<void> {
    const r = await fetch(`${this.url}/rest/v1/submissions`, { method: 'POST', headers: this.h({ Prefer: 'return=minimal' }), body: JSON.stringify({ flow_id: id, answers_json: answers }) });
    if (!r.ok) throw new Error('submit');
  }
}

/* --------------------------------------------------------------- icons -- */
const I = {
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isVideo = (u: string) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(u);
function esc(s: string): string { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }

/* -------------------------------------------------------------- widget -- */
class Widget {
  private root!: ShadowRoot; private host!: HTMLElement; private api: Api;
  private t = STRINGS.es; private flow: Flow | null = null; private questions: Question[] = [];
  private answers: Record<string, string | string[]> = {};
  private step = 1; private transitioning = false;
  private screen: 'intro' | 'resume' | 'flow' | 'success' | 'unavailable' | 'error' = 'intro';
  private viewed = false; private audioEl: HTMLAudioElement | null = null; private audioBtn: HTMLElement | null = null;
  private accent = '#E7AB2E'; private overlayEl: HTMLElement | null = null; private launcher: HTMLButtonElement | null = null;
  private pageMode = false; private theme: 'dark' | 'light' = 'dark';
  private nebRaf = 0; private nebStop = true; private nebCleanup: (() => void) | null = null;

  constructor(private cfg: Config) {
    this.api = new Api(cfg.supabaseUrl || SUPABASE_URL, cfg.supabaseAnonKey || SUPABASE_ANON_KEY);
    if (cfg.accentColor) this.accent = cfg.accentColor;
    this.pageMode = !!cfg.page; this.theme = loadTheme();
  }

  async mount(): Promise<void> {
    const inline = !!this.cfg.target;
    this.host = document.createElement('div'); this.host.setAttribute('data-discovery-assistant', this.cfg.key);
    (inline ? (document.querySelector(this.cfg.target!) || document.body) : document.body).appendChild(this.host);
    this.root = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style'); style.textContent = CSS; this.root.appendChild(style);
    if (!document.querySelector('link[data-da-font]')) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-da-font', '');
      l.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'; document.head.appendChild(l);
    }
    if (inline || this.pageMode) await this.open(); else this.renderLauncher();
  }

  private renderLauncher(): void {
    const pos = this.cfg.position === 'bottom-left' ? 'left' : 'right';
    const btn = document.createElement('button'); btn.className = `da-launcher ${pos}`; btn.style.background = this.accent;
    btn.setAttribute('aria-haspopup', 'dialog'); btn.innerHTML = `${I.spark}<span>${esc(DA_TITLE)}</span>`;
    btn.addEventListener('click', () => this.open()); this.root.appendChild(btn); this.launcher = btn;
  }

  private async open(): Promise<void> {
    if (!this.flow) {
      try {
        const flow = await this.api.getFlow(this.cfg.key);
        if (!flow || flow.status === 'DRAFT') { this.flow = flow; this.screen = 'unavailable'; }
        else {
          this.flow = flow; this.t = STRINGS[flow.language] || STRINGS.es;
          if (!this.cfg.accentColor && flow.accent_color) this.accent = flow.accent_color;
          if (flow.status === 'INACTIVE') this.screen = 'unavailable';
          else {
            this.questions = await this.api.getQuestions(flow.id);
            const prev = loadProgress(this.cfg.key);
            if (prev && prev.answers && Object.keys(prev.answers).length) {
              this.answers = prev.answers; this.step = Math.min(Math.max(1, prev.currentStep || 1), this.questions.length); this.screen = 'resume';
            } else this.screen = 'intro';
          }
        }
      } catch { this.screen = 'error'; }
    }
    this.renderPanel();
    if (this.flow && this.flow.status === 'ACTIVE' && !this.viewed) { this.viewed = true; this.api.recordView(this.flow.id); }
  }

  private close(): void {
    this.stopAudio(); this.stopNebula(); if (this.cfg.target) return;
    const ov = this.overlayEl; if (ov) { ov.classList.remove('open'); setTimeout(() => ov.remove(), 220); this.overlayEl = null; document.removeEventListener('keydown', this.onKey); }
    this.launcher && (this.launcher.style.display = '');
  }
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') this.close(); };

  /* ---- shell ---- */
  private renderPanel(): void {
    if (this.pageMode) { this.renderPage(); return; }
    const inline = !!this.cfg.target; let mount: HTMLElement;
    if (inline) {
      this.root.querySelectorAll('.da-inline').forEach((n) => n.remove());
      const wrap = document.createElement('div'); wrap.className = 'da-root da-inline'; this.root.appendChild(wrap); mount = wrap;
    } else {
      if (!this.overlayEl) {
        const ov = document.createElement('div'); ov.className = 'da-root da-overlay';
        ov.addEventListener('click', (e) => { if (e.target === ov) this.close(); });
        this.root.appendChild(ov); this.overlayEl = ov; requestAnimationFrame(() => ov.classList.add('open'));
        document.addEventListener('keydown', this.onKey); this.launcher && (this.launcher.style.display = 'none');
      }
      mount = this.overlayEl;
    }
    const panel = document.createElement('div'); panel.className = 'da-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    if (this.flow?.background_url && this.screen !== 'unavailable' && this.screen !== 'error') panel.classList.add('da-onbg');
    panel.style.setProperty('--da-accent', this.accent);
    panel.innerHTML = this.shellHtml();
    const ex = mount.querySelector('.da-panel'); ex ? ex.replaceWith(panel) : mount.appendChild(panel);
    this.afterRender(panel);
  }

  private renderPage(): void {
    this.root.querySelectorAll('.da-page').forEach((n) => n.remove());
    const wrap = document.createElement('div'); wrap.className = `da-root da-page da-theme-${this.theme}`;
    wrap.style.setProperty('--da-accent', this.accent);
    const hasBg = !!this.flow?.background_url && this.screen !== 'unavailable' && this.screen !== 'error';
    const bg = hasBg ? this.bgHtml() : `<div class="da-grad" aria-hidden="true"></div><div class="da-grid" aria-hidden="true"></div>`;
    const logo = this.flow?.logo_url ? `<img class="da-logo" src="${esc(this.flow.logo_url)}" alt="" />` : '';
    const themeBtn = `<button class="da-theme-btn" data-act="theme" aria-label="${esc(this.t.themeToggle)}">${this.theme === 'dark' ? I.sun : I.moon}</button>`;
    const isHero = this.screen === 'intro';
    const body = isHero
      ? `<main class="da-pagebody da-pagebody-hero">${this.contentHtml()}</main>`
      : `<main class="da-pagebody"><div class="da-panel da-page-panel" role="region">${this.contentHtml()}</div></main>`;
    wrap.innerHTML =
      `${bg}
       <header class="da-pagehead"><div class="da-pagehead-c">${logo}<p class="da-pagetitle">${esc(DA_TITLE)}</p></div>${themeBtn}</header>
       ${body}
       <footer class="da-pagefoot">Producto desarrollado por <a href="https://www.wearevectis.com" target="_blank" rel="noopener">Vectis</a></footer>`;
    this.root.appendChild(wrap);
    this.afterRender(wrap);
  }

  private afterRender(root: HTMLElement): void {
    this.wireShell(root);
    if (this.screen === 'flow') this.mountStep('fwd', false);
    else if (this.screen === 'intro') { const c = root.querySelector<HTMLCanvasElement>('[data-neb]'); c && this.startNebula(c); const f = root.querySelector<HTMLElement>('button.da-btn-primary'); f && setTimeout(() => f.focus(), 60); }
    else { const f = root.querySelector<HTMLElement>('button.da-btn-primary,.da-opt,input,textarea,select'); f && setTimeout(() => f.focus(), 60); }
  }

  private bgHtml(): string {
    const url = this.flow?.background_url; if (!url || this.screen === 'unavailable' || this.screen === 'error') return '';
    return `<div class="da-bg">${isVideo(url) ? `<video src="${esc(url)}" autoplay muted loop playsinline></video>` : `<img src="${esc(url)}" alt="" />`}</div>`;
  }
  private headHtml(): string {
    const logo = this.flow?.logo_url ? `<img class="da-logo" src="${esc(this.flow.logo_url)}" alt="" />` : '';
    const close = this.cfg.target ? '' : `<button class="da-close" data-act="close" aria-label="${esc(this.t.close)}">${I.close}</button>`;
    return `<div class="da-head">${logo}<p class="da-title">${esc(DA_TITLE)}</p>${close}</div>`;
  }

  private contentHtml(): string {
    const closeActions = this.cfg.target ? '' : `<div class="da-actions"><button class="da-btn da-btn-ghost" data-act="close">${esc(this.t.close)}</button></div>`;
    switch (this.screen) {
      case 'unavailable': return `<div class="da-center"><h2>${esc(DA_TITLE)}</h2><p>${esc(this.t.unavailable)}</p>${closeActions}</div>`;
      case 'error': return `<div class="da-center"><h2>:(</h2><p>${esc(this.t.errorLoad)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="retry">${esc(this.t.retry)}</button></div></div>`;
      case 'success': return `<div class="da-center"><span class="da-badge">${I.ok}</span><h2>${esc(this.t.successTitle)}</h2><p>${esc(this.t.successBody)}</p>${closeActions}</div>`;
      case 'resume': return `<div class="da-center"><h2>${esc(this.t.resumeTitle)}</h2><p>${esc(this.t.resumeBody)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="resume">${esc(this.t.continue)}</button><button class="da-btn da-btn-ghost" data-act="restart">${esc(this.t.startAgain)}</button></div></div>`;
      case 'intro':
        return `<div class="da-hero">
            <div class="da-hero-text">
              <h1 class="da-hero-title">${esc(this.t.welcomeTitle)}</h1>
              <p class="da-hero-sub">${esc(this.t.welcome)}</p>
              <div class="da-actions"><button class="da-btn da-btn-primary" data-act="begin">${esc(this.t.begin)}</button></div>
            </div>
            <div class="da-hero-visual"><canvas class="da-neb" data-neb aria-hidden="true"></canvas></div>
          </div>`;
      default: { // flow
        const last = this.step >= this.questions.length;
        return `${this.progressHtml()}
          <p class="da-legend">${esc(this.t.during)}</p>
          <div class="da-body"><div class="da-qstage" data-stage></div></div>
          <div class="da-foot">
            <button class="da-btn da-btn-ghost" data-act="back" ${this.step <= 1 ? 'hidden' : ''}>${esc(this.t.back)}</button>
            <button class="da-btn da-btn-primary" data-act="${last ? 'submit' : 'next'}">${last ? esc(this.t.finish) : esc(this.t.next)}</button>
          </div>`;
      }
    }
  }

  private progressHtml(): string {
    const n = Math.max(1, this.questions.length);
    const pct = Math.round((this.step / n) * 100);
    return `<p class="da-stepno">${esc(this.t.step)} ${this.step} ${esc(this.t.of)} ${this.questions.length}</p>
            <div class="da-progress"><i style="width:${pct}%"></i></div>`;
  }

  private shellHtml(): string {
    const head = this.screen === 'intro' ? '' : this.headHtml();
    return this.bgHtml() + head + this.contentHtml();
  }

  /* ---- one question at a time ---- */
  private buildQuestionBlock(index: number): HTMLElement {
    const q = this.questions[index - 1];
    const block = document.createElement('div'); block.className = 'da-qblock'; block.setAttribute('data-block', String(index));
    block.innerHTML =
      `<button class="da-audiobtn" data-act="audio" aria-label="${esc(this.t.listen)}">${I.play}</button>
       <div class="da-qbody">
         <h3 class="da-q">${esc(q.label)}${q.required ? '' : ` <span style="font-weight:500;font-size:14px;color:var(--da-ink-2)">(${esc(this.t.optional)})</span>`}</h3>
         ${q.help_text ? `<p class="da-help">${esc(q.help_text)}</p>` : ''}
         ${this.fieldHtml(q)}
         <p class="da-err" data-err role="alert"></p>
       </div>`;
    this.wireBlock(block, q);
    return block;
  }

  private mountStep(dir: 'fwd' | 'back', animate: boolean): void {
    const stage = this.currentPanel()?.querySelector<HTMLElement>('[data-stage]'); if (!stage) return;
    stage.innerHTML = '';
    const block = this.buildQuestionBlock(this.step);
    if (animate) block.classList.add(dir === 'back' ? 'da-enter-back' : 'da-enter-fwd');
    stage.appendChild(block);
    const fld = block.querySelector<HTMLElement>('input,textarea,select,.da-opt'); fld && setTimeout(() => fld.focus(), animate ? 120 : 60);
  }

  private fieldHtml(q: Question): string {
    const v = this.answers[q.key]; const sv = typeof v === 'string' ? v : ''; const av = Array.isArray(v) ? v : [];
    switch (q.type) {
      case 'TEXTAREA': return `<label class="da-field"><textarea class="da-textarea" data-input placeholder="${esc(q.placeholder || '')}">${esc(sv)}</textarea></label>`;
      case 'EMAIL': return `<label class="da-field"><input class="da-input" type="email" inputmode="email" autocomplete="email" data-input placeholder="${esc(q.placeholder || '')}" value="${esc(sv)}" /></label>`;
      case 'PHONE': return `<label class="da-field"><input class="da-input" type="tel" inputmode="tel" autocomplete="tel" data-input placeholder="${esc(q.placeholder || '')}" value="${esc(sv)}" /></label>`;
      case 'SELECT': return `<label class="da-field"><select class="da-select" data-input><option value="">${esc(q.placeholder || this.t.selectPlaceholder)}</option>${q.options.map((o) => `<option value="${esc(o)}"${o === sv ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
      case 'RADIO': return `<div class="da-options" role="radiogroup">${q.options.map((o) => `<div class="da-opt radio${o === sv ? ' sel' : ''}" data-opt="${esc(o)}" role="radio" tabindex="0" aria-checked="${o === sv}"><span class="box">${I.check}</span><span class="lbl">${esc(o)}</span></div>`).join('')}</div>`;
      case 'CHECKBOX': return `<div class="da-options">${q.options.map((o) => `<div class="da-opt check${av.includes(o) ? ' sel' : ''}" data-optm="${esc(o)}" role="checkbox" tabindex="0" aria-checked="${av.includes(o)}"><span class="box">${I.check}</span><span class="lbl">${esc(o)}</span></div>`).join('')}</div>`;
      default: return `<label class="da-field"><input class="da-input" type="text" data-input placeholder="${esc(q.placeholder || '')}" value="${esc(sv)}" /></label>`;
    }
  }

  /* ---- wiring ---- */
  private wireShell(panel: HTMLElement): void {
    panel.querySelectorAll<HTMLElement>('.da-foot [data-act], .da-center [data-act], .da-hero [data-act], .da-head [data-act], .da-pagehead [data-act]').forEach((el) => {
      el.addEventListener('click', () => this.act(el.getAttribute('data-act')!, el));
    });
  }
  private wireBlock(block: HTMLElement, q: Question): void {
    const input = block.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-input]');
    if (input) {
      const upd = () => { this.answers[q.key] = input.value; this.persist(); };
      input.addEventListener('input', upd); input.addEventListener('change', upd);
      if (q.type === 'SELECT') input.addEventListener('change', () => { if (input.value) this.autoAdvance(); });
      if (q.type === 'TEXT' || q.type === 'EMAIL' || q.type === 'PHONE') {
        input.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); this.goNext(); } });
      }
    }
    block.querySelectorAll<HTMLElement>('[data-opt]').forEach((el) => {
      const pick = () => {
        this.answers[q.key] = el.getAttribute('data-opt')!; this.persist();
        block.querySelectorAll('.da-opt').forEach((o) => { o.classList.remove('sel'); o.setAttribute('aria-checked', 'false'); });
        el.classList.add('sel'); el.setAttribute('aria-checked', 'true');
        const e = block.querySelector<HTMLElement>('[data-err]'); if (e) e.textContent = '';
        this.autoAdvance();
      };
      el.addEventListener('click', pick);
      el.addEventListener('keydown', (ev) => { const k = (ev as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { ev.preventDefault(); pick(); } });
    });
    block.querySelectorAll<HTMLElement>('[data-optm]').forEach((el) => {
      const toggle = () => {
        const o = el.getAttribute('data-optm')!; const cur = Array.isArray(this.answers[q.key]) ? [...(this.answers[q.key] as string[])] : [];
        const i = cur.indexOf(o); i >= 0 ? cur.splice(i, 1) : cur.push(o); this.answers[q.key] = cur; this.persist();
        const on = cur.includes(o); el.classList.toggle('sel', on); el.setAttribute('aria-checked', String(on));
        const e = block.querySelector<HTMLElement>('[data-err]'); if (e) e.textContent = '';
      };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', (ev) => { const k = (ev as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { ev.preventDefault(); toggle(); } });
    });
    const audio = block.querySelector<HTMLElement>('[data-act="audio"]'); audio && audio.addEventListener('click', () => this.speak(q, audio));
  }

  private autoAdvance(): void { if (this.step < this.questions.length && !this.transitioning) setTimeout(() => this.goNext(), 320); }

  private async act(a: string, el?: HTMLElement): Promise<void> {
    switch (a) {
      case 'close': this.close(); break;
      case 'retry': this.flow = null; this.screen = 'intro'; await this.open(); break;
      case 'begin': this.stopNebula(); this.screen = 'flow'; this.step = 1; this.persist(); this.renderPanel(); break;
      case 'resume': this.screen = 'flow'; this.renderPanel(); break;
      case 'restart': this.answers = {}; this.step = 1; clearProgress(this.cfg.key); this.screen = 'flow'; this.renderPanel(); break;
      case 'back': this.goBack(); break;
      case 'next': this.goNext(); break;
      case 'submit': await this.onSubmit(); break;
      case 'audio': break;
      case 'theme': this.toggleTheme(); break;
    }
  }

  private goNext(): void {
    if (this.transitioning) return;
    if (!this.validateCurrent()) return;
    if (this.step >= this.questions.length) { void this.onSubmit(); return; }
    this.stopAudio(); this.transition('fwd', this.step + 1);
  }
  private goBack(): void {
    if (this.transitioning || this.step <= 1) return;
    this.stopAudio(); this.transition('back', this.step - 1);
  }
  private transition(dir: 'fwd' | 'back', toStep: number): void {
    const stage = this.currentPanel()?.querySelector<HTMLElement>('[data-stage]');
    const cur = stage?.firstElementChild as HTMLElement | null;
    this.transitioning = true;
    if (cur) cur.className = 'da-qblock ' + (dir === 'fwd' ? 'da-leave-fwd' : 'da-leave-back');
    this.step = toStep; this.persist();
    setTimeout(() => { this.mountStep(dir, true); this.updateControls(); this.transitioning = false; }, cur ? 220 : 0);
  }

  private updateControls(): void {
    const panel = this.currentPanel(); if (!panel) return;
    const bar = panel.querySelector<HTMLElement>('.da-progress > i'); if (bar) bar.style.width = `${Math.round((this.step / Math.max(1, this.questions.length)) * 100)}%`;
    const sn = panel.querySelector<HTMLElement>('.da-stepno'); if (sn) sn.textContent = `${this.t.step} ${this.step} ${this.t.of} ${this.questions.length}`;
    const back = panel.querySelector<HTMLButtonElement>('.da-foot [data-act="back"], .da-foot [data-act="back"][hidden]') || panel.querySelector<HTMLButtonElement>('.da-foot .da-btn-ghost');
    if (back) { if (this.step <= 1) back.setAttribute('hidden', ''); else back.removeAttribute('hidden'); }
    const prim = panel.querySelector<HTMLButtonElement>('.da-foot .da-btn-primary');
    if (prim) { const last = this.step >= this.questions.length; prim.setAttribute('data-act', last ? 'submit' : 'next'); prim.textContent = last ? this.t.finish : this.t.next; }
  }

  private validateCurrent(): boolean {
    const q = this.questions[this.step - 1]; const block = this.currentPanel()?.querySelector<HTMLElement>(`[data-block="${this.step}"]`);
    const errEl = block?.querySelector<HTMLElement>('[data-err]'); const set = (m: string) => { if (errEl) errEl.textContent = m; };
    const v = this.answers[q.key];
    const empty = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
    if (q.required && empty) { set(q.type === 'RADIO' || q.type === 'CHECKBOX' || q.type === 'SELECT' ? this.t.selectOne : this.t.required); return false; }
    if (q.type === 'EMAIL' && typeof v === 'string' && v.trim() && !EMAIL_RE.test(v.trim())) { set(this.t.invalidEmail); return false; }
    set(''); return true;
  }
  private firstInvalid(): number {
    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i]; const v = this.answers[q.key];
      const empty = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
      if (q.required && empty) return i + 1;
      if (q.type === 'EMAIL' && typeof v === 'string' && v.trim() && !EMAIL_RE.test(v.trim())) return i + 1;
    }
    return 0;
  }

  private async onSubmit(): Promise<void> {
    if (this.transitioning || !this.flow) return;
    const bad = this.firstInvalid();
    if (bad) { this.step = bad; this.mountStep('fwd', true); this.updateControls(); this.validateCurrent(); return; }
    const b = this.currentPanel()?.querySelector<HTMLButtonElement>('.da-foot .da-btn-primary');
    if (b) { b.disabled = true; b.innerHTML = `<span class="da-spin"></span>${esc(this.t.sending)}`; }
    try { await this.api.submit(this.flow.id, this.answers); clearProgress(this.cfg.key); this.stopAudio(); this.screen = 'success'; this.renderPanel(); }
    catch {
      if (b) { b.disabled = false; b.textContent = this.t.finish; }
      const e = this.currentPanel()?.querySelector<HTMLElement>(`[data-block="${this.step}"] [data-err]`); if (e) e.textContent = this.t.errorSend;
    }
  }

  /* ---- audio: play recorded explanation or read the question aloud (TTS) ---- */
  private speak(q: Question, btn: HTMLElement): void {
    if (this.audioBtn === btn) { this.stopAudio(); return; }
    this.stopAudio();
    this.audioBtn = btn; btn.classList.add('playing'); btn.innerHTML = I.pause;
    if (q.audio_url) {
      this.audioEl = new Audio(q.audio_url); this.audioEl.play().catch(() => this.stopAudio());
      this.audioEl.onended = () => this.stopAudio();
    } else if ('speechSynthesis' in window) {
      try {
        const u = new SpeechSynthesisUtterance(q.label + (q.help_text ? '. ' + q.help_text : ''));
        u.lang = this.flow?.language === 'en' ? 'en-US' : 'es-ES'; u.rate = 1;
        u.onend = () => this.stopAudio();
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      } catch { this.stopAudio(); }
    } else { this.stopAudio(); }
  }
  private stopAudio(): void {
    if (this.audioEl) { try { this.audioEl.pause(); } catch { /* noop */ } this.audioEl = null; }
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch { /* noop */ }
    if (this.audioBtn) { this.audioBtn.classList.remove('playing'); this.audioBtn.innerHTML = I.play; this.audioBtn = null; }
  }

  private toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark'; saveTheme(this.theme);
    const page = this.root.querySelector('.da-page');
    if (page) {
      page.classList.remove('da-theme-dark', 'da-theme-light'); page.classList.add(`da-theme-${this.theme}`);
      const b = page.querySelector('[data-act="theme"]'); if (b) b.innerHTML = this.theme === 'dark' ? I.sun : I.moon;
    }
  }

  /* ---- interactive 3D nebula (canvas 2D, dependency-free) ---- */
  private startNebula(cv: HTMLCanvasElement): void {
    const ctx = cv.getContext('2d'); if (!ctx) return;
    this.stopNebula(); this.nebStop = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 1, H = 1;
    const resize = () => { const r = cv.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const sprite = (r: number, g: number, b: number) => { const d = 44, c = document.createElement('canvas'); c.width = d; c.height = d; const x = c.getContext('2d')!; const gr = x.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2); gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.35, `rgba(${r},${g},${b},.5)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, d, d); return c; };
    const cWhite = sprite(255, 255, 255), cBlue = sprite(110, 160, 255), cCyan = sprite(90, 220, 255), cViolet = sprite(168, 120, 255), cMag = sprite(232, 120, 210), cGold = sprite(231, 171, 46);
    const palette = [cBlue, cBlue, cCyan, cViolet, cViolet, cMag, cWhite, cGold];   // weighted toward cool nebula hues
    const N = W < 480 ? 560 : 1000;
    const pts: { x: number; y: number; z: number; s: number; sp: HTMLCanvasElement; ph: number; tw: number }[] = [];
    for (let i = 0; i < N; i++) {
      const core = Math.random() < 0.36;
      const rr = core ? 0.12 + Math.random() * 0.6 : 0.78 + Math.random() * 0.34;   // dense glowing core + sparse halo
      const t = (i + 0.5) / N; const phi = Math.acos(1 - 2 * t); const th = Math.PI * (1 + Math.sqrt(5)) * i;
      pts.push({ x: Math.sin(phi) * Math.cos(th) * rr, y: Math.cos(phi) * rr, z: Math.sin(phi) * Math.sin(th) * rr,
        s: (core ? 0.5 : 0.7) + Math.random() * (core ? 1.4 : 2.1), sp: palette[(Math.random() * palette.length) | 0],
        ph: Math.random() * 6.28, tw: 0.5 + Math.random() * 1.6 });
    }
    let spin = 0, offX = 0, offY = 0, tX = 0, tY = 0;
    const onMove = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); tY = ((e.clientX - r.left) / r.width - 0.5) * 1.3; tX = ((e.clientY - r.top) / r.height - 0.5) * 1.0; };
    const onTouch = (e: TouchEvent) => { const tt = e.touches[0]; if (!tt) return; const r = cv.getBoundingClientRect(); tY = ((tt.clientX - r.left) / r.width - 0.5) * 1.3; tX = ((tt.clientY - r.top) / r.height - 0.5) * 1.0; };
    const onLeave = () => { tX = 0; tY = 0; };
    cv.addEventListener('mousemove', onMove); cv.addEventListener('mouseleave', onLeave); cv.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('resize', resize);
    this.nebCleanup = () => { cv.removeEventListener('mousemove', onMove); cv.removeEventListener('mouseleave', onLeave); cv.removeEventListener('touchmove', onTouch); window.removeEventListener('resize', resize); };
    const loop = () => {
      if (this.nebStop) return;
      const now = performance.now() / 1000;
      spin += 0.0015; offX += (tX - offX) * 0.05; offY += (tY - offY) * 0.05;
      const ay = spin + offY, ax = offX, cy = Math.cos(ay), sy = Math.sin(ay), cx2 = Math.cos(ax), sx2 = Math.sin(ax);
      const cX = W / 2, cY = H / 2, R = Math.min(W, H) * 0.44, focal = 2.6;
      ctx.clearRect(0, 0, W, H);
      // dark "deep space" disc that fades to transparent → no hard square edges, looks right on light OR dark pages
      const bd = ctx.createRadialGradient(cX, cY, 0, cX, cY, R * 1.6);
      bd.addColorStop(0, 'rgba(6,7,18,0.94)'); bd.addColorStop(0.55, 'rgba(7,8,20,0.6)'); bd.addColorStop(1, 'rgba(7,8,20,0)');
      ctx.fillStyle = bd; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createRadialGradient(cX, cY, 0, cX, cY, R * 1.3);   // layered nebula glow (blue → violet → gold)
      cg.addColorStop(0, 'rgba(120,150,255,0.30)'); cg.addColorStop(0.4, 'rgba(165,95,235,0.17)'); cg.addColorStop(0.75, 'rgba(231,171,46,0.07)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      for (const p of pts) {
        let x = p.x * cy - p.z * sy; const z1 = p.x * sy + p.z * cy; let y = p.y;
        const y2 = y * cx2 - z1 * sx2; const z = y * sx2 + z1 * cx2; y = y2;
        const persp = focal / (focal - z); const px = cX + x * R * persp; const py = cY + y * R * persp;
        const depth = (z + 1) / 2; const size = p.s * persp * (0.7 + depth * 1.7);
        const tw = 0.65 + 0.35 * Math.sin(now * p.tw + p.ph);
        ctx.globalAlpha = Math.max(0, Math.min(1, (0.2 + depth * 0.8) * tw));
        ctx.drawImage(p.sp, px - size, py - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      this.nebRaf = requestAnimationFrame(loop);
    };
    loop();
  }
  private stopNebula(): void { this.nebStop = true; cancelAnimationFrame(this.nebRaf); if (this.nebCleanup) { this.nebCleanup(); this.nebCleanup = null; } }

  /* ---- helpers ---- */
  private currentPanel(): HTMLElement | null { return this.root.querySelector('.da-panel'); }
  private persist(): void { saveProgress(this.cfg.key, { flowKey: this.cfg.key, currentStep: this.step, answers: this.answers, updatedAt: new Date().toISOString() }); }
}

/* --------------------------------------------------------------- init -- */
const instances = new Set<string>();
function init(cfg: Config): void {
  if (!cfg || !cfg.key) { console.error('[DiscoveryAssistant] init requires { key }'); return; }
  const id = cfg.key + (cfg.target || ''); if (instances.has(id)) return; instances.add(id);
  const start = () => new Widget(cfg).mount().catch((e) => console.error('[DiscoveryAssistant]', e));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}
declare global { interface Window { DiscoveryAssistant: { init: (cfg: Config) => void }; } }
(window as Window).DiscoveryAssistant = { init };
export { init };
