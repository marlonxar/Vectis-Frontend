/**
 * Discovery Assistant Widget
 * Embeddable, framework-agnostic, Shadow-DOM isolated guided discovery flow.
 *
 *   <script src="https://wearevectis.com/assets/discovery/widget.js"></script>
 *   <script>
 *     DiscoveryAssistant.init({ key: "da_vectis" });
 *   </script>
 *
 * Supabase URL + anon key live baked in (src/config.ts) — the host site only passes `key`.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

const DA_TITLE = 'Discovery Assistant';

type QType = 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'RADIO' | 'CHECKBOX' | 'SELECT';

interface Flow {
  id: string; public_key: string; name: string; language: 'en' | 'es';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  logo_url: string | null; background_url: string | null; accent_color: string | null;
  intro_title: string | null; intro_subtitle: string | null;
}
interface Question {
  id: string; type: QType; key: string; label: string;
  help_text: string | null; placeholder: string | null; audio_url: string | null;
  options: string[]; required: boolean; order_index: number;
}
interface Config {
  key: string; supabaseUrl?: string; supabaseAnonKey?: string;
  target?: string; accentColor?: string; position?: 'bottom-right' | 'bottom-left';
  page?: boolean;            // full-page mode (mounts inside `target`, no popup/launcher)
}
interface Progress { flowKey: string; currentStep: number; answers: Record<string, string | string[]>; updatedAt: string; }

/* ----------------------------------------------------------------- i18n -- */
const STRINGS = {
  es: {
    title: DA_TITLE,
    welcome: 'Bienvenido al sistema de asistencia guiada. Por favor responde a cada una de las preguntas con claridad.',
    during: 'Por favor responde a la pregunta con claridad.',
    begin: 'Comenzar', next: 'Siguiente', finish: 'Enviar', sending: 'Enviando…',
    required: 'Este campo es obligatorio.', invalidEmail: 'Ingresa un correo válido.',
    selectOne: 'Selecciona una opción.', optional: 'opcional',
    resumeTitle: '¿Continuar donde quedaste?', resumeBody: 'Guardamos tus respuestas anteriores.',
    continue: 'Continuar', startAgain: 'Empezar de nuevo',
    unavailable: 'Este asistente no está disponible por ahora.',
    errorLoad: 'No pudimos cargar el asistente. Intenta de nuevo.',
    errorSend: 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.',
    successTitle: '¡Gracias!', successBody: 'Recibimos tu información. Te contactaremos pronto.',
    close: 'Cerrar', listen: 'Escuchar', retry: 'Reintentar', selectPlaceholder: 'Selecciona…',
  },
  en: {
    title: DA_TITLE,
    welcome: 'Welcome to the guided assistance system. Please answer each question clearly.',
    during: 'Please answer the question clearly.',
    begin: 'Start', next: 'Next', finish: 'Submit', sending: 'Sending…',
    required: 'This field is required.', invalidEmail: 'Enter a valid email.',
    selectOne: 'Select an option.', optional: 'optional',
    resumeTitle: 'Continue where you left off?', resumeBody: 'We saved your previous answers.',
    continue: 'Continue', startAgain: 'Start again',
    unavailable: 'This assistant is currently unavailable.',
    errorLoad: 'We could not load the assistant. Please try again.',
    errorSend: 'Could not send. Check your connection and try again.',
    successTitle: 'Thank you!', successBody: 'We received your info. We will contact you soon.',
    close: 'Close', listen: 'Play', retry: 'Retry', selectPlaceholder: 'Select…',
  },
};

/* --------------------------------------------------------------- styles -- */
const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.da-root {
  --da-accent:#E7AB2E; --da-ink:#14161c; --da-ink-2:#5b6170; --da-surface:#fff;
  --da-line:#e7e7ea; --da-radius:18px;
  --da-font:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
  font-family:var(--da-font); color:var(--da-ink); line-height:1.5;
}
@media (prefers-color-scheme: dark){ .da-root{ --da-ink:#f3f3f5; --da-ink-2:#a7adba; --da-surface:#15161b; --da-line:#2a2c34; } }

.da-launcher{ position:fixed; z-index:2147483000; bottom:22px; display:inline-flex; align-items:center; gap:10px;
  padding:14px 20px; border:none; border-radius:999px; cursor:pointer; background:var(--da-accent); color:#1a1205;
  font-weight:700; font-size:15px; font-family:var(--da-font); box-shadow:0 10px 30px -8px rgba(0,0,0,.45);
  transition:transform .2s ease; }
.da-launcher:hover{ transform:translateY(-2px); } .da-launcher.right{ right:22px; } .da-launcher.left{ left:22px; }
.da-launcher svg{ width:20px; height:20px; }

.da-overlay{ position:fixed; inset:0; z-index:2147483001; display:flex; align-items:center; justify-content:center;
  padding:20px; background:rgba(10,11,16,.55); backdrop-filter:blur(4px); opacity:0; transition:opacity .22s ease; }
.da-overlay.open{ opacity:1; }
.da-panel{ position:relative; width:100%; max-width:560px; max-height:min(92vh,780px); display:flex; flex-direction:column;
  overflow:hidden; background:var(--da-surface); border-radius:var(--da-radius); box-shadow:0 30px 80px -20px rgba(0,0,0,.6);
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
.da-close{ margin-left:auto; width:40px; height:40px; border-radius:10px; border:none; background:transparent; color:var(--da-ink-2);
  cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
.da-close:hover{ color:var(--da-ink); } .da-close svg{ width:20px; height:20px; }

.da-legend{ position:relative; z-index:1; padding:14px 22px 0; font-size:14px; color:var(--da-ink-2); }

.da-body{ position:relative; z-index:1; padding:18px 22px 8px; overflow-y:auto; flex:1; }

/* stacked, conversational questions */
.da-stack{ display:flex; flex-direction:column; gap:22px; }
.da-qblock{ position:relative; padding-left:2px; }
.da-qblock.enter{ animation:da-floatin .65s cubic-bezier(.2,.7,.2,1) both; }
@keyframes da-floatin{ from{ opacity:0; transform:translateY(18px); } to{ opacity:1; transform:none; } }
.da-qnum{ font-size:12px; letter-spacing:.1em; font-weight:700; color:var(--da-accent); margin:0 0 6px; }
.da-q{ font-size:20px; font-weight:700; margin:0 0 6px; letter-spacing:-.01em; }
.da-help{ font-size:14px; color:var(--da-ink-2); margin:0 0 14px; }

.da-field{ display:block; }
.da-input, .da-textarea, .da-select{ width:100%; font:inherit; font-size:16px; color:var(--da-ink);
  background:color-mix(in srgb,var(--da-surface) 100%,#888 6%); border:1.5px solid var(--da-line); border-radius:12px;
  padding:13px 14px; min-height:48px; transition:border-color .15s ease, box-shadow .15s ease; outline:none; }
.da-onbg .da-input, .da-onbg .da-textarea, .da-onbg .da-select{ background:rgba(255,255,255,.08); color:#fff; }
.da-textarea{ min-height:104px; resize:vertical; }
.da-input:focus, .da-textarea:focus, .da-select:focus{ border-color:var(--da-accent); box-shadow:0 0 0 4px color-mix(in srgb,var(--da-accent) 26%,transparent); }
.da-input::placeholder, .da-textarea::placeholder{ color:var(--da-ink-2); opacity:.8; }

.da-options{ display:grid; gap:10px; }
.da-opt{ display:flex; align-items:center; gap:12px; padding:13px 14px; cursor:pointer; border:1.5px solid var(--da-line);
  border-radius:12px; min-height:48px; transition:border-color .15s ease, background .15s ease; }
.da-opt:hover{ border-color:color-mix(in srgb,var(--da-accent) 60%,var(--da-line)); }
.da-opt.sel{ border-color:var(--da-accent); background:color-mix(in srgb,var(--da-accent) 12%,transparent); }
.da-opt .box{ width:20px; height:20px; flex:none; border:2px solid var(--da-line); display:inline-flex; align-items:center; justify-content:center; color:#1a1205; }
.da-opt.radio .box{ border-radius:50%; } .da-opt.check .box{ border-radius:6px; }
.da-opt.sel .box{ border-color:var(--da-accent); background:var(--da-accent); }
.da-opt .box svg{ width:13px; height:13px; opacity:0; } .da-opt.sel .box svg{ opacity:1; }
.da-opt span.lbl{ font-size:15px; }

.da-audio{ display:inline-flex; align-items:center; gap:8px; margin:0 0 14px; padding:8px 12px; border-radius:999px;
  border:1.5px solid var(--da-line); background:transparent; color:var(--da-ink); cursor:pointer; font:inherit; font-size:13px; font-weight:600; }
.da-audio:hover{ border-color:var(--da-accent); } .da-audio svg{ width:16px; height:16px; color:var(--da-accent); }

.da-err{ color:#c0392b; font-size:13px; margin:8px 0 0; min-height:18px; }
.da-onbg .da-err{ color:#ff9b8a; }

.da-foot{ position:relative; z-index:1; display:flex; gap:10px; align-items:center; padding:16px 22px 22px; }
.da-btn{ font:inherit; font-size:15px; font-weight:700; border-radius:12px; padding:13px 22px; min-height:48px; cursor:pointer;
  border:1.5px solid transparent; transition:transform .15s ease, filter .15s ease, opacity .15s ease; }
.da-btn:active{ transform:translateY(1px); }
.da-btn-primary{ background:var(--da-accent); color:#1a1205; margin-left:auto; }
.da-btn-primary:hover{ filter:brightness(1.04); } .da-btn-primary:disabled{ opacity:.5; cursor:not-allowed; }
.da-btn-ghost{ background:transparent; color:var(--da-ink); border-color:var(--da-line); }
.da-btn-ghost:hover{ border-color:var(--da-ink-2); }

.da-center{ position:relative; z-index:1; text-align:center; padding:44px 26px; }
.da-center .da-logo-lg{ height:48px; width:auto; margin:0 auto 16px; display:block; border-radius:10px; }
.da-center h2{ font-size:26px; margin:0 0 10px; letter-spacing:-.01em; font-weight:800; }
.da-center p{ color:var(--da-ink-2); margin:0 auto 22px; max-width:42ch; }
.da-center .da-actions{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.da-badge{ width:56px; height:56px; border-radius:50%; margin:0 auto; display:inline-flex; align-items:center; justify-content:center;
  background:color-mix(in srgb,var(--da-accent) 18%,transparent); color:var(--da-accent); }
.da-badge svg{ width:28px; height:28px; }

.da-spin{ width:16px; height:16px; border:2px solid rgba(0,0,0,.25); border-top-color:#1a1205; border-radius:50%;
  display:inline-block; animation:da-rot .7s linear infinite; vertical-align:-2px; margin-right:6px; }
@keyframes da-rot{ to{ transform:rotate(360deg); } }

@media (max-width:560px){ .da-overlay{ padding:0; } .da-panel{ max-width:100%; max-height:100%; height:100%; border-radius:0; } }

/* ---- full-page mode ---- */
.da-page{ position:relative; min-height:100dvh; min-height:100vh; display:flex; flex-direction:column; color:#fff; overflow:hidden; }
.da-grad{ position:absolute; inset:0; z-index:0;
  background:
    radial-gradient(48% 48% at 18% 22%, rgba(40,96,210,.7), transparent 70%),
    radial-gradient(44% 44% at 84% 18%, rgba(231,171,46,.6), transparent 70%),
    radial-gradient(60% 60% at 72% 96%, rgba(255,255,255,.4), transparent 72%),
    linear-gradient(140deg,#0a1024,#121a3a 55%,#0a1024);
  filter:blur(8px); transform:scale(1.06); }
.da-page .da-bg::after{ background:linear-gradient(180deg,rgba(8,9,13,.55),rgba(8,9,13,.78)); }
.da-pagehead{ position:relative; z-index:1; padding:24px 26px; display:flex; align-items:center; }
.da-pagehead img{ height:38px; width:auto; border-radius:8px; }
.da-pagebody{ position:relative; z-index:1; flex:1; width:100%; max-width:640px; margin:0 auto; padding:8px 22px 36px;
  display:flex; flex-direction:column; justify-content:center; }
.da-page-panel{ background:color-mix(in srgb, var(--da-surface) 88%, transparent); border:1px solid var(--da-line);
  border-radius:20px; overflow:visible; max-height:none; box-shadow:0 24px 70px -28px rgba(0,0,0,.6);
  -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); }
.da-page-panel .da-legend{ padding:18px 22px 0; } .da-page-panel .da-body{ overflow:visible; padding:18px 22px 8px; }
.da-page-panel .da-center{ padding:40px 26px; }
.da-pagefoot{ position:relative; z-index:1; padding:18px 24px 26px; text-align:center; font-size:13px; color:rgba(255,255,255,.82); }
.da-pagefoot a{ color:var(--da-accent); text-decoration:none; font-weight:700; }
.da-pagefoot a:hover{ text-decoration:underline; }
@media (max-width:560px){ .da-pagebody{ justify-content:flex-start; padding-top:6px; } .da-page-panel{ border-radius:16px; } }

@media (prefers-reduced-motion: reduce){ .da-overlay,.da-panel,.da-btn{ transition:none; } .da-qblock.enter{ animation:none; } }
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
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isVideo = (u: string) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(u);
function esc(s: string): string { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

/* -------------------------------------------------------------- widget -- */
class Widget {
  private root!: ShadowRoot; private host!: HTMLElement; private api: Api;
  private t = STRINGS.es; private flow: Flow | null = null; private questions: Question[] = [];
  private answers: Record<string, string | string[]> = {};
  private revealed = 0;            // how many questions are currently shown (stacked)
  private screen: 'intro' | 'resume' | 'flow' | 'success' | 'unavailable' | 'error' = 'intro';
  private viewed = false; private audioEl: HTMLAudioElement | null = null;
  private accent = '#E7AB2E'; private overlayEl: HTMLElement | null = null; private launcher: HTMLButtonElement | null = null;
  private pageMode = false;

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
              this.answers = prev.answers; this.revealed = Math.min(Math.max(1, prev.currentStep || 1), this.questions.length); this.screen = 'resume';
            } else this.screen = 'intro';
          }
        }
      } catch { this.screen = 'error'; }
    }
    this.renderPanel();
    if (this.flow && this.flow.status === 'ACTIVE' && !this.viewed) { this.viewed = true; this.api.recordView(this.flow.id); }
  }

  private close(): void {
    this.stopAudio(); if (this.cfg.target) return;
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
    this.wireShell(panel);
    if (this.screen === 'flow') for (let i = 1; i <= this.revealed; i++) this.appendQuestion(i, i === this.revealed);
    else { const f = panel.querySelector<HTMLElement>('button.da-btn-primary,.da-opt,input,textarea,select'); f && setTimeout(() => f.focus(), 60); }
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

  // Per-screen inner content (no bg, no header bar). Reused by popup/inline and page modes.
  private contentHtml(): string {
    const closeActions = this.cfg.target ? '' : `<div class="da-actions"><button class="da-btn da-btn-ghost" data-act="close">${esc(this.t.close)}</button></div>`;
    switch (this.screen) {
      case 'unavailable': return `<div class="da-center"><h2>${esc(DA_TITLE)}</h2><p>${esc(this.t.unavailable)}</p>${closeActions}</div>`;
      case 'error': return `<div class="da-center"><h2>:(</h2><p>${esc(this.t.errorLoad)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="retry">${esc(this.t.retry)}</button></div></div>`;
      case 'success': return `<div class="da-center"><span class="da-badge">${I.ok}</span><h2>${esc(this.t.successTitle)}</h2><p>${esc(this.t.successBody)}</p>${closeActions}</div>`;
      case 'resume': return `<div class="da-center"><h2>${esc(this.t.resumeTitle)}</h2><p>${esc(this.t.resumeBody)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="resume">${esc(this.t.continue)}</button><button class="da-btn da-btn-ghost" data-act="restart">${esc(this.t.startAgain)}</button></div></div>`;
      case 'intro': {
        const logo = (!this.pageMode && this.flow?.logo_url) ? `<img class="da-logo-lg" src="${esc(this.flow.logo_url)}" alt="" />` : '';
        return `<div class="da-center">${logo}<h2>${esc(DA_TITLE)}</h2><p>${esc(this.t.welcome)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="begin">${esc(this.t.begin)}</button></div></div>`;
      }
      default: { // flow
        const last = this.revealed >= this.questions.length;
        return `<p class="da-legend">${esc(this.t.during)}</p>
          <div class="da-body"><div class="da-stack" data-stack></div></div>
          <div class="da-foot"><button class="da-btn da-btn-primary" data-act="${last ? 'submit' : 'next'}">${last ? esc(this.t.finish) : esc(this.t.next)}</button></div>`;
      }
    }
  }

  private shellHtml(): string {
    const head = this.screen === 'intro' ? '' : this.headHtml();
    return this.bgHtml() + head + this.contentHtml();
  }

  // Full-page mode: gradient (or DB background) + logo-only header + content card + Vectis footer.
  private renderPage(): void {
    this.root.querySelectorAll('.da-page').forEach((n) => n.remove());
    const wrap = document.createElement('div'); wrap.className = 'da-root da-page';
    wrap.style.setProperty('--da-accent', this.accent);
    const hasBg = !!this.flow?.background_url && this.screen !== 'unavailable' && this.screen !== 'error';
    const bg = hasBg ? this.bgHtml() : `<div class="da-grad" aria-hidden="true"></div>`;
    const logo = this.flow?.logo_url ? `<img class="da-logo" src="${esc(this.flow.logo_url)}" alt="" />` : '';
    wrap.innerHTML =
      `${bg}
       <header class="da-pagehead">${logo}</header>
       <main class="da-pagebody"><div class="da-panel da-page-panel" role="region">${this.contentHtml()}</div></main>
       <footer class="da-pagefoot">Producto desarrollado por <a href="https://www.wearevectis.com" target="_blank" rel="noopener">Vectis</a></footer>`;
    this.root.appendChild(wrap);
    this.wireShell(wrap);
    if (this.screen === 'flow') for (let i = 1; i <= this.revealed; i++) this.appendQuestion(i, i === this.revealed);
    else { const f = wrap.querySelector<HTMLElement>('button.da-btn-primary,.da-opt,input,textarea,select'); f && setTimeout(() => f.focus(), 60); }
  }

  private appendQuestion(index: number, animate: boolean): void {
    const stack = this.currentPanel()?.querySelector<HTMLElement>('[data-stack]'); if (!stack) return;
    if (stack.querySelector(`[data-block="${index}"]`)) return;
    const q = this.questions[index - 1];
    const block = document.createElement('div'); block.className = 'da-qblock' + (animate ? ' enter' : '');
    block.setAttribute('data-block', String(index));
    block.innerHTML =
      `<p class="da-qnum">${pad2(index)} / ${pad2(this.questions.length)}</p>
       <h3 class="da-q">${esc(q.label)}${q.required ? '' : ` <span style="font-weight:500;font-size:14px;color:var(--da-ink-2)">(${esc(this.t.optional)})</span>`}</h3>
       ${q.help_text ? `<p class="da-help">${esc(q.help_text)}</p>` : ''}
       ${q.audio_url ? `<button class="da-audio" data-act="audio" data-url="${esc(q.audio_url)}" aria-label="${esc(this.t.listen)}">${I.play}<span>${esc(this.t.listen)}</span></button>` : ''}
       ${this.fieldHtml(q)}
       <p class="da-err" data-err role="alert"></p>`;
    stack.appendChild(block); this.wireBlock(block, q);
    if (animate) { const fld = block.querySelector<HTMLElement>('input,textarea,select,.da-opt'); fld && setTimeout(() => { fld.focus(); block.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80); }
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
    panel.querySelectorAll<HTMLElement>('.da-foot [data-act], .da-center [data-act], .da-head [data-act]').forEach((el) => {
      el.addEventListener('click', () => this.act(el.getAttribute('data-act')!, el));
    });
  }
  private wireBlock(block: HTMLElement, q: Question): void {
    const input = block.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-input]');
    if (input) {
      const upd = () => { this.answers[q.key] = input.value; this.persist(); };
      input.addEventListener('input', upd); input.addEventListener('change', upd);
    }
    block.querySelectorAll<HTMLElement>('[data-opt]').forEach((el) => {
      const pick = () => {
        this.answers[q.key] = el.getAttribute('data-opt')!; this.persist();
        block.querySelectorAll('.da-opt').forEach((o) => { o.classList.remove('sel'); o.setAttribute('aria-checked', 'false'); });
        el.classList.add('sel'); el.setAttribute('aria-checked', 'true');
        const e = block.querySelector<HTMLElement>('[data-err]'); if (e) e.textContent = '';
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
    const audio = block.querySelector<HTMLElement>('[data-act="audio"]'); audio && audio.addEventListener('click', () => this.toggleAudio(audio));
  }

  private async act(a: string, el?: HTMLElement): Promise<void> {
    switch (a) {
      case 'close': this.close(); break;
      case 'retry': this.flow = null; this.screen = 'intro'; await this.open(); break;
      case 'begin': this.screen = 'flow'; this.revealed = 1; this.persistStep(1); this.renderPanel(); break;
      case 'resume': this.screen = 'flow'; this.renderPanel(); break;
      case 'restart': this.answers = {}; this.revealed = 1; clearProgress(this.cfg.key); this.screen = 'flow'; this.renderPanel(); break;
      case 'next': this.onNext(); break;
      case 'submit': await this.onSubmit(); break;
      case 'audio': el && this.toggleAudio(el); break;
    }
  }

  private onNext(): void {
    if (!this.validateBlock(this.revealed)) return;
    this.stopAudio(); this.revealed += 1; this.persistStep(this.revealed);
    this.appendQuestion(this.revealed, true); this.updateFooter();
  }
  private updateFooter(): void {
    const b = this.currentPanel()?.querySelector<HTMLButtonElement>('.da-foot .da-btn-primary'); if (!b) return;
    const last = this.revealed >= this.questions.length;
    b.setAttribute('data-act', last ? 'submit' : 'next'); b.textContent = last ? this.t.finish : this.t.next;
  }

  private validateBlock(index: number): boolean {
    const q = this.questions[index - 1]; const block = this.currentPanel()?.querySelector<HTMLElement>(`[data-block="${index}"]`);
    const errEl = block?.querySelector<HTMLElement>('[data-err]'); const set = (m: string) => { if (errEl) errEl.textContent = m; };
    const v = this.answers[q.key];
    const empty = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
    if (q.required && empty) { set(q.type === 'RADIO' || q.type === 'CHECKBOX' || q.type === 'SELECT' ? this.t.selectOne : this.t.required); block?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; }
    if (q.type === 'EMAIL' && typeof v === 'string' && v.trim() && !EMAIL_RE.test(v.trim())) { set(this.t.invalidEmail); return false; }
    set(''); return true;
  }

  private async onSubmit(): Promise<void> {
    for (let i = 1; i <= this.revealed; i++) if (!this.validateBlock(i)) return;
    if (!this.flow) return;
    const b = this.currentPanel()?.querySelector<HTMLButtonElement>('.da-foot .da-btn-primary');
    if (b) { b.disabled = true; b.innerHTML = `<span class="da-spin"></span>${esc(this.t.sending)}`; }
    try { await this.api.submit(this.flow.id, this.answers); clearProgress(this.cfg.key); this.screen = 'success'; this.renderPanel(); }
    catch {
      if (b) { b.disabled = false; b.textContent = this.t.finish; }
      const last = this.currentPanel()?.querySelector<HTMLElement>(`[data-block="${this.revealed}"] [data-err]`); if (last) last.textContent = this.t.errorSend;
    }
  }

  /* ---- audio ---- */
  private toggleAudio(btn: HTMLElement): void {
    const url = btn.getAttribute('data-url')!;
    if (this.audioEl && !this.audioEl.paused && this.audioEl.src === url) { this.stopAudio(); btn.innerHTML = `${I.play}<span>${esc(this.t.listen)}</span>`; return; }
    this.stopAudio(); this.audioEl = new Audio(url); this.audioEl.play().catch(() => { /* needs gesture; this click is one */ });
    btn.innerHTML = `${I.pause}<span>${esc(this.t.listen)}</span>`; this.audioEl.onended = () => { btn.innerHTML = `${I.play}<span>${esc(this.t.listen)}</span>`; };
  }
  private stopAudio(): void { if (this.audioEl) { try { this.audioEl.pause(); } catch { /* noop */ } this.audioEl = null; } }

  /* ---- helpers ---- */
  private currentPanel(): HTMLElement | null { return this.root.querySelector('.da-panel'); }
  private persistStep(step: number): void { saveProgress(this.cfg.key, { flowKey: this.cfg.key, currentStep: step, answers: this.answers, updatedAt: new Date().toISOString() }); }
  private persist(): void { this.persistStep(this.revealed); }
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
