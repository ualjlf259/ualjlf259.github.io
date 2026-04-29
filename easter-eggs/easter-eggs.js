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
   - 7) Mob       : "shigeo"  → contador 0→100% + explosión psíquica
   - 8) Gear 5    : agitar ratón/móvil → tema Joy Boy + nubes + goma

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
    tatakae: () => triggerTatakae(),
    rasengan: () => triggerRasengan(),
    saiyan: () => triggerSaiyan(),
    joyboy: () => triggerJoyboy(),
    shigeo: () => triggerMob(),
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
  const TSU_CLICK_COUNT = 5;
  const TSU_CLICK_WINDOW = 2000;
  const TSU_SHAKE_MS = 1000;
  const TSU_GENJUTSU_MS = 7000;
  const TSU_FLASH_MS = 450;
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
    layer.style.top = (rect.top + rect.height * 0.85) + 'px';
  }
  function spawnBloodDrop(layer) {
    if (!layer || !layer.parentNode) return;
    const drop = document.createElement('div');
    drop.className = 'ee-blood-drop';
    const w = (3.5 + Math.random() * 2.5).toFixed(1);
    const h = (5 + Math.random() * 4).toFixed(1);
    drop.style.width = w + 'px';
    drop.style.height = h + 'px';
    drop.style.setProperty('--ee-blood-x', (Math.random() * 14 - 7).toFixed(1) + 'px');
    drop.style.setProperty('--ee-blood-dur', (0.85 + Math.random() * 0.6).toFixed(2) + 's');
    drop.style.setProperty('--ee-blood-delay', (Math.random() * 0.15).toFixed(2) + 's');
    drop.style.setProperty('--ee-blood-fall', (80 + Math.random() * 70).toFixed(0) + 'px');
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

  /* ─────────────────────────────────────────────────
     EASTER EGG 7 — MOB PSYCHO 100%
  ───────────────────────────────────────────────── */
  let mobActive = false;

  function triggerMob() {
    if (mobActive) return;
    mobActive = true;

    const overlay = document.createElement('div');
    overlay.className = 'ee-mob-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const counter = document.createElement('div');
    counter.className = 'ee-mob-counter';
    counter.setAttribute('role', 'status');
    counter.setAttribute('aria-live', 'assertive');

    const eyebrow = document.createElement('div');
    eyebrow.className = 'ee-mob-eyebrow';
    eyebrow.textContent = 'M O B';

    const pct = document.createElement('div');
    pct.className = 'ee-mob-pct';
    pct.textContent = '0%';

    counter.appendChild(eyebrow);
    counter.appendChild(pct);
    overlay.appendChild(counter);
    document.body.appendChild(overlay);

    const DURATION_MS = 2200;
    const start = performance.now();
    let phase = 0;

    function ease(t) {
      // Construcción lenta que se dispara en los últimos instantes
      return t < 0.75 ? t * 0.55 : 0.4125 + (t - 0.75) * (0.5875 / 0.25);
    }

    function setGlow(p) {
      const a1 = (0.4 + p * 0.6).toFixed(2);
      const a2 = (0.2 + p * 0.55).toFixed(2);
      const a3 = (parseFloat(a2) * 0.6).toFixed(2);
      const s1 = Math.round(20 + p * 80);
      const s2 = Math.round(50 + p * 150);
      const s3 = Math.round(100 + p * 250);
      pct.style.textShadow =
        '0 0 ' + s1 + 'px rgba(190,110,255,' + a1 + '),' +
        '0 0 ' + s2 + 'px rgba(140,60,230,' + a2 + '),' +
        '0 0 ' + s3 + 'px rgba(100,20,200,' + a3 + ')';
      pct.style.color =
        'rgb(' + Math.round(210 + p * 45) + ',' + Math.round(160 + p * 95) + ',255)';
    }

    function tick(now) {
      const raw = Math.min((now - start) / DURATION_MS, 1);
      const p = ease(raw);

      if (raw < 1) {
        pct.textContent = Math.min(Math.floor(p * 100), 99) + '%';
        setGlow(p);

        if (p >= 0.75 && phase < 2) {
          document.body.classList.remove('ee-mob-sl');
          document.body.classList.add('ee-mob-sh');
          phase = 2;
        } else if (p >= 0.4 && phase < 1) {
          document.body.classList.add('ee-mob-sl');
          phase = 1;
        }
        requestAnimationFrame(tick);
      } else {
        // ── LLEGÓ AL 100% ──
        pct.textContent = '100%';
        setGlow(1);
        document.body.classList.remove('ee-mob-sl', 'ee-mob-sh');

        setTimeout(() => {
          counter.classList.add('ee-mob-burst');
          overlay.classList.add('ee-mob-exploding');

          // 3 anillos de choque con desfase
          [0, 140, 300].forEach((delay, i) => {
            const ring = document.createElement('div');
            ring.className = 'ee-mob-ring';
            ring.setAttribute('aria-hidden', 'true');
            ring.style.setProperty('--ee-ring-delay', delay + 'ms');
            ring.style.setProperty('--ee-ring-color',
              i === 1 ? 'rgba(255,255,255,0.92)' : 'rgba(190,110,255,0.82)');
            ring.style.setProperty('--ee-ring-dur', (0.75 + i * 0.09) + 's');
            document.body.appendChild(ring);
            setTimeout(() => ring.remove(), delay + 1100);
          });

          const flash = document.createElement('div');
          flash.className = 'ee-mob-flash';
          flash.setAttribute('aria-hidden', 'true');
          document.body.appendChild(flash);

          setTimeout(() => {
            flash.remove();
            overlay.remove();
            mobActive = false;
          }, 1400);
        }, 380);
      }
    }

    requestAnimationFrame(tick);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 8 — GEAR 5 / JOY BOY AWAKENING
     Desktop : agitar el ratón rápidamente (≥6 reversiones en 1.5s)
     Móvil   : sacudir el teléfono (DeviceMotion) o zig-zag táctil
  ───────────────────────────────────────────────── */
  let gear5Active = false;

  /* — Detección de agitación del ratón (desktop) — */
  const G5_MOUSE_REVERSALS = 6;
  const G5_MOUSE_WINDOW    = 1500;
  const G5_MOUSE_MIN_SEG   = 70;
  const g5MouseHist = [];

  function onMouseShake(e) {
    if (gear5Active) return;
    const t = Date.now();
    g5MouseHist.push({ x: e.clientX, t });
    while (g5MouseHist.length && t - g5MouseHist[0].t > G5_MOUSE_WINDOW) g5MouseHist.shift();
    if (g5MouseHist.length < 5) return;
    let reversals = 0, lastDir = 0, segX = g5MouseHist[0].x;
    for (let i = 1; i < g5MouseHist.length; i++) {
      const dx = g5MouseHist[i].x - g5MouseHist[i - 1].x;
      if (Math.abs(dx) < 3) continue;
      const dir = dx > 0 ? 1 : -1;
      if (lastDir && dir !== lastDir && Math.abs(g5MouseHist[i].x - segX) >= G5_MOUSE_MIN_SEG) {
        reversals++;
        segX = g5MouseHist[i].x;
      }
      lastDir = dir;
    }
    if (reversals >= G5_MOUSE_REVERSALS) {
      g5MouseHist.length = 0;
      triggerGear5();
    }
  }

  /* — Detección de sacudida por acelerómetro (móvil) — */
  const G5_MOTION_THRESHOLD = 22;
  const G5_MOTION_NEEDED    = 3;
  const G5_MOTION_WINDOW    = 1000;
  const g5MotionTimes = [];

  function onDeviceShake(e) {
    if (gear5Active) return;
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
    if (mag > G5_MOTION_THRESHOLD) {
      const now = Date.now();
      g5MotionTimes.push(now);
      while (g5MotionTimes.length && now - g5MotionTimes[0] > G5_MOTION_WINDOW) g5MotionTimes.shift();
      if (g5MotionTimes.length >= G5_MOTION_NEEDED) {
        g5MotionTimes.length = 0;
        triggerGear5();
      }
    }
  }

  /* — Fallback táctil: zig-zag horizontal (móvil) — */
  const G5_TOUCH_REVERSALS = 4;
  const G5_TOUCH_WINDOW    = 1200;
  const G5_TOUCH_MIN_SEG   = 50;
  const g5TouchHist = [];

  function onTouchZigzag(e) {
    if (gear5Active) return;
    const t = Date.now();
    const x = e.touches[0].clientX;
    g5TouchHist.push({ x, t });
    while (g5TouchHist.length && t - g5TouchHist[0].t > G5_TOUCH_WINDOW) g5TouchHist.shift();
    if (g5TouchHist.length < 4) return;
    let reversals = 0, lastDir = 0, segX = g5TouchHist[0].x;
    for (let i = 1; i < g5TouchHist.length; i++) {
      const dx = g5TouchHist[i].x - g5TouchHist[i - 1].x;
      if (Math.abs(dx) < 4) continue;
      const dir = dx > 0 ? 1 : -1;
      if (lastDir && dir !== lastDir && Math.abs(g5TouchHist[i].x - segX) >= G5_TOUCH_MIN_SEG) {
        reversals++;
        segX = g5TouchHist[i].x;
      }
      lastDir = dir;
    }
    if (reversals >= G5_TOUCH_REVERSALS) {
      g5TouchHist.length = 0;
      triggerGear5();
    }
  }

  function attachMotionDetector() {
    document.addEventListener('mousemove', onMouseShake);
    document.addEventListener('touchmove', onTouchZigzag, { passive: true });
    if (typeof DeviceMotionEvent === 'undefined') return;
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS 13+: necesita gesto del usuario para pedir permiso al sensor
      document.addEventListener('touchstart', function requestOnce() {
        DeviceMotionEvent.requestPermission()
          .then(s => { if (s === 'granted') window.addEventListener('devicemotion', onDeviceShake); })
          .catch(() => { /* denegado: zig-zag táctil actúa de fallback */ });
      }, { once: true });
    } else {
      window.addEventListener('devicemotion', onDeviceShake);
    }
  }

  function spawnGear5Clouds() {
    const layer = document.createElement('div');
    layer.className = 'ee-g5-cloud-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const clouds = [
      { w: 220, top:  8, dur: 45, delay: -10, rtl: true,  op: 0.75 },
      { w: 140, top: 18, dur: 32, delay: -22, rtl: false, op: 0.60 },
      { w: 180, top: 35, dur: 55, delay:  -5, rtl: true,  op: 0.50 },
      { w: 100, top: 12, dur: 28, delay: -15, rtl: false, op: 0.65 },
      { w: 260, top: 55, dur: 62, delay: -30, rtl: true,  op: 0.45 },
      { w: 130, top: 70, dur: 38, delay:  -8, rtl: false, op: 0.55 },
      { w:  90, top: 45, dur: 26, delay: -18, rtl: true,  op: 0.50 },
      { w: 200, top: 82, dur: 50, delay: -25, rtl: false, op: 0.40 },
    ];
    clouds.forEach(c => {
      const el = document.createElement('div');
      el.className = 'ee-g5-cloud ' + (c.rtl ? 'ee-g5-cloud--rtl' : 'ee-g5-cloud--ltr');
      el.style.cssText =
        'width:' + c.w + 'px;top:' + c.top + '%;opacity:' + c.op +
        ';animation-duration:' + c.dur + 's;animation-delay:' + c.delay + 's';
      layer.appendChild(el);
    });
  }

  function scheduleGear5Flash() {
    if (!gear5Active) return;
    setTimeout(() => {
      if (!gear5Active) return;
      const f = document.createElement('div');
      f.className = 'ee-g5-sparkle';
      f.setAttribute('aria-hidden', 'true');
      f.style.left = (8 + Math.random() * 84) + '%';
      f.style.top  = (8 + Math.random() * 80) + '%';
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 950);
      scheduleGear5Flash();
    }, 1800 + Math.random() * 4500);
  }

  const G5_TEXTS = [
    { text: 'GEAR 5',   color: '#fbbf24', shadow: '0 0 20px rgba(251,191,36,0.9),0 0 55px rgba(251,191,36,0.55)',           size: 'clamp(1.6rem,4.5vw,2.8rem)' },
    { text: 'JOYBOY',   color: '#fb923c', shadow: '0 0 20px rgba(251,146,60,0.9),0 0 55px rgba(251,146,60,0.55)',           size: 'clamp(1.4rem,3.5vw,2.2rem)' },
    { text: 'NIKA',     color: '#ffffff', shadow: '0 0 25px rgba(255,200,0,1),0 0 70px rgba(255,180,0,0.7),0 0 140px rgba(255,150,0,0.4)', size: 'clamp(2rem,7vw,4.5rem)' },
    { text: 'HAHAHAHA', color: '#fde68a', shadow: '0 0 16px rgba(253,230,138,0.88),0 0 45px rgba(253,230,138,0.5)',         size: 'clamp(1rem,2.8vw,2rem)' },
  ];

  function scheduleGear5Text() {
    if (!gear5Active) return;
    setTimeout(() => {
      if (!gear5Active) return;
      const t = G5_TEXTS[Math.floor(Math.random() * G5_TEXTS.length)];
      const el = document.createElement('div');
      el.className = 'ee-g5-floattext';
      el.setAttribute('aria-hidden', 'true');
      el.textContent = t.text;
      el.style.left       = (5 + Math.random() * 88) + '%';
      el.style.top        = (8 + Math.random() * 78) + '%';
      el.style.color      = t.color;
      el.style.fontSize   = t.size;
      el.style.textShadow = t.shadow;
      el.style.setProperty('--ee-g5-rot', (Math.random() * 22 - 11).toFixed(1) + 'deg');
      const dur = Math.round(2200 + Math.random() * 1600);
      el.style.setProperty('--ee-g5-text-dur', dur + 'ms');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), dur + 100);
      scheduleGear5Text();
    }, 2200 + Math.random() * 3800);
  }

  function triggerGear5() {
    if (gear5Active) return;
    gear5Active = true;

    document.removeEventListener('mousemove', onMouseShake);
    document.removeEventListener('touchmove', onTouchZigzag);
    window.removeEventListener('devicemotion', onDeviceShake);

    // Sacudida de activación (+700ms más larga y más exagerada)
    document.body.classList.add('ee-g5-awake-shake');
    setTimeout(() => document.body.classList.remove('ee-g5-awake-shake'), 1300);

    // Flash dorado — enmascara el cambio instantáneo de variables CSS
    const awakeFlash = document.createElement('div');
    awakeFlash.className = 'ee-g5-awake-flash';
    awakeFlash.setAttribute('aria-hidden', 'true');
    document.body.appendChild(awakeFlash);

    // Aplicar tema en el pico del flash (t=400ms), invisible bajo el flash dorado
    setTimeout(() => document.body.classList.add('ee-g5-active'), 400);

    // Al terminar el flash (t=1600ms): título + nubes + efecto goma + textos flotantes
    setTimeout(() => {
      awakeFlash.remove();

      const title = document.createElement('div');
      title.className = 'ee-g5-title';
      title.setAttribute('aria-hidden', 'true');
      title.innerHTML =
        '<div class="ee-g5-title-sub">GEAR 5</div>' +
        '<div class="ee-g5-title-main">AWAKENING</div>';
      document.body.appendChild(title);
      setTimeout(() => {
        title.classList.add('is-leaving');
        setTimeout(() => title.remove(), 600);
      }, 2200);

      spawnGear5Clouds();
      setTimeout(scheduleGear5Flash, 800);
      setTimeout(scheduleGear5Text, 1200);

      document.querySelectorAll('.card, .btn-primary, .btn-outline, .btn-roulette, .btn-spin')
        .forEach(el => el.classList.add('ee-g5-rubber'));
    }, 1600);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 9 — PONEGLYPH / VOID CENTURY
     Paso 1 : clic en .robin-key-trigger  → llave dorada
              → guarda 'nakama_robin_key'='1' en localStorage
     Paso 2 : (solo con llave desbloqueada)
              clic en #poneglyph-easter-img → Void Century Mode
  ───────────────────────────────────────────────── */
  const ROBIN_KEY_LS = 'nakama_robin_key';
  let robinKeyUnlocked = localStorage.getItem(ROBIN_KEY_LS) === '1';
  let voidCenturyActive = false;

  /* — Burbuja "explorar" periódica — */
  function startBubbleCycle(wrap) {
    const bubble = wrap.querySelector('.poneglyph-egg-bubble');
    if (!bubble || bubble.dataset.eeCycleOn) return;
    bubble.dataset.eeCycleOn = '1';
    function cycle() {
      if (!wrap.isConnected || !robinKeyUnlocked) return;
      bubble.classList.remove('ee-bubble-visible');
      void bubble.offsetWidth;
      bubble.classList.add('ee-bubble-visible');
      setTimeout(function() {
        bubble.classList.remove('ee-bubble-visible');
        if (wrap.isConnected) setTimeout(cycle, 5000 + Math.random() * 8000);
      }, 3200);
    }
    setTimeout(cycle, 1800);
  }

  /* — Activar imagen poneglyph — */
  function activatePoneglyphImg() {
    var img = document.getElementById('poneglyph-easter-img');
    if (!img || img.dataset.eeVoidBound) return;
    img.dataset.eeVoidBound = '1';
    var wrap = img.closest('.poneglyph-egg-wrap');
    if (wrap) { wrap.classList.add('ee-pg-unlocked'); startBubbleCycle(wrap); }
    img.addEventListener('click', triggerVoidCentury);
  }

  /* — Adjuntar listeners a .robin-key-trigger — */
  function attachRobinTrigger() {
    document.querySelectorAll('.robin-key-trigger').forEach(function(el) {
      if (el.dataset.eeRobinBound) return;
      el.dataset.eeRobinBound = '1';
      el.addEventListener('click', onRobinClick);
    });
    if (robinKeyUnlocked) activatePoneglyphImg();
  }

  function onRobinClick() {
    if (robinKeyUnlocked) { activatePoneglyphImg(); return; }
    robinKeyUnlocked = true;
    localStorage.setItem(ROBIN_KEY_LS, '1');
    showKeyUnlockAnim(this, activatePoneglyphImg);
  }

  /* — Delegación de evento: captura clics en .robin-key-trigger sin depender del timing de render — */
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest && e.target.closest('.robin-key-trigger');
    if (!trigger) return;
    if (robinKeyUnlocked) { activatePoneglyphImg(); return; }
    robinKeyUnlocked = true;
    localStorage.setItem(ROBIN_KEY_LS, '1');
    showKeyUnlockAnim(trigger, activatePoneglyphImg);
  });

  /* — Toast + llave flotante al desbloquear — */
  function showKeyUnlockAnim(trigger, onDone) {
    var lang = (typeof currentLang !== 'undefined' && currentLang)
      || localStorage.getItem('lang') || 'es';
    var msgs = {
      es: ['🗝️', 'Has desbloqueado la habilidad de leer los Poneglyphs', '— Nico Robin —'],
      en: ['🗝️', 'You have unlocked the ability to read the Poneglyphs', '— Nico Robin —'],
      fr: ['🗝️', 'Vous avez débloqué la capacité à lire les Ponéglyphes', '— Nico Robin —'],
      ja: ['🗝️', 'ポーネグリフを読む能力を解放した', '— ニコ・ロビン —'],
    };
    var m = msgs[lang] || msgs.es;
    var toast = document.createElement('div');
    toast.className = 'ee-robin-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML =
      '<div class="ee-robin-toast-icon">' + m[0] + '</div>' +
      '<div class="ee-robin-toast-text">' +
        '<div class="ee-robin-toast-main">' + m[1] + '</div>' +
        '<div class="ee-robin-toast-sub">' + m[2] + '</div>' +
      '</div>';
    document.body.appendChild(toast);
    if (trigger) {
      var rect = trigger.getBoundingClientRect();
      var key = document.createElement('div');
      key.className = 'ee-robin-key-float';
      key.setAttribute('aria-hidden', 'true');
      key.textContent = '🗝️';
      key.style.left = (rect.left + rect.width / 2) + 'px';
      key.style.top  = rect.top + 'px';
      document.body.appendChild(key);
      setTimeout(function() { key.remove(); }, 1400);
    }
    setTimeout(function() {
      toast.classList.add('is-leaving');
      setTimeout(function() { toast.remove(); if (onDone) onDone(); }, 450);
    }, 3500);
  }

  /* — Void Century Mode — */
  var VOID_RUNES = [
    'ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ',
    '𐤀','𐤁','𐤂','𐤃','𐤄','𐤅','𐤆','𐤇',
    '𒀭','𒀮','𒁁','𒁲','𒂗','𒌦','☽','✦','⊕',
  ];

  function spawnVoidRune(container) {
    if (!container.isConnected || !voidCenturyActive) return;
    var rune = document.createElement('div');
    rune.className = 'ee-void-rune';
    rune.setAttribute('aria-hidden', 'true');
    rune.textContent = VOID_RUNES[Math.floor(Math.random() * VOID_RUNES.length)];
    rune.style.left = (5 + Math.random() * 90) + '%';
    var dur = (6 + Math.random() * 8).toFixed(1);
    rune.style.setProperty('--ee-rune-dur', dur + 's');
    rune.style.setProperty('--ee-rune-x', (Math.random() * 80 - 40).toFixed(0) + 'px');
    rune.style.fontSize = (0.8 + Math.random() * 1.4).toFixed(1) + 'rem';
    container.appendChild(rune);
    setTimeout(function() { rune.remove(); }, parseFloat(dur) * 1000 + 200);
    setTimeout(function() { spawnVoidRune(container); }, 350 + Math.random() * 700);
  }

  function triggerVoidCentury() {
    if (voidCenturyActive) return;
    voidCenturyActive = true;
    var lang = (typeof currentLang !== 'undefined' && currentLang)
      || localStorage.getItem('lang') || 'es';
    var content = {
      es: {
        eyebrow: 'SIGLO VACÍO — DESCLASIFICADO',
        title: 'La Historia que el Poder no Pudo Destruir',
        rows: [
          ['Biblioteca de Alejandría, ~391 d.C.', 'Incendiada por quienes temían el saber que concentraba. No destruyeron libros; destruyeron preguntas.'],
          ['Códices Mayas, 1562', 'El obispo Diego de Landa quemó en Maní todos los manuscritos mayas que pudo reunir. «Contenían mentiras del demonio», escribió. Era astronomía, historia y matemáticas.'],
          ['Revolución Cultural Maoísta, 1966–1976', 'Mao ordenó borrar «los cuatro viejos». Templos, archivos y libros destruidos. Una generación creció sin memoria de lo que fue su propio país.'],
          ['Enciclopedias Soviéticas', 'Cada vez que Stalin purgaba a un camarada, los suscriptores recibían páginas de sustitución. La historia se reescribía en tiempo real.'],
        ],
        quote: 'El control del pasado es la forma más sofisticada de control del presente.',
        close: 'Cerrar',
      },
      en: {
        eyebrow: 'VOID CENTURY — DECLASSIFIED',
        title: 'The History That Power Could Not Destroy',
        rows: [
          ['Library of Alexandria, ~391 AD', "Partially burned on orders of those who feared the knowledge it held. They didn't destroy books; they destroyed questions."],
          ['Maya Codices, 1562', "Bishop Diego de Landa burned every Mayan manuscript he could gather in Maní. 'They contained the devil's lies,' he wrote. It was astronomy, history and mathematics."],
          ['Maoist Cultural Revolution, 1966–1976', "Mao ordered the erasure of 'the four olds.' Temples, archives, books destroyed. A generation grew up without memory of their own country's past."],
          ['Soviet Encyclopedias', 'Every time Stalin purged a comrade, subscribers received replacement pages. History was rewritten in real time.'],
        ],
        quote: 'Control of the past is the most sophisticated form of control of the present.',
        close: 'Close',
      },
      fr: {
        eyebrow: 'SIÈCLE VIDE — DÉCLASSIFIÉ',
        title: "L'Histoire que le Pouvoir n'a Pas Pu Détruire",
        rows: [
          ["Bibliothèque d'Alexandrie, ~391 apr. J.-C.", 'Partiellement brûlée par ceux qui craignaient le savoir qu\'elle concentrait. Ils ne détruisaient pas des livres ; ils détruisaient des questions.'],
          ['Codex Mayas, 1562', "L'évêque Diego de Landa brûla à Maní tous les manuscrits mayas. «Ils contenaient les mensonges du diable», écrivit-il. C'était de l'astronomie, de l'histoire et des mathématiques."],
          ['Révolution Culturelle Maoïste, 1966–1976', "Mao ordonna d'effacer «les quatre vieilleries». Temples, archives, livres détruits. Une génération grandit sans mémoire de son propre pays."],
          ['Encyclopédies Soviétiques', "Chaque fois que Staline purgeait un camarade, les abonnés recevaient des pages de remplacement. L'histoire était réécrite en temps réel."],
        ],
        quote: 'Le contrôle du passé est la forme la plus sophistiquée de contrôle du présent.',
        close: 'Fermer',
      },
      ja: {
        eyebrow: '空白の100年 — 機密解除',
        title: '権力が破壊できなかった歴史',
        rows: [
          ['アレクサンドリア図書館、約391年', '集積した知識を恐れた者たちの命令で部分的に焼かれた。本を破壊したのではない——問いを破壊したのだ。'],
          ['マヤのコデックス、1562年', 'ディエゴ・デ・ランダ司教はマニで集めたすべてのマヤ写本を焼却した。「悪魔の嘘が書かれていた」と彼は書いた。それは天文学、歴史、数学だった。'],
          ['毛沢東の文化大革命、1966〜1976年', '「四つの古いもの」の消去が命じられた。寺院、文書館、書物が破壊され、一世代が自国の過去の記憶なしに育った。'],
          ['ソビエトの百科事典', 'スターリンが同志を粛清するたびに購読者は差し替えページを受け取った。歴史はリアルタイムで書き換えられた。'],
        ],
        quote: '過去の支配は現在の支配のもっとも洗練された形態である。',
        close: '閉じる',
      },
    };
    var c = content[lang] || content.es;
    var rows = c.rows.map(function(r) {
      return '<div class="ee-void-row"><div class="ee-void-row-title">' + r[0] +
             '</div><p class="ee-void-row-text">' + r[1] + '</p></div>';
    }).join('');
    var overlay = document.createElement('div');
    overlay.className = 'ee-void-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    var runeLayer = document.createElement('div');
    runeLayer.className = 'ee-void-rune-layer';
    runeLayer.setAttribute('aria-hidden', 'true');
    overlay.appendChild(runeLayer);
    spawnVoidRune(runeLayer);
    var modal = document.createElement('div');
    modal.className = 'ee-void-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div class="ee-void-eyebrow">' + c.eyebrow + '</div>' +
      '<h3 class="ee-void-title">' + c.title + '</h3>' +
      '<div class="ee-void-rows">' + rows + '</div>' +
      '<blockquote class="ee-void-quote">' + c.quote + '</blockquote>' +
      '<button class="ee-void-close">' + c.close + '</button>';
    overlay.appendChild(modal);
    function closeVoid() {
      overlay.classList.add('is-leaving');
      document.removeEventListener('keydown', onVoidKey);
      setTimeout(function() { overlay.remove(); voidCenturyActive = false; }, 450);
    }
    function onVoidKey(e) { if (e.key === 'Escape') closeVoid(); }
    document.addEventListener('keydown', onVoidKey);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeVoid(); });
    modal.querySelector('.ee-void-close').addEventListener('click', closeVoid);
  }

  /* — Observador del artículo (contenido dinámico / cambio de idioma) — */
  function watchArticleBody() {
    var articleBody = document.getElementById('article-body');
    if (!articleBody) return;
    var observer = new MutationObserver(function() {
      attachRobinTrigger();
      if (robinKeyUnlocked) activatePoneglyphImg();
    });
    observer.observe(articleBody, { childList: true, subtree: true });
    attachRobinTrigger();
    if (robinKeyUnlocked) activatePoneglyphImg();
    // Fallbacks para casos de carga tardía o caché
    setTimeout(function() { attachRobinTrigger(); if (robinKeyUnlocked) activatePoneglyphImg(); }, 600);
    setTimeout(function() { attachRobinTrigger(); if (robinKeyUnlocked) activatePoneglyphImg(); }, 2000);
  }

  /* ── Init ──────────────────────────────────────── */
  function bootEasterEggs() {
    attachLogoListener();
    attachTsukuyomiListener();
    attachMotionDetector();
    watchArticleBody();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootEasterEggs);
  } else {
    bootEasterEggs();
  }
})();
