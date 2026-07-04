/**
 * Vectis AI ChatBot — Widget embebible
 * Uso:
 *   <script src="https://wearevectis.com/assets/chatbot/widget.js"
 *           data-client-id="UUID-DEL-CHATBOT" defer></script>
 *
 * Lee su apariencia desde el worker (acción "config") y conversa (acción "chat").
 * IMPORTANTE: ajusta WORKER_URL al endpoint de tu worker de Cloudflare.
 */
(function () {
  'use strict';

  var WORKER_URL = 'https://chatbot.vectisauto.workers.dev';

  // --- localizar el script y el client_id ---
  var self = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var CLIENT_ID = self && self.getAttribute('data-client-id');
  if (!CLIENT_ID) { console.warn('[Vectis ChatBot] Falta data-client-id'); return; }
  if (window.__vxcLoaded) return; window.__vxcLoaded = true;

  var cfg = null, history = [], open = false, sending = false, sentEnd = false, csatTimer = null;
  var SKEY = 'vxc_hist_' + CLIENT_ID;
  function loadHistory() { try { return JSON.parse(sessionStorage.getItem(SKEY) || '[]') || []; } catch (e) { return []; } }
  function saveHistory() { try { sessionStorage.setItem(SKEY, JSON.stringify(history.slice(-20))); } catch (e) { /* noop */ } }
  // Una "conversación" = una sesión del visitante (persiste mientras dure la pestaña).
  var SIDKEY = 'vxc_sid_' + CLIENT_ID;
  function sessionId() {
    try {
      var v = sessionStorage.getItem(SIDKEY);
      if (!v) { v = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); sessionStorage.setItem(SIDKEY, v); }
      return v;
    } catch (e) { return 'anon'; }
  }

  // --- helpers ---
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Markdown mínimo y seguro (escapa primero, luego aplica formato).
  function mdToHtml(t) {
    var s = esc(String(t));
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // listas con viñetas (- o *) y numeradas
    var lines = s.split(/\n/), html = '', i = 0;
    while (i < lines.length) {
      if (/^\s*[-*]\s+/.test(lines[i])) {
        html += '<ul>';
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { html += '<li>' + lines[i].replace(/^\s*[-*]\s+/, '') + '</li>'; i++; }
        html += '</ul>';
      } else if (/^\s*\d+\.\s+/.test(lines[i])) {
        html += '<ol>';
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { html += '<li>' + lines[i].replace(/^\s*\d+\.\s+/, '') + '</li>'; i++; }
        html += '</ol>';
      } else {
        var buf = [];
        while (i < lines.length && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) { buf.push(lines[i]); i++; }
        html += buf.join('\n');
      }
    }
    return html.replace(/\n/g, '<br>');
  }
  function api(payload) {
    return fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }

  // --- arranque: pedir config ---
  api({ action: 'config', client_id: CLIENT_ID }).then(function (c) {
    if (!c || !c.available) return;        // bot inactivo / cancelado / no disponible
    cfg = c;
    injectStyles();
    render();
  }).catch(function () { /* silencioso */ });

  function injectStyles() {
    var brand = cfg.brandColor || '#E7AB2E';
    var brand2 = cfg.secondColor || '#0A0A0A';
    var css =
      '.vxc-launch{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;z-index:2147483000;' +
      'background:linear-gradient(135deg,' + brand + ',' + brand2 + ');box-shadow:0 10px 30px rgba(0,0,0,.25);display:grid;place-items:center;transition:transform .2s;animation:vxc-pop .42s cubic-bezier(.2,.9,.3,1.3) both}' +
      '.vxc-launch:hover{transform:translateY(-2px) scale(1.05)}.vxc-launch:active{transform:scale(.96)}' +
      '.vxc-launch svg{width:28px;height:28px;color:#fff}' +
      '.vxc-panel{position:fixed;bottom:92px;right:20px;width:410px;max-width:calc(100vw - 32px);height:640px;max-height:calc(100vh - 110px);' +
      'background:#fff;border-radius:18px;overflow:hidden;z-index:2147483000;display:flex;flex-direction:column;box-shadow:0 24px 70px rgba(0,0,0,.3);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'opacity:0;visibility:hidden;transform:translateY(14px) scale(.97);transform-origin:bottom right;pointer-events:none;transition:opacity .22s ease,transform .24s cubic-bezier(.2,.8,.2,1),visibility .24s}' +
      '.vxc-panel.vxc-on{opacity:1;visibility:visible;transform:none;pointer-events:auto}' +
      '.vxc-head{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#fff;background:linear-gradient(135deg,' + brand + ',' + brand2 + ')}' +
      '.vxc-ava{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);color:#111;display:grid;place-items:center;font-weight:800;font-size:14px;object-fit:cover;flex-shrink:0}' +
      '.vxc-meta{display:flex;flex-direction:column;min-width:0;line-height:1.15}' +
      '.vxc-title{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.vxc-sub{font-size:11px;opacity:.92;display:inline-flex;align-items:center;gap:5px}' +
      '.vxc-dot{width:7px;height:7px;border-radius:50%;background:#34e0a1;box-shadow:0 0 6px #34e0a1}' +
      '.vxc-min,.vxc-x{background:transparent;border:none;color:#fff;cursor:pointer;line-height:1;padding:4px 6px;border-radius:8px;display:inline-flex;align-items:center}' +
      '.vxc-min{margin-left:auto}.vxc-x{font-size:20px}' +
      '.vxc-min:hover,.vxc-x:hover{background:rgba(255,255,255,.18)}' +
      '.vxc-body{flex:1;overflow-y:auto;padding:16px;background:#f6f6f8;display:flex;flex-direction:column;gap:10px}' +
      '.vxc-b{max-width:84%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;animation:vxc-rise .26s ease both}' +
      '.vxc-bot{align-self:flex-start;background:#fff;color:#1a1a1a;border:1px solid #ececf0;border-bottom-left-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.05)}' +
      '.vxc-user{align-self:flex-end;color:#fff;background:linear-gradient(135deg,' + brand + ',' + brand2 + ');border-bottom-right-radius:4px}' +
      '.vxc-typing{align-self:flex-start;display:inline-flex;gap:4px;padding:13px 14px;background:#fff;border:1px solid #ececf0;border-radius:14px;border-bottom-left-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.05)}' +
      '.vxc-typing span{width:7px;height:7px;border-radius:50%;background:#bbb;animation:vxc-bounce 1s infinite}' +
      '.vxc-typing span:nth-child(2){animation-delay:.15s}.vxc-typing span:nth-child(3){animation-delay:.3s}' +
      '.vxc-qr{display:flex;flex-wrap:wrap;gap:7px;margin-top:2px}' +
      '.vxc-chip{font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:999px;border:1px solid ' + brand + ';color:' + brand + ';background:#fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.05);transition:background .15s,color .15s}' +
      '.vxc-chip:hover{background:' + brand + ';color:#fff}' +
      '.vxc-foot{display:flex;align-items:center;gap:8px;padding:11px 12px;border-top:1px solid #eee;background:#fff}' +
      '.vxc-in{flex:1;border:1px solid #e3e3e8;border-radius:11px;padding:11px 13px;font-size:14px;outline:none;font-family:inherit}' +
      '.vxc-in:focus{border-color:' + brand + ';box-shadow:0 0 0 3px ' + brand + '22}' +
      '.vxc-send{border:none;border-radius:11px;width:42px;height:42px;flex-shrink:0;display:grid;place-items:center;cursor:pointer;color:#fff;background:linear-gradient(135deg,' + brand + ',' + brand2 + ');transition:transform .15s}' +
      '.vxc-send:hover{transform:translateY(-1px)}.vxc-send:disabled{opacity:.5;cursor:default;transform:none}' +
      '.vxc-powered{text-align:center;font-size:10.5px;color:#aaa;padding:0 0 8px;background:#fff}.vxc-powered a{color:inherit;text-decoration:underline}' +
      // encuesta de satisfacción (CSAT)
      '.vxc-csat{align-self:center;display:flex;align-items:center;gap:8px;margin:4px 0;padding:8px 12px;background:#fff;border:1px solid #ececf0;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.05);font-size:12.5px;color:#555}' +
      '.vxc-csat-q{font-weight:600}' +
      '.vxc-csat-b{border:none;background:#f2f2f5;border-radius:8px;cursor:pointer;font-size:15px;line-height:1;padding:5px 9px;transition:transform .12s,background .15s}' +
      '.vxc-csat-b:hover{background:#e7e7ec;transform:translateY(-1px)}' +
      '.vxc-note{font-size:10.5px;color:#9a9a9a;padding:8px 12px 2px;background:#fff;text-align:center;line-height:1.4}.vxc-note a{color:#777;text-decoration:underline}' +
      // posición a la izquierda
      '.vxc-launch.vxc-left{left:20px;right:auto}' +
      '.vxc-panel.vxc-left{left:20px;right:auto;transform-origin:bottom left}' +
      // markdown en respuestas del bot
      '.vxc-bot{white-space:normal}' +
      '.vxc-bot a{color:' + brand + ';text-decoration:underline;font-weight:600;word-break:break-word}' +
      '.vxc-bot strong{font-weight:700}.vxc-bot em{font-style:italic}' +
      '.vxc-bot ul,.vxc-bot ol{margin:6px 0;padding-left:20px}.vxc-bot li{margin:2px 0}' +
      '.vxc-bot code{background:#f0f0f3;border-radius:4px;padding:1px 5px;font-size:12.5px;font-family:ui-monospace,Menlo,Consolas,monospace}' +
      '@keyframes vxc-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}' +
      '@keyframes vxc-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '@keyframes vxc-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}';
    var st = el('style'); st.textContent = css; document.head.appendChild(st);
  }

  var $body, $panel, $launch;

  function render() {
    // launcher
    $launch = el('button', 'vxc-launch');
    $launch.setAttribute('aria-label', 'Abrir chat');
    $launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    $launch.onclick = toggle;
    document.body.appendChild($launch);

    // panel
    $panel = el('div', 'vxc-panel');
    var head = el('div', 'vxc-head');
    var initial = ((cfg.title || 'A').trim().charAt(0) || 'A').toUpperCase();
    var ava = cfg.logo ? '<img class="vxc-ava" src="' + esc(cfg.logo) + '" alt="">' : '<span class="vxc-ava">' + esc(initial) + '</span>';
    head.innerHTML = ava + '<div class="vxc-meta"><div class="vxc-title">' + esc(cfg.title) + '</div><div class="vxc-sub"><span class="vxc-dot"></span>En línea</div></div>' +
      '<button class="vxc-min" aria-label="Minimizar" title="Minimizar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg></button>' +
      '<button class="vxc-x" aria-label="Cerrar y borrar conversación" title="Cerrar y empezar de nuevo">&times;</button>';
    head.querySelector('.vxc-min').onclick = toggle;     // minimizar: oculta el panel, conserva el chat
    head.querySelector('.vxc-x').onclick = closeChat;    // cerrar: borra la conversación y empieza una nueva

    $body = el('div', 'vxc-body');

    var foot = el('div', 'vxc-foot');
    var input = el('input', 'vxc-in'); input.type = 'text'; input.placeholder = 'Escribe tu mensaje…';
    var send = el('button', 'vxc-send');
    send.setAttribute('aria-label', 'Enviar');
    send.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    foot.appendChild(input); foot.appendChild(send);
    function doSend() { var v = input.value.trim(); if (v) { input.value = ''; ask(v); } }
    send.onclick = doSend;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSend(); });

    var note = null;
    if (cfg.privacyText) {
      var noteHtml = esc(cfg.privacyText);
      if (cfg.privacyUrl) {
        var anchor = function (t) { return '<a href="' + esc(cfg.privacyUrl) + '" target="_blank" rel="noopener">' + t + '</a>'; };
        // Enlaza la frase "privacidad de Vectis" dentro del texto; si no aparece, agrega "Más info".
        var m = cfg.privacyText.match(/privacidad de vectis/i);
        if (m) noteHtml = noteHtml.replace(esc(m[0]), anchor(esc(m[0])));
        else noteHtml += ' ' + anchor('Más info');
      }
      note = el('div', 'vxc-note', noteHtml);
    }
    var powered = el('div', 'vxc-powered', 'Powered by <a href="https://www.wearevectis.com" target="_blank" rel="noopener">Vectis</a>');

    $panel.appendChild(head); $panel.appendChild($body); $panel.appendChild(foot);
    if (note) $panel.appendChild(note);
    $panel.appendChild(powered);
    document.body.appendChild($panel);

    // posición del círculo y del panel (izquierda / derecha)
    if (cfg.position === 'left') { $launch.classList.add('vxc-left'); $panel.classList.add('vxc-left'); }

    // restaura la conversación previa (sessionStorage) o muestra la bienvenida
    var saved = loadHistory();
    if (saved.length) {
      history = saved;
      saved.forEach(function (m) { if (m.role === 'user') addUser(m.text); else addBot(m.text); });
    } else {
      addBot(cfg.welcome);
      if (cfg.quickReplies && cfg.quickReplies.length) addQuickReplies(cfg.quickReplies);
    }
  }

  function toggle() { open = !open; $panel.classList.toggle('vxc-on', open); if (open) { var i = $panel.querySelector('.vxc-in'); if (i) i.focus(); } }

  // Cerrar: analiza la sesión vieja (insight), la borra e inicia una conversación nueva.
  function closeChat() {
    endSession();                                  // captura el insight de la sesión actual antes de descartarla
    try { sessionStorage.removeItem(SKEY); sessionStorage.removeItem(SIDKEY); } catch (e) { /* noop */ }
    history = []; sentEnd = false;                  // nueva sesión (sessionId() generará un id nuevo)
    if ($body) {
      $body.innerHTML = '';
      addBot(cfg.welcome);
      if (cfg.quickReplies && cfg.quickReplies.length) addQuickReplies(cfg.quickReplies);
    }
    open = false; $panel.classList.remove('vxc-on');
  }

  function addBot(text) { var b = el('div', 'vxc-b vxc-bot', mdToHtml(text)); $body.appendChild(b); scroll(); }
  function addUser(text) { var b = el('div', 'vxc-b vxc-user', esc(text)); $body.appendChild(b); scroll(); }
  function scroll() { $body.scrollTop = $body.scrollHeight; }

  function addQuickReplies(list) {
    var wrap = el('div', 'vxc-qr');
    list.forEach(function (q) {
      var c = el('button', 'vxc-chip', esc(q));
      c.onclick = function () { wrap.remove(); ask(q); };
      wrap.appendChild(c);
    });
    $body.appendChild(wrap); scroll();
  }

  // Encuesta de satisfacción (CSAT) — solo si el plan la habilita (cfg.csat). Una vez por sesión.
  var CKEY = 'vxc_csat_' + CLIENT_ID;
  function csatDone() { try { return sessionStorage.getItem(CKEY) === '1'; } catch (e) { return false; } }
  function userMsgCount() { var n = 0; for (var i = 0; i < history.length; i++) { if (history[i].role === 'user') n++; } return n; }
  /** Detecta si el cliente cerró la conversación (gracias / adiós / eso es todo…). */
  function isClosing(t) {
    var s = String(t || '').trim().toLowerCase();
    if (s.length > 40 || s.indexOf('?') >= 0) return false;
    return /(^|\b)(gracias|muchas gracias|mil gracias|listo|vale gracias|ok gracias|perfecto gracias|eso es todo|eso ser[ií]a todo|ad[ií]os|hasta luego|chao|nos vemos|ya (est[aá]|qued[oó])|thanks|thank you|thx|bye|goodbye|that'?s all|appreciate it)(\b|$)/.test(s);
  }
  /**
   * Programa la encuesta para el FINAL de la conversación (con ≥2 mensajes del cliente):
   * o por INACTIVIDAD (25 s sin actividad) o rápido si el cliente se despidió/agradeció.
   */
  function scheduleCsat(delay) {
    if (!cfg || !cfg.csat || csatDone()) return;
    if (csatTimer) { clearTimeout(csatTimer); csatTimer = null; }
    if (userMsgCount() < 3) return;                 // espera a que haya una conversación real (varios intercambios)
    csatTimer = setTimeout(function () {
      csatTimer = null;
      if (!csatDone() && !sending) showCsat();
    }, delay || 45000);
  }
  function showCsat() {
    if (!cfg || !cfg.csat || csatDone()) return;
    if ($body.querySelector('.vxc-csat')) return;
    if (!history.some(function (h) { return h.role === 'user'; })) return;
    var bar = el('div', 'vxc-csat');
    bar.innerHTML = '<span class="vxc-csat-q">¿Te resultó útil?</span>' +
      '<button class="vxc-csat-b" data-r="1" aria-label="Sí, me ayudó">👍</button>' +
      '<button class="vxc-csat-b" data-r="0" aria-label="No me ayudó">👎</button>';
    var btns = bar.querySelectorAll('.vxc-csat-b');
    for (var i = 0; i < btns.length; i++) {
      (function (b) { b.onclick = function () { sendCsat(b.getAttribute('data-r') === '1' ? 1 : 0, bar); }; })(btns[i]);
    }
    $body.appendChild(bar); scroll();
  }
  function sendCsat(rating, bar) {
    try { sessionStorage.setItem(CKEY, '1'); } catch (e) { /* noop */ }
    api({ action: 'csat', client_id: CLIENT_ID, session_id: sessionId(), rating: rating }).catch(function () { /* noop */ });
    bar.innerHTML = '<span class="vxc-csat-q">¡Gracias por tu opinión!</span>';
  }

  // Avisa al worker que la sesión terminó → genera el insight con IA (1 por sesión, planes Pro/Business).
  function endSession() {
    if (sentEnd) return;
    if (!history.some(function (h) { return h.role === 'user'; })) return;
    sentEnd = true;
    try {
      var payload = JSON.stringify({ action: 'end', client_id: CLIENT_ID, session_id: sessionId(), history: history.slice(-20) });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(WORKER_URL, new Blob([payload], { type: 'text/plain;charset=UTF-8' }));
      } else {
        fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload, keepalive: true });
      }
    } catch (e) { /* noop */ }
  }

  function ask(text) {
    if (sending) return; sending = true;
    sentEnd = false;                 // hay nueva actividad: permitir analizar el cierre posterior
    var closing = isClosing(text);   // ¿el cliente se está despidiendo/agradeciendo?
    if (csatTimer) { clearTimeout(csatTimer); csatTimer = null; }   // hay actividad: reinicia el reloj de la encuesta
    var qr = $body.querySelector('.vxc-csat'); if (qr) qr.remove(); // si había encuesta pendiente, quítala al seguir chateando
    qr = $body.querySelector('.vxc-qr'); if (qr) qr.remove();       // los quick replies se ocultan al iniciar la conversación
    addUser(text);
    history.push({ role: 'user', text: text }); saveHistory();
    var typing = el('div', 'vxc-typing', '<span></span><span></span><span></span>'); $body.appendChild(typing); scroll();

    api({ action: 'chat', client_id: CLIENT_ID, session_id: sessionId(), message: text, history: history.slice(0, -1) })
      .then(function (r) {
        typing.remove();
        var reply = (r && r.reply) || (r && r.error === 'origin_not_allowed'
          ? 'Este chat no está autorizado en este dominio.'
          : 'Lo siento, no pude responder. Intenta de nuevo.');
        addBot(reply);
        history.push({ role: 'bot', text: reply });
        if (history.length > 20) history = history.slice(-20);
        saveHistory();
        // Si el cliente cerró (gracias/adiós), pide opinión tras una breve pausa; si no, espera a que haya inactividad.
        scheduleCsat(closing ? 4000 : 45000);
      })
      .catch(function () { typing.remove(); addBot('Hubo un problema de conexión. Intenta de nuevo.'); })
      .finally(function () { sending = false; });
  }

  // Fin de sesión: al salir de la página (confiable vía sendBeacon).
  window.addEventListener('pagehide', endSession);
  window.addEventListener('beforeunload', endSession);
})();
