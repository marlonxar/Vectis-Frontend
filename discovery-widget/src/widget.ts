/**
 * Discovery Assistant Widget — embeddable, Shadow-DOM isolated guided discovery flow.
 *   <script src="https://wearevectis.com/assets/discovery/widget.js"></script>
 *   <script>DiscoveryAssistant.init({ key: "da_vectis" });</script>
 * Supabase URL + anon key are baked in (src/config.ts); the host only passes `key`. Dark theme only.
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
interface Config { key: string; supabaseUrl?: string; supabaseAnonKey?: string; target?: string; accentColor?: string; position?: 'bottom-right' | 'bottom-left'; page?: boolean; }
interface Progress { flowKey: string; currentStep: number; answers: Record<string, string | string[]>; updatedAt: string; }

/* ----------------------------------------------------------------- i18n -- */
const STRINGS = {
  es: {
    welcomeTitle: 'Bienvenido al Discovery Assistant',
    welcome: 'La captación de información es importante para nosotros: nos permite ofrecer servicios mucho más apegados a lo que tu proyecto realmente necesita.',
    during: 'Por favor responde a la pregunta con claridad.',
    begin: 'Comenzar', next: 'Siguiente', back: 'Atrás', step: 'Paso', of: 'de', finish: 'Enviar', sending: 'Enviando…',
    required: 'Este campo es obligatorio.', invalidEmail: 'Ingresa un correo válido.',
    selectOne: 'Selecciona una opción.', optional: 'opcional',
    resumeTitle: '¿Continuar donde quedaste?', resumeBody: 'Guardamos tus respuestas anteriores.',
    continue: 'Continuar', startAgain: 'Empezar de nuevo',
    unavailable: 'Este asistente no está disponible para su organización. Por favor contacte a un administrador para habilitarlo.',
    errorLoad: 'No pudimos cargar el asistente. Intenta de nuevo.',
    errorSend: 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.',
    successTitle: '¡Gracias!', successBody: 'Recibimos tu información. Te contactaremos pronto.',
    close: 'Cerrar', listen: 'Escuchar la pregunta', mute: 'Silenciar audio', unmute: 'Activar audio', retry: 'Reintentar', selectPlaceholder: 'Selecciona…',
    audioPlay: 'Reproducir explicación', audioStop: 'Detener audio', downloadPdf: 'Descargar PDF', otherPlaceholder: 'Escribe tu opción…',
    backupNote: 'Al enviar, recibirás una copia en PDF de tus respuestas y un enlace para seguir tu proceso en el correo que indicaste.',
    sentNote: 'Te enviamos una copia en PDF y un enlace de seguimiento al correo que nos diste.',
  },
  en: {
    welcomeTitle: 'Welcome to the Discovery Assistant',
    welcome: 'Capturing your information matters to us: it lets us tailor our services much more closely to what your project really needs.',
    during: 'Please answer the question clearly.',
    begin: 'Start', next: 'Next', back: 'Back', step: 'Step', of: 'of', finish: 'Submit', sending: 'Sending…',
    required: 'This field is required.', invalidEmail: 'Enter a valid email.',
    selectOne: 'Select an option.', optional: 'optional',
    resumeTitle: 'Continue where you left off?', resumeBody: 'We saved your previous answers.',
    continue: 'Continue', startAgain: 'Start again',
    unavailable: 'This assistant is not available for your organization. Please contact an administrator to enable it.',
    errorLoad: 'We could not load the assistant. Please try again.',
    errorSend: 'Could not send. Check your connection and try again.',
    successTitle: 'Thank you!', successBody: 'We received your info. We will contact you soon.',
    close: 'Close', listen: 'Play the question', mute: 'Mute audio', unmute: 'Unmute audio', retry: 'Retry', selectPlaceholder: 'Select…',
    audioPlay: 'Play explanation', audioStop: 'Stop audio', downloadPdf: 'Download PDF', otherPlaceholder: 'Type your option…',
    backupNote: 'On submit, you will get a PDF copy of your answers and a link to follow your process at the email you provided.',
    sentNote: 'We sent a PDF copy and a tracking link to the email you gave us.',
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

.da-legend{ position:relative; z-index:1; padding:14px 0 0; font-size:14px; color:var(--da-ink-2); }
.da-progress{ position:relative; z-index:1; height:7px; background:rgba(255,255,255,.07); border-radius:7px; margin:0 0 4px; overflow:hidden; max-width:440px; box-shadow:inset 0 0 0 1px rgba(255,255,255,.05); }
.da-progress > i{ position:relative; display:block; height:100%; width:0; border-radius:7px; background:linear-gradient(90deg,#E7AB2E,#d96ee6 55%,#6aa8ff); box-shadow:0 0 14px rgba(231,171,46,.45); transition:width .55s cubic-bezier(.2,.7,.2,1); }
.da-progress > i::after{ content:''; position:absolute; inset:0; border-radius:7px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); background-size:200% 100%; animation:da-shimmer 2.2s linear infinite; }
@keyframes da-shimmer{ to{ background-position:-200% 0; } }
.da-stepno{ position:relative; z-index:1; margin:0 0 10px; font-size:12px; letter-spacing:.06em; text-transform:uppercase; font-weight:700; color:var(--da-ink-2); }

.da-qstage{ position:relative; min-height:200px; }
.da-qblock{ display:block; }
.da-qblock.da-enter-fwd{ animation:da-in-fwd .42s cubic-bezier(.2,.7,.2,1) both; }
.da-qblock.da-enter-back{ animation:da-in-back .42s cubic-bezier(.2,.7,.2,1) both; }
.da-qblock.da-leave-fwd{ animation:da-out-fwd .22s ease-in both; }
.da-qblock.da-leave-back{ animation:da-out-back .22s ease-in both; }
@keyframes da-in-fwd{ from{ opacity:0; transform:translateX(34px); } to{ opacity:1; transform:none; } }
@keyframes da-out-fwd{ from{ opacity:1; transform:none; } to{ opacity:0; transform:translateX(-34px); } }
@keyframes da-in-back{ from{ opacity:0; transform:translateX(-34px); } to{ opacity:1; transform:none; } }
@keyframes da-out-back{ from{ opacity:1; transform:none; } to{ opacity:0; transform:translateX(34px); } }

.da-audiobtn{ display:inline-flex; align-items:center; gap:8px; margin:0 0 16px; padding:10px 16px; border-radius:999px; border:1.5px solid var(--da-line);
  background:transparent; color:var(--da-ink); cursor:pointer; font:inherit; font-size:13px; font-weight:600; transition:border-color .15s ease; }
.da-audiobtn:hover{ border-color:var(--da-accent); } .da-audiobtn svg{ width:18px; height:18px; color:var(--da-accent); }
.da-audiobtn.playing{ border-color:var(--da-accent); }

.da-q{ font-size:clamp(20px,2.4vw,26px); font-weight:700; margin:0 0 8px; letter-spacing:-.01em; }
.da-help{ font-size:14px; color:var(--da-ink-2); margin:0 0 16px; }

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
.da-opt:hover{ border-color:color-mix(in srgb,var(--da-accent) 60%,var(--da-line)); } .da-opt:active{ transform:scale(.99); }
.da-opt.sel{ border-color:var(--da-accent); background:color-mix(in srgb,var(--da-accent) 12%,transparent); }
.da-opt .box{ width:20px; height:20px; flex:none; border:2px solid var(--da-line); display:inline-flex; align-items:center; justify-content:center; color:#1a1205; }
.da-opt.radio .box{ border-radius:50%; } .da-opt.check .box{ border-radius:6px; }
.da-opt.sel .box{ border-color:var(--da-accent); background:var(--da-accent); }
.da-opt .box svg{ width:13px; height:13px; opacity:0; } .da-opt.sel .box svg{ opacity:1; }
.da-opt span.lbl{ font-size:15px; }

.da-other{ animation:da-fade .25s ease both; }
.da-other[hidden]{ display:none; }
.da-other .da-input{ margin-top:8px; }
.da-err{ color:#c0392b; font-size:13px; margin:8px 0 0; min-height:18px; }
.da-onbg .da-err{ color:#ff9b8a; }

.da-foot{ position:relative; z-index:1; display:flex; gap:10px; align-items:center; padding:18px 0 0; }
.da-btn{ font:inherit; font-size:15px; font-weight:700; border-radius:12px; padding:13px 22px; min-height:48px; cursor:pointer; border:1.5px solid transparent;
  transition:transform .15s ease, filter .15s ease, opacity .15s ease; }
.da-btn:active{ transform:translateY(1px); }
.da-btn-primary{ background:var(--da-accent); color:#1a1205; margin-left:auto; }
.da-btn-primary:hover{ filter:brightness(1.04); } .da-btn-primary:disabled{ opacity:.5; cursor:not-allowed; }
.da-btn-ghost{ background:transparent; color:var(--da-ink); border-color:var(--da-line); }
.da-btn-ghost:hover{ border-color:var(--da-ink-2); }
.da-btn[hidden]{ display:none; }

.da-center{ position:relative; z-index:1; text-align:center; padding:44px 26px; }
.da-center h2{ font-size:26px; margin:0 0 10px; letter-spacing:-.01em; font-weight:800; }
.da-center p{ color:var(--da-ink-2); margin:0 auto 22px; max-width:42ch; }
.da-center .da-actions{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.da-center .da-actions .da-btn-primary, .da-actions .da-btn-primary{ margin-left:0; }   /* keep centered (override the hero's margin-left:auto) */
.da-badge{ width:56px; height:56px; border-radius:50%; margin:0 auto; display:inline-flex; align-items:center; justify-content:center;
  background:color-mix(in srgb,var(--da-accent) 18%,transparent); color:var(--da-accent); }
.da-badge svg{ width:28px; height:28px; }

.da-hero-text{ text-align:left; }
.da-page[data-screen="intro"] .da-hero-text{ animation:da-rise .7s .25s cubic-bezier(.2,.7,.2,1) both; }
.da-hero-text.da-fadeout{ animation:da-out-fwd .32s ease forwards; }
@keyframes da-rise{ from{ opacity:0; transform:translateY(18px); } to{ opacity:1; transform:none; } }
.da-hero-title{ font-size:clamp(36px,5.4vw,62px); font-weight:800; letter-spacing:-.025em; line-height:1.02; margin:0 0 18px; color:var(--da-ink); }
/* typewriter caret */
.da-q.da-typing::after{ content:'▌'; color:var(--da-accent); margin-left:2px; animation:da-caret .8s steps(1) infinite; }
@keyframes da-caret{ 50%{ opacity:0; } }
/* animated success check */
.da-badge.da-pop{ animation:da-pop .5s cubic-bezier(.2,.9,.3,1.4) both; }
@keyframes da-pop{ 0%{ transform:scale(.4); opacity:0; } 60%{ transform:scale(1.12); } 100%{ transform:scale(1); opacity:1; } }
.da-badge.da-pop svg path{ stroke-dasharray:30; stroke-dashoffset:30; animation:da-draw .5s .22s ease forwards; }
@keyframes da-draw{ to{ stroke-dashoffset:0; } }
.da-hero-sub{ color:var(--da-ink-2); font-size:clamp(15px,1.5vw,18px); line-height:1.6; margin:0 0 28px; max-width:50ch; }
.da-hero-text .da-actions{ display:flex; justify-content:flex-start; }
.da-hero-text .da-btn-primary{ margin-left:0; padding:15px 30px; font-size:16px; }

.da-spin{ width:16px; height:16px; border:2px solid rgba(0,0,0,.25); border-top-color:#1a1205; border-radius:50%; display:inline-block; animation:da-rot .7s linear infinite; vertical-align:-2px; margin-right:6px; }
@keyframes da-rot{ to{ transform:rotate(360deg); } }
@keyframes da-fade{ from{ opacity:0; } to{ opacity:1; } }

@media (max-width:560px){ .da-overlay{ padding:0; } .da-panel{ max-width:100%; max-height:100%; height:100%; border-radius:0; } }

/* ---- full-page mode (dark only) ---- */
.da-page{ position:relative; height:100vh; height:100dvh; display:flex; flex-direction:column; overflow:hidden;
  --da-ink:#f3f3f5; --da-ink-2:#a7adba; --da-surface:#16171c; --da-line:#2a2c34; color:#fff; }
.da-grad{ position:absolute; inset:0; z-index:0; background:#060509; transition:background .5s ease; }
/* keep the page glow behind the nebula only, never behind the header/footer */
.da-page[data-screen="intro"] .da-grad, .da-page[data-screen="flow"] .da-grad{ background:radial-gradient(44% 58% at 74% 50%, rgba(120,60,220,.15), transparent 70%), #060509; }
.da-pagehead{ position:relative; z-index:2; flex:0 0 auto; padding:18px 26px 14px; display:flex; align-items:center; justify-content:center; background:transparent; animation:da-fade .5s ease both; }
.da-pagehead-c{ display:flex; flex-direction:column; align-items:center; gap:8px; }
.da-pagehead img{ height:40px; width:auto; border-radius:8px; }
.da-pagetitle{ margin:0; font-size:15px; font-weight:800; letter-spacing:.01em; }
.da-pagebody{ position:relative; z-index:1; flex:1 1 auto; min-height:0; overflow-y:auto; width:100%; max-width:640px; margin:0 auto; padding:8px 22px 28px; display:flex; flex-direction:column; justify-content:flex-start; }
.da-pagebody-hero{ max-width:1280px; justify-content:center; padding:8px 34px 28px; }

/* emerge layout (resume / success): content on top, a big nebula rising from the bottom-centre */
.da-pagebody-emerge{ position:relative; max-width:none; justify-content:flex-start; align-items:center; padding:clamp(18px,4vh,56px) 22px 0; overflow:hidden; }
.da-emerge-content{ position:relative; z-index:2; width:100%; max-width:560px; margin:0 auto; }
.da-emerge-visual{ position:absolute; left:50%; bottom:0; z-index:0; width:min(860px,108vw); transform:translate(-50%,52%);
  transition:left .85s cubic-bezier(.4,0,.2,1), transform .85s cubic-bezier(.4,0,.2,1), opacity .6s ease; pointer-events:none; }
.da-emerge-visual .da-neb-wrap{ max-width:none; width:100%; }
.da-emerge-visual.da-slide-right{ left:96%; transform:translate(-50%,52%) scale(.82); }
.da-page[data-screen="resume"] .da-pagefoot, .da-page[data-screen="success"] .da-pagefoot{ text-align:right; }

/* split: content left, nebula right (used for hero + the form) */
.da-split{ display:grid; grid-template-columns:1.05fr .95fr; align-items:center; gap:clamp(20px,4vw,56px); width:100%; }
.da-stage-left{ text-align:left; min-width:0; }
.da-stage-left.da-leftin{ animation:da-in-fwd .5s cubic-bezier(.2,.7,.2,1) both; }
.da-hero-visual{ position:relative; display:flex; align-items:center; justify-content:center; }
.da-neb-wrap{ position:relative; width:100%; max-width:480px; margin:0 auto; transition:max-width .6s cubic-bezier(.4,0,.2,1), transform .4s cubic-bezier(.2,.7,.2,1); will-change:transform; }
.da-page[data-screen="intro"] .da-split{ grid-template-columns:0.9fr 1.1fr; }
.da-page[data-screen="intro"] .da-neb-wrap{ max-width:min(780px,54vw); }
.da-page[data-screen="flow"] .da-neb-wrap{ max-width:460px; }
.da-neb{ width:100%; aspect-ratio:1/1; height:auto; display:block; transition:filter .9s ease; }
.da-neb-audio{ position:absolute; top:9%; right:9%; z-index:3; width:44px; height:44px; border-radius:50%; border:1px solid var(--da-line);
  background:rgba(255,255,255,.06); color:#fff; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; backdrop-filter:blur(6px); transition:border-color .2s ease, transform .15s ease, color .2s ease; }
.da-neb-audio:hover{ border-color:var(--da-accent); } .da-neb-audio:active{ transform:scale(.92); } .da-neb-audio svg{ width:19px; height:19px; }
.da-neb-audio.playing{ border-color:var(--da-accent); color:var(--da-accent); animation:da-pulse 1.2s ease-in-out infinite; }
@keyframes da-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.09); } }
.da-note{ font-size:13px; line-height:1.5; color:var(--da-ink-2); margin:14px 0 0; max-width:46ch; }
.da-center .da-note{ margin:0 auto 18px; text-align:center; }

.da-page-centered{ width:100%; max-width:560px; margin:0 auto; }

.da-pagefoot{ position:relative; z-index:2; flex:0 0 auto; padding:14px 24px 18px; text-align:center; font-size:13px; color:rgba(255,255,255,.8); background:transparent; pointer-events:none; }
.da-pagefoot a{ pointer-events:auto; }
.da-pagefoot a{ color:var(--da-accent); text-decoration:none; font-weight:700; } .da-pagefoot a:hover{ text-decoration:underline; }

@media (max-width:820px){
  .da-split, .da-page[data-screen="intro"] .da-split{ grid-template-columns:1fr; gap:8px; text-align:center; }
  .da-stage-left{ text-align:center; order:2; }
  .da-hero-visual{ order:1; }
  .da-hero-text .da-actions{ justify-content:center; }
  .da-hero-sub{ margin-left:auto; margin-right:auto; }
  .da-progress, .da-stepno, .da-legend, .da-foot{ text-align:left; }
  .da-foot{ justify-content:center; flex-wrap:wrap; }
  .da-page[data-screen="intro"] .da-neb-wrap,
  .da-page[data-screen="flow"] .da-neb-wrap{ max-width:320px; }
}

@media (prefers-reduced-motion: reduce){ .da-overlay,.da-panel,.da-btn{ transition:none; }
  .da-qblock,.da-pagehead,.da-stage-left,.da-audiobtn.playing,.da-hero-text,.da-badge.da-pop,.da-badge.da-pop svg path{ animation:none; }
  .da-q.da-typing::after{ content:none; } }
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
  spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  spkOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isVideo = (u: string) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(u);
function esc(s: string): string { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }

/* Minimal text PDF writer (Helvetica/WinAnsi), multi-page, dependency-free. */
function pdfEsc(s: string): string {
  return s.replace(/[‒-―]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...')
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function pdfWrap(text: string, max: number): string[] {
  const out: string[] = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean); let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur); cur = w; } else cur = (cur ? cur + ' ' : '') + w; }
    out.push(cur);
  }
  return out.length ? out : [''];
}
function buildPdf(title: string, subtitle: string, rows: { q: string; a: string }[]): Uint8Array {
  const PW = 595, PH = 842, M = 56, LH = 15;
  const pages: string[][] = []; let ops: string[] = []; let y = PH - M;
  const newPage = () => { pages.push(ops); ops = []; y = PH - M; };
  const line = (s: string, x: number, font: string, size: number, gray?: number) => {
    if (y - LH < M) newPage();
    ops.push(`BT /${font} ${size} Tf ${gray != null ? `${gray} ${gray} ${gray}` : '0 0 0'} rg 1 0 0 1 ${x} ${y} Tm (${pdfEsc(s)}) Tj ET`); y -= LH;
  };
  line(title, M, 'F2', 18); y -= 9;
  if (subtitle) { line(subtitle, M, 'F1', 10, 0.45); y -= 8; }
  for (const r of rows) {
    for (const l of pdfWrap(r.q, 84)) line(l, M, 'F2', 11, 0.05);
    for (const l of pdfWrap(r.a, 92)) line(l, M + 14, 'F1', 11, 0.2);
    y -= 8;
  }
  newPage();
  const bytes: number[] = []; const off: number[] = [];
  const push = (s: string) => { for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); bytes.push(c < 256 ? c : 63); } };
  const obj = (id: number, body: string) => { off[id] = bytes.length; push(`${id} 0 obj\n${body}\nendobj\n`); };
  push('%PDF-1.4\n');
  const n = pages.length, maxId = 4 + 2 * n;
  obj(1, '<</Type /Catalog /Pages 2 0 R>>');
  obj(2, `<</Type /Pages /Kids [${pages.map((_, i) => `${5 + 2 * i} 0 R`).join(' ')}] /Count ${n}>>`);
  obj(3, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>');
  obj(4, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>');
  pages.forEach((arr, i) => {
    const pid = 5 + 2 * i, cid = 6 + 2 * i; const content = arr.join('\n');
    obj(pid, `<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources <</Font <</F1 3 0 R /F2 4 0 R>>>> /Contents ${cid} 0 R>>`);
    obj(cid, `<</Length ${content.length}>>\nstream\n${content}\nendstream`);
  });
  const xref = bytes.length;
  push(`xref\n0 ${maxId + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= maxId; id++) push(`${String(off[id] || 0).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<</Size ${maxId + 1} /Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`);
  return new Uint8Array(bytes);
}

/* -------------------------------------------------------------- widget -- */
class Widget {
  private root!: ShadowRoot; private host!: HTMLElement; private api: Api;
  private t = STRINGS.es; private flow: Flow | null = null; private questions: Question[] = [];
  private answers: Record<string, string | string[]> = {};
  private step = 1; private transitioning = false;
  private screen: 'intro' | 'resume' | 'flow' | 'success' | 'unavailable' | 'error' = 'intro';
  private viewed = false; private audioEl: HTMLAudioElement | null = null; private audioBtn: HTMLElement | null = null;
  private accent = '#E7AB2E'; private overlayEl: HTMLElement | null = null; private launcher: HTMLButtonElement | null = null; private pageMode = false;
  private nebRaf = 0; private nebStop = true; private nebCleanup: (() => void) | null = null; private nebBoost = 0;
  private nebBurst = 0; private nebCanvas: HTMLCanvasElement | null = null; private twTimer = 0;
  private nebTint: [number, number, number] = [150, 80, 240]; private nebTintCur: [number, number, number] = [150, 80, 240];

  constructor(private cfg: Config) {
    this.api = new Api(cfg.supabaseUrl || SUPABASE_URL, cfg.supabaseAnonKey || SUPABASE_ANON_KEY);
    if (cfg.accentColor) this.accent = cfg.accentColor;
    this.pageMode = !!cfg.page;
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

  private splitScreen(): boolean { return this.pageMode && (this.screen === 'intro' || this.screen === 'flow'); }

  /* ---- popup / inline shell ---- */
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
    panel.innerHTML = this.bgHtml() + (this.screen === 'intro' ? '' : this.headHtml()) + `<div class="da-body">${this.contentHtml()}</div>`;
    const ex = mount.querySelector('.da-panel'); ex ? ex.replaceWith(panel) : mount.appendChild(panel);
    this.afterRender(panel);
  }

  /* ---- full-page shell ---- */
  private renderPage(): void {
    this.root.querySelectorAll('.da-page').forEach((n) => n.remove());
    const wrap = document.createElement('div'); wrap.className = 'da-root da-page'; wrap.setAttribute('data-screen', this.screen); wrap.style.setProperty('--da-accent', this.accent);
    const hasBg = !!this.flow?.background_url && this.screen !== 'unavailable' && this.screen !== 'error';
    const bg = hasBg ? this.bgHtml() : `<div class="da-grad" aria-hidden="true"></div>`;
    const logo = this.flow?.logo_url ? `<img class="da-logo" src="${esc(this.flow.logo_url)}" alt="" />` : '';
    const title = this.screen === 'intro' ? '' : `<p class="da-pagetitle">${esc(DA_TITLE)}</p>`;   // hero: logo only
    let body: string;
    if (this.splitScreen()) {
      body = `<main class="da-pagebody da-pagebody-hero"><div class="da-split">
          <div class="da-stage-left" data-left>${this.contentHtml()}</div>
          <div class="da-hero-visual"><div class="da-neb-wrap">
            <canvas class="da-neb" data-neb aria-hidden="true"></canvas>
            <button class="da-neb-audio" data-act="audio" aria-label="${esc(this.t.audioPlay)}">${I.spk}</button>
          </div></div></div></main>`;
    } else if (this.screen === 'resume' || this.screen === 'success') {
      body = `<main class="da-pagebody da-pagebody-emerge">
          <div class="da-emerge-content">${this.contentHtml()}</div>
          <div class="da-emerge-visual"><div class="da-neb-wrap"><canvas class="da-neb" data-neb aria-hidden="true"></canvas></div></div>
        </main>`;
    } else {
      body = `<main class="da-pagebody"><div class="da-page-centered">${this.contentHtml()}</div></main>`;
    }
    wrap.innerHTML = `${bg}<header class="da-pagehead"><div class="da-pagehead-c">${logo}${title}</div></header>${body}<footer class="da-pagefoot">Producto desarrollado por <a href="https://www.wearevectis.com" target="_blank" rel="noopener">Vectis</a></footer>`;
    this.root.appendChild(wrap);
    this.afterRender(wrap);
  }

  private afterRender(root: HTMLElement): void {
    this.wireShell(root);
    const neb = root.querySelector<HTMLCanvasElement>('[data-neb]'); if (neb) this.startNebula(neb);
    this.wireParallax(root);
    if (this.screen === 'flow') this.mountStep('fwd', false);
    else { const f = root.querySelector<HTMLElement>('button.da-btn-primary,.da-opt,input,textarea,select'); f && setTimeout(() => f.focus(), 60); }
  }

  // The nebula gently follows the cursor across the whole page (parallax drift).
  private wireParallax(root: HTMLElement): void {
    const page = root.querySelector<HTMLElement>('.da-page') || (root.classList.contains('da-page') ? root : null);
    const wrap = root.querySelector<HTMLElement>('.da-neb-wrap'); if (!page || !wrap) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; const r = page.getBoundingClientRect();
        const nx = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
        const ny = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
        wrap.style.transform = `translate(${(nx * 34).toFixed(1)}px, ${(ny * 28).toFixed(1)}px)`;
      });
    };
    page.addEventListener('mousemove', onMove);
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

  // Content for the active screen (used as left column in split, or inside the card/overlay).
  private contentHtml(): string {
    const closeActions = this.cfg.target ? '' : `<div class="da-actions"><button class="da-btn da-btn-ghost" data-act="close">${esc(this.t.close)}</button></div>`;
    switch (this.screen) {
      case 'unavailable': return `<div class="da-center"><h2>${esc(DA_TITLE)}</h2><p>${esc(this.t.unavailable)}</p>${closeActions}</div>`;
      case 'error': return `<div class="da-center"><h2>:(</h2><p>${esc(this.t.errorLoad)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="retry">${esc(this.t.retry)}</button></div></div>`;
      case 'success': return `<div class="da-center"><span class="da-badge da-pop">${I.ok}</span><h2>${esc(this.t.successTitle)}</h2><p>${esc(this.t.successBody)}</p><p class="da-note">${esc(this.t.sentNote)}</p><div class="da-actions"><button class="da-btn da-btn-ghost" data-act="pdf">${esc(this.t.downloadPdf)}</button>${this.cfg.target ? '' : `<button class="da-btn da-btn-primary" data-act="close">${esc(this.t.close)}</button>`}</div></div>`;
      case 'resume': return `<div class="da-center"><h2>${esc(this.t.resumeTitle)}</h2><p>${esc(this.t.resumeBody)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="resume">${esc(this.t.continue)}</button><button class="da-btn da-btn-ghost" data-act="restart">${esc(this.t.startAgain)}</button></div></div>`;
      case 'intro':
        return `<div class="da-hero-text"><h1 class="da-hero-title">${esc(this.t.welcomeTitle)}</h1><p class="da-hero-sub">${esc(this.t.welcome)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="begin">${esc(this.t.begin)}</button></div></div>`;
      default: { // flow
        const last = this.step >= this.questions.length;
        return `${this.progressHtml()}<p class="da-legend">${esc(this.t.during)}</p>
          <div class="da-qstage" data-stage></div>
          <p class="da-note" data-note ${last ? '' : 'hidden'}>${esc(this.t.backupNote)}</p>
          <div class="da-foot">
            <button class="da-btn da-btn-ghost" data-act="back" ${this.step <= 1 ? 'hidden' : ''}>${esc(this.t.back)}</button>
            <button class="da-btn da-btn-ghost" data-act="pdf" data-pdf ${last ? '' : 'hidden'}>${esc(this.t.downloadPdf)}</button>
            <button class="da-btn da-btn-primary" data-act="${last ? 'submit' : 'next'}">${last ? esc(this.t.finish) : esc(this.t.next)}</button>
          </div>`;
      }
    }
  }
  private progressHtml(): string {
    const n = Math.max(1, this.questions.length); const pct = Math.round((this.step / n) * 100);
    return `<p class="da-stepno">${esc(this.t.step)} ${this.step} ${esc(this.t.of)} ${this.questions.length}</p><div class="da-progress"><i style="width:${pct}%"></i></div>`;
  }

  /* ---- one question at a time ---- */
  private buildQuestionBlock(index: number): HTMLElement {
    const q = this.questions[index - 1];
    const block = document.createElement('div'); block.className = 'da-qblock'; block.setAttribute('data-block', String(index));
    block.innerHTML =
      `<h3 class="da-q" data-q><span data-qtext></span>${q.required ? '' : ` <span style="font-weight:500;font-size:14px;color:var(--da-ink-2)">(${esc(this.t.optional)})</span>`}</h3>
       ${q.help_text ? `<p class="da-help">${esc(q.help_text)}</p>` : ''}
       ${this.fieldHtml(q)}
       <p class="da-err" data-err role="alert"></p>`;
    this.wireBlock(block, q);
    return block;
  }
  private mountStep(dir: 'fwd' | 'back', animate: boolean): void {
    const stage = this.currentPanel()?.querySelector<HTMLElement>('[data-stage]'); if (!stage) return;
    clearTimeout(this.twTimer); stage.innerHTML = '';
    const q = this.questions[this.step - 1];
    const block = this.buildQuestionBlock(this.step);
    if (animate) block.classList.add(dir === 'back' ? 'da-enter-back' : 'da-enter-fwd');
    stage.appendChild(block);
    this.nebSetSection();
    const qtext = block.querySelector<HTMLElement>('[data-qtext]'); const qh = block.querySelector<HTMLElement>('.da-q');
    if (qtext && q) this.typewrite(qtext, qh, q.label, () => this.nebPulse());
    const fld = block.querySelector<HTMLElement>('input,textarea,select,.da-opt'); fld && setTimeout(() => fld.focus(), animate ? 120 : 60);
  }
  // Reveal each question character-by-character; flash the nebula when it finishes.
  private typewrite(el: HTMLElement, qh: HTMLElement | null, text: string, done?: () => void): void {
    let reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* noop */ }
    if (reduce) { el.textContent = text; done && done(); return; }
    el.textContent = ''; qh && qh.classList.add('da-typing'); let i = 0;
    const tick = () => {
      if (!el.isConnected) { qh && qh.classList.remove('da-typing'); return; }
      el.textContent = text.slice(0, i); i++;
      if (i <= text.length) this.twTimer = window.setTimeout(tick, 16);
      else { qh && qh.classList.remove('da-typing'); done && done(); }
    };
    tick();
  }
  // Nebula tint shifts by section to convey progress (start → cyan, mid → violet, end → gold).
  private nebSetSection(): void {
    const n = Math.max(1, this.questions.length), p = this.step / n;
    this.nebTint = p <= 0.34 ? [40, 190, 225] : p <= 0.67 ? [150, 80, 240] : [231, 171, 46];
    if (this.nebCanvas) this.nebCanvas.style.filter = p <= 0.34 ? 'hue-rotate(-30deg) saturate(1.08)' : p <= 0.67 ? 'none' : 'hue-rotate(64deg) saturate(1.12)';
  }

  private fieldHtml(q: Question): string {
    const v = this.answers[q.key]; const sv = typeof v === 'string' ? v : ''; const av = Array.isArray(v) ? v : [];
    switch (q.type) {
      case 'TEXTAREA': return `<label class="da-field"><textarea class="da-textarea" data-input placeholder="${esc(q.placeholder || '')}">${esc(sv)}</textarea></label>`;
      case 'EMAIL': return `<label class="da-field"><input class="da-input" type="email" inputmode="email" autocomplete="email" data-input placeholder="${esc(q.placeholder || '')}" value="${esc(sv)}" /></label>`;
      case 'PHONE': return `<label class="da-field"><input class="da-input" type="tel" inputmode="tel" autocomplete="tel" data-input placeholder="${esc(q.placeholder || '')}" value="${esc(sv)}" /></label>`;
      case 'SELECT': return `<label class="da-field"><select class="da-select" data-input><option value="">${esc(q.placeholder || this.t.selectPlaceholder)}</option>${q.options.map((o) => `<option value="${esc(o)}"${o === sv ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
      case 'RADIO': {
        const other = q.options.find((o) => this.isOther(o)); const oTxt = (this.answers[q.key + '__other'] as string) || '';
        return `<div class="da-options" role="radiogroup">${q.options.map((o) => `<div class="da-opt radio${o === sv ? ' sel' : ''}" data-opt="${esc(o)}" role="radio" tabindex="0" aria-checked="${o === sv}"><span class="box">${I.check}</span><span class="lbl">${esc(o)}</span></div>`).join('')}${other ? `<div class="da-other" data-other${sv === other ? '' : ' hidden'}><input type="text" class="da-input" data-other-input placeholder="${esc(this.t.otherPlaceholder)}" value="${esc(oTxt)}" /></div>` : ''}</div>`;
      }
      case 'CHECKBOX': {
        const other = q.options.find((o) => this.isOther(o)); const oTxt = (this.answers[q.key + '__other'] as string) || '';
        return `<div class="da-options">${q.options.map((o) => `<div class="da-opt check${av.includes(o) ? ' sel' : ''}" data-optm="${esc(o)}" role="checkbox" tabindex="0" aria-checked="${av.includes(o)}"><span class="box">${I.check}</span><span class="lbl">${esc(o)}</span></div>`).join('')}${other ? `<div class="da-other" data-other${av.includes(other) ? '' : ' hidden'}><input type="text" class="da-input" data-other-input placeholder="${esc(this.t.otherPlaceholder)}" value="${esc(oTxt)}" /></div>` : ''}</div>`;
      }
      default: return `<label class="da-field"><input class="da-input" type="text" data-input placeholder="${esc(q.placeholder || '')}" value="${esc(sv)}" /></label>`;
    }
  }

  /* ---- wiring ---- */
  private wireShell(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('[data-act]').forEach((el) => {
      if (el.closest('[data-stage]')) return;   // question-level controls are wired in wireBlock
      el.addEventListener('click', () => this.act(el.getAttribute('data-act')!, el));
    });
  }
  private wireLeft(left: HTMLElement): void {
    left.querySelectorAll<HTMLElement>('[data-act]').forEach((el) => { if (!el.closest('[data-stage]')) el.addEventListener('click', () => this.act(el.getAttribute('data-act')!, el)); });
  }
  private wireBlock(block: HTMLElement, q: Question): void {
    const input = block.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-input]');
    if (input) {
      const upd = () => { this.answers[q.key] = input.value; this.persist(); };
      input.addEventListener('input', upd); input.addEventListener('change', upd);
      if (q.type === 'SELECT') input.addEventListener('change', () => { if (input.value) this.autoAdvance(); });
      if (q.type === 'TEXT' || q.type === 'EMAIL' || q.type === 'PHONE') input.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); this.goNext(); } });
    }
    const otherWrap = block.querySelector<HTMLElement>('[data-other]');
    const otherInput = block.querySelector<HTMLInputElement>('[data-other-input]');
    const showOther = (on: boolean) => { if (!otherWrap) return; if (on) { otherWrap.removeAttribute('hidden'); setTimeout(() => otherInput?.focus(), 20); } else otherWrap.setAttribute('hidden', ''); };
    if (otherInput) {
      const upd = () => { this.answers[q.key + '__other'] = otherInput.value; this.persist(); const e = block.querySelector<HTMLElement>('[data-err]'); if (e) e.textContent = ''; };
      otherInput.addEventListener('input', upd);
      otherInput.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); this.goNext(); } });
    }
    block.querySelectorAll<HTMLElement>('[data-opt]').forEach((el) => {
      const pick = () => {
        const val = el.getAttribute('data-opt')!; this.answers[q.key] = val; this.persist();
        block.querySelectorAll('.da-opt').forEach((o) => { o.classList.remove('sel'); o.setAttribute('aria-checked', 'false'); });
        el.classList.add('sel'); el.setAttribute('aria-checked', 'true');
        const e = block.querySelector<HTMLElement>('[data-err]'); if (e) e.textContent = '';
        const o = this.isOther(val); showOther(o);
        if (!o) this.autoAdvance();   // don't auto-advance when "Other" needs a written answer
      };
      el.addEventListener('click', pick);
      el.addEventListener('keydown', (ev) => { const k = (ev as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { ev.preventDefault(); pick(); } });
    });
    block.querySelectorAll<HTMLElement>('[data-optm]').forEach((el) => {
      const toggle = () => {
        const o = el.getAttribute('data-optm')!; const cur = Array.isArray(this.answers[q.key]) ? [...(this.answers[q.key] as string[])] : [];
        const i = cur.indexOf(o); i >= 0 ? cur.splice(i, 1) : cur.push(o); this.answers[q.key] = cur; this.persist();
        const on = cur.includes(o); el.classList.toggle('sel', on); el.setAttribute('aria-checked', String(on));
        if (this.isOther(o)) showOther(on);
        const e = block.querySelector<HTMLElement>('[data-err]'); if (e) e.textContent = '';
      };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', (ev) => { const k = (ev as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { ev.preventDefault(); toggle(); } });
    });
  }
  private isOther(o: string): boolean { return /^(otros?|otras?|other)$/i.test(o.trim()); }
  // Merge "Other" free-text into the saved answers (drops the __other helper keys).
  private finalAnswers(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const q of this.questions) {
      const v = this.answers[q.key]; const other = q.options.find((o) => this.isOther(o)); const ot = ((this.answers[q.key + '__other'] as string) || '').trim();
      if (Array.isArray(v)) out[q.key] = v.map((x) => (other && x === other && ot) ? ot : x);
      else if (typeof v === 'string' && v !== '') out[q.key] = (other && v === other && ot) ? ot : v;
    }
    return out;
  }

  private autoAdvance(): void { if (this.step < this.questions.length && !this.transitioning) setTimeout(() => this.goNext(), 320); }

  private async act(a: string, el?: HTMLElement): Promise<void> {
    switch (a) {
      case 'close': this.close(); break;
      case 'retry': this.flow = null; this.screen = 'intro'; await this.open(); break;
      case 'begin': this.startFlow(); break;
      case 'resume': this.slideToFlow(false); break;
      case 'restart': this.slideToFlow(true); break;
      case 'back': this.goBack(); break;
      case 'next': this.goNext(); break;
      case 'submit': await this.onSubmit(); break;
      case 'audio': if (el) this.playContextAudio(el); break;
      case 'pdf': this.downloadPdf(); break;
    }
  }

  // Enter the form. In split mode, swap only the left column (keeps the nebula running) + animate.
  private startFlow(): void {
    this.stopAudio();
    const left = this.root.querySelector<HTMLElement>('[data-left]');
    const page = this.root.querySelector<HTMLElement>('.da-page');
    if (!left || !page) { this.screen = 'flow'; this.step = 1; this.persist(); this.renderPanel(); return; }
    const hero = left.querySelector<HTMLElement>('.da-hero-text');
    page.setAttribute('data-screen', 'flow');   // nebula shrinks (CSS) + ring fades in while the hero text leaves
    this.nebPulse();
    if (hero) hero.classList.add('da-fadeout');
    window.setTimeout(() => {
      this.screen = 'flow'; this.step = 1; this.persist();
      left.innerHTML = this.contentHtml(); this.wireLeft(left);
      left.classList.remove('da-leftin'); void left.offsetWidth; left.classList.add('da-leftin');
      this.mountStep('fwd', true);
    }, 320);
  }

  // From the resume screen: slide the big centred nebula to the right, then reveal the form.
  private slideToFlow(reset: boolean): void {
    this.stopAudio();
    if (reset) { this.answers = {}; this.step = 1; clearProgress(this.cfg.key); }
    const vis = this.root.querySelector<HTMLElement>('.da-emerge-visual');
    const content = this.root.querySelector<HTMLElement>('.da-emerge-content');
    if (vis) {
      this.nebPulse(); vis.classList.add('da-slide-right');
      if (content) { content.style.transition = 'opacity .45s ease, transform .45s ease'; content.style.opacity = '0'; content.style.transform = 'translateY(-12px)'; }
      setTimeout(() => { this.screen = 'flow'; this.renderPanel(); }, 720);
    } else { this.screen = 'flow'; this.renderPanel(); }
  }

  private goNext(): void {
    if (this.transitioning) return;
    if (!this.validateCurrent()) return;
    if (this.step >= this.questions.length) { void this.onSubmit(); return; }
    this.stopAudio(); this.transition('fwd', this.step + 1);
  }
  private goBack(): void { if (this.transitioning || this.step <= 1) return; this.stopAudio(); this.transition('back', this.step - 1); }
  private transition(dir: 'fwd' | 'back', toStep: number): void {
    const stage = this.currentPanel()?.querySelector<HTMLElement>('[data-stage]');
    const cur = stage?.firstElementChild as HTMLElement | null;
    this.transitioning = true; this.nebPulse();
    if (cur) cur.className = 'da-qblock ' + (dir === 'fwd' ? 'da-leave-fwd' : 'da-leave-back');
    this.step = toStep; this.persist();
    setTimeout(() => { this.mountStep(dir, true); this.updateControls(); this.transitioning = false; }, cur ? 220 : 0);
  }
  private updateControls(): void {
    const panel = this.currentPanel(); if (!panel) return;
    const bar = panel.querySelector<HTMLElement>('.da-progress > i'); if (bar) bar.style.width = `${Math.round((this.step / Math.max(1, this.questions.length)) * 100)}%`;
    const sn = panel.querySelector<HTMLElement>('.da-stepno'); if (sn) sn.textContent = `${this.t.step} ${this.step} ${this.t.of} ${this.questions.length}`;
    const back = panel.querySelector<HTMLButtonElement>('.da-foot [data-act="back"]'); if (back) { if (this.step <= 1) back.setAttribute('hidden', ''); else back.removeAttribute('hidden'); }
    const last = this.step >= this.questions.length;
    const prim = panel.querySelector<HTMLButtonElement>('.da-foot .da-btn-primary'); if (prim) { prim.setAttribute('data-act', last ? 'submit' : 'next'); prim.textContent = last ? this.t.finish : this.t.next; }
    const pdf = panel.querySelector<HTMLElement>('[data-pdf]'); if (pdf) { if (last) pdf.removeAttribute('hidden'); else pdf.setAttribute('hidden', ''); }
    const note = panel.querySelector<HTMLElement>('[data-note]'); if (note) { if (last) note.removeAttribute('hidden'); else note.setAttribute('hidden', ''); }
  }

  private validateCurrent(): boolean {
    const q = this.questions[this.step - 1]; const block = this.currentPanel()?.querySelector<HTMLElement>(`[data-block="${this.step}"]`);
    const errEl = block?.querySelector<HTMLElement>('[data-err]'); const set = (m: string) => { if (errEl) errEl.textContent = m; };
    const v = this.answers[q.key];
    const empty = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
    if (q.required && empty) { set(q.type === 'RADIO' || q.type === 'CHECKBOX' || q.type === 'SELECT' ? this.t.selectOne : this.t.required); return false; }
    const other = q.options.find((o) => this.isOther(o));
    if (other && q.required) { const chosen = q.type === 'CHECKBOX' ? (Array.isArray(v) && v.includes(other)) : v === other; if (chosen && !((this.answers[q.key + '__other'] as string) || '').trim()) { set(this.t.required); return false; } }
    if (q.type === 'EMAIL' && typeof v === 'string' && v.trim() && !EMAIL_RE.test(v.trim())) { set(this.t.invalidEmail); return false; }
    set(''); return true;
  }
  private firstInvalid(): number {
    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i]; const v = this.answers[q.key];
      const empty = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
      if (q.required && empty) return i + 1;
      const other = q.options.find((o) => this.isOther(o));
      if (other && q.required) { const chosen = q.type === 'CHECKBOX' ? (Array.isArray(v) && v.includes(other)) : v === other; if (chosen && !((this.answers[q.key + '__other'] as string) || '').trim()) return i + 1; }
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
    try {
      await this.api.submit(this.flow.id, this.finalAnswers()); clearProgress(this.cfg.key); this.stopAudio();
      this.nebExplode();   // celebration: the nebula bursts, then reforms on the success screen
      setTimeout(() => { this.screen = 'success'; this.renderPanel(); }, 850);
    }
    catch {
      if (b) { b.disabled = false; b.textContent = this.t.finish; }
      const e = this.currentPanel()?.querySelector<HTMLElement>(`[data-block="${this.step}"] [data-err]`); if (e) e.textContent = this.t.errorSend;
    }
  }

  /* ---- audio: the nebula button plays the explanation of the current context (or stops it) ---- */
  private playContextAudio(btn: HTMLElement): void {
    if (this.audioBtn === btn) { this.stopAudio(); return; }   // already playing → stop (mute)
    this.stopAudio();
    let text = '', url: string | null = null;
    if (this.screen === 'flow') { const q = this.questions[this.step - 1]; if (q) { url = q.audio_url; text = q.label + (q.help_text ? '. ' + q.help_text : ''); } }
    else { text = this.t.welcomeTitle + '. ' + this.t.welcome; }
    this.speakText(text, url, btn);
  }
  private speakText(text: string, url: string | null, btn: HTMLElement): void {
    this.audioBtn = btn; btn.classList.add('playing'); btn.setAttribute('aria-label', this.t.audioStop);
    if (url) {
      this.audioEl = new Audio(url); this.audioEl.play().catch(() => this.stopAudio());
      this.audioEl.onended = () => this.stopAudio();
    } else if ('speechSynthesis' in window && text) {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = this.flow?.language === 'en' ? 'en-US' : 'es-ES'; u.onend = () => this.stopAudio();
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      } catch { this.stopAudio(); }
    } else { this.stopAudio(); }
  }
  private stopAudio(): void {
    if (this.audioEl) { try { this.audioEl.pause(); } catch { /* noop */ } this.audioEl = null; }
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch { /* noop */ }
    if (this.audioBtn) { this.audioBtn.classList.remove('playing'); this.audioBtn.setAttribute('aria-label', this.t.audioPlay); this.audioBtn = null; }
  }

  /* ---- PDF backup of answers (self-contained, no deps) ---- */
  private downloadPdf(): void {
    const fa = this.finalAnswers();
    const rows = this.questions.map((q) => {
      const v = fa[q.key]; const a = Array.isArray(v) ? v.join(', ') : (typeof v === 'string' ? v : '');
      return { q: q.label, a: a || '—' };
    });
    const title = this.flow?.name || DA_TITLE;
    const subtitle = `${DA_TITLE} · ${new Date().toLocaleString(this.flow?.language === 'en' ? 'en-US' : 'es-ES')}`;
    const bytes = buildPdf(title, subtitle, rows);
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `${(this.flow?.public_key || 'respuestas')}-respuestas.pdf`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ---- energy nebula: rotating plasma, transparent trails (no box / no clipping) ----
     Fixed internal resolution (L) drawn once; CSS scales the canvas → the hero→form
     shrink is a smooth CSS transition with no redraw/flicker. */
  private startNebula(cv: HTMLCanvasElement): void {
    const ctx = cv.getContext('2d'); if (!ctx) return;
    this.stopNebula(); this.nebStop = false; this.nebCanvas = cv; this.nebSetSection();
    const L = 600, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.floor(L * dpr); cv.height = Math.floor(L * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, L, L);
    const sprite = (r: number, g: number, b: number) => { const d = 28, c = document.createElement('canvas'); c.width = d; c.height = d; const x = c.getContext('2d')!; const gr = x.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2); gr.addColorStop(0, `rgba(${r},${g},${b},0.95)`); gr.addColorStop(0.4, `rgba(${r},${g},${b},0.32)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, d, d); return c; };
    const cP = sprite(168, 85, 247), cV = sprite(139, 92, 246), cC = sprite(34, 211, 238), cB = sprite(96, 165, 250), cM = sprite(217, 110, 230), cW = sprite(214, 225, 255);
    const palette = [cP, cP, cV, cC, cC, cB, cM, cW];
    const R = L * 0.42, ccx = L / 2, ccy = L / 2;
    type P = { x: number; y: number; sp: HTMLCanvasElement; sz: number; life: number; max: number };
    const spawn = (p: P, center?: boolean) => { const a = Math.random() * 6.283, rr = (center ? Math.random() * 14 : Math.random() * R * 0.55); p.x = ccx + Math.cos(a) * rr; p.y = ccy + Math.sin(a) * rr; p.sp = palette[(Math.random() * palette.length) | 0]; p.sz = 2 + Math.random() * 6.5; p.max = 120 + Math.random() * 240; p.life = Math.random() * p.max; };
    const N = 900;
    const pts: P[] = []; for (let i = 0; i < N; i++) { const p: P = { x: 0, y: 0, sp: cP, sz: 3, life: 0, max: 200 }; spawn(p, true); pts.push(p); }   // ignite from a point
    let mx = -9999, my = -9999, active = false;
    const map = (cx: number, cy: number) => { const r = cv.getBoundingClientRect(); const s = L / Math.max(1, r.width); mx = (cx - r.left) * s; my = (cy - r.top) * s; active = true; };
    const onMove = (e: MouseEvent) => map(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const tt = e.touches[0]; if (tt) map(tt.clientX, tt.clientY); };
    const onLeave = () => { active = false; };
    cv.addEventListener('mousemove', onMove); cv.addEventListener('mouseleave', onLeave); cv.addEventListener('touchmove', onTouch, { passive: true });
    this.nebCleanup = () => { cv.removeEventListener('mousemove', onMove); cv.removeEventListener('mouseleave', onLeave); cv.removeEventListener('touchmove', onTouch); };
    const start = performance.now(); let t = 0;
    const step = () => {
      const now = performance.now();
      const ignite = Math.min(1, (now - start) / 850);                 // fade up from the ignition point
      const boost = now < this.nebBoost ? 1 : 0;
      const burst = now < this.nebBurst ? (1 - (this.nebBurst - now) / 900) : -1;   // 0→1 over the burst; -1 when idle
      const tc = this.nebTintCur; for (let k = 0; k < 3; k++) tc[k] += (this.nebTint[k] - tc[k]) * 0.04;   // ease tint toward section colour
      ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(0, 0, L, L);
      ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, R * 1.25);   // volumetric bloom, tinted by section
      cg.addColorStop(0, `rgba(${tc[0] | 0},${tc[1] | 0},${tc[2] | 0},${(0.10 + boost * 0.06) * ignite})`); cg.addColorStop(0.5, `rgba(40,190,225,${(0.05 + boost * 0.04) * ignite})`); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, L, L);
      if (now - start < 380) { const fl = 1 - (now - start) / 380; const fg = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, R * 0.6); fg.addColorStop(0, `rgba(220,230,255,${0.5 * fl})`); fg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = fg; ctx.fillRect(0, 0, L, L); }
      const spin = 0.016 + boost * 0.01;
      for (const p of pts) {
        const s = 0.006;
        const ang = (Math.sin(p.x * s + t) + Math.cos(p.y * s * 1.2 - t * 0.8) + Math.sin((p.x + p.y) * s * 0.6 + t * 0.5)) * Math.PI;
        const dxc = p.x - ccx, dyc = p.y - ccy;
        let vx = Math.cos(ang) * 0.8 - dyc * spin + (ccx - p.x) * 0.0006;
        let vy = Math.sin(ang) * 0.8 + dxc * spin + (ccy - p.y) * 0.0006;
        if (burst >= 0) { const d = Math.hypot(dxc, dyc) || 1; const k = 6 * (1 - burst); vx += dxc / d * k; vy += dyc / d * k; }   // explode outward, easing off → regroups via pull
        if (active && burst < 0) { const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy; if (d2 < 17000) { const f = (1 - Math.sqrt(d2) / 130) * 0.9; vx += (-dy * 0.02 + dx * 0.012) * f; vy += (dx * 0.02 + dy * 0.012) * f; } }
        const sp = 1.25 + boost * 0.7; p.x += vx * sp; p.y += vy * sp; p.life++;
        if (burst >= 0) { const d = Math.hypot(p.x - ccx, p.y - ccy); if (d > R) { const f = R / d; p.x = ccx + (p.x - ccx) * f; p.y = ccy + (p.y - ccy) * f; } }   // keep the explosion inside the frame
        if (burst < 0 && (p.life > p.max || Math.hypot(p.x - ccx, p.y - ccy) > R)) spawn(p);
        ctx.globalAlpha = Math.max(0, Math.min(1, (0.5 + boost * 0.2) * Math.sin((p.life / p.max) * Math.PI) * ignite));
        ctx.drawImage(p.sp, p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    };
    let reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* noop */ }
    if (reduce) { for (let k = 0; k < 120; k++) { t += 0.011; step(); } return; }
    const loop = () => { if (this.nebStop) return; t += 0.011; step(); this.nebRaf = requestAnimationFrame(loop); };
    loop();
  }
  private nebExplode(): void { this.nebBurst = performance.now() + 900; this.nebBoost = performance.now() + 900; }
  private nebPulse(): void { this.nebBoost = performance.now() + 800; }
  private stopNebula(): void { this.nebStop = true; cancelAnimationFrame(this.nebRaf); this.nebCanvas = null; if (this.nebCleanup) { this.nebCleanup(); this.nebCleanup = null; } }

  /* ---- helpers ---- */
  private currentPanel(): HTMLElement | null { return this.root.querySelector('.da-stage-left, .da-panel, .da-page-centered'); }
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
