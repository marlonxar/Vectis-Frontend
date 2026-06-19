"use strict";(()=>{var p={es:{start:"Comenzar",continue:"Continuar",startAgain:"Empezar de nuevo",back:"Atr\xE1s",next:"Siguiente",finish:"Enviar",sending:"Enviando\u2026",step:"Paso",of:"de",required:"Este campo es obligatorio.",invalidEmail:"Ingresa un correo v\xE1lido.",selectOne:"Selecciona una opci\xF3n.",resumeTitle:"\xBFContinuar donde quedaste?",resumeBody:"Guardamos tus respuestas anteriores.",unavailable:"Este formulario no est\xE1 disponible por ahora.",errorLoad:"No pudimos cargar el formulario. Intenta de nuevo.",errorSend:"No se pudo enviar. Revisa tu conexi\xF3n e intenta de nuevo.",successTitle:"\xA1Gracias!",successBody:"Recibimos tu informaci\xF3n. Te contactaremos pronto.",close:"Cerrar",listen:"Escuchar audio",optional:"opcional",selectPlaceholder:"Selecciona\u2026"},en:{start:"Start",continue:"Continue",startAgain:"Start again",back:"Back",next:"Next",finish:"Submit",sending:"Sending\u2026",step:"Step",of:"of",required:"This field is required.",invalidEmail:"Enter a valid email.",selectOne:"Select an option.",resumeTitle:"Continue where you left off?",resumeBody:"We saved your previous answers.",unavailable:"This flow is currently unavailable.",errorLoad:"We could not load the flow. Please try again.",errorSend:"Could not send. Check your connection and try again.",successTitle:"Thank you!",successBody:"We received your info. We will contact you soon.",close:"Close",listen:"Play audio",optional:"optional",selectPlaceholder:"Select\u2026"}},m=`
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.da-root {
  --da-accent: #E7AB2E;
  --da-ink: #14161c;
  --da-ink-2: #5b6170;
  --da-surface: #ffffff;
  --da-line: #e7e7ea;
  --da-radius: 18px;
  --da-font: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  font-family: var(--da-font);
  color: var(--da-ink);
  line-height: 1.5;
}
@media (prefers-color-scheme: dark) {
  .da-root { --da-ink:#f3f3f5; --da-ink-2:#a7adba; --da-surface:#15161b; --da-line:#2a2c34; }
}

/* launcher */
.da-launcher {
  position: fixed; z-index: 2147483000; bottom: 22px;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 20px; border: none; border-radius: 999px; cursor: pointer;
  background: var(--da-accent); color: #1a1205; font-weight: 700; font-size: 15px;
  font-family: var(--da-font);
  box-shadow: 0 10px 30px -8px rgba(0,0,0,.45); transition: transform .2s ease, box-shadow .2s ease;
}
.da-launcher:hover { transform: translateY(-2px); }
.da-launcher.right { right: 22px; } .da-launcher.left { left: 22px; }
.da-launcher svg { width: 20px; height: 20px; }

/* overlay + panel */
.da-overlay {
  position: fixed; inset: 0; z-index: 2147483001; display: flex;
  align-items: center; justify-content: center; padding: 20px;
  background: rgba(10,11,16,.55); backdrop-filter: blur(4px);
  opacity: 0; transition: opacity .22s ease;
}
.da-overlay.open { opacity: 1; }
.da-panel {
  position: relative; width: 100%; max-width: 560px; max-height: min(92vh, 760px);
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--da-surface); border-radius: var(--da-radius);
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.6);
  transform: translateY(14px) scale(.985); transition: transform .24s cubic-bezier(.2,.7,.2,1);
}
.da-overlay.open .da-panel { transform: none; }
.da-inline .da-panel { box-shadow: 0 1px 0 var(--da-line); border: 1px solid var(--da-line); max-height: none; }

/* background media */
.da-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
.da-bg img, .da-bg video { width: 100%; height: 100%; object-fit: cover; }
.da-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,9,13,.62), rgba(8,9,13,.82)); }
.da-onbg { --da-ink: #fff; --da-ink-2: rgba(255,255,255,.78); --da-surface: transparent; --da-line: rgba(255,255,255,.18); }

/* header */
.da-head { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px;
  padding: 18px 20px; border-bottom: 1px solid var(--da-line); }
.da-logo { height: 30px; width: auto; border-radius: 6px; }
.da-title { font-size: 15px; font-weight: 700; margin: 0; }
.da-close { margin-left: auto; width: 40px; height: 40px; border-radius: 10px; border: none;
  background: transparent; color: var(--da-ink-2); cursor: pointer; display: inline-flex;
  align-items: center; justify-content: center; }
.da-close:hover { color: var(--da-ink); }
.da-close svg { width: 20px; height: 20px; }

/* progress */
.da-progress { position: relative; z-index: 1; height: 4px; background: var(--da-line); }
.da-progress > i { display: block; height: 100%; background: var(--da-accent); width: 0;
  transition: width .3s ease; }

/* body */
.da-body { position: relative; z-index: 1; padding: 26px 22px 8px; overflow-y: auto; flex: 1; }
.da-stepno { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--da-ink-2); margin: 0 0 8px; font-weight: 600; }
.da-q { font-size: 22px; font-weight: 700; margin: 0 0 6px; letter-spacing: -.01em; }
.da-help { font-size: 14px; color: var(--da-ink-2); margin: 0 0 16px; }
.da-intro-sub { font-size: 15px; color: var(--da-ink-2); margin: 6px 0 0; }

/* fields */
.da-field { display: block; }
.da-input, .da-textarea, .da-select {
  width: 100%; font: inherit; font-size: 16px; color: var(--da-ink);
  background: color-mix(in srgb, var(--da-surface) 100%, #888 6%);
  border: 1.5px solid var(--da-line); border-radius: 12px; padding: 13px 14px; min-height: 48px;
  transition: border-color .15s ease, box-shadow .15s ease; outline: none;
}
.da-onbg .da-input, .da-onbg .da-textarea, .da-onbg .da-select { background: rgba(255,255,255,.08); color:#fff; }
.da-textarea { min-height: 110px; resize: vertical; }
.da-input:focus, .da-textarea:focus, .da-select:focus { border-color: var(--da-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--da-accent) 26%, transparent); }
.da-input::placeholder, .da-textarea::placeholder { color: var(--da-ink-2); opacity: .8; }

/* choice options */
.da-options { display: grid; gap: 10px; }
.da-opt { display: flex; align-items: center; gap: 12px; padding: 13px 14px; cursor: pointer;
  border: 1.5px solid var(--da-line); border-radius: 12px; min-height: 48px;
  transition: border-color .15s ease, background .15s ease; }
.da-opt:hover { border-color: color-mix(in srgb, var(--da-accent) 60%, var(--da-line)); }
.da-opt.sel { border-color: var(--da-accent); background: color-mix(in srgb, var(--da-accent) 12%, transparent); }
.da-opt .box { width: 20px; height: 20px; flex: none; border: 2px solid var(--da-line);
  display: inline-flex; align-items: center; justify-content: center; color: #1a1205; }
.da-opt.radio .box { border-radius: 50%; } .da-opt.check .box { border-radius: 6px; }
.da-opt.sel .box { border-color: var(--da-accent); background: var(--da-accent); }
.da-opt .box svg { width: 13px; height: 13px; opacity: 0; }
.da-opt.sel .box svg { opacity: 1; }
.da-opt span.lbl { font-size: 15px; }

/* audio */
.da-audio { display: inline-flex; align-items: center; gap: 8px; margin: 0 0 14px;
  padding: 8px 12px; border-radius: 999px; border: 1.5px solid var(--da-line);
  background: transparent; color: var(--da-ink); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; }
.da-audio:hover { border-color: var(--da-accent); }
.da-audio svg { width: 16px; height: 16px; color: var(--da-accent); }

/* error */
.da-err { color: #c0392b; font-size: 13px; margin: 8px 0 0; min-height: 18px; }
.da-onbg .da-err { color: #ff9b8a; }

/* footer */
.da-foot { position: relative; z-index: 1; display: flex; gap: 10px; align-items: center;
  padding: 16px 22px 22px; }
.da-btn { font: inherit; font-size: 15px; font-weight: 700; border-radius: 12px; padding: 13px 22px;
  min-height: 48px; cursor: pointer; border: 1.5px solid transparent; transition: transform .15s ease, background .15s ease, opacity .15s ease; }
.da-btn:active { transform: translateY(1px); }
.da-btn-primary { background: var(--da-accent); color: #1a1205; margin-left: auto; }
.da-btn-primary:hover { filter: brightness(1.04); }
.da-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.da-btn-ghost { background: transparent; color: var(--da-ink); border-color: var(--da-line); }
.da-btn-ghost:hover { border-color: var(--da-ink-2); }

/* centered states (intro / resume / success / unavailable) */
.da-center { position: relative; z-index: 1; text-align: center; padding: 40px 26px; }
.da-center h2 { font-size: 24px; margin: 14px 0 6px; letter-spacing: -.01em; }
.da-center p { color: var(--da-ink-2); margin: 0 auto 22px; max-width: 40ch; }
.da-center .da-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.da-badge { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto;
  display: inline-flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--da-accent) 18%, transparent); color: var(--da-accent); }
.da-badge svg { width: 28px; height: 28px; }

.da-spin { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,.25); border-top-color: #1a1205;
  border-radius: 50%; display: inline-block; animation: da-rot .7s linear infinite; vertical-align: -2px; margin-right: 6px; }
@keyframes da-rot { to { transform: rotate(360deg); } }

@media (max-width: 560px) {
  .da-overlay { padding: 0; }
  .da-panel { max-width: 100%; max-height: 100%; height: 100%; border-radius: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .da-overlay, .da-panel, .da-progress > i, .da-btn { transition: none; }
}
`;function g(){try{return localStorage.setItem("__da","1"),localStorage.removeItem("__da"),localStorage}catch{try{return sessionStorage}catch{return null}}}var v=n=>`da_progress_${n}`;function y(n){let t=g();if(!t)return null;try{let e=t.getItem(v(n));return e?JSON.parse(e):null}catch{return null}}function x(n,t){let e=g();if(e)try{e.setItem(v(n),JSON.stringify(t))}catch{}}function b(n){let t=g();if(t)try{t.removeItem(v(n))}catch{}}var h=class{constructor(t,e){this.url=t;this.anon=e;this.url=t.replace(/\/$/,"")}h(t={}){return{apikey:this.anon,Authorization:`Bearer ${this.anon}`,"Content-Type":"application/json",...t}}async getFlow(t){let e=await fetch(`${this.url}/rest/v1/flows?public_key=eq.${encodeURIComponent(t)}&select=*`,{headers:this.h()});if(!e.ok)throw new Error("flow");return(await e.json())[0]||null}async getQuestions(t){let e=await fetch(`${this.url}/rest/v1/flow_questions?flow_id=eq.${t}&order=order_index.asc&select=*`,{headers:this.h()});if(!e.ok)throw new Error("questions");return(await e.json()).map(r=>({...r,options:Array.isArray(r.options)?r.options:[]}))}recordView(t){fetch(`${this.url}/rest/v1/flow_views`,{method:"POST",headers:this.h({Prefer:"return=minimal"}),body:JSON.stringify({flow_id:t})}).catch(()=>{})}async submit(t,e){if(!(await fetch(`${this.url}/rest/v1/submissions`,{method:"POST",headers:this.h({Prefer:"return=minimal"}),body:JSON.stringify({flow_id:t,answers_json:e})})).ok)throw new Error("submit")}},c={spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>'},w=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,k=n=>/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(n),u=class{constructor(t){this.cfg=t;this.t=p.es;this.flow=null;this.questions=[];this.answers={};this.step=0;this.screen="intro";this.sending=!1;this.viewed=!1;this.audioEl=null;this.accent="#E7AB2E";this.launcher=null;this.overlayEl=null;this.onKey=t=>{t.key==="Escape"&&this.close()};this.api=new h(t.supabaseUrl,t.supabaseAnonKey),t.accentColor&&(this.accent=t.accentColor)}async mount(){let t=!!this.cfg.target;this.host=document.createElement("div"),this.host.setAttribute("data-discovery-assistant",this.cfg.key),(t&&document.querySelector(this.cfg.target)||document.body).appendChild(this.host),this.root=this.host.attachShadow({mode:"open"});let e=document.createElement("style");if(e.textContent=m,this.root.appendChild(e),!document.querySelector("link[data-da-font]")){let a=document.createElement("link");a.rel="stylesheet",a.setAttribute("data-da-font",""),a.href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",document.head.appendChild(a)}t?await this.open():this.renderLauncher()}renderLauncher(){let t=this.cfg.position==="bottom-left"?"left":"right",e=this.cfg.launcherText||"Discovery",a=document.createElement("button");a.className=`da-launcher ${t}`,a.style.background=this.accent,a.setAttribute("aria-haspopup","dialog"),a.innerHTML=`${c.spark}<span></span>`,a.querySelector("span").textContent=e,a.addEventListener("click",()=>this.open()),this.root.appendChild(a),this.launcher=a}async open(){if(!this.flow)try{let t=await this.api.getFlow(this.cfg.key);if(!t||t.status==="DRAFT")this.flow=t,this.screen="unavailable";else if(this.flow=t,this.t=p[t.language]||p.es,!this.cfg.accentColor&&t.accent_color&&(this.accent=t.accent_color),t.status==="INACTIVE")this.screen="unavailable";else{this.questions=await this.api.getQuestions(t.id);let e=y(this.cfg.key);e&&e.answers&&Object.keys(e.answers).length?(this.answers=e.answers,this.step=Math.min(e.currentStep||1,this.questions.length),this.screen="resume"):this.screen="intro"}}catch{this.screen="error"}this.renderPanel(),this.flow&&this.flow.status==="ACTIVE"&&!this.viewed&&(this.viewed=!0,this.api.recordView(this.flow.id))}close(){if(this.stopAudio(),this.cfg.target)return;let t=this.overlayEl;t&&(t.classList.remove("open"),setTimeout(()=>t.remove(),220),this.overlayEl=null),this.launcher&&(this.launcher.style.display="")}renderPanel(){var l;let t=!!this.cfg.target,e;if(t){this.root.querySelectorAll(".da-overlay,.da-inline").forEach(d=>d.remove());let o=document.createElement("div");o.className="da-root da-inline",this.root.appendChild(o),e=o}else{if(!this.overlayEl){let o=document.createElement("div");o.className="da-root da-overlay",o.addEventListener("click",d=>{d.target===o&&this.close()}),this.root.appendChild(o),this.overlayEl=o,requestAnimationFrame(()=>o.classList.add("open")),document.addEventListener("keydown",this.onKey),this.launcher&&(this.launcher.style.display="none")}e=this.overlayEl}let a=document.createElement("div");a.className="da-panel",a.setAttribute("role","dialog"),a.setAttribute("aria-modal","true"),(l=this.flow)!=null&&l.background_url&&this.screen!=="unavailable"&&a.classList.add("da-onbg"),a.style.setProperty("--da-accent",this.accent),a.innerHTML=this.panelHtml();let r=e.querySelector(".da-panel");r?r.replaceWith(a):e.appendChild(a),this.wire(a);let s=a.querySelector("input,textarea,select,button.da-btn-primary,.da-opt");s&&setTimeout(()=>s.focus(),60)}bgHtml(){var e;let t=(e=this.flow)==null?void 0:e.background_url;return!t||this.screen==="unavailable"?"":`<div class="da-bg">${k(t)?`<video src="${i(t)}" autoplay muted loop playsinline></video>`:`<img src="${i(t)}" alt="" />`}</div>`}headHtml(){var r,s,l;let t=(r=this.flow)!=null&&r.logo_url?`<img class="da-logo" src="${i(this.flow.logo_url)}" alt="${i(((s=this.flow)==null?void 0:s.name)||"")}" />`:"",e=t?"":`<p class="da-title">${i(((l=this.flow)==null?void 0:l.name)||"Discovery")}</p>`,a=this.cfg.target?"":`<button class="da-close" data-act="close" aria-label="${i(this.t.close)}">${c.close}</button>`;return`<div class="da-head">${t}${e}${a}</div>`}panelHtml(){var s,l,o,d;if(this.screen==="unavailable")return this.headHtml()+`<div class="da-center"><h2>${i(((s=this.flow)==null?void 0:s.name)||"")}</h2><p>${i(this.t.unavailable)}</p>${this.cfg.target?"":`<div class="da-actions"><button class="da-btn da-btn-ghost" data-act="close">${i(this.t.close)}</button></div>`}</div>`;if(this.screen==="error")return this.headHtml()+`<div class="da-center"><h2>:(</h2><p>${i(this.t.errorLoad)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="retry">${i(this.t.next)}</button></div></div>`;if(this.screen==="success")return this.bgHtml()+this.headHtml()+`<div class="da-center"><span class="da-badge">${c.ok}</span><h2>${i(this.t.successTitle)}</h2><p>${i(this.t.successBody)}</p>${this.cfg.target?"":`<div class="da-actions"><button class="da-btn da-btn-ghost" data-act="close">${i(this.t.close)}</button></div>`}</div>`;if(this.screen==="resume")return this.bgHtml()+this.headHtml()+`<div class="da-center"><h2>${i(this.t.resumeTitle)}</h2><p>${i(this.t.resumeBody)}</p><div class="da-actions"><button class="da-btn da-btn-primary" data-act="resume">${i(this.t.continue)}</button><button class="da-btn da-btn-ghost" data-act="restart">${i(this.t.startAgain)}</button></div></div>`;if(this.screen==="intro")return this.bgHtml()+this.headHtml()+`<div class="da-center"><h2>${i(((l=this.flow)==null?void 0:l.intro_title)||((o=this.flow)==null?void 0:o.name)||"")}</h2>${(d=this.flow)!=null&&d.intro_subtitle?`<p>${i(this.flow.intro_subtitle)}</p>`:"<p></p>"}<div class="da-actions"><button class="da-btn da-btn-primary" data-act="begin">${i(this.t.start)}</button></div></div>`;let t=this.questions.length,e=this.questions[this.step-1],a=Math.round((this.step-1)/t*100),r=this.step>=t;return this.bgHtml()+this.headHtml()+`<div class="da-progress"><i style="width:${a}%"></i></div>
       <div class="da-body">
         <p class="da-stepno">${i(this.t.step)} ${this.step} ${i(this.t.of)} ${t}</p>
         <h2 class="da-q" id="da-q">${i(e.label)}${e.required?"":` <span style="font-weight:500;font-size:14px;color:var(--da-ink-2)">(${i(this.t.optional)})</span>`}</h2>
         ${e.help_text?`<p class="da-help">${i(e.help_text)}</p>`:""}
         ${e.audio_url?`<button class="da-audio" data-act="audio" data-url="${i(e.audio_url)}" aria-label="${i(this.t.listen)}">${c.play}<span>${i(this.t.listen)}</span></button>`:""}
         ${this.fieldHtml(e)}
         <p class="da-err" data-err role="alert"></p>
       </div>
       <div class="da-foot">
         ${this.step>1?`<button class="da-btn da-btn-ghost" data-act="back">${i(this.t.back)}</button>`:""}
         <button class="da-btn da-btn-primary" data-act="${r?"submit":"next"}">${i(r?this.t.finish:this.t.next)}</button>
       </div>`}fieldHtml(t){let e=this.answers[t.key],a=typeof e=="string"?e:"",r=Array.isArray(e)?e:[];switch(t.type){case"TEXTAREA":return`<label class="da-field"><textarea class="da-textarea" data-input placeholder="${i(t.placeholder||"")}">${i(a)}</textarea></label>`;case"EMAIL":return`<label class="da-field"><input class="da-input" type="email" inputmode="email" autocomplete="email" data-input placeholder="${i(t.placeholder||"")}" value="${i(a)}" /></label>`;case"PHONE":return`<label class="da-field"><input class="da-input" type="tel" inputmode="tel" autocomplete="tel" data-input placeholder="${i(t.placeholder||"")}" value="${i(a)}" /></label>`;case"SELECT":return`<label class="da-field"><select class="da-select" data-input><option value="">${i(t.placeholder||this.t.selectPlaceholder)}</option>${t.options.map(s=>`<option value="${i(s)}"${s===a?" selected":""}>${i(s)}</option>`).join("")}</select></label>`;case"RADIO":return`<div class="da-options" role="radiogroup">${t.options.map(s=>`<div class="da-opt radio${s===a?" sel":""}" data-opt="${i(s)}" role="radio" tabindex="0" aria-checked="${s===a}"><span class="box">${c.check}</span><span class="lbl">${i(s)}</span></div>`).join("")}</div>`;case"CHECKBOX":return`<div class="da-options">${t.options.map(s=>`<div class="da-opt check${r.includes(s)?" sel":""}" data-optm="${i(s)}" role="checkbox" tabindex="0" aria-checked="${r.includes(s)}"><span class="box">${c.check}</span><span class="lbl">${i(s)}</span></div>`).join("")}</div>`;default:return`<label class="da-field"><input class="da-input" type="text" data-input placeholder="${i(t.placeholder||"")}" value="${i(a)}" /></label>`}}wire(t){t.querySelectorAll("[data-act]").forEach(a=>{a.addEventListener("click",()=>this.act(a.getAttribute("data-act"),a))});let e=t.querySelector("[data-input]");if(e){let a=this.questions[this.step-1];e.addEventListener("input",()=>{this.answers[a.key]=e.value,this.persist()}),e.addEventListener("change",()=>{this.answers[a.key]=e.value,this.persist()})}t.querySelectorAll("[data-opt]").forEach(a=>{let r=()=>{let s=this.questions[this.step-1];this.answers[s.key]=a.getAttribute("data-opt"),this.persist(),this.renderPanel()};a.addEventListener("click",r),a.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),r())})}),t.querySelectorAll("[data-optm]").forEach(a=>{let r=()=>{let s=this.questions[this.step-1],l=a.getAttribute("data-optm"),o=Array.isArray(this.answers[s.key])?[...this.answers[s.key]]:[],d=o.indexOf(l);d>=0?o.splice(d,1):o.push(l),this.answers[s.key]=o,this.persist(),this.renderPanel()};a.addEventListener("click",r),a.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),r())})})}async act(t,e){switch(t){case"close":this.close();break;case"retry":this.flow=null,this.screen="intro",await this.open();break;case"begin":this.step=1,this.screen="question",this.persist(),this.renderPanel();break;case"resume":this.screen="question",this.step=Math.max(1,this.step),this.renderPanel();break;case"restart":this.answers={},this.step=1,b(this.cfg.key),this.screen="question",this.renderPanel();break;case"back":this.stopAudio(),this.step=Math.max(1,this.step-1),this.persist(),this.renderPanel();break;case"next":this.validateStep()&&(this.stopAudio(),this.step+=1,this.persist(),this.renderPanel());break;case"submit":this.validateStep()&&await this.submit();break;case"audio":e&&this.toggleAudio(e);break}}validateStep(){var l;let t=this.questions[this.step-1],e=this.answers[t.key],a=(l=this.currentPanel())==null?void 0:l.querySelector("[data-err]"),r=o=>{a&&(a.textContent=o)},s=e==null||typeof e=="string"&&!e.trim()||Array.isArray(e)&&e.length===0;return t.required&&s?(r(t.type==="RADIO"||t.type==="CHECKBOX"||t.type==="SELECT"?this.t.selectOne:this.t.required),!1):t.type==="EMAIL"&&typeof e=="string"&&e.trim()&&!w.test(e.trim())?(r(this.t.invalidEmail),!1):(r(""),!0)}async submit(){var t;if(this.flow){this.sending=!0,this.updatePrimary(!0);try{await this.api.submit(this.flow.id,this.answers),b(this.cfg.key),this.screen="success",this.renderPanel()}catch{let e=(t=this.currentPanel())==null?void 0:t.querySelector("[data-err]");e&&(e.textContent=this.t.errorSend),this.sending=!1,this.updatePrimary(!1)}}}updatePrimary(t){var a;let e=(a=this.currentPanel())==null?void 0:a.querySelector(".da-btn-primary");e&&(e.disabled=t,e.innerHTML=t?`<span class="da-spin"></span>${i(this.t.sending)}`:i(this.t.finish))}toggleAudio(t){let e=t.getAttribute("data-url");if(this.audioEl&&!this.audioEl.paused&&this.audioEl.src===e){this.stopAudio(),t.innerHTML=`${c.play}<span>${i(this.t.listen)}</span>`;return}this.stopAudio(),this.audioEl=new Audio(e),this.audioEl.play().catch(()=>{}),t.innerHTML=`${c.pause}<span>${i(this.t.listen)}</span>`,this.audioEl.onended=()=>{t.innerHTML=`${c.play}<span>${i(this.t.listen)}</span>`}}stopAudio(){if(this.audioEl){try{this.audioEl.pause()}catch{}this.audioEl=null}}currentPanel(){return this.root.querySelector(".da-panel")}persist(){x(this.cfg.key,{flowKey:this.cfg.key,currentStep:this.step,answers:this.answers,updatedAt:new Date().toISOString()})}};function i(n){return String(n).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}var f=new Set;function E(n){if(!n||!n.key||!n.supabaseUrl||!n.supabaseAnonKey){console.error("[DiscoveryAssistant] init requires { key, supabaseUrl, supabaseAnonKey }");return}let t=n.key+(n.target||"");if(f.has(t))return;f.add(t);let e=()=>new u(n).mount().catch(a=>console.error("[DiscoveryAssistant]",a));document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}window.DiscoveryAssistant={init:E};})();
