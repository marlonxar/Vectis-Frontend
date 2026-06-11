# Loaders de Vectis

El loader vive en `src/index.html` (CSS + markup + script en línea; corre **antes** de que arranque Angular).
Hay tres variantes. Para cambiar, reemplaza en `index.html` el `<style>` del loader, el `<div id="vectis-loader">` y el `<script>` del loader por los de la variante deseada.

**Activo actualmente: Typing.** Las otras dos quedan como backup abajo.

---

## Activo — "Typing" (escribe Vectis letra por letra)

Ver el bloque en uso en `src/index.html`. Resumen: sobre fondo negro, escribe `Vectis` carácter por carácter con un cursor dorado parpadeante; al terminar agrega el punto dorado y crece una línea dorada debajo.

---

## Backup 1 — "Terminal (dev)"

`<style>`:

```html
<style>
  #vectis-loader{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
    background:#0A0A0A;transition:opacity .6s ease,visibility .6s ease;
    font-family:'JetBrains Mono',ui-monospace,monospace}
  #vectis-loader.hidden{opacity:0;visibility:hidden}
  .vt{width:min(440px,86vw);background:#0E0E12;border:1px solid rgba(255,255,255,.10);
    border-radius:12px;overflow:hidden;box-shadow:0 40px 90px -34px rgba(0,0,0,.85)}
  .vt-bar{display:flex;align-items:center;gap:7px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
  .vt-bar i{width:11px;height:11px;border-radius:50%;display:block}
  .vt-d1{background:#FF5F57}.vt-d2{background:#FEBC2E}.vt-d3{background:#28C840}
  .vt-title{margin-left:8px;font-size:12px;color:rgba(255,255,255,.45)}
  .vt-body{padding:18px;font-size:13px;line-height:1.95;min-height:176px}
  .vt-line{opacity:0;color:#C9C9D2;transition:opacity .2s ease}
  .vt-line.show{opacity:1}
  .vt-line .p{color:#E7AB2E}.vt-line .ok{color:#28C840}.vt-line .dim{color:rgba(255,255,255,.38)}
  .vt-brand{margin-top:10px;font-family:'Outfit',sans-serif;font-weight:800;font-size:36px;
    color:#fff;opacity:0;transform:translateY(6px);transition:opacity .45s ease,transform .45s ease}
  .vt-brand.show{opacity:1;transform:none}
  .vt-brand b{color:#E7AB2E}
  .vt-caret{display:inline-block;width:9px;height:17px;background:#E7AB2E;margin-left:3px;
    vertical-align:-3px;animation:vtb 1s steps(1) infinite}
  @keyframes vtb{50%{opacity:0}}
  @media (prefers-reduced-motion: reduce){
    .vt-line,.vt-brand{opacity:1;transform:none}.vt-caret{animation:none}#vectis-loader{transition:none}}
</style>
```

Markup:

```html
<div id="vectis-loader" role="status" aria-live="polite" aria-label="Cargando Vectis">
  <div class="vt" aria-hidden="true">
    <div class="vt-bar"><i class="vt-d1"></i><i class="vt-d2"></i><i class="vt-d3"></i><span class="vt-title">vectis — zsh</span></div>
    <div class="vt-body" id="vt-body">
      <div class="vt-line"><span class="p">$</span> vectis build --prod <span class="vt-caret"></span></div>
      <div class="vt-line"><span class="dim">→</span> resolving modules <span class="dim">·········</span> <span class="ok">done</span></div>
      <div class="vt-line"><span class="dim">→</span> compiling typescript <span class="dim">······</span> <span class="ok">done</span></div>
      <div class="vt-line"><span class="dim">→</span> bundling assets <span class="dim">··········</span> <span class="ok">ok</span></div>
      <div class="vt-line"><span class="ok">✓</span> <span class="dim">ready in 1.8s</span></div>
      <div class="vt-brand">Vectis<b>.</b></div>
    </div>
  </div>
</div>
```

Script:

```html
<script>
  (function () {
    var loader = document.getElementById('vectis-loader');
    var lines = document.querySelectorAll('#vt-body .vt-line');
    var brand = document.querySelector('#vt-body .vt-brand');
    var i = 0;
    function step() {
      if (i < lines.length) { lines[i].classList.add('show'); i++; setTimeout(step, 340); }
      else if (brand) { brand.classList.add('show'); }
    }
    setTimeout(step, 260);
    function hide(){ if(!loader) return; loader.classList.add('hidden');
      setTimeout(function(){ if(loader) loader.style.display='none'; }, 650); }
    setTimeout(hide, 2600);
    setTimeout(function(){ if(loader) loader.style.display='none'; }, 4200);
  })();
</script>
```

---

## Backup 2 — "Minimal" (wordmark + barra dorada)

`<style>`:

```html
<style>
  #vectis-loader{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:24px;background:#0A0A0A;
    transition:opacity .6s ease,visibility .6s ease}
  #vectis-loader.hidden{opacity:0;visibility:hidden}
  .vl-word{font-family:'Outfit',sans-serif;font-weight:800;font-size:30px;letter-spacing:.02em;color:#fff}
  .vl-word b{color:#E7AB2E;font-weight:800}
  .vl-track{position:relative;width:180px;height:2px;background:rgba(255,255,255,.14);overflow:hidden;border-radius:2px}
  .vl-track>i{position:absolute;left:0;top:0;height:100%;width:0;display:block;background:#E7AB2E}
  @media (prefers-reduced-motion: reduce){#vectis-loader{transition:none}}
</style>
```

Markup:

```html
<div id="vectis-loader" role="status" aria-live="polite" aria-label="Cargando Vectis">
  <div class="vl-word" aria-hidden="true">Vectis<b>.</b></div>
  <div class="vl-track" aria-hidden="true"><i id="vl-fill"></i></div>
</div>
```

Script:

```html
<script>
  (function () {
    var fill = document.getElementById('vl-fill');
    var loader = document.getElementById('vectis-loader');
    var p = 0;
    var iv = setInterval(function () {
      p = Math.min(100, p + Math.random() * 16);
      if (fill) fill.style.width = p + '%';
      if (p >= 100) clearInterval(iv);
    }, 170);
    function hide(){ if(!loader) return; loader.classList.add('hidden');
      setTimeout(function(){ if(loader) loader.style.display='none'; }, 650); }
    setTimeout(hide, 2200);
    setTimeout(function(){ if(loader) loader.style.display='none'; }, 4000);
  })();
</script>
```
