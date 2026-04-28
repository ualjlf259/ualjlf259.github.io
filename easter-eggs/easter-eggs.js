/* ═══════════════════════════════════════════════════
   EASTER EGGS — Módulo autocontenido
   Carga DESPUÉS de script.js, locales/*.js (depende
   de los globales `i18n` y `currentLang` definidos
   allí, con fallback defensivo si no existen).

   Eggs incluidos:
   - 1) Tatakae   : "tatakae"  → shake + borde rojo + modal
   - 2) Sakura    : 3 clics rápidos sobre .nav-logo → lluvia de pétalos
   - 3) Rasengan  : "rasengan" → esfera de chakra centrada
   - 4) Saiyan    : "saiyan"   → aura dorada + shake fuerte
   - 5) Joyboy    : "joyboy"   → latido de la página + risa de Nika
   - 6) Tsukuyomi : 5 clics rápidos sobre #theme-toggle → caos + genjutsu

   Convivencia segura:
   · Todas las clases CSS llevan prefijo .ee-*
   · Cada egg tiene su propio flag *Active para evitar reentrada
   · Listeners protegidos con dataset.eeBound / dataset.eeTsuBound
   · No toca theme toggle, idiomas, tarjetas, modal de compartir.
═══════════════════════════════════════════════════ */
(function easterEggs() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  /* ── Helpers ───────────────────────────────────── */
  function tCurrent(key, fallback) {
    try {
      const lang = (typeof currentLang !== 'undefined' && currentLang)
        || localStorage.getItem('lang') || 'es';
      const dict = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : null;
      if (dict && dict[key]) return dict[key];
    } catch (_) { /* noop */ }
    return fallback;
  }

  /* ─────────────────────────────────────────────────
     DETECTOR DE PALABRAS — un solo listener, un solo
     buffer, diccionario palabra → handler. O(k) por
     tecla, donde k = nº de palabras secretas.
  ───────────────────────────────────────────────── */
  const KEYWORDS = {
    tatakae : () => triggerTatakae(),
    rasengan: () => triggerRasengan(),
    saiyan  : () => triggerSaiyan(),
    joyboy  : () => triggerJoyboy(),
  };
  const KW_LIST = Object.keys(KEYWORDS);
  const KW_MAX_LEN = KW_LIST.reduce((m, w) => Math.max(m, w.length), 0);
  let keyBuffer = '';

  document.addEventListener('keydown', (e) => {
    // Ignora combinaciones con modificadores (Ctrl+C, Cmd+V, etc.)
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Solo nos interesan teclas imprimibles (a-z, etc.), no Shift/Enter/Arrow…
    if (!e.key || e.key.length !== 1) return;
    keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-KW_MAX_LEN);
    for (let i = 0; i < KW_LIST.length; i++) {
      const w = KW_LIST[i];
      if (keyBuffer.endsWith(w)) {
        keyBuffer = '';
        KEYWORDS[w]();
        break;
      }
    }
  });

  /* ─────────────────────────────────────────────────
     EASTER EGG 1 — TATAKAE
  ───────────────────────────────────────────────── */
  let tatakaeActive = false;

  function triggerTatakae() {
    if (tatakaeActive) return;
    tatakaeActive = true;

    // Shake
    document.body.classList.add('ee-shake-active');
    setTimeout(() => document.body.classList.remove('ee-shake-active'), 1000);

    // Borde rojo parpadeante
    const flash = document.createElement('div');
    flash.className = 'ee-tatakae-flash';
    flash.setAttribute('aria-hidden', 'true');
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1600);

    // Backdrop a pantalla completa + modal dentro
    const backdrop = document.createElement('div');
    backdrop.className = 'ee-tatakae-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const modal = document.createElement('div');
    modal.className = 'ee-tatakae-modal';
    modal.setAttribute('role', 'status');
    modal.setAttribute('aria-live', 'polite');
    const translation = tCurrent('easter_tatakae', '¡Entregad vuestros corazones!');
    modal.innerHTML = `
      <div class="ee-media"><!-- aquí se podrán inyectar imágenes o vídeo en el futuro --></div>
      <div class="ee-eyebrow">進撃の巨人</div>
      <p class="ee-quote">Shinzou wo Sasageyo!</p>
      <div class="ee-divider"></div>
      <p class="ee-translation">${translation}</p>
    `;
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    setTimeout(() => {
      backdrop.classList.add('is-leaving');
      modal.classList.add('is-leaving');
      setTimeout(() => {
        backdrop.remove();
        tatakaeActive = false;
      }, 400);
    }, 4800);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 2 — SAKURA (triple clic en .nav-logo)
  ───────────────────────────────────────────────── */
  const TRIPLE_WINDOW_MS = 700;
  const PETAL_COUNT = 60;
  const PETAL_LIFETIME_MS = 9000;
  let clickTimes = [];
  let sakuraActive = false;

  function attachLogoListener() {
    const logo = document.querySelector('.nav-logo');
    if (!logo || logo.dataset.eeBound === '1') return;
    logo.dataset.eeBound = '1';

    logo.addEventListener('click', (e) => {
      const now = Date.now();
      clickTimes = clickTimes.filter(t => now - t < TRIPLE_WINDOW_MS);
      clickTimes.push(now);
      if (clickTimes.length >= 3) {
        clickTimes = [];
        e.preventDefault(); // evita la navegación al activar el huevo
        triggerSakura();
      }
    });
  }

  function triggerSakura() {
    if (sakuraActive) return;
    sakuraActive = true;

    const layer = document.createElement('div');
    layer.className = 'ee-sakura-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const vw = window.innerWidth;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const petal = document.createElement('div');
      petal.className = 'ee-sakura';
      const size = 8 + Math.random() * 12;          // 8–20px
      const drift = (Math.random() * 240 - 120);    // -120 a +120 px
      const duration = 5 + Math.random() * 5;       // 5–10s
      const delay = Math.random() * 2.5;            // 0–2.5s
      const startX = Math.random() * vw;
      petal.style.left = `${startX}px`;
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      petal.style.setProperty('--ee-drift', `${drift}px`);
      petal.style.animationDuration = `${duration}s`;
      petal.style.animationDelay = `${delay}s`;
      petal.style.opacity = (0.7 + Math.random() * 0.3).toFixed(2);
      layer.appendChild(petal);
    }

    setTimeout(() => {
      layer.remove();
      sakuraActive = false;
    }, PETAL_LIFETIME_MS);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 3 — RASENGAN (Naruto)
  ───────────────────────────────────────────────── */
  let rasenganActive = false;
  function triggerRasengan() {
    if (rasenganActive) return;
    rasenganActive = true;

    const orb = document.createElement('div');
    orb.className = 'ee-rasengan';
    orb.setAttribute('aria-hidden', 'true');
    document.body.appendChild(orb);

    setTimeout(() => {
      orb.remove();
      rasenganActive = false;
    }, 2000);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 4 — SAIYAN (Dragon Ball)
  ───────────────────────────────────────────────── */
  let saiyanActive = false;
  function triggerSaiyan() {
    if (saiyanActive) return;
    saiyanActive = true;

    document.body.classList.add('ee-saiyan-active');

    const aura = document.createElement('div');
    aura.className = 'ee-saiyan-aura';
    aura.setAttribute('aria-hidden', 'true');
    document.body.appendChild(aura);

    setTimeout(() => {
      document.body.classList.remove('ee-saiyan-active');
      aura.remove();
      saiyanActive = false;
    }, 2000);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 5 — JOYBOY / GEAR 5 (One Piece)
  ───────────────────────────────────────────────── */
  let joyboyActive = false;
  function triggerJoyboy() {
    if (joyboyActive) return;
    joyboyActive = true;

    // Latido de la página (clase en <html> para evitar scrollbars al escalar)
    document.documentElement.classList.add('ee-joyboy-active');

    // Texto flotante con la risa de Nika
    const text = document.createElement('div');
    text.className = 'ee-joyboy-text';
    text.setAttribute('role', 'status');
    text.setAttribute('aria-live', 'polite');
    text.textContent = tCurrent('easter_joyboy', '¡Hahahaha! ¡Los tambores de la liberación!');
    document.body.appendChild(text);

    // Quita la clase del <html> tras el latido (1.6s)
    setTimeout(() => {
      document.documentElement.classList.remove('ee-joyboy-active');
    }, 1700);

    // Saca el texto con animación de salida y limpia
    setTimeout(() => {
      text.classList.add('is-leaving');
      setTimeout(() => {
        text.remove();
        joyboyActive = false;
      }, 450);
    }, 3200);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 6 — TSUKUYOMI INFINITO (Naruto)
     5 clics rápidos sobre #theme-toggle (≤ 2s) →
     cancela el cambio de tema y dispara el genjutsu.
  ───────────────────────────────────────────────── */
  const TSU_CLICK_COUNT  = 5;
  const TSU_CLICK_WINDOW = 2000;
  const TSU_SHAKE_MS     = 1000;
  const TSU_GENJUTSU_MS  = 7000;
  const TSU_FLASH_MS     = 450;
  let tsuClickTimes = [];
  let tsukuyomiActive = false;

  function attachTsukuyomiListener() {
    const btn = document.getElementById('theme-toggle');
    if (!btn || btn.dataset.eeTsuBound === '1') return;
    btn.dataset.eeTsuBound = '1';

    // capture:true → corremos antes que el listener del tema (bubble).
    btn.addEventListener('click', (e) => {
      if (tsukuyomiActive) {
        // Mientras el genjutsu corre, anula cualquier toggle del tema.
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      const now = Date.now();
      tsuClickTimes = tsuClickTimes.filter(t => now - t < TSU_CLICK_WINDOW);
      tsuClickTimes.push(now);
      if (tsuClickTimes.length >= TSU_CLICK_COUNT) {
        tsuClickTimes = [];
        // Bloquea el toggle de tema en este 5º clic.
        e.stopImmediatePropagation();
        e.preventDefault();
        triggerTsukuyomi();
      }
    }, true);
  }

  /* — Helpers del Tsukuyomi — */
  function createChaosLayer() {
    const layer = document.createElement('div');
    layer.className = 'ee-tsu-chaos';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML =
      '<div class="ee-tsu-noise"></div>' +
      '<div class="ee-tsu-scan"></div>' +
      '<div class="ee-tsu-cracks"></div>';
    return layer;
  }

  function createFakeError() {
    const el = document.createElement('div');
    el.className = 'ee-tsu-fake-error';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="ee-tsu-err-icon">:(</div>' +
      '<div class="ee-tsu-err-title">Aw, Snap!</div>' +
      '<div class="ee-tsu-err-msg">Something went wrong while displaying this webpage.</div>' +
      '<div class="ee-tsu-err-code">Error code: ERR_CHAKRA_OVERFLOW</div>';
    return el;
  }

  function spawnTear() {
    const tear = document.createElement('div');
    tear.className = 'ee-tsu-tear';
    tear.setAttribute('aria-hidden', 'true');
    tear.style.top = (10 + Math.random() * 75).toFixed(1) + '%';
    tear.style.height = (18 + Math.random() * 28).toFixed(0) + 'px';
    document.body.appendChild(tear);
    setTimeout(() => tear.remove(), 500);
  }

  function createBloodLayer(btn) {
    const layer = document.createElement('div');
    layer.className = 'ee-tsu-blood-layer';
    layer.setAttribute('aria-hidden', 'true');
    positionBloodLayer(layer, btn);
    return layer;
  }
  function positionBloodLayer(layer, btn) {
    const rect = btn.getBoundingClientRect();
    layer.style.left = (rect.left + rect.width / 2) + 'px';
    layer.style.top  = (rect.top  + rect.height * 0.85) + 'px';
  }
  function spawnBloodDrop(layer) {
    if (!layer || !layer.parentNode) return;
    const drop = document.createElement('div');
    drop.className = 'ee-blood-drop';
    const w = (3.5 + Math.random() * 2.5).toFixed(1);
    const h = (5   + Math.random() * 4  ).toFixed(1);
    drop.style.width  = w + 'px';
    drop.style.height = h + 'px';
    drop.style.setProperty('--ee-blood-x',     (Math.random() * 14 - 7).toFixed(1) + 'px');
    drop.style.setProperty('--ee-blood-dur',   (0.85 + Math.random() * 0.6).toFixed(2) + 's');
    drop.style.setProperty('--ee-blood-delay', (Math.random() * 0.15).toFixed(2) + 's');
    drop.style.setProperty('--ee-blood-fall',  (80 + Math.random() * 70).toFixed(0) + 'px');
    layer.appendChild(drop);
    setTimeout(() => drop.remove(), 1700);
  }

  function triggerTsukuyomi() {
    if (tsukuyomiActive) return;
    tsukuyomiActive = true;

    const btn = document.getElementById('theme-toggle');
    const CHAOS_MS = 1400; // duración del "se ha roto la web"

    /* ── FASE 1 (0 → 1.4s): el usuario cree que ha roto todo ── */

    // 1.a) Icono de la luna rojo sangre + sangre goteando
    if (btn) btn.classList.add('ee-tsukuyomi-armed');

    let bloodLayer = null, bloodInterval = null, bloodReposition = null;
    if (btn) {
      bloodLayer = createBloodLayer(btn);
      document.body.appendChild(bloodLayer);
      // arranque inmediato con dos gotas
      spawnBloodDrop(bloodLayer);
      spawnBloodDrop(bloodLayer);
      // chorrito continuo
      bloodInterval = setInterval(() => spawnBloodDrop(bloodLayer), 130);
      // por si la página tiembla y el icono cambia de sitio (resize, etc.)
      bloodReposition = () => positionBloodLayer(bloodLayer, btn);
      window.addEventListener('resize', bloodReposition);
    }

    // 1.b) Shake VIOLENTO de toda la página
    document.body.classList.add('ee-tsu-violent');

    // 1.c) Capa global de caos: scanlines + ruido + grietas de cristal
    const chaos = createChaosLayer();
    document.body.appendChild(chaos);

    // 1.d) Tearings horizontales aleatorios
    const tearTimers = [180, 460, 760, 1080].map(t => setTimeout(spawnTear, t));

    // 1.e) Falsa pantalla "Aw, Snap!" estilo Chrome crash
    let fakeErr = null;
    const errTimer = setTimeout(() => {
      fakeErr = createFakeError();
      document.body.appendChild(fakeErr);
    }, 350);

    /* ── FASE 2 (1.4s → 8.4s): Genjutsu de 7s ── */
    setTimeout(() => {
      document.body.classList.remove('ee-tsu-violent');
      if (btn) btn.classList.remove('ee-tsukuyomi-armed');
      chaos.remove();
      if (fakeErr && fakeErr.parentNode) fakeErr.remove();
      tearTimers.forEach(clearTimeout);
      clearTimeout(errTimer);
      if (bloodInterval) clearInterval(bloodInterval);
      if (bloodReposition) window.removeEventListener('resize', bloodReposition);
      if (bloodLayer && bloodLayer.parentNode) bloodLayer.remove();

      document.body.classList.add('ee-tsukuyomi-active');
    }, CHAOS_MS);

    /* ── FASE 3 (8.4s): corte brusco + destello blanco ── */
    setTimeout(() => {
      document.body.classList.remove('ee-tsukuyomi-active');
      const flash = document.createElement('div');
      flash.className = 'ee-tsukuyomi-flash';
      flash.setAttribute('aria-hidden', 'true');
      document.body.appendChild(flash);
      setTimeout(() => {
        flash.remove();
        tsukuyomiActive = false;
      }, TSU_FLASH_MS);
    }, CHAOS_MS + TSU_GENJUTSU_MS);
  }

  /* ── Init ──────────────────────────────────────── */
  function bootEasterEggs() {
    attachLogoListener();
    attachTsukuyomiListener();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootEasterEggs);
  } else {
    bootEasterEggs();
  }
})();
