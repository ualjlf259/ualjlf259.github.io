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

  function unlockEgg(id) {
    try {
      let unlocked = JSON.parse(localStorage.getItem('ee_unlocked')) || {};
      if (!unlocked[id]) {
        unlocked[id] = true;
        localStorage.setItem('ee_unlocked', JSON.stringify(unlocked));
        document.dispatchEvent(new CustomEvent('ee_unlocked_updated'));
      }
    } catch (e) { console.error('ee save err', e); }
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
    unlockEgg('tatakae');

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
    unlockEgg('sakura');

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
    unlockEgg('rasengan');

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
    unlockEgg('saiyan');

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
    unlockEgg('joyboy');

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
    unlockEgg('tsukuyomi');

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
        triggerTsukuyomiBlackout(); // FASE 4: pantalla negra + vídeo
      }, TSU_FLASH_MS);
    }, CHAOS_MS + TSU_GENJUTSU_MS);
  }

  /* ── FASE 4: pantalla apagándose + vídeo ── */
  function triggerTsukuyomiBlackout() {
    const blackout = document.createElement('div');
    blackout.className = 'ee-tsu-blackout';
    blackout.setAttribute('aria-hidden', 'true');
    document.body.appendChild(blackout);

    // Cuando la pantalla está totalmente negra, reproducir el vídeo
    setTimeout(() => {
      const videoWrap = document.createElement('div');
      videoWrap.className = 'ee-tsu-video-wrap';

      const video = document.createElement('video');
      video.className = 'ee-tsu-video';
      // Ruta root-absoluta: las páginas SSG viven en subdirectorios (/articulos/<id>/, /<lang>/…)
      video.src = '/videos/easter-egg-tsukuyomi.mp4';
      video.autoplay = true;
      video.playsInline = true;
      videoWrap.appendChild(video);
      blackout.appendChild(videoWrap);

      function closeAll() {
        document.removeEventListener('keydown', onKey);
        blackout.classList.add('is-leaving');
        setTimeout(() => {
          blackout.remove();
          tsukuyomiActive = false;
        }, 600);
      }

      function onKey(e) { if (e.key === 'Escape') closeAll(); }
      document.addEventListener('keydown', onKey);
      blackout.addEventListener('click', closeAll);
      video.addEventListener('ended', closeAll);

      video.play().catch(() => {
        const btn = document.createElement('button');
        btn.className = 'ee-tsu-play-btn';
        btn.setAttribute('aria-label', 'Reproducir');
        btn.textContent = '▶';
        btn.addEventListener('click', () => { video.play(); btn.remove(); });
        videoWrap.appendChild(btn);
      });
    }, 3500); // pausa larga en negro para que el usuario crea que la página se ha cargado
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 7 — MOB PSYCHO 100%
  ───────────────────────────────────────────────── */
  let mobActive = false;

  function triggerMob() {
    if (mobActive) return;
    mobActive = true;
    unlockEgg('mob');

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
    unlockEgg('gear5');

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
    }, 1600);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 9 — PONEGLYPH / VOID CENTURY

     FLUJO:
       Paso 1: clic en .robin-key-trigger ("Robin")
               → desbloquea la llave (toast + animación)
               → estado SOLO en memoria (sin persistencia)
       Paso 2: clic en #poneglyph-easter-img
               · Si la llave está desbloqueada → abre Void Century Mode
               · Si NO → muestra pista "necesitas la llave de Robin"

     NOTA: F5 / cerrar pestaña → la llave se pierde y hay que volver
           a clicar Robin. Esto es intencional para que el huevo
           se redescubra cada visita.

     ARQUITECTURA:
       - El handler del poneglyph se monta SIEMPRE que aparece la imagen
         (independientemente del estado de la llave). Comprueba el estado
         en el momento del clic.
       - El click en Robin se captura mediante delegación en `document`,
         lo que es totalmente independiente del timing de render.
  ───────────────────────────────────────────────── */
  // Estado en memoria SOLO: la llave se pierde al recargar (F5) o cerrar la pestaña.
  // Si el usuario abandona la página, debe volver a clicar Robin para desbloquear.
  let robinKeyUnlocked = false;
  let voidCenturyActive = false;

  /* — Burbuja "explorar" periódica (solo si está desbloqueado) — */
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

  /* — Aplica el aspecto desbloqueado al wrap (sin dependencia de eventos) — */
  function applyUnlockedVisual(wrap) {
    if (!wrap || wrap.classList.contains('ee-pg-unlocked')) return;
    wrap.classList.add('ee-pg-unlocked');
    startBubbleCycle(wrap);
  }

  /* — Pista cuando se intenta acceder al poneglyph sin la llave — */
  let lockHintActive = false;
  function showLockedHint(wrap) {
    if (!wrap || lockHintActive) return;
    lockHintActive = true;
    wrap.classList.add('ee-pg-shake');

    var lang = (typeof currentLang !== 'undefined' && currentLang)
      || localStorage.getItem('lang') || 'es';
    var hints = {
      es: '🔒 Necesitas la llave de Robin',
      en: "🔒 You need Robin's key",
      fr: '🔒 Il vous faut la clé de Robin',
      ja: '🔒 ロビンの鍵が必要だ',
      it: '🔒 Ti serve la chiave di Robin',
      de: '🔒 Du brauchst Robins Schlüssel',
      ru: '🔒 Тебе нужен ключ Робин',
      pt: '🔒 Você precisa da chave da Robin',
    };
    var hint = document.createElement('div');
    hint.className = 'ee-pg-lock-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = hints[lang] || hints.es;
    wrap.appendChild(hint);

    setTimeout(function() {
      wrap.classList.remove('ee-pg-shake');
      hint.classList.add('is-leaving');
      setTimeout(function() {
        if (hint.parentNode) hint.remove();
        lockHintActive = false;
      }, 400);
    }, 1800);
  }

  /* — Setup del poneglyph: handler ÚNICO que decide en tiempo de clic — */
  function setupPoneglyphImg() {
    var img = document.getElementById('poneglyph-easter-img');
    if (!img || img.dataset.eePgBound) return;
    img.dataset.eePgBound = '1';

    var wrap = img.closest('.poneglyph-egg-wrap');

    // Aplicar visual desbloqueado si la llave ya está disponible al renderizar
    if (robinKeyUnlocked && wrap) applyUnlockedVisual(wrap);

    img.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (robinKeyUnlocked) {
        // Asegura visual desbloqueado por si fue renderizado tras el unlock
        if (wrap) applyUnlockedVisual(wrap);
        triggerVoidCentury();
      } else {
        showLockedHint(wrap);
      }
    });
  }

  /* — Click en "Robin": desbloquea la llave o, si ya estaba, refresca visual — */
  function handleRobinClick(triggerEl) {
    if (robinKeyUnlocked) {
      // Ya desbloqueado: refrescar visual del poneglyph si está en el DOM
      var img = document.getElementById('poneglyph-easter-img');
      if (img) applyUnlockedVisual(img.closest('.poneglyph-egg-wrap'));
      return;
    }
    robinKeyUnlocked = true;
    // (sin persistencia: el estado vive solo en memoria hasta recargar)
    showKeyUnlockAnim(triggerEl, function() {
      var img = document.getElementById('poneglyph-easter-img');
      if (img) applyUnlockedVisual(img.closest('.poneglyph-egg-wrap'));
    });
  }

  function attachRobinTrigger() {
    document.querySelectorAll('.robin-key-trigger').forEach(function(el) {
      if (el.dataset.eeRobinBound) return;
      el.dataset.eeRobinBound = '1';
      el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleRobinClick(el);
      });
    });
    setupPoneglyphImg();
  }

  /* — Delegación global para .robin-key-trigger (a prueba de timing) — */
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest && e.target.closest('.robin-key-trigger');
    if (!trigger) return;
    // Si el listener directo ya marcó eeRobinClickHandled en el evento,
    // saltamos para no duplicar.
    if (e._eeRobinHandled) return;
    e._eeRobinHandled = true;
    handleRobinClick(trigger);
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
      it: ['🗝️', 'Hai sbloccato la capacità di leggere i Poneglyph', '— Nico Robin —'],
      de: ['🗝️', 'Du hast die Fähigkeit freigeschaltet, die Poneglyphen zu lesen', '— Nico Robin —'],
      ru: ['🗝️', 'Вы разблокировали способность читать Понеглифы', '— Нико Робин —'],
      pt: ['🗝️', 'Você desbloqueou a capacidade de ler os Poneglyphs', '— Nico Robin —'],
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
    unlockEgg('poneglyph');
    var lang = (typeof currentLang !== 'undefined' && currentLang)
      || localStorage.getItem('lang') || 'es';
    var content = {
      es: {
        eyebrow: 'SIGLO VACÍO — DESCLASIFICADO',
        title: 'La Historia que el Poder no Pudo Destruir',
        rows: [
          ['Biblioteca de Alejandría, ~391 d.C.', 'Incendiada por quienes temían el saber que concentraba. No destruyeron libros; destruyeron preguntas.'],
          ['Manuscrito de Voynich (MS408), c. 1404–1438', 'Un códice de 240 páginas escrito en un alfabeto que nadie ha logrado descifrar en seis siglos. Plantas inexistentes, diagramas astronómicos imposibles, figuras bañándose en líquidos verdes. Custodiado en Yale, sigue siendo el único libro que el conocimiento humano se niega a admitir.'],
          ['El Arca de la Alianza, ~587 a.C.', 'Desapareció cuando Nabucodonosor arrasó Jerusalén. Ningún ejército la capturó, ningún cronista la describe después. Etiopía afirma custodiarla en Aksum; el Vaticano calla. La reliquia más buscada de Occidente lleva 2.600 años fuera del alcance del poder.'],
          ['Casa de la Sabiduría, Bagdad 1258', 'Cuando los mongoles tomaron la ciudad, arrojaron al Tigris tantos manuscritos que el río corrió negro de tinta durante días. Con ellos se hundió el Siglo de Oro islámico — siglos de matemática, medicina y astronomía borrados en una semana.'],
        ],
        quote: 'El control del pasado es la forma más sofisticada de control del presente.',
        close: 'Cerrar',
      },
      en: {
        eyebrow: 'VOID CENTURY — DECLASSIFIED',
        title: 'The History That Power Could Not Destroy',
        rows: [
          ['Library of Alexandria, ~391 AD', "Partially burned on orders of those who feared the knowledge it held. They didn't destroy books; they destroyed questions."],
          ['Voynich Manuscript (MS408), c. 1404–1438', "A 240-page codex written in an alphabet no one has decoded in six centuries. Plants that don't exist, impossible astronomical diagrams, figures bathing in green liquids. Held at Yale, it remains the only book human knowledge refuses to admit."],
          ['The Ark of the Covenant, ~587 BC', "Vanished when Nebuchadnezzar razed Jerusalem. No army captured it, no chronicler describes it afterwards. Ethiopia claims to guard it in Aksum; the Vatican stays silent. The West's most hunted relic has been beyond power's reach for 2,600 years."],
          ['House of Wisdom, Baghdad 1258', 'When the Mongols took the city, they threw so many manuscripts into the Tigris that the river ran black with ink for days. With them sank the Islamic Golden Age — centuries of mathematics, medicine and astronomy erased in a week.'],
        ],
        quote: 'Control of the past is the most sophisticated form of control of the present.',
        close: 'Close',
      },
      fr: {
        eyebrow: 'SIÈCLE VIDE — DÉCLASSIFIÉ',
        title: "L'Histoire que le Pouvoir n'a Pas Pu Détruire",
        rows: [
          ["Bibliothèque d'Alexandrie, ~391 apr. J.-C.", 'Partiellement brûlée par ceux qui craignaient le savoir qu\'elle concentrait. Ils ne détruisaient pas des livres ; ils détruisaient des questions.'],
          ['Manuscrit de Voynich (MS408), v. 1404–1438', "Un codex de 240 pages écrit dans un alphabet que personne n'a déchiffré en six siècles. Plantes inexistantes, diagrammes astronomiques impossibles, figures se baignant dans des liquides verts. Conservé à Yale, c'est le seul livre que la connaissance humaine refuse encore d'admettre."],
          ["L'Arche d'Alliance, ~587 av. J.-C.", "Disparue lorsque Nabuchodonosor rasa Jérusalem. Aucune armée ne l'a capturée, aucun chroniqueur ne la décrit ensuite. L'Éthiopie prétend la garder à Aksoum ; le Vatican se tait. La relique la plus recherchée d'Occident échappe au pouvoir depuis 2 600 ans."],
          ['Maison de la Sagesse, Bagdad 1258', "Quand les Mongols prirent la ville, ils jetèrent tant de manuscrits dans le Tigre que le fleuve coula noir d'encre pendant des jours. Avec eux sombra l'Âge d'or islamique — des siècles de mathématiques, médecine et astronomie effacés en une semaine."],
        ],
        quote: 'Le contrôle du passé est la forme la plus sophistiquée de contrôle du présent.',
        close: 'Fermer',
      },
      ja: {
        eyebrow: '空白の100年 — 機密解除',
        title: '権力が破壊できなかった歴史',
        rows: [
          ['アレクサンドリア図書館、約391年', '集積した知識を恐れた者たちの命令で部分的に焼かれた。本を破壊したのではない——問いを破壊したのだ。'],
          ['ヴォイニッチ手稿（MS408）、1404〜1438年頃', '六世紀のあいだ誰一人として解読できなかった240ページの写本。実在しない植物、ありえない天体図、緑色の液体に浸かる人物像。イェール大学に保管され、人類の知が認めることを拒んだ唯一の書物として残る。'],
          ['契約の箱（聖櫃）、紀元前587年頃', 'ネブカドネザルがエルサレムを焼き払ったとき消えた。捕獲した軍も、その後を記した年代記も存在しない。エチオピアはアクスムでの守護を主張し、ヴァチカンは沈黙する。西洋でもっとも探された遺物は、2600年ものあいだ権力の手の届かない場所にある。'],
          ['知恵の館、バグダード1258年', 'モンゴル軍が都を陥落させたとき、無数の写本がティグリス川に投げ込まれ、川は数日にわたってインクで黒く染まった。それと共にイスラム黄金時代は沈み——数世紀分の数学、医学、天文学が一週間で消し去られた。'],
        ],
        quote: '過去の支配は現在の支配のもっとも洗練された形態である。',
        close: '閉じる',
      },
      it: {
        eyebrow: 'SECOLO VUOTO — DECLASSIFICATO',
        title: 'La Storia che il Potere non è Riuscito a Distruggere',
        rows: [
          ['Biblioteca di Alessandria, ~391 d.C.', 'Parzialmente bruciata per ordine di chi temeva il sapere che custodiva. Non distrussero libri; distrussero domande.'],
          ['Manoscritto Voynich (MS408), c. 1404–1438', "Un codice di 240 pagine scritto in un alfabeto che nessuno è riuscito a decifrare in sei secoli. Piante inesistenti, diagrammi astronomici impossibili, figure immerse in liquidi verdi. Custodito a Yale, resta l'unico libro che la conoscenza umana si rifiuta di ammettere."],
          ["L'Arca dell'Alleanza, ~587 a.C.", "Scomparve quando Nabucodonosor rase al suolo Gerusalemme. Nessun esercito la catturò, nessun cronista la descrive in seguito. L'Etiopia afferma di custodirla ad Axum; il Vaticano tace. La reliquia più cercata dell'Occidente sfugge al potere da 2.600 anni."],
          ['Casa della Saggezza, Baghdad 1258', "Quando i Mongoli presero la città, gettarono nel Tigri così tanti manoscritti che il fiume scorse nero d'inchiostro per giorni. Con essi affondò l'Età dell'Oro islamica — secoli di matematica, medicina e astronomia cancellati in una settimana."],
        ],
        quote: 'Il controllo del passato è la forma più sofisticata di controllo del presente.',
        close: 'Chiudi',
      },
      de: {
        eyebrow: 'LEERES JAHRHUNDERT — FREIGEGEBEN',
        title: 'Die Geschichte, die die Macht nicht zerstören konnte',
        rows: [
          ['Bibliothek von Alexandria, ~391 n. Chr.', 'Teilweise verbrannt auf Befehl derer, die das dort versammelte Wissen fürchteten. Sie zerstörten keine Bücher; sie zerstörten Fragen.'],
          ['Voynich-Manuskript (MS408), ca. 1404–1438', 'Ein 240-seitiger Kodex in einem Alphabet, das seit sechs Jahrhunderten niemand entschlüsseln konnte. Pflanzen, die nicht existieren, unmögliche astronomische Diagramme, Gestalten, die in grünen Flüssigkeiten baden. Aufbewahrt in Yale, bleibt es das einzige Buch, das das menschliche Wissen sich weigert anzuerkennen.'],
          ['Die Bundeslade, ~587 v. Chr.', 'Verschwand, als Nebukadnezar Jerusalem niederbrannte. Kein Heer erbeutete sie, kein Chronist beschreibt sie danach. Äthiopien behauptet, sie in Aksum zu hüten; der Vatikan schweigt. Die meistgesuchte Reliquie des Westens ist seit 2.600 Jahren außerhalb der Reichweite der Macht.'],
          ['Haus der Weisheit, Bagdad 1258', 'Als die Mongolen die Stadt einnahmen, warfen sie so viele Handschriften in den Tigris, dass der Fluss tagelang schwarz von Tinte floss. Mit ihnen versank das Goldene Zeitalter des Islam — Jahrhunderte an Mathematik, Medizin und Astronomie, ausgelöscht in einer Woche.'],
        ],
        quote: 'Die Kontrolle über die Vergangenheit ist die raffinierteste Form der Kontrolle über die Gegenwart.',
        close: 'Schließen',
      },
      ru: {
        eyebrow: 'ПУСТОЕ СТОЛЕТИЕ — РАССЕКРЕЧЕНО',
        title: 'История, которую власть не смогла уничтожить',
        rows: [
          ['Александрийская библиотека, ~391 г. н. э.', 'Частично сожжена по приказу тех, кто боялся собранных в ней знаний. Они уничтожали не книги — они уничтожали вопросы.'],
          ['Манускрипт Войнича (MS408), ок. 1404–1438', 'Кодекс на 240 страниц, написанный алфавитом, который никто не смог расшифровать за шесть веков. Несуществующие растения, невозможные астрономические схемы, фигуры, купающиеся в зелёных жидкостях. Хранится в Йеле и остаётся единственной книгой, которую человеческое знание отказывается признать.'],
          ['Ковчег Завета, ~587 г. до н. э.', 'Исчез, когда Навуходоносор разрушил Иерусалим. Ни одна армия его не захватила, ни один летописец больше его не описывает. Эфиопия утверждает, что хранит его в Аксуме; Ватикан молчит. Самая разыскиваемая реликвия Запада уже 2600 лет недосягаема для власти.'],
          ['Дом мудрости, Багдад, 1258', 'Когда монголы взяли город, они бросили в Тигр столько рукописей, что река несколько дней текла чёрной от чернил. Вместе с ними утонул исламский Золотой век — столетия математики, медицины и астрономии, стёртые за неделю.'],
        ],
        quote: 'Контроль над прошлым — самая изощрённая форма контроля над настоящим.',
        close: 'Закрыть',
      },
      pt: {
        eyebrow: 'SÉCULO PERDIDO — DESCLASSIFICADO',
        title: 'A História que o Poder Não Conseguiu Destruir',
        rows: [
          ['Biblioteca de Alexandria, ~391 d.C.', 'Parcialmente queimada por ordem de quem temia o conhecimento que ela concentrava. Não destruíram livros; destruíram perguntas.'],
          ['Manuscrito Voynich (MS408), c. 1404–1438', 'Um códice de 240 páginas escrito em um alfabeto que ninguém conseguiu decifrar em seis séculos. Plantas inexistentes, diagramas astronômicos impossíveis, figuras banhando-se em líquidos verdes. Guardado em Yale, continua sendo o único livro que o conhecimento humano se recusa a admitir.'],
          ['A Arca da Aliança, ~587 a.C.', 'Desapareceu quando Nabucodonosor arrasou Jerusalém. Nenhum exército a capturou, nenhum cronista a descreve depois. A Etiópia afirma guardá-la em Axum; o Vaticano se cala. A relíquia mais procurada do Ocidente está fora do alcance do poder há 2.600 anos.'],
          ['Casa da Sabedoria, Bagdá 1258', 'Quando os mongóis tomaram a cidade, jogaram tantos manuscritos no Tigre que o rio correu negro de tinta por dias. Com eles afundou a Era de Ouro islâmica — séculos de matemática, medicina e astronomia apagados em uma semana.'],
        ],
        quote: 'O controle do passado é a forma mais sofisticada de controle do presente.',
        close: 'Fechar',
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

  /* — Observador del artículo (contenido dinámico / cambio de idioma) —
     Monitorea tanto #article-body (article.html) como #modal-body (index.html)
  ─────────────────────────────────────────────────────────────────────── */
  function observeContainer(el) {
    var obs = new MutationObserver(function() {
      attachRobinTrigger();   // attachRobinTrigger ya llama internamente a setupPoneglyphImg
    });
    obs.observe(el, { childList: true, subtree: true });
  }

  function watchArticleBody() {
    var articleBody = document.getElementById('article-body');
    var modalBody   = document.getElementById('modal-body');

    if (articleBody) observeContainer(articleBody);
    if (modalBody)   observeContainer(modalBody);

    // Fallbacks para carga tardía / caché / cambios de idioma
    setTimeout(attachRobinTrigger, 400);
    setTimeout(attachRobinTrigger, 900);
    setTimeout(attachRobinTrigger, 2000);
  }

  /* ─────────────────────────────────────────────────
     EASTER EGG 10 — ARAÑA FANTASMA (Hunter x Hunter)
     Clic en la araña nº 4 de la portada del artículo
  ───────────────────────────────────────────────── */
  let phantomTroupeActive = false;

  function createWebBgSVG() {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ee-pt-web-bg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '-50 -50 100 100');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

    var numLines = 16, numRings = 8, maxR = 72;

    for (var i = 0; i < numLines; i++) {
      var angle = (i / numLines) * 2 * Math.PI;
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', (Math.cos(angle) * maxR).toFixed(2));
      line.setAttribute('y2', (Math.sin(angle) * maxR).toFixed(2));
      line.setAttribute('class', 'ee-pt-web-line');
      line.style.animationDelay = (i * 0.04).toFixed(2) + 's';
      svg.appendChild(line);
    }

    for (var r = 1; r <= numRings; r++) {
      var radius = (r / numRings) * maxR;
      var pts = [];
      for (var j = 0; j < numLines; j++) {
        var a = (j / numLines) * 2 * Math.PI;
        pts.push(
          (Math.cos(a) * radius).toFixed(2) + ',' +
          (Math.sin(a) * radius).toFixed(2)
        );
      }
      var poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('points', pts.join(' '));
      poly.setAttribute('class', 'ee-pt-web-ring');
      poly.style.animationDelay = (r * 0.1 + 0.2).toFixed(2) + 's';
      svg.appendChild(poly);
    }

    return svg;
  }

  function createThreadSVG() {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ee-pt-thread-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '-200 -80 400 160');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var endpoints = [
      [-200, -80], [0, -80], [200, -80],
      [-200,  80], [0,  80], [200,  80],
      [-200,   0], [200,  0],
      [-140, -80], [140, -80], [-140, 80], [140, 80],
    ];

    endpoints.forEach(function(pt, i) {
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', pt[0]);
      line.setAttribute('y2', pt[1]);
      line.setAttribute('class', 'ee-pt-thread');
      line.style.animationDelay = (i * 0.08).toFixed(2) + 's';
      svg.appendChild(line);
    });

    return svg;
  }

  function triggerPhantomTroupe() {
    if (phantomTroupeActive) return;
    phantomTroupeActive = true;
    unlockEgg('phantom_troupe');

    var overlay = document.createElement('div');
    overlay.className = 'ee-pt-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    overlay.appendChild(createWebBgSVG());

    // Araña orbitando
    var orbitCenter = document.createElement('div');
    orbitCenter.className = 'ee-pt-orbit-center';
    var spider = document.createElement('div');
    spider.className = 'ee-pt-spider';
    spider.textContent = '🕷️';
    orbitCenter.appendChild(spider);
    overlay.appendChild(orbitCenter);

    // Fase 2: hilos + texto "MS 408" (aparece cuando termina la órbita, ~3.2s)
    setTimeout(function() {
      var textWrap = document.createElement('div');
      textWrap.className = 'ee-pt-text-wrap';
      textWrap.appendChild(createThreadSVG());

      var msText = document.createElement('div');
      msText.className = 'ee-pt-ms408-text';
      msText.textContent = 'MS 408';
      textWrap.appendChild(msText);

      var cSpider = document.createElement('div');
      cSpider.className = 'ee-pt-center-spider';
      cSpider.textContent = '🕷️';
      textWrap.appendChild(cSpider);

      overlay.appendChild(textWrap);

      // Fase 3: desvanecer (hilos ~1.2s + texto ~3s + pausa ~2s = 6.2s total desde fase 2)
      setTimeout(function() {
        overlay.classList.add('is-leaving');
        setTimeout(function() {
          overlay.remove();
          phantomTroupeActive = false;
        }, 700);
      }, 6200);
    }, 3200);
  }

  function setupSpiderHotspot(container) {
    var img = container.querySelector('img.article-img-hero-img');
    if (!img || img.dataset.eeSpiderBound) return;
    if (!img.src || img.src.indexOf('hunter-x-hunter-portada') === -1) return;
    img.dataset.eeSpiderBound = '1';

    var wrap = img.parentElement;
    if (!wrap) return;

    var cs = window.getComputedStyle(wrap);
    if (cs.position === 'static') wrap.style.position = 'relative';

    var hotspot = document.createElement('div');
    hotspot.className = 'ee-spider-hotspot';
    hotspot.setAttribute('aria-hidden', 'true');
    wrap.appendChild(hotspot);

    hotspot.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      triggerPhantomTroupe();
    });
  }

  function watchForHxHImage() {
    function trySetup() {
      ['article-img-top', 'modal-img-top'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) setupSpiderHotspot(el);
      });
    }
    trySetup();
    [400, 900, 2000].forEach(function(ms) { setTimeout(trySetup, ms); });
    ['article-img-top', 'modal-img-top'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(trySetup).observe(el, { childList: true, subtree: true });
    });
  }

  /* ─────────────────────────────────────────────────
     PROGRESS MODAL
  ───────────────────────────────────────────────── */
  const EE_I18N = {
    es: {
      title: "Easter Eggs",
      desc: "Descubre los secretos ocultos en la página.",
      discovered: "Descubiertos",
      final_title: "¡ENHORABUENA, HAS DESCUBIERTO TODOS LOS SECRETOS!",
      reward_badge: "Recompensa desbloqueada",
      reward_title: '¡Encontraste los <b>{n}</b> <span class="ee-final-grad">HUEVOS</span>!',
      reward_sub: "Has explorado cada rincón del blog como un verdadero nakama. Esta es tu recompensa.",
      reward_wallpaper: "Reclamar wallpaper",
      reward_share: "Presumir logro",
      reward_share_text: "He descubierto los {n} secretos ocultos de Nakama.blog 🥚 ¿Puedes encontrarlos todos?",
      claim: "Reclamar recompensa",
      names: ["Tatakae", "Sakura", "Rasengan", "Super Saiyan", "Joy Boy", "Tsukuyomi Infinito", "100%", "Gear 5", "Siglo Vacío", "Araña Fantasma"],
      hints: [
        "Una palabra para seguir luchando.",
        "Haz florecer rápidamente el emblema principal de la web.",
        "La técnica giratoria de chakra del ninja rubio.",
        "Grita el nombre de la mítica raza guerrera del universo.",
        "El guerrero de la liberación que hace latir los tambores.",
        "Alterna entre la luz y la oscuridad velozmente hasta atraparte en una ilusión.",
        "El nombre real del chico con poderes psíquicos.",
        "Agita tu mundo con fuerza para despertar el poder más ridículo.",
        "Encuentra la llave oculta de la única superviviente de la catástrofe de Ohara y úsala para leer los Poneglyphs.",
        "Encuentra al traidor del Gen'ei Ryodan (Brigada Fantasma). Él tiene un mensaje que darte."
      ]
    },
    en: {
      title: "Easter Eggs",
      desc: "Discover the hidden secrets on the page.",
      discovered: "Discovered",
      final_title: "CONGRATULATIONS, YOU'VE DISCOVERED ALL THE SECRETS!",
      reward_badge: "Reward unlocked",
      reward_title: 'You found all <b>{n}</b> <span class="ee-final-grad">EGGS</span>!',
      reward_sub: "You've explored every corner of the blog like a true nakama. This is your reward.",
      reward_wallpaper: "Claim wallpaper",
      reward_share: "Show off",
      reward_share_text: "I found all {n} hidden secrets of Nakama.blog 🥚 Can you find them all?",
      claim: "Claim your reward",
      names: ["Tatakae", "Sakura", "Rasengan", "Super Saiyan", "Joy Boy", "Infinite Tsukuyomi", "100%", "Gear 5", "Void Century", "Phantom Troupe"],
      hints: [
        "A word to keep fighting.",
        "Make the main emblem of the site bloom quickly.",
        "The spinning chakra technique of the blonde ninja.",
        "Shout the name of the mythical warrior race of the universe.",
        "The warrior of liberation who makes the drums beat.",
        "Alternate between light and darkness swiftly to trap yourself in an illusion.",
        "The real name of the boy with psychic powers.",
        "Shake your world strongly to awaken the most ridiculous power.",
        "Find the hidden key of the sole survivor of the Ohara catastrophe and use it to read the Poneglyphs.",
        "Find the traitor of the Phantom Troupe (Gen'ei Ryodan). He has a message for you."
      ]
    },
    fr: {
      title: "Easter Eggs",
      desc: "Découvrez les secrets cachés de la page.",
      discovered: "Découverts",
      final_title: "FÉLICITATIONS, VOUS AVEZ DÉCOUVERT TOUS LES SECRETS !",
      reward_badge: "Récompense débloquée",
      reward_title: 'Tu as trouvé les <b>{n}</b> <span class="ee-final-grad">ŒUFS</span> !',
      reward_sub: "Tu as exploré chaque recoin du blog comme un vrai nakama. Voici ta récompense.",
      reward_wallpaper: "Réclamer le fond d'écran",
      reward_share: "Frimer",
      reward_share_text: "J'ai découvert les {n} secrets cachés de Nakama.blog 🥚 Saurez-vous tous les trouver ?",
      claim: "Réclamer la récompense",
      names: ["Tatakae", "Sakura", "Rasengan", "Super Saiyan", "Joy Boy", "Tsukuyomi Infini", "100%", "Gear 5", "Siècle Vide", "Brigade Fantôme"],
      hints: [
        "Un mot pour continuer à se battre.",
        "Faites fleurir rapidement l'emblème principal du site.",
        "La technique de chakra tourbillonnant du ninja blond.",
        "Criez le nom de la mythique race guerrière de l'univers.",
        "Le guerrier de la libération qui fait battre les tambours.",
        "Alternez rapidement entre la lumière et l'obscurité pour vous piéger dans une illusion.",
        "Le vrai nom du garçon aux pouvoirs psychiques.",
        "Secouez fortement votre monde pour éveiller le pouvoir le plus ridicule.",
        "Trouvez la clé cachée de la seule survivante de la catastrophe d'Ohara et utilisez-la pour lire les Ponéglyphes.",
        "Trouve le traître de la Brigade Fantôme (Gen'ei Ryodan). Il a un message pour toi."
      ]
    },
    ja: {
      title: "イースターエッグ",
      desc: "ページに隠された秘密を発見しよう。",
      discovered: "発見",
      final_title: "おめでとう！すべての秘密を見つけ出した！",
      reward_badge: "報酬を解放",
      reward_title: '<b>{n}</b>個の<span class="ee-final-grad">タマゴ</span>を全部見つけた！',
      reward_sub: "本物のナカマのようにブログの隅々まで探索した。これがその報酬だ。",
      reward_wallpaper: "壁紙を受け取る",
      reward_share: "自慢する",
      reward_share_text: "Nakama.blogの隠された秘密を{n}個すべて見つけた 🥚 君は全部見つけられる？",
      claim: "報酬を受け取る",
      names: ["戦え", "桜", "螺旋丸", "超サイヤ人", "ジョイボーイ", "無限月読", "100%", "ギア5", "空白の100年", "幻影旅団"],
      hints: [
        "戦い続けるための言葉。",
        "ウェブのメインエンブレムをすばやく咲かせよ。",
        "金髪の忍者の回転するチャクラの技。",
        "宇宙の神話的な戦闘種族の名前を叫べ。",
        "太鼓を鳴らす解放の戦士。",
        "光と闇を素早く切り替えて、幻術に囚われよ。",
        "超能力を持つ少年の本名。",
        "世界を強く揺さぶり、最も馬鹿げた能力を覚醒させよ。",
        "オハラの悲劇の唯一の生存者の隠された鍵を見つけ、ポーネグリフを読むために使え。",
        "幻影旅団（ゲンエイリョダン）の裏切り者を探せ。彼はお前に伝言がある。"
      ]
    },
    it: {
      final_title: "CONGRATULAZIONI, HAI SCOPERTO TUTTI I SEGRETI!",
      reward_badge: "Ricompensa sbloccata",
      reward_title: 'Hai trovato tutte le <b>{n}</b> <span class="ee-final-grad">UOVA</span>!',
      reward_sub: "Hai esplorato ogni angolo del blog come un vero nakama. Questa è la tua ricompensa.",
      reward_wallpaper: "Riscatta il wallpaper",
      reward_share: "Vantati",
      reward_share_text: "Ho trovato tutti i {n} segreti nascosti di Nakama.blog 🥚 Riesci a trovarli tutti?",
      claim: "Riscatta la ricompensa",
      title: "Easter Eggs",
      desc: "Scopri i segreti nascosti nella pagina.",
      discovered: "Scoperti",
      names: ["Tatakae", "Sakura", "Rasengan", "Super Saiyan", "Joy Boy", "Tsukuyomi Infinito", "100%", "Gear 5", "Secolo Vuoto", "Brigata Fantasma"],
      hints: [
        "Una parola per continuare a combattere.",
        "Fai fiorire rapidamente l'emblema principale del sito.",
        "La tecnica di chakra rotante del ninja biondo.",
        "Urla il nome della mitica razza guerriera dell'universo.",
        "Il guerriero della liberazione che fa battere i tamburi.",
        "Alterna rapidamente tra luce e oscurità per intrappolarti in un'illusione.",
        "Il vero nome del ragazzo con poteri psichici.",
        "Scuoti fortemente il tuo mondo per risvegliare il potere più ridicolo.",
        "Trova la chiave nascosta dell'unica sopravvissuta alla catastrofe di Ohara e usala per leggere i Poneglyph.",
        "Trova il traditore della Brigata Fantasma (Gen'ei Ryodan). Ha un messaggio per te."
      ]
    },
    de: {
      title: "Easter Eggs",
      desc: "Entdecke die verborgenen Geheimnisse der Seite.",
      discovered: "Entdeckt",
      final_title: "GLÜCKWUNSCH, DU HAST ALLE GEHEIMNISSE ENTDECKT!",
      reward_badge: "Belohnung freigeschaltet",
      reward_title: 'Du hast alle <b>{n}</b> <span class="ee-final-grad">EIER</span> gefunden!',
      reward_sub: "Du hast jede Ecke des Blogs erkundet wie ein echter Nakama. Das ist deine Belohnung.",
      reward_wallpaper: "Wallpaper einlösen",
      reward_share: "Angeben",
      reward_share_text: "Ich habe alle {n} versteckten Geheimnisse von Nakama.blog gefunden 🥚 Findest du sie alle?",
      claim: "Belohnung einfordern",
      names: ["Tatakae", "Sakura", "Rasengan", "Super Saiyajin", "Joy Boy", "Unendliches Tsukuyomi", "100%", "Gear 5", "Leeres Jahrhundert", "Phantom-Truppe"],
      hints: [
        "Ein Wort, um weiterzukämpfen.",
        "Bringe das Hauptemblem der Website schnell zum Blühen.",
        "Die rotierende Chakra-Technik des blonden Ninjas.",
        "Schreie den Namen der mythischen Kriegerrasse des Universums.",
        "Der Krieger der Befreiung, der die Trommeln schlagen lässt.",
        "Wechsle schnell zwischen Licht und Dunkelheit, um dich in einer Illusion zu fangen.",
        "Der wahre Name des Jungen mit den psychischen Kräften.",
        "Schüttle deine Welt kräftig, um die lächerlichste Kraft zu erwecken.",
        "Finde den versteckten Schlüssel der einzigen Überlebenden der Ohara-Katastrophe und nutze ihn, um die Poneglyphen zu lesen.",
        "Finde den Verräter der Phantom-Truppe (Gen'ei Ryodan). Er hat eine Nachricht für dich."
      ]
    },
    ru: {
      title: "Пасхалки",
      desc: "Откройте скрытые секреты на странице.",
      discovered: "Открыто",
      final_title: "ПОЗДРАВЛЯЕМ, ВЫ ОТКРЫЛИ ВСЕ СЕКРЕТЫ!",
      reward_badge: "Награда разблокирована",
      reward_title: 'Ты нашёл все <b>{n}</b> <span class="ee-final-grad">ЯЙЦА</span>!',
      reward_sub: "Ты исследовал каждый уголок блога как настоящий накама. Это твоя награда.",
      reward_wallpaper: "Забрать обои",
      reward_share: "Похвастаться",
      reward_share_text: "Я нашёл все {n} скрытых секретов Nakama.blog 🥚 Сможешь найти их все?",
      claim: "Получить награду",
      names: ["Tatakae", "Sakura", "Rasengan", "Супер Сайян", "Джой Бой", "Бесконечное Цукуёми", "100%", "5 Гир", "Пустое Столетие", "Призрачная бригада"],
      hints: [
        "Слово, чтобы продолжать сражаться.",
        "Быстро заставь расцвести главную эмблему сайта.",
        "Вращающаяся техника чакры светловласого ниндзя.",
        "Выкрикни название мифической расы воинов вселенной.",
        "Воин освобождения, заставляющий бить барабаны.",
        "Быстро чередуйте свет и тьму, чтобы попасть в иллюзию.",
        "Настоящее имя мальчика с экстрасенсорными способностями.",
        "Сильно потряси свой мир, чтобы пробудить самую нелепую силу.",
        "Найдите спрятанный ключ единственной выжившей в катастрофе на Охаре и используйте его, чтобы прочесть Понеглифы.",
        "Найди предателя Призрачной бригады (Gen'ei Ryodan). У него есть послание для тебя."
      ]
    },
    pt: {
      title: "Easter Eggs",
      desc: "Descubra os segredos ocultos na página.",
      discovered: "Descobertos",
      final_title: "PARABÉNS, VOCÊ DESCOBRIU TODOS OS SEGREDOS!",
      reward_badge: "Recompensa desbloqueada",
      reward_title: 'Você encontrou os <b>{n}</b> <span class="ee-final-grad">OVOS</span>!',
      reward_sub: "Você explorou cada canto do blog como um verdadeiro nakama. Esta é a sua recompensa.",
      reward_wallpaper: "Resgatar wallpaper",
      reward_share: "Se gabar",
      reward_share_text: "Descobri os {n} segredos ocultos do Nakama.blog 🥚 Você consegue achar todos?",
      claim: "Resgatar recompensa",
      names: ["Tatakae", "Sakura", "Rasengan", "Super Saiyajin", "Joy Boy", "Tsukuyomi Infinito", "100%", "Gear 5", "Século Perdido", "Tropa Fantasma"],
      hints: [
        "Uma palavra para continuar lutando.",
        "Faça o emblema principal do site florescer rapidamente.",
        "A técnica de chakra giratória do ninja loiro.",
        "Grite o nome da mítica raça guerreira do universo.",
        "O guerreiro da libertação que faz os tambores baterem.",
        "Alterne rapidamente entre luz e escuridão até se prender em uma ilusão.",
        "O verdadeiro nome do garoto com poderes psíquicos.",
        "Agite fortemente o seu mundo para despertar o poder mais ridículo.",
        "Encontre a chave oculta da única sobrevivente da catástrofe de Ohara e use-a para ler os Poneglyphs.",
        "Encontre o traidor da Tropa Fantasma (Gen'ei Ryodan). Ele tem uma mensagem para você."
      ]
    }
  };

  const EGG_IDS = ['tatakae', 'sakura', 'rasengan', 'saiyan', 'joyboy', 'tsukuyomi', 'mob', 'gear5', 'poneglyph', 'phantom_troupe'];
  let eeModalBackdrop = null;

  function buildProgressModal() {
    if (eeModalBackdrop) return;
    
    eeModalBackdrop = document.createElement('div');
    eeModalBackdrop.className = 'ee-progress-backdrop';
    eeModalBackdrop.innerHTML = `
      <div class="ee-progress-modal" role="dialog" aria-modal="true" aria-labelledby="ee-modal-title">
        <button class="ee-modal-close" aria-label="Cerrar">&times;</button>
        <h2 id="ee-modal-title">Easter Eggs</h2>
        <p id="ee-modal-desc"></p>
        <div class="ee-progress-bar-container">
          <div class="ee-progress-fill"></div>
        </div>
        <span class="ee-progress-count"></span>
        <ul class="ee-list"></ul>
      </div>
    `;
    document.body.appendChild(eeModalBackdrop);

    eeModalBackdrop.querySelector('.ee-modal-close').addEventListener('click', closeProgressModal);
    eeModalBackdrop.addEventListener('click', (e) => {
      if (e.target === eeModalBackdrop) closeProgressModal();
    });
  }

  function renderProgress() {
    buildProgressModal();
    const lang = (typeof currentLang !== 'undefined' && currentLang) || localStorage.getItem('lang') || 'es';
    const loc = EE_I18N[lang] || EE_I18N['es'];

    document.getElementById('ee-modal-title').textContent = loc.title;
    document.getElementById('ee-modal-desc').textContent = loc.desc;

    let unlocked = {};
    try {
      unlocked = JSON.parse(localStorage.getItem('ee_unlocked')) || {};
    } catch(e) {}

    let discovered = 0;
    const listEl = eeModalBackdrop.querySelector('.ee-list');
    listEl.innerHTML = '';

    EGG_IDS.forEach((id, idx) => {
      const isUn = unlocked[id];
      if (isUn) discovered++;
      const li = document.createElement('li');
      li.className = 'ee-list-item' + (isUn ? ' is-unlocked' : '');
      li.innerHTML = `
        <div class="ee-list-icon">${isUn ? '✅' : '❓'}</div>
        <div class="ee-list-content">
          <h4 class="ee-list-title">${isUn ? loc.names[idx] : '???'}</h4>
          <p class="ee-list-hint">${loc.hints[idx]}</p>
        </div>
      `;
      listEl.appendChild(li);
    });

    eeModalBackdrop.querySelector('.ee-progress-fill').style.width = (discovered / EGG_IDS.length * 100) + '%';
    eeModalBackdrop.querySelector('.ee-progress-count').textContent = discovered + '/' + EGG_IDS.length + ' ' + loc.discovered;
  }

  function openProgressModal() {
    renderProgress();
    eeModalBackdrop.classList.add('is-visible');
  }

  function closeProgressModal() {
    if (eeModalBackdrop) {
      eeModalBackdrop.classList.remove('is-visible');
    }
  }

  function attachProgressBtn() {
    const btns = document.querySelectorAll('#ee-progress-btn');
    btns.forEach(btn => {
      if (!btn.dataset.eeBtnBound) {
        btn.dataset.eeBtnBound = '1';
        btn.addEventListener('click', function(e) {
          if (btn.classList.contains('is-all-complete')) {
            e.preventDefault();
            e.stopPropagation();
            triggerFinalReward(btn);
            return;
          }
          openProgressModal();
        });
      }
    });
  }

  // Update modal automatically if open when a new egg is found
  document.addEventListener('ee_unlocked_updated', () => {
    if (eeModalBackdrop && eeModalBackdrop.classList.contains('is-visible')) {
      renderProgress();
    }
    // Re-evaluate "all completed" state — may upgrade the egg button to golden
    checkAllEggsComplete();
  });

  /* ─────────────────────────────────────────────────
     CUMPLEAÑOS DE LUFFY — 5 de mayo (automático)
     No cuenta como easter egg ni aparece en el modal.
  ───────────────────────────────────────────────── */
  function checkLuffyBirthday() {
    var now = new Date();
    if (now.getMonth() !== 4 || now.getDate() !== 5) return;

    var layer = document.createElement('div');
    layer.className = 'ee-luffy-hat-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    var vw = window.innerWidth;
    for (var i = 0; i < 35; i++) {
      var hat = document.createElement('div');
      hat.className = 'ee-luffy-hat';
      hat.textContent = '👒';
      hat.style.left = (Math.random() * vw) + 'px';
      hat.style.fontSize = (14 + Math.random() * 18) + 'px';
      hat.style.setProperty('--ee-hat-drift', (Math.random() * 200 - 100) + 'px');
      hat.style.animationDuration = (4 + Math.random() * 4) + 's';
      hat.style.animationDelay = (Math.random() * 3.5) + 's';
      layer.appendChild(hat);
    }
    setTimeout(function() { layer.remove(); }, 10000);

    setTimeout(function() {
      var lang = (typeof currentLang !== 'undefined' && currentLang)
        || localStorage.getItem('lang') || 'es';

      var tx = {
        es: { laugh: '¡SHISHISHI!',  date: '5 de mayo',   sub: 'Feliz cumpleaños,',      name: 'Monkey D. Luffy', quote: '¡Seré el Rey de los Piratas!' },
        en: { laugh: 'SHISHISHI!',   date: 'May 5th',      sub: 'Happy birthday,',         name: 'Monkey D. Luffy', quote: 'I\'m gonna be King of the Pirates!' },
        fr: { laugh: 'SHISHISHI!',   date: '5 mai',        sub: 'Joyeux anniversaire,',    name: 'Monkey D. Luffy', quote: 'Je serai le Roi des Pirates !' },
        ja: { laugh: 'シシシシ！',    date: '5月5日',       sub: 'お誕生日おめでとう、',    name: 'モンキー・D・ルフィ', quote: '海賊王に、おれはなる！' },
        it: { laugh: 'SHISHISHI!',   date: '5 maggio',     sub: 'Buon compleanno,',        name: 'Monkey D. Luffy', quote: 'Diventerò il Re dei Pirati!' },
        de: { laugh: 'SHISHISHI!',   date: '5. Mai',       sub: 'Alles Gute zum Geburtstag,', name: 'Monkey D. Luffy', quote: 'Ich werde der Piratenkönig!' },
        ru: { laugh: 'ШИШИШИ!',      date: '5 мая',        sub: 'С днём рождения,',        name: 'Манки Д. Луффи', quote: 'Я стану королём пиратов!' },
        pt: { laugh: 'SHISHISHI!',   date: '5 de maio',    sub: 'Feliz aniversário,',      name: 'Monkey D. Luffy', quote: 'Eu vou ser o Rei dos Piratas!' },
      };
      var c = tx[lang] || tx.es;

      var backdrop = document.createElement('div');
      backdrop.className = 'ee-luffy-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');

      var card = document.createElement('div');
      card.className = 'ee-luffy-card';
      card.innerHTML =
        '<div class="ee-luffy-hat-big">👒</div>' +
        '<div class="ee-luffy-laugh">' + c.laugh + '</div>' +
        '<div class="ee-luffy-sub">' + c.date + ' — ' + c.sub + '</div>' +
        '<div class="ee-luffy-name">' + c.name + '</div>' +
        '<div class="ee-luffy-divider"></div>' +
        '<p class="ee-luffy-quote">“' + c.quote + '”</p>';

      backdrop.appendChild(card);
      document.body.appendChild(backdrop);

      function dismiss() {
        backdrop.classList.add('is-leaving');
        setTimeout(function() { backdrop.remove(); }, 500);
      }

      backdrop.addEventListener('click', dismiss);
      setTimeout(dismiss, 6000);
    }, 350);
  }

  /* ─────────────────────────────────────────────────
     RECOMPENSA FINAL — Todos los easter eggs completados
     · Cuando los 10 estén desbloqueados, el huevo del nav
       se vuelve dorado, brilla y se agita.
     · Click → animación de rotura → vídeo final
       (videos/video-easter-eggs-completados.mp4)
       que se congela en el último frame (cofre abierto).
     · Aparece un botón de "Reclamar recompensa" → descarga.
     · Al reclamar se persiste `ee_final_claimed=1` para
       que el huevo dorado no vuelva a aparecer.
  ───────────────────────────────────────────────── */

  // Archivo de recompensa final que se descarga al completar todos los easter eggs.
  var FINAL_REWARD_FILE     = '/img/articles/leeme.jpg';
  var FINAL_REWARD_FILENAME = 'leeme.jpg';

  var finalRewardActive = false;

  function checkAllEggsComplete() {
    try {
      if (localStorage.getItem('ee_final_claimed') === '1') return;
      var unlocked = JSON.parse(localStorage.getItem('ee_unlocked')) || {};
      var allDone = EGG_IDS.every(function(id) { return !!unlocked[id]; });
      if (!allDone) return;
      var btns = document.querySelectorAll('#ee-progress-btn');
      btns.forEach(function(btn) {
        if (!btn.classList.contains('is-all-complete')) {
          btn.classList.add('is-all-complete');
        }
      });
    } catch (e) { /* noop */ }
  }

  function triggerFinalReward(srcBtn) {
    if (finalRewardActive) return;
    finalRewardActive = true;

    // Marcar como reclamado para que el huevo dorado no reaparezca
    try { localStorage.setItem('ee_final_claimed', '1'); } catch (e) {}

    // Fase 1: animación de rotura sobre el huevo
    var btns = document.querySelectorAll('#ee-progress-btn');
    btns.forEach(function(b) {
      b.classList.remove('is-all-complete');
      b.classList.add('is-breaking');
    });

    // Fase 2: tras la rotura → cinemática épica + tarjeta de recompensa
    setTimeout(function() {
      btns.forEach(function(b) { b.classList.remove('is-breaking'); });
      openFinalReward();
    }, 850);
  }

  /* Decide el flujo: cinemática + tarjeta, o tarjeta directa si reduced-motion. */
  function openFinalReward() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { openFinalRewardOverlay(); return; }
    openFinalCinematic();
  }

  /* Cinemática épica (runas → monolito → explosión → emblema) que reutiliza
     videos/video-easter-eggs-completados.mp4. Al formarse el emblema, la tarjeta
     de recompensa emerge de la luz. Saltable (botón / Escape). */
  function openFinalCinematic() {
    var lang = (typeof currentLang !== 'undefined' && currentLang) || localStorage.getItem('lang') || 'es';
    var SKIP = { es: 'Saltar', en: 'Skip', fr: 'Passer', ja: 'スキップ', it: 'Salta', de: 'Überspringen', ru: 'Пропустить', pt: 'Pular' };

    var stage = document.createElement('div');
    stage.className = 'ee-final-cine';
    stage.innerHTML =
      '<video class="ee-final-cine-video" playsinline preload="auto" src="/videos/video-easter-eggs-completados.mp4"></video>' +
      '<button class="ee-final-cine-skip" type="button">' + (SKIP[lang] || SKIP.es) + ' ›</button>';
    document.body.appendChild(stage);

    var video   = stage.querySelector('.ee-final-cine-video');
    var skipBtn = stage.querySelector('.ee-final-cine-skip');
    var done = false, timer = null;

    function reveal() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      stage.classList.add('is-leaving');
      setTimeout(function() { stage.remove(); }, 650);
      openFinalRewardOverlay();
    }
    function onKey(e) { if (e.key === 'Escape') reveal(); }

    document.addEventListener('keydown', onKey);
    skipBtn.addEventListener('click', reveal);
    video.addEventListener('ended', reveal);

    // Intentar con sonido; si el navegador lo bloquea, reproducir en silencio
    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function() { video.muted = true; video.play().catch(function() {}); });
    }

    // Revelar la tarjeta cuando el emblema ya se forma (solapa el último tramo)
    timer = setTimeout(reveal, 6000);
  }

  function openFinalRewardOverlay() {
    var lang = (typeof currentLang !== 'undefined' && currentLang)
      || localStorage.getItem('lang') || 'es';
    var loc = EE_I18N[lang] || EE_I18N['es'];
    var total = EGG_IDS.length;

    var badge   = loc.reward_badge || 'Recompensa desbloqueada';
    var titleTx = (loc.reward_title || '¡Encontraste los <b>{n}</b> <span class="ee-final-grad">HUEVOS</span>!').replace('{n}', total);
    var subTx   = loc.reward_sub || '';
    var progLbl = loc.discovered || 'Descubiertos';
    var wallTx  = loc.reward_wallpaper || 'Reclamar wallpaper';
    var shareTx = loc.reward_share || 'Presumir logro';
    var quote   = tCurrent('motiv_phrase', '¡Nunca te rindas y persigue tus sueños!');

    var tiles = '';
    for (var i = 0; i < total; i++) {
      tiles += '<span class="ee-final-egg-tile" style="--i:' + i + '"><span class="ee-final-egg-mini"></span></span>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'ee-final-overlay';
    overlay.innerHTML =
      '<div class="ee-final-card" role="dialog" aria-modal="true">' +
        '<button class="ee-final-close" aria-label="Cerrar">×</button>' +
        '<div class="ee-final-egg" aria-hidden="true"></div>' +
        '<div class="ee-final-badge">✦ ' + badge + '</div>' +
        '<h2 class="ee-final-title">' + titleTx + '</h2>' +
        '<p class="ee-final-sub">' + subTx + '</p>' +
        '<div class="ee-final-progress">' +
          '<div class="ee-final-progress-head"><span>' + progLbl + '</span><span>' + total + ' / ' + total + '</span></div>' +
          '<div class="ee-final-progress-track"><div class="ee-final-progress-fill"></div></div>' +
        '</div>' +
        '<div class="ee-final-grid">' + tiles + '</div>' +
        '<blockquote class="ee-final-quote">«' + quote + '»</blockquote>' +
        '<div class="ee-final-actions">' +
          '<button class="ee-final-wallpaper" type="button"><span class="ee-final-star">★</span>' + wallTx + '</button>' +
          '<button class="ee-final-share" type="button">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>' +
            shareTx +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // Rellenar la barra de progreso al abrir (anima 0 -> 100%)
    requestAnimationFrame(function () {
      var fill = overlay.querySelector('.ee-final-progress-fill');
      if (fill) fill.style.width = '100%';
    });

    var closeBtn = overlay.querySelector('.ee-final-close');
    var wallBtn  = overlay.querySelector('.ee-final-wallpaper');
    var shareBtn = overlay.querySelector('.ee-final-share');

    function closeFinalReward() {
      overlay.classList.add('is-leaving');
      setTimeout(function () { overlay.remove(); finalRewardActive = false; }, 500);
      document.removeEventListener('keydown', escHandler);
    }
    function escHandler(e) { if (e.key === 'Escape') closeFinalReward(); }
    document.addEventListener('keydown', escHandler);

    closeBtn.addEventListener('click', closeFinalReward);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeFinalReward(); });

    // Reclamar wallpaper -> descarga (el secreto va dentro del propio archivo)
    wallBtn.addEventListener('click', function () {
      try {
        var a = document.createElement('a');
        a.href = FINAL_REWARD_FILE;
        a.download = FINAL_REWARD_FILENAME;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) { console.warn('ee final download err', e); }
      wallBtn.classList.add('is-claimed');
    });

    // Presumir logro -> Web Share API o, en su defecto, intent de X/Twitter
    shareBtn.addEventListener('click', function () {
      var url = 'https://ualjlf259.github.io/';
      var text = (loc.reward_share_text || 'He descubierto los {n} secretos ocultos de Nakama.blog 🥚')
        .replace('{n}', total);
      if (navigator.share) {
        navigator.share({ title: 'Nakama.blog', text: text, url: url }).catch(function () {});
      } else {
        window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
          '&url=' + encodeURIComponent(url), '_blank', 'noopener');
      }
    });
  }

  /* ── Init ──────────────────────────────────────── */
  function bootEasterEggs() {
    attachLogoListener();
    attachTsukuyomiListener();
    attachMotionDetector();
    watchArticleBody();
    watchForHxHImage();
    checkLuffyBirthday();
    attachProgressBtn();
    checkAllEggsComplete();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootEasterEggs);
  } else {
    bootEasterEggs();
  }
})();
