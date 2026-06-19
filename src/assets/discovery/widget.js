"use strict";(()=>{var y="https://cqblywvdveetrhwbytmh.supabase.co",w="sb_publishable_PGC-OBJQdwbQgqGmxnKtiQ_erMWjloU";var h="Discovery Assistant",g={es:{title:h,welcomeTitle:"Bienvenido",themeToggle:"Cambiar tema",welcome:"A continuaci\xF3n se mostrar\xE1 un asistente interactivo para capturar informaci\xF3n relevante de su proyecto.",during:"Por favor responde a la pregunta con claridad.",begin:"Comenzar",next:"Siguiente",finish:"Enviar",sending:"Enviando\u2026",required:"Este campo es obligatorio.",invalidEmail:"Ingresa un correo v\xE1lido.",selectOne:"Selecciona una opci\xF3n.",optional:"opcional",resumeTitle:"\xBFContinuar donde quedaste?",resumeBody:"Guardamos tus respuestas anteriores.",continue:"Continuar",startAgain:"Empezar de nuevo",unavailable:"Este asistente no est\xE1 disponible para su organizaci\xF3n. Por favor contacte a un administrador para habilitarlo.",errorLoad:"No pudimos cargar el asistente. Intenta de nuevo.",errorSend:"No se pudo enviar. Revisa tu conexi\xF3n e intenta de nuevo.",successTitle:"\xA1Gracias!",successBody:"Recibimos tu informaci\xF3n. Te contactaremos pronto.",close:"Cerrar",listen:"Escuchar",retry:"Reintentar",selectPlaceholder:"Selecciona\u2026"},en:{title:h,welcomeTitle:"Welcome",themeToggle:"Toggle theme",welcome:"An interactive assistant will guide you to capture key information about your project.",during:"Please answer the question clearly.",begin:"Start",next:"Next",finish:"Submit",sending:"Sending\u2026",required:"This field is required.",invalidEmail:"Enter a valid email.",selectOne:"Select an option.",optional:"optional",resumeTitle:"Continue where you left off?",resumeBody:"We saved your previous answers.",continue:"Continue",startAgain:"Start again",unavailable:"This assistant is not available for your organization. Please contact an administrator to enable it.",errorLoad:"We could not load the assistant. Please try again.",errorSend:"Could not send. Check your connection and try again.",successTitle:"Thank you!",successBody:"We received your info. We will contact you soon.",close:"Close",listen:"Play",retry:"Retry",selectPlaceholder:"Select\u2026"}},A=`
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
.da-qblock{ position:relative; display:flex; gap:12px; align-items:flex-start; }
.da-qblock.enter{ animation:da-floatin .65s cubic-bezier(.2,.7,.2,1) both; }
.da-avatar{ flex:0 0 auto; width:40px; height:40px; margin-top:2px; }
.da-avatar svg, .da-avatar img{ width:40px; height:40px; display:block; border-radius:12px; }
.da-avatar.speaking{ animation:da-pulse 1.1s ease-in-out infinite; transform-origin:center; }
@keyframes da-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.09); } }
.da-qbubble{ flex:1 1 auto; min-width:0; }
@keyframes da-floatin{ from{ opacity:0; transform:translateY(22px) scale(.985); } to{ opacity:1; transform:none; } }
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

/* ---- full-page mode (day / night) ---- */
.da-page{ position:relative; height:100vh; height:100dvh; display:flex; flex-direction:column; overflow:hidden; transition:color .35s ease; }
.da-page.da-theme-dark{ --da-ink:#f3f3f5; --da-ink-2:#a7adba; --da-surface:#16171c; --da-line:#2a2c34; color:#fff; }
.da-page.da-theme-light{ --da-ink:#14161c; --da-ink-2:#5b6170; --da-surface:#ffffff; --da-line:#e7e7ea; color:#14161c; }

.da-grad{ position:absolute; inset:0; z-index:0; filter:blur(7px); transform:scale(1.06); transition:opacity .35s ease; }
.da-theme-dark .da-grad{ background:
    radial-gradient(44% 44% at 84% 16%, rgba(231,171,46,.5), transparent 70%),
    radial-gradient(56% 56% at 70% 98%, rgba(255,255,255,.13), transparent 72%),
    radial-gradient(52% 52% at 14% 22%, rgba(38,58,120,.32), transparent 70%),
    linear-gradient(150deg,#08080b,#0e0f14 55%,#08080b); }
.da-theme-light .da-grad{ background:
    radial-gradient(44% 44% at 84% 16%, rgba(231,171,46,.3), transparent 70%),
    radial-gradient(52% 52% at 14% 22%, rgba(40,96,210,.16), transparent 70%),
    radial-gradient(60% 60% at 70% 98%, rgba(255,255,255,.7), transparent 72%),
    linear-gradient(150deg,#f3f1ea,#ffffff 55%,#eceef4); }
.da-page .da-bg::after{ background:linear-gradient(180deg,rgba(8,8,10,.5),rgba(8,8,10,.78)); }

.da-pagehead{ position:relative; z-index:2; flex:0 0 auto; padding:18px 26px 14px; display:flex; align-items:center; justify-content:center; animation:da-fade .5s ease both; }
.da-pagehead-c{ display:flex; flex-direction:column; align-items:center; gap:8px; }
.da-pagehead img{ height:40px; width:auto; border-radius:8px; }
.da-pagetitle{ margin:0; font-size:15px; font-weight:800; letter-spacing:.01em; }
.da-theme-btn{ position:absolute; right:18px; top:50%; transform:translateY(-50%); width:40px; height:40px; border-radius:10px;
  border:1px solid var(--da-line); background:transparent; color:inherit; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;
  transition:border-color .2s ease, transform .2s ease; }
.da-theme-btn:hover{ border-color:var(--da-accent); }
.da-theme-btn:active{ transform:translateY(-50%) scale(.92); }
.da-theme-btn svg{ width:18px; height:18px; }

.da-pagebody{ position:relative; z-index:1; flex:1 1 auto; min-height:0; overflow-y:auto; width:100%; max-width:640px; margin:0 auto; padding:8px 22px 28px;
  display:flex; flex-direction:column; justify-content:flex-start; }
.da-page-panel{ background:color-mix(in srgb, var(--da-surface) 90%, transparent); border:1px solid var(--da-line);
  border-radius:20px; overflow:visible; max-height:none; box-shadow:0 24px 70px -28px rgba(0,0,0,.55);
  -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
  animation:da-cardin .55s cubic-bezier(.2,.7,.2,1) both; transition:background-color .35s ease, border-color .35s ease; }
.da-page-panel .da-legend{ padding:18px 22px 0; text-align:left; }
.da-page-panel .da-body{ overflow:visible; padding:18px 22px 8px; }

/* left-aligned content */
.da-page .da-center{ text-align:left; padding:36px 24px; }
.da-page .da-center .da-actions{ justify-content:flex-start; }
.da-page .da-center .da-badge{ margin:0 0 6px; }
.da-page .da-center p{ margin-left:0; margin-right:0; max-width:48ch; }
/* conversation-thread accent per question */

.da-pagefoot{ position:relative; z-index:2; flex:0 0 auto; padding:14px 24px 20px; text-align:center; font-size:13px; transition:color .35s ease; }
.da-theme-dark .da-pagefoot{ color:rgba(255,255,255,.8); }
.da-theme-light .da-pagefoot{ color:rgba(20,22,28,.66); }
.da-pagefoot a{ color:var(--da-accent); text-decoration:none; font-weight:700; }
.da-pagefoot a:hover{ text-decoration:underline; }

@keyframes da-cardin{ from{ opacity:0; transform:translateY(16px) scale(.99); } to{ opacity:1; transform:none; } }
@keyframes da-fade{ from{ opacity:0; } to{ opacity:1; } }
@media (max-width:560px){ .da-page-panel{ border-radius:16px; } .da-pagehead img{ height:34px; } }

@media (prefers-reduced-motion: reduce){ .da-overlay,.da-panel,.da-btn{ transition:none; } .da-qblock.enter,.da-page-panel,.da-pagehead,.da-avatar.speaking{ animation:none; } }
`;function u(){try{return localStorage.setItem("__da","1"),localStorage.removeItem("__da"),localStorage}catch{try{return sessionStorage}catch{return null}}}var m=l=>`da_progress_${l}`;function S(l){let e=u();if(!e)return null;try{let t=e.getItem(m(l));return t?JSON.parse(t):null}catch{return null}}function T(l,e){let t=u();if(t)try{t.setItem(m(l),JSON.stringify(e))}catch{}}function k(l){let e=u();if(e)try{e.removeItem(m(l))}catch{}}function L(){var l;try{let e=(l=u())==null?void 0:l.getItem("da_theme");if(e==="light"||e==="dark")return e}catch{}try{return window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch{return"dark"}}function M(l){var e;try{(e=u())==null||e.setItem("da_theme",l)}catch{}}var f=class{constructor(e,t){this.url=e;this.anon=t;this.url=e.replace(/\/$/,"")}h(e={}){return{apikey:this.anon,Authorization:`Bearer ${this.anon}`,"Content-Type":"application/json",...e}}async getFlow(e){let t=await fetch(`${this.url}/rest/v1/flows?public_key=eq.${encodeURIComponent(e)}&select=*`,{headers:this.h()});if(!t.ok)throw new Error("flow");return(await t.json())[0]||null}async getQuestions(e){let t=await fetch(`${this.url}/rest/v1/flow_questions?flow_id=eq.${e}&order=order_index.asc&select=*`,{headers:this.h()});if(!t.ok)throw new Error("questions");return(await t.json()).map(s=>({...s,options:Array.isArray(s.options)?s.options:[]}))}recordView(e){fetch(`${this.url}/rest/v1/flow_views`,{method:"POST",headers:this.h({Prefer:"return=minimal"}),body:JSON.stringify({flow_id:e})}).catch(()=>{})}async submit(e,t){if(!(await fetch(`${this.url}/rest/v1/submissions`,{method:"POST",headers:this.h({Prefer:"return=minimal"}),body:JSON.stringify({flow_id:e,answers_json:t})})).ok)throw new Error("submit")}},c={spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>'},C='<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="vmascot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2C868"/><stop offset="1" stop-color="#D99A22"/></linearGradient></defs><line x1="48" y1="16" x2="48" y2="7" stroke="#E7AB2E" stroke-width="3" stroke-linecap="round"/><circle cx="48" cy="5.5" r="4" fill="#F2C868"/><rect x="10" y="16" width="76" height="68" rx="23" fill="#0D1024"/><rect x="10" y="16" width="76" height="68" rx="23" fill="none" stroke="#E7AB2E" stroke-opacity="0.45" stroke-width="2"/><circle cx="36" cy="44" r="6" fill="#F4F0E6"/><circle cx="60" cy="44" r="6" fill="#F4F0E6"/><circle cx="37.6" cy="45" r="2.2" fill="#0D1024"/><circle cx="61.6" cy="45" r="2.2" fill="#0D1024"/><path d="M33 60 L48 72 L63 60" fill="none" stroke="url(#vmascot)" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',H=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,_=l=>/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(l);function r(l){return String(l).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}var E=l=>l<10?"0"+l:""+l,v=class{constructor(e){this.cfg=e;this.t=g.es;this.flow=null;this.questions=[];this.answers={};this.revealed=0;this.screen="intro";this.viewed=!1;this.audioEl=null;this.accent="#E7AB2E";this.overlayEl=null;this.launcher=null;this.pageMode=!1;this.theme="dark";this.onKey=e=>{e.key==="Escape"&&this.close()};this.speakingAvatar=null;this.api=new f(e.supabaseUrl||y,e.supabaseAnonKey||w),e.accentColor&&(this.accent=e.accentColor),this.pageMode=!!e.page,this.theme=L()}async mount(){let e=!!this.cfg.target;this.host=document.createElement("div"),this.host.setAttribute("data-discovery-assistant",this.cfg.key),(e&&document.querySelector(this.cfg.target)||document.body).appendChild(this.host),this.root=this.host.attachShadow({mode:"open"});let t=document.createElement("style");if(t.textContent=A,this.root.appendChild(t),!document.querySelector("link[data-da-font]")){let a=document.createElement("link");a.rel="stylesheet",a.setAttribute("data-da-font",""),a.href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",document.head.appendChild(a)}e||this.pageMode?await this.open():this.renderLauncher()}renderLauncher(){let e=this.cfg.position==="bottom-left"?"left":"right",t=document.createElement("button");t.className=`da-launcher ${e}`,t.style.background=this.accent,t.setAttribute("aria-haspopup","dialog"),t.innerHTML=`${c.spark}<span>${r(h)}</span>`,t.addEventListener("click",()=>this.open()),this.root.appendChild(t),this.launcher=t}async open(){if(!this.flow)try{let e=await this.api.getFlow(this.cfg.key);if(!e||e.status==="DRAFT")this.flow=e,this.screen="unavailable";else if(this.flow=e,this.t=g[e.language]||g.es,!this.cfg.accentColor&&e.accent_color&&(this.accent=e.accent_color),e.status==="INACTIVE")this.screen="unavailable";else{this.questions=await this.api.getQuestions(e.id);let t=S(this.cfg.key);t&&t.answers&&Object.keys(t.answers).length?(this.answers=t.answers,this.revealed=Math.min(Math.max(1,t.currentStep||1),this.questions.length),this.screen="resume"):this.screen="intro"}}catch{this.screen="error"}this.renderPanel(),this.flow&&this.flow.status==="ACTIVE"&&!this.viewed&&(this.viewed=!0,this.api.recordView(this.flow.id))}close(){if(this.stopAudio(),this.cfg.target)return;let e=this.overlayEl;e&&(e.classList.remove("open"),setTimeout(()=>e.remove(),220),this.overlayEl=null,document.removeEventListener("keydown",this.onKey)),this.launcher&&(this.launcher.style.display="")}renderPanel(){var i;if(this.pageMode){this.renderPage();return}let e=!!this.cfg.target,t;if(e){this.root.querySelectorAll(".da-inline").forEach(d=>d.remove());let n=document.createElement("div");n.className="da-root da-inline",this.root.appendChild(n),t=n}else{if(!this.overlayEl){let n=document.createElement("div");n.className="da-root da-overlay",n.addEventListener("click",d=>{d.target===n&&this.close()}),this.root.appendChild(n),this.overlayEl=n,requestAnimationFrame(()=>n.classList.add("open")),document.addEventListener("keydown",this.onKey),this.launcher&&(this.launcher.style.display="none")}t=this.overlayEl}let a=document.createElement("div");a.className="da-panel",a.setAttribute("role","dialog"),a.setAttribute("aria-modal","true"),(i=this.flow)!=null&&i.background_url&&this.screen!=="unavailable"&&this.screen!=="error"&&a.classList.add("da-onbg"),a.style.setProperty("--da-accent",this.accent),a.innerHTML=this.shellHtml();let s=t.querySelector(".da-panel");if(s?s.replaceWith(a):t.appendChild(a),this.wireShell(a),this.screen==="flow")for(let n=1;n<=this.revealed;n++)this.appendQuestion(n,n===this.revealed);else{let n=a.querySelector("button.da-btn-primary,.da-opt,input,textarea,select");n&&setTimeout(()=>n.focus(),60)}}bgHtml(){var t;let e=(t=this.flow)==null?void 0:t.background_url;return!e||this.screen==="unavailable"||this.screen==="error"?"":`<div class="da-bg">${_(e)?`<video src="${r(e)}" autoplay muted loop playsinline></video>`:`<img src="${r(e)}" alt="" />`}</div>`}headHtml(){var a;let e=(a=this.flow)!=null&&a.logo_url?`<img class="da-logo" src="${r(this.flow.logo_url)}" alt="" />`:"",t=this.cfg.target?"":`<button class="da-close" data-act="close" aria-label="${r(this.t.close)}">${c.close}</button>`;return`<div class="da-head">${e}<p class="da-title">${r(h)}</p>${t}</div>`}contentHtml(){var t;let e=this.cfg.target?"":`<div class="da-actions"><button class="da-btn da-btn-ghost" data-act="close">${r(this.t.close)}</button></div>`;switch(this.screen){case"unavailable":return`<div class="da-center"><h2>${r(h)}</h2><p>${r(this.t.unavailable)}</p>${e}</div>`;case"error":return`<div class="da-center"><h2>:(</h2><p>${r(this.t.errorLoad)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="retry">${r(this.t.retry)}</button></div></div>`;case"success":return`<div class="da-center"><span class="da-badge">${c.ok}</span><h2>${r(this.t.successTitle)}</h2><p>${r(this.t.successBody)}</p>${e}</div>`;case"resume":return`<div class="da-center"><h2>${r(this.t.resumeTitle)}</h2><p>${r(this.t.resumeBody)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="resume">${r(this.t.continue)}</button><button class="da-btn da-btn-ghost" data-act="restart">${r(this.t.startAgain)}</button></div></div>`;case"intro":return`<div class="da-center">${!this.pageMode&&((t=this.flow)!=null&&t.logo_url)?`<img class="da-logo-lg" src="${r(this.flow.logo_url)}" alt="" />`:""}<h2>${r(this.t.welcomeTitle)}</h2><p>${r(this.t.welcome)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="begin">${r(this.t.begin)}</button></div></div>`;default:{let a=this.revealed>=this.questions.length;return`<p class="da-legend">${r(this.t.during)}</p>
          <div class="da-body"><div class="da-stack" data-stack></div></div>
          <div class="da-foot"><button class="da-btn da-btn-primary" data-act="${a?"submit":"next"}">${r(a?this.t.finish:this.t.next)}</button></div>`}}}shellHtml(){let e=this.screen==="intro"?"":this.headHtml();return this.bgHtml()+e+this.contentHtml()}renderPage(){var n,d;this.root.querySelectorAll(".da-page").forEach(o=>o.remove());let e=document.createElement("div");e.className=`da-root da-page da-theme-${this.theme}`,e.style.setProperty("--da-accent",this.accent);let a=!!((n=this.flow)!=null&&n.background_url)&&this.screen!=="unavailable"&&this.screen!=="error"?this.bgHtml():'<div class="da-grad" aria-hidden="true"></div>',s=(d=this.flow)!=null&&d.logo_url?`<img class="da-logo" src="${r(this.flow.logo_url)}" alt="" />`:"",i=`<button class="da-theme-btn" data-act="theme" aria-label="${r(this.t.themeToggle)}">${this.theme==="dark"?c.sun:c.moon}</button>`;if(e.innerHTML=`${a}
       <header class="da-pagehead"><div class="da-pagehead-c">${s}<p class="da-pagetitle">${r(h)}</p></div>${i}</header>
       <main class="da-pagebody"><div class="da-panel da-page-panel" role="region">${this.contentHtml()}</div></main>
       <footer class="da-pagefoot">Producto desarrollado por <a href="https://www.wearevectis.com" target="_blank" rel="noopener">Vectis</a></footer>`,this.root.appendChild(e),this.wireShell(e),this.screen==="flow")for(let o=1;o<=this.revealed;o++)this.appendQuestion(o,o===this.revealed);else{let o=e.querySelector("button.da-btn-primary,.da-opt,input,textarea,select");o&&setTimeout(()=>o.focus(),60)}}appendQuestion(e,t){var d,o;let a=(d=this.currentPanel())==null?void 0:d.querySelector("[data-stack]");if(!a||a.querySelector(`[data-block="${e}"]`))return;let s=this.questions[e-1],i=document.createElement("div");i.className="da-qblock"+(t?" enter":""),i.setAttribute("data-block",String(e));let n=(o=this.flow)!=null&&o.avatar_url?`<img src="${r(this.flow.avatar_url)}" alt="" />`:C;if(i.innerHTML=`<div class="da-avatar" aria-hidden="true">${n}</div>
       <div class="da-qbubble">
         <p class="da-qnum">${E(e)} / ${E(this.questions.length)}</p>
         <h3 class="da-q">${r(s.label)}${s.required?"":` <span style="font-weight:500;font-size:14px;color:var(--da-ink-2)">(${r(this.t.optional)})</span>`}</h3>
         ${s.help_text?`<p class="da-help">${r(s.help_text)}</p>`:""}
         ${s.audio_url?`<button class="da-audio" data-act="audio" data-url="${r(s.audio_url)}" aria-label="${r(this.t.listen)}">${c.play}<span>${r(this.t.listen)}</span></button>`:""}
         ${this.fieldHtml(s)}
         <p class="da-err" data-err role="alert"></p>
       </div>`,a.appendChild(i),this.wireBlock(i,s),t){let p=i.querySelector("input,textarea,select,.da-opt");p&&setTimeout(()=>{p.focus(),i.scrollIntoView({behavior:"smooth",block:"center"})},80)}}fieldHtml(e){let t=this.answers[e.key],a=typeof t=="string"?t:"",s=Array.isArray(t)?t:[];switch(e.type){case"TEXTAREA":return`<label class="da-field"><textarea class="da-textarea" data-input placeholder="${r(e.placeholder||"")}">${r(a)}</textarea></label>`;case"EMAIL":return`<label class="da-field"><input class="da-input" type="email" inputmode="email" autocomplete="email" data-input placeholder="${r(e.placeholder||"")}" value="${r(a)}" /></label>`;case"PHONE":return`<label class="da-field"><input class="da-input" type="tel" inputmode="tel" autocomplete="tel" data-input placeholder="${r(e.placeholder||"")}" value="${r(a)}" /></label>`;case"SELECT":return`<label class="da-field"><select class="da-select" data-input><option value="">${r(e.placeholder||this.t.selectPlaceholder)}</option>${e.options.map(i=>`<option value="${r(i)}"${i===a?" selected":""}>${r(i)}</option>`).join("")}</select></label>`;case"RADIO":return`<div class="da-options" role="radiogroup">${e.options.map(i=>`<div class="da-opt radio${i===a?" sel":""}" data-opt="${r(i)}" role="radio" tabindex="0" aria-checked="${i===a}"><span class="box">${c.check}</span><span class="lbl">${r(i)}</span></div>`).join("")}</div>`;case"CHECKBOX":return`<div class="da-options">${e.options.map(i=>`<div class="da-opt check${s.includes(i)?" sel":""}" data-optm="${r(i)}" role="checkbox" tabindex="0" aria-checked="${s.includes(i)}"><span class="box">${c.check}</span><span class="lbl">${r(i)}</span></div>`).join("")}</div>`;default:return`<label class="da-field"><input class="da-input" type="text" data-input placeholder="${r(e.placeholder||"")}" value="${r(a)}" /></label>`}}wireShell(e){e.querySelectorAll(".da-foot [data-act], .da-center [data-act], .da-head [data-act], .da-pagehead [data-act]").forEach(t=>{t.addEventListener("click",()=>this.act(t.getAttribute("data-act"),t))})}wireBlock(e,t){let a=e.querySelector("[data-input]");if(a){let i=()=>{this.answers[t.key]=a.value,this.persist()};a.addEventListener("input",i),a.addEventListener("change",i)}e.querySelectorAll("[data-opt]").forEach(i=>{let n=()=>{this.answers[t.key]=i.getAttribute("data-opt"),this.persist(),e.querySelectorAll(".da-opt").forEach(o=>{o.classList.remove("sel"),o.setAttribute("aria-checked","false")}),i.classList.add("sel"),i.setAttribute("aria-checked","true");let d=e.querySelector("[data-err]");d&&(d.textContent="")};i.addEventListener("click",n),i.addEventListener("keydown",d=>{let o=d.key;(o==="Enter"||o===" ")&&(d.preventDefault(),n())})}),e.querySelectorAll("[data-optm]").forEach(i=>{let n=()=>{let d=i.getAttribute("data-optm"),o=Array.isArray(this.answers[t.key])?[...this.answers[t.key]]:[],p=o.indexOf(d);p>=0?o.splice(p,1):o.push(d),this.answers[t.key]=o,this.persist();let b=o.includes(d);i.classList.toggle("sel",b),i.setAttribute("aria-checked",String(b));let x=e.querySelector("[data-err]");x&&(x.textContent="")};i.addEventListener("click",n),i.addEventListener("keydown",d=>{let o=d.key;(o==="Enter"||o===" ")&&(d.preventDefault(),n())})});let s=e.querySelector('[data-act="audio"]');s&&s.addEventListener("click",()=>this.toggleAudio(s))}async act(e,t){switch(e){case"close":this.close();break;case"retry":this.flow=null,this.screen="intro",await this.open();break;case"begin":this.screen="flow",this.revealed=1,this.persistStep(1),this.renderPanel();break;case"resume":this.screen="flow",this.renderPanel();break;case"restart":this.answers={},this.revealed=1,k(this.cfg.key),this.screen="flow",this.renderPanel();break;case"next":this.onNext();break;case"submit":await this.onSubmit();break;case"audio":t&&this.toggleAudio(t);break;case"theme":this.toggleTheme();break}}toggleTheme(){this.theme=this.theme==="dark"?"light":"dark",M(this.theme);let e=this.root.querySelector(".da-page");if(e){e.classList.remove("da-theme-dark","da-theme-light"),e.classList.add(`da-theme-${this.theme}`);let t=e.querySelector('[data-act="theme"]');t&&(t.innerHTML=this.theme==="dark"?c.sun:c.moon)}}onNext(){this.validateBlock(this.revealed)&&(this.stopAudio(),this.revealed+=1,this.persistStep(this.revealed),this.appendQuestion(this.revealed,!0),this.updateFooter())}updateFooter(){var a;let e=(a=this.currentPanel())==null?void 0:a.querySelector(".da-foot .da-btn-primary");if(!e)return;let t=this.revealed>=this.questions.length;e.setAttribute("data-act",t?"submit":"next"),e.textContent=t?this.t.finish:this.t.next}validateBlock(e){var o;let t=this.questions[e-1],a=(o=this.currentPanel())==null?void 0:o.querySelector(`[data-block="${e}"]`),s=a==null?void 0:a.querySelector("[data-err]"),i=p=>{s&&(s.textContent=p)},n=this.answers[t.key],d=n==null||typeof n=="string"&&!n.trim()||Array.isArray(n)&&n.length===0;return t.required&&d?(i(t.type==="RADIO"||t.type==="CHECKBOX"||t.type==="SELECT"?this.t.selectOne:this.t.required),a==null||a.scrollIntoView({behavior:"smooth",block:"center"}),!1):t.type==="EMAIL"&&typeof n=="string"&&n.trim()&&!H.test(n.trim())?(i(this.t.invalidEmail),!1):(i(""),!0)}async onSubmit(){var t,a;for(let s=1;s<=this.revealed;s++)if(!this.validateBlock(s))return;if(!this.flow)return;let e=(t=this.currentPanel())==null?void 0:t.querySelector(".da-foot .da-btn-primary");e&&(e.disabled=!0,e.innerHTML=`<span class="da-spin"></span>${r(this.t.sending)}`);try{await this.api.submit(this.flow.id,this.answers),k(this.cfg.key),this.screen="success",this.renderPanel()}catch{e&&(e.disabled=!1,e.textContent=this.t.finish);let s=(a=this.currentPanel())==null?void 0:a.querySelector(`[data-block="${this.revealed}"] [data-err]`);s&&(s.textContent=this.t.errorSend)}}toggleAudio(e){var s;let t=e.getAttribute("data-url");if(this.audioEl&&!this.audioEl.paused&&this.audioEl.src===t){this.stopAudio(),e.innerHTML=`${c.play}<span>${r(this.t.listen)}</span>`;return}this.stopAudio(),this.audioEl=new Audio(t),this.audioEl.play().catch(()=>{}),e.innerHTML=`${c.pause}<span>${r(this.t.listen)}</span>`;let a=(s=e.closest(".da-qblock"))==null?void 0:s.querySelector(".da-avatar");a&&(a.classList.add("speaking"),this.speakingAvatar=a),this.audioEl.onended=()=>{var i;e.innerHTML=`${c.play}<span>${r(this.t.listen)}</span>`,(i=this.speakingAvatar)==null||i.classList.remove("speaking"),this.speakingAvatar=null}}stopAudio(){var e;if(this.audioEl){try{this.audioEl.pause()}catch{}this.audioEl=null}(e=this.speakingAvatar)==null||e.classList.remove("speaking"),this.speakingAvatar=null}currentPanel(){return this.root.querySelector(".da-panel")}persistStep(e){T(this.cfg.key,{flowKey:this.cfg.key,currentStep:e,answers:this.answers,updatedAt:new Date().toISOString()})}persist(){this.persistStep(this.revealed)}},$=new Set;function q(l){if(!l||!l.key){console.error("[DiscoveryAssistant] init requires { key }");return}let e=l.key+(l.target||"");if($.has(e))return;$.add(e);let t=()=>new v(l).mount().catch(a=>console.error("[DiscoveryAssistant]",a));document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t()}window.DiscoveryAssistant={init:q};})();
