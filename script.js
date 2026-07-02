/* ═══════════════════════════════════════════════════
   TRANSLATIONS — UI strings desde locales/*.js
═══════════════════════════════════════════════════ */
const i18n = {
  es: window.LANG_ES,
  en: window.LANG_EN,
  fr: window.LANG_FR,
  ja: window.LANG_JA,
  it: window.LANG_IT,
  de: window.LANG_DE,
  ru: window.LANG_RU,
  pt: window.LANG_PT
};

const SUPPORTED_LANGS = ['es', 'en', 'fr', 'ja', 'it', 'de', 'ru', 'pt'];

function detectInitialLang() {
  // 0. Página prerenderizada (SSG): el idioma lo fija el fichero estático.
  if (typeof window !== 'undefined' && window.__PRERENDERED && window.__PRERENDERED.lang) return window.__PRERENDERED.lang;
  // 1. Parámetro ?lang=XX en la URL (máxima prioridad — para SEO/hreflang)
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;
  // 2. Idioma guardado en localStorage
  const saved = localStorage.getItem('lang');
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  // 3. Idioma del navegador como respaldo
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : 'es';
}

/* Genera URL absoluta con o sin ?lang= según el idioma (es = default sin param) */
function buildLangUrl(lang) {
  const SITE_URL = 'https://ualjlf259.github.io';
  const url = new URL(location.href, SITE_URL);
  url.searchParams.delete('lang');
  if (lang !== 'es') url.searchParams.set('lang', lang);
  return SITE_URL + url.pathname + (url.search || '');
}

/* Inyecta/actualiza los <link rel="alternate" hreflang="..."> + x-default */
function updateHreflangTags() {
  // Quitar las que ya existan (para evitar duplicados al cambiar de idioma)
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  // Una etiqueta por idioma
  SUPPORTED_LANGS.forEach(lang => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', lang);
    link.setAttribute('href', buildLangUrl(lang));
    document.head.appendChild(link);
  });
  // x-default (apunta al idioma por defecto: español)
  const xd = document.createElement('link');
  xd.setAttribute('rel', 'alternate');
  xd.setAttribute('hreflang', 'x-default');
  xd.setAttribute('href', buildLangUrl('es'));
  document.head.appendChild(xd);
}

let currentLang = detectInitialLang();

/* URL pública (SSG, directorio limpio) de un artículo respetando el idioma actual.
   ES en la raíz; el resto bajo /<lang>/. Coincide con scripts/generate-articles.js. */
function articleHref(id) {
  return currentLang === 'es' ? `/articulos/${id}/` : `/articulos/${id}/${currentLang}/`;
}

/* ═══════════════════════════════════════════════════
   ARTICLE STORE
═══════════════════════════════════════════════════ */
const articleStore = {
  index: null,
  full: {},
};

async function loadArticleIndex() {
  if (articleStore.index) return articleStore.index;
  const res = await fetch('/articles/index.json');
  if (!res.ok) throw new Error('No se pudo cargar articles/index.json');
  articleStore.index = await res.json();
  return articleStore.index;
}

async function loadArticle(id) {
  if (articleStore.full[id]) return articleStore.full[id];
  const res = await fetch(`/articles/${id}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar el artículo "${id}"`);
  const data = await res.json();
  articleStore.full[id] = data;
  return data;
}

/* ═══════════════════════════════════════════════════
   DETECCIÓN DE PÁGINA
═══════════════════════════════════════════════════ */
const onArticlePage = !!document.getElementById('article-root');
const onIndexPage   = !!document.getElementById('articles-grid');
const onSavedPage   = !!document.getElementById('saved-grid');

/* ═══════════════════════════════════════════════════
   APLICAR IDIOMA
═══════════════════════════════════════════════════ */
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // En páginas prerenderizadas (SSG) la URL y los hreflang son estáticos por idioma → no tocarlos.
  if (!window.__PRERENDERED) {
    // Actualizar URL con ?lang= (sin recargar) y refrescar hreflang
    try {
      const newUrl = buildLangUrl(lang);
      history.replaceState(null, '', newUrl);
    } catch (e) { /* no critico */ }
    updateHreflangTags();
  }

  const t = i18n[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  const si = document.getElementById('search-input');
  if (si && t.search_placeholder) {
    si.placeholder = t.search_placeholder;
    si.setAttribute('aria-label', t.search_placeholder);
  }

  // Actualiza el texto de no-resultados sin destruir el <span> interior
  const noResultsEl = document.getElementById('no-results');
  if (noResultsEl && t.no_results) {
    const firstChild = noResultsEl.firstChild;
    if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
      firstChild.textContent = t.no_results + ' "';
    }
  }

  // Hero
  const ey = document.querySelector('.hero-eyebrow');
  if (ey && t.hero_eyebrow) ey.innerHTML = t.hero_eyebrow;
  const h1 = document.querySelector('.hero h1');
  if (h1 && t.hero_h1) h1.innerHTML = t.hero_h1;
  const hs = document.querySelector('.hero-sub');
  if (hs && t.hero_sub) hs.innerHTML = t.hero_sub;
  const ctaBtns = document.querySelectorAll('.hero-cta .btn');
  const setBtnLabel = (btn, txt) => {
    if (!btn || !txt) return;
    const lbl = btn.querySelector('.btn-label');
    if (lbl) lbl.textContent = txt; else btn.textContent = txt;
  };
  if (ctaBtns[0] && t.btn_read)     setBtnLabel(ctaBtns[0], t.btn_read);
  if (ctaBtns[1] && t.btn_roulette) setBtnLabel(ctaBtns[1], t.btn_roulette);
  if (ctaBtns[2] && t.btn_about)    setBtnLabel(ctaBtns[2], t.btn_about);

  // Hero stats labels
  const statRating = document.querySelector('.hero-stat-rating-label');
  if (statRating && t.hero_stat_rating) statRating.textContent = t.hero_stat_rating;
  const statEps = document.querySelector('.hero-stat-eps-label');
  if (statEps && t.hero_stat_episodes) statEps.textContent = t.hero_stat_episodes;

  // Featured banner
  const fb = document.querySelector('.featured-badge');
  if (fb && t.featured_badge) fb.textContent = t.featured_badge;
  const ftag = document.querySelector('.featured-tag');
  if (ftag && t.featured_tag) ftag.textContent = t.featured_tag;
  const fh2 = document.querySelector('.featured-content h2');
  if (fh2 && t.featured_title) fh2.textContent = t.featured_title;
  const fdesc = document.querySelector('.featured-content p');
  if (fdesc && t.featured_desc) fdesc.textContent = t.featured_desc;
  const rb = document.querySelector('.featured-content .btn');
  if (rb && t.btn_read_now) rb.textContent = t.btn_read_now;

  // Ranking
  const rt = document.querySelector('#ranking .section-header h2');
  if (rt && t.ranking_title) rt.textContent = t.ranking_title;
  const rs = document.querySelector('#ranking .section-header span');
  if (rs && t.ranking_sub) rs.textContent = t.ranking_sub;
  const rankingEmojis = ['⚓','✨','⚔️','🍀','🪓','⚡','🗡️','🍃','📓','💥','😴','🐉','👁️','🔥','🏐','🌀','⛓️'];
  const rankBars = [100,94,88,83,79,75,71,67,63,59,55,51,48,44,41,37,33];
  const rankingList = document.querySelector('.ranking-list');
  if (rankingList && t.ranking_items) {
    const items = t.ranking_items;
    const ratingOf = (i) => (rankBars[i] != null ? (rankBars[i] / 10).toFixed(1) : '');
    const authorOf = (it) => (it.desc ? it.desc.split('·')[0].trim() : '');
    const place = (i) => String(i + 1).padStart(2, '0');

    // Podio: top 3 en orden visual 2 · 1 · 3 (el #1 va elevado)
    const podium = [1, 0, 2].filter((idx) => items[idx]).map((idx) => {
      const it = items[idx];
      const cover = it.img
        ? `<img src="${it.img}" alt="${it.name}" loading="lazy">`
        : `<span class="rank-pod-emoji">${rankingEmojis[idx] || '★'}</span>`;
      return `
      <div class="rank-pod rank-pod-${idx + 1}">
        <div class="rank-pod-cover">${cover}<span class="rank-pod-badge">★ ${ratingOf(idx)}</span></div>
        <div class="rank-pod-place">${place(idx)}</div>
        <div class="rank-pod-name">${it.name}</div>
      </div>`;
    }).join('');

    // Lista: del 4º en adelante
    const rows = items.slice(3).map((it, j) => {
      const i = j + 3;
      const author = authorOf(it);
      return `
      <div class="rank-row" style="--rank-delay:${j * 45}ms">
        <span class="rank-row-num">${place(i)}</span>
        <div class="rank-row-info">
          <div class="rank-row-title"><strong>${it.name}</strong>${author ? `<span>· ${author}</span>` : ''}</div>
          <div class="rank-bar-wrap"><div class="rank-bar" style="width:${rankBars[i] || 20}%"></div></div>
        </div>
        <span class="rank-row-rating">${ratingOf(i)}</span>
      </div>`;
    }).join('');

    rankingList.innerHTML =
      `<div class="rank-podium">${podium}</div><div class="rank-rows">${rows}</div>`;
  }

  // About
  const aboutTextDiv = document.querySelector('.about-text-content');
  if (aboutTextDiv && t.about_p1) {
    aboutTextDiv.innerHTML = `
      <p>${t.about_p1}</p>
      <p>${t.about_p2}</p>
      <p>${t.about_p3}</p>
      <p style="margin-top:1.1rem;"><a href="https://github.com/ualjlf259" target="_blank" rel="noopener">→ GitHub: ualjlf259</a></p>`;
  }

  // Footer
  const footerP = document.querySelector('footer p:first-child');
  if (footerP && t.footer_made) {
    const nameEl = footerP.querySelector('strong:first-child');
    const blogEl = footerP.querySelector('strong:last-child');
    if (nameEl && blogEl) {
      footerP.childNodes[0].textContent = t.footer_made + ' ';
    }
  }

  // Re-render tarjetas
  if (onIndexPage && articleStore.index) {
    renderCards(articleStore.index);
  }

  // Re-render artículo (article.html)
  if (onArticlePage && currentArticleData) {
    renderArticlePage(currentArticleData);
  }

  // Re-render tarjetas guardadas (guardados.html)
  if (onSavedPage && articleStore.index) {
    renderSavedCards();
  }

  if (typeof updateLangUI === 'function') updateLangUI(lang);
  document.documentElement.lang = lang;
}

/* ═══════════════════════════════════════════════════
   RENDER DE TARJETAS (index.html + guardados.html)
═══════════════════════════════════════════════════ */
/* Artículos con tráiler: id → fichero de vídeo (botón ▶ en la portada). */
const videoMap = {
  'op-esclavitud':         '/videos/video-one-piece.mp4',
  'jjk-maldicion':         '/videos/video-jujutsu.mp4',
  'mha-heroes':            '/videos/video-boku-no-hero.mp4',
  'vinland-guerra':        '/videos/video-vinland.mp4',
  'aot-libertad':          '/videos/video-shingeki.mp4',
  'chainsaw-caos':         '/videos/video-chainsaw.mp4',
  'black-clover-voluntad': '/videos/video-black-clover.mp4'
};

/* ¿El artículo está guardado? (botón 🔖 del rail → localStorage saved_<id>). */
function isSaved(id) {
  try { return localStorage.getItem('saved_' + id) === '1'; } catch (e) { return false; }
}

/* Construye una tarjeta <a class="card"> a partir de un item de index.json.
   opts.removable añade el botón ✕ para quitarla de Guardados. */
function buildCard(item, opts) {
  opts = opts || {};
  const t = i18n[currentLang] || {};
  const a = document.createElement('a');
  a.className = 'card';
  a.href = articleHref(item.id);
  a.dataset.category = item.category;
  a.dataset.title = (item.title && item.title[currentLang]) || '';
  a.dataset.id = item.id;

  const thumb = item.thumb || {};
  const visual = thumb.type === 'img'
    ? `<img src="/${thumb.src}" alt="${thumb.alt || ''}" class="card-thumb-img" loading="lazy" decoding="async">`
    : (thumb.value || '');

  const title = (item.title && item.title[currentLang]) || '';
  const desc  = (item.desc  && item.desc[currentLang])  || '';
  const label = (item.label && item.label[currentLang]) || '';

  const playBtn = videoMap[item.id]
    ? `<button class="card-play-btn" aria-label="Ver vídeo"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>`
    : '';

  const removeBtn = opts.removable
    ? `<button class="card-remove" type="button" aria-label="${t.saved_remove || 'Quitar'}" title="${t.saved_remove || 'Quitar'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>`
    : '';

  a.innerHTML = `
    <div class="card-thumb ${thumb.class || ''}">${visual}${playBtn}${removeBtn}</div>
    <div class="card-body">
      <span class="card-tag">${item.category}</span>
      <h3>${title}</h3>
      <p>${desc}</p>
      <div class="card-meta"><span>${item.mins} ${t.read_min || ''}</span><span>${label}</span></div>
    </div>`;

  if (videoMap[item.id]) {
    a.querySelector('.card-play-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openVideoModal(videoMap[item.id]);
    });
  }

  if (opts.removable) {
    a.querySelector('.card-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      try { localStorage.setItem('saved_' + item.id, '0'); } catch (err) { /* noop */ }
      renderSavedCards();
    });
  }

  return a;
}

function renderCards(index) {
  const grid = document.getElementById('articles-grid');
  if (!grid) return;
  const noResults = document.getElementById('no-results');

  grid.innerHTML = '';
  if (noResults) grid.appendChild(noResults);

  index.forEach(item => grid.appendChild(buildCard(item)));

  filterCards();
}

/* ═══════════════════════════════════════════════════
   PÁGINA DE GUARDADOS (guardados.html)
   Pinta las tarjetas que el usuario marcó con 🔖 (localStorage saved_<id>).
═══════════════════════════════════════════════════ */
function renderSavedCards() {
  const grid = document.getElementById('saved-grid');
  if (!grid || !articleStore.index) return;
  const empty = document.getElementById('saved-empty');
  const countEl = document.getElementById('saved-count');

  const saved = articleStore.index.filter(it => isSaved(it.id));
  if (countEl) countEl.textContent = saved.length;

  grid.innerHTML = '';
  if (!saved.length) {
    if (empty) empty.hidden = false;
    grid.hidden = true;
    return;
  }
  if (empty) empty.hidden = true;
  grid.hidden = false;
  saved.forEach(item => grid.appendChild(buildCard(item, { removable: true })));
}

/* ═══════════════════════════════════════════════════
   FOCUS-TRAP LIGERO (modales): mantiene Tab dentro del
   contenedor mientras está abierto. Devuelve la limpieza.
═══════════════════════════════════════════════════ */
function trapFocus(container) {
  const SEL = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, video[controls], [tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key !== 'Tab') return;
    const items = Array.from(container.querySelectorAll(SEL))
      .filter(el => el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    if (!items.length) return;
    const first = items[0];
    const last  = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}

/* ═══════════════════════════════════════════════════
   VIDEO MODAL
═══════════════════════════════════════════════════ */
let vmodalLastFocus = null;
let untrapVmodal = null;

function openVideoModal(src) {
  const modal  = document.getElementById('vmodal');
  const video  = document.getElementById('vmodal-video');
  const splash = document.getElementById('earphone-splash');
  if (!modal || !video) return;

  video.src = src;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Foco al modal (y atrapado dentro) mientras esté abierto
  vmodalLastFocus = document.activeElement;
  untrapVmodal = trapFocus(modal);
  const vClose = document.getElementById('vmodal-close');
  if (vClose) vClose.focus();

  if (splash) {
    splash.classList.remove('ep-hidden', 'ep-exit', 'ep-visible');
    void splash.offsetWidth; // reflow para reiniciar animaciones
    splash.classList.add('ep-visible');

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      splash.removeEventListener('click', onSplashClick);
      splash.classList.remove('ep-visible');
      splash.classList.add('ep-exit');
      splash.addEventListener('animationend', () => {
        splash.classList.add('ep-hidden');
        splash.classList.remove('ep-exit');
        video.play().catch(() => {});
      }, { once: true });
    };

    const onSplashClick = () => { clearTimeout(splashTimer); dismiss(); };
    splash.addEventListener('click', onSplashClick);
    const splashTimer = setTimeout(dismiss, 3900);
  }
}

function closeVideoModal() {
  const modal  = document.getElementById('vmodal');
  const splash = document.getElementById('earphone-splash');
  if (!modal || modal.style.display === 'none') return; // ya cerrado (Escape global)
  const video = document.getElementById('vmodal-video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  if (splash) {
    splash.classList.add('ep-hidden');
    splash.classList.remove('ep-visible', 'ep-exit');
  }
  modal.style.display = 'none';
  document.body.style.overflow = '';
  if (untrapVmodal) { untrapVmodal(); untrapVmodal = null; }
  if (vmodalLastFocus && vmodalLastFocus.focus) vmodalLastFocus.focus();
  vmodalLastFocus = null;
}

(function () {
  const closeBtn  = document.getElementById('vmodal-close');
  const backdrop  = document.getElementById('vmodal-backdrop');
  const motivBtn  = document.getElementById('motiv-play-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
  if (backdrop) backdrop.addEventListener('click', closeVideoModal);
  if (motivBtn) motivBtn.addEventListener('click', () => openVideoModal('/videos/video-motivacion.mp4'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoModal();
  });
})();

/* ═══════════════════════════════════════════════════
   DROPDOWN DE IDIOMA
═══════════════════════════════════════════════════ */
const langMeta = {
  es: { fiClass: 'fi fi-es fis', name: 'Español' },
  en: { fiClass: 'fi fi-gb fis', name: 'English' },
  fr: { fiClass: 'fi fi-fr fis', name: 'Français' },
  ja: { fiClass: 'fi fi-jp fis', name: '日本語' },
  it: { fiClass: 'fi fi-it fis', name: 'Italiano' },
  de: { fiClass: 'fi fi-de fis', name: 'Deutsch' },
  ru: { fiClass: 'fi fi-ru fis', name: 'Русский' },
  pt: { fiClass: 'fi fi-pt fis', name: 'Português' }
};

const langDropdown = document.getElementById('lang-dropdown');
const langToggle   = document.getElementById('lang-toggle');
const langMenu     = document.getElementById('lang-menu');

if (langToggle && langMenu && langDropdown) {
  langToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = langDropdown.classList.toggle('open');
    langToggle.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', () => {
    langDropdown.classList.remove('open');
    langToggle.setAttribute('aria-expanded', 'false');
  });

  langMenu.addEventListener('click', (e) => e.stopPropagation());

  langMenu.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.lang;
      // En páginas prerenderizadas (SSG), cambiar de idioma NAVEGA a la URL hermana estática.
      // Guardamos el idioma antes de navegar para que la raíz / (adaptativa) lo respete al llegar.
      if (window.__PRERENDERED && window.__PRERENDERED.langUrls && window.__PRERENDERED.langUrls[lang]) {
        try { localStorage.setItem('lang', lang); } catch (e) { /* noop */ }
        window.location.href = window.__PRERENDERED.langUrls[lang];
        return;
      }
      applyLang(lang);
      langDropdown.classList.remove('open');
      langToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      langDropdown.classList.remove('open');
      langToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function updateLangUI(lang) {
  const meta = langMeta[lang];
  if (!meta) return;
  const flagEl = document.getElementById('lang-flag');
  const label  = document.getElementById('lang-label');
  // Swap the flag SVG class so the correct country flag shows
  if (flagEl) flagEl.innerHTML = `<span class="${meta.fiClass}"></span>`;
  if (label)  label.textContent = meta.name;
  if (langMenu) {
    langMenu.querySelectorAll('.lang-option').forEach(opt => {
      const isActive = opt.dataset.lang === lang;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-selected', isActive);
    });
  }
}

/* ═══════════════════════════════════════════════════
   SEARCH & FILTER (solo en index.html)
═══════════════════════════════════════════════════ */
/* Pliega acentos y mayúsculas para buscar ("Alejandría" → "alejandria") */
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/* Texto completo plegado por id — lo rellena el buscador (initSearchCmd) al cargar
   su índice; el filtro del grid lo usa para que ambos coincidan. */
let ftFoldedById = null;

let activeFilter = 'all';
let searchQuery  = '';

function filterCards() {
  const cards = document.querySelectorAll('#articles-grid .card');
  const noResults = document.getElementById('no-results');
  const term = document.getElementById('no-results-term');
  const fq = fold(searchQuery);
  let visible = 0;

  cards.forEach(card => {
    const cat   = card.dataset.category || '';
    const cardText = card.textContent.toLowerCase();

    const matchFilter = activeFilter === 'all' || cat === activeFilter;
    const matchSearch = fq === '' || fold(cardText).includes(fq) ||
      !!(ftFoldedById && ftFoldedById[card.dataset.id] && ftFoldedById[card.dataset.id].includes(fq));

    if (matchFilter && matchSearch) {
      card.style.display = '';
      visible++;
    } else {
      card.style.display = 'none';
    }
  });

  if (noResults) {
    if (visible === 0) {
      noResults.style.display = 'block';
      if (term) term.textContent = searchQuery || activeFilter;
    } else {
      noResults.style.display = 'none';
    }
  }
}

const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase().trim();
    filterCards();
  });
}

const filterChips = document.getElementById('filter-chips');
if (filterChips) {
  filterChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filterCards();
  });
}

/* ═══════════════════════════════════════════════════
   ARTICLE IMAGE HELPER
═══════════════════════════════════════════════════ */
function renderArticleImg(src, caption, type) {
  if (!src) return '';
  const isHero = type === 'hero';
  const imgCls = isHero ? 'article-img-hero-img'   : 'article-img-inline-img';
  const phCls  = isHero ? 'img-ph img-ph-hero'      : 'img-ph img-ph-inline';
  const label  = isHero ? 'Imagen principal'        : 'Imagen del artículo';
  const captionHtml = caption ? `<p class="article-img-caption">${caption}</p>` : '';
  const wrapCls = isHero ? 'article-img-block article-img-block-hero'
                         : 'article-img-block article-img-block-inline';
  // Hero = imagen principal (LCP en article.html): carga inmediata y prioritaria.
  // Inline = bajo el pliegue: carga diferida.
  const loadAttrs = isHero ? 'loading="eager" fetchpriority="high" decoding="async"'
                           : 'loading="lazy" decoding="async"';

  return `
    <div class="${wrapCls}">
      <img src="${src}" alt="${caption || ''}" class="${imgCls}" ${loadAttrs}
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="${phCls}" style="display:none;">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="img-ph-lbl">${label}</span>
        <span class="img-ph-path">${src}</span>
      </div>
      ${captionHtml}
    </div>`;
}

function pickLang(field, lang) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.es || field.en || '';
}

function applyMidImg(body, midHtml) {
  // Reemplaza solo la PRIMERA ocurrencia de {{MID_IMG}} con la imagen,
  // las demás se eliminan.
  return (body || '')
    .replace('{{MID_IMG}}', midHtml)
    .replace(/\{\{MID_IMG\}\}/g, '');
}

// Featured banner button
const featuredReadBtn = document.getElementById('featured-read-btn');
if (featuredReadBtn) {
  featuredReadBtn.addEventListener('click', () => { window.location.href = articleHref('op-obra'); });
}

/* ═══════════════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════════════ */
const themeToggle = document.getElementById('theme-toggle');
const iconSun  = document.querySelector('.icon-sun');
const iconMoon = document.querySelector('.icon-moon');

function applyTheme(isLight) {
  if (isLight) {
    document.body.classList.add('light-theme');
    if (iconSun)  iconSun.style.display  = 'block';
    if (iconMoon) iconMoon.style.display = 'none';
  } else {
    document.body.classList.remove('light-theme');
    if (iconSun)  iconSun.style.display  = 'none';
    if (iconMoon) iconMoon.style.display = 'block';
  }
}

const savedTheme = localStorage.getItem('theme');
applyTheme(savedTheme === 'light');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = !document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    applyTheme(isLight);
  });
}

/* ═══════════════════════════════════════════════════
   RULETA (solo en index.html)
═══════════════════════════════════════════════════ */
const btnRoulette     = document.getElementById('btn-roulette');
const rouletteOverlay = document.getElementById('roulette-overlay');
const rouletteWheel   = document.getElementById('roulette-wheel');
const btnSpin         = document.getElementById('btn-spin');
let isSpinning = false;
let rouletteItems = [];
let rouletteLastFocus = null;
let untrapRoulette = null;

function openRoulette() {
  if (!rouletteOverlay || !rouletteWheel) return;
  rouletteOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Foco al modal (y atrapado dentro) mientras esté abierto
  rouletteLastFocus = document.activeElement;
  untrapRoulette = trapFocus(rouletteOverlay);
  if (btnSpin) btnSpin.focus();

  if (rouletteWheel.innerHTML === '' && articleStore.index) {
    rouletteItems = articleStore.index.map(it => it.id);
    const numItems = rouletteItems.length;
    const sliceAngle = 360 / numItems;
    let html = '';
    let gradientParts = [];
    const colors = ['#2176ae', '#e63946', '#f0b429', '#0c1226'];

    rouletteItems.forEach((id, index) => {
      const item = articleStore.index.find(it => it.id === id);
      const animeName = item ? item.category : id;
      const textRotation = (index * sliceAngle) + (sliceAngle / 2);
      html += `<div class="roulette-item" style="transform: rotate(${textRotation}deg);">${animeName}</div>`;
      let color = colors[index % colors.length];
      if (index === numItems - 1 && color === colors[0]) color = colors[1];
      gradientParts.push(`${color} ${index * sliceAngle}deg ${(index + 1) * sliceAngle}deg`);
    });

    rouletteWheel.innerHTML = html;
    rouletteWheel.style.background = `conic-gradient(from 90deg, ${gradientParts.join(', ')})`;
    rouletteWheel.dataset.rotation = "0";
  }
  rouletteWheel.style.transition = 'none';
  rouletteWheel.style.transform = `rotate(${rouletteWheel.dataset.rotation || 0}deg)`;
}

function closeRoulette() {
  if (isSpinning) return;
  if (!rouletteOverlay || !rouletteOverlay.classList.contains('open')) return;
  rouletteOverlay.classList.remove('open');
  document.body.style.overflow = '';
  if (untrapRoulette) { untrapRoulette(); untrapRoulette = null; }
  if (rouletteLastFocus && rouletteLastFocus.focus) rouletteLastFocus.focus();
  rouletteLastFocus = null;
}

function closeRouletteOnOverlay(e) {
  if (e.target === rouletteOverlay) closeRoulette();
}

window.closeRoulette = closeRoulette;
window.closeRouletteOnOverlay = closeRouletteOnOverlay;

if (btnRoulette) {
  btnRoulette.addEventListener('click', () => openRoulette());
}

// Escape cierra la ruleta (como el resto de modales); closeRoulette ignora si está girando
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && rouletteOverlay && rouletteOverlay.classList.contains('open')) closeRoulette();
});

if (btnSpin && rouletteWheel) {
  btnSpin.addEventListener('click', () => {
    if (isSpinning) return;
    isSpinning = true;
    btnSpin.disabled = true;

    const itemsCount = rouletteItems.length;
    const sliceAngle = 360 / itemsCount;
    const randomItemIndex = Math.floor(Math.random() * itemsCount);

    const textRotation = (randomItemIndex * sliceAngle) + (sliceAngle / 2);
    const currentRotation = parseFloat(rouletteWheel.dataset.rotation || "0");
    const spins = 5;

    let offset = 270 - textRotation - (currentRotation % 360);
    if (offset < 0) offset += 360;
    const targetRotation = currentRotation + (360 * spins) + offset;

    const randomOffset = (Math.random() * (sliceAngle * 0.6)) - (sliceAngle * 0.3);
    const finalRotation = targetRotation + randomOffset;

    rouletteWheel.dataset.rotation = finalRotation.toString();
    rouletteWheel.style.transition = 'transform 2.5s cubic-bezier(0.1, 0.7, 0.1, 1)';
    rouletteWheel.style.transform = `rotate(${finalRotation}deg)`;

    setTimeout(() => {
      isSpinning = false;
      btnSpin.disabled = false;
      const id = rouletteItems[randomItemIndex];
      setTimeout(() => {
        closeRoulette();
        window.location.href = articleHref(id);
      }, 1500);
    }, 2800);
  });
}

/* ═══════════════════════════════════════════════════
   PÁGINA DE ARTÍCULO INDIVIDUAL (article.html)
═══════════════════════════════════════════════════ */
let currentArticleData = null;

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ─────────────────────────────────────────────
   SEO dinámico para article.html
   - Actualiza meta tags Open Graph, Twitter, canonical y description
   - Se llama cada vez que se renderiza el artículo (carga + cambio de idioma)
   - No duplica tags: si existen, actualiza el content; si no, los crea
───────────────────────────────────────────── */
function updateArticleSEO(data, lang) {
  const SITE_URL = 'https://ualjlf259.github.io';
  const localeMap = {
    es: 'es_ES', en: 'en_US', fr: 'fr_FR', ja: 'ja_JP',
    de: 'de_DE', it: 'it_IT', ru: 'ru_RU', pt: 'pt_PT'
  };

  const title    = pickLang(data.title, lang);
  const rawDesc  = pickLang(data.desc,  lang);
  const desc     = (rawDesc && rawDesc.trim())
                     ? rawDesc
                     : (pickLang(data.tag, lang) || title);
  const imageUrl = `${SITE_URL}/${data.image}`;
  // Canonical = la página SSG limpia (esta ruta SPA es solo respaldo si fallara la redirección)
  const pageUrl  = lang === 'es'
    ? `${SITE_URL}/articulos/${encodeURIComponent(data.id)}/`
    : `${SITE_URL}/articulos/${encodeURIComponent(data.id)}/${lang}/`;
  const locale   = localeMap[lang] || 'es_ES';

  const setMeta = (attr, value, content) => {
    let el = document.head.querySelector(`meta[${attr}="${value}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, value);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setCanonical = (href) => {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  setMeta('name', 'description', desc);
  setCanonical(pageUrl);

  setMeta('property', 'og:title',       title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:image',       imageUrl);
  setMeta('property', 'og:url',         pageUrl);
  setMeta('property', 'og:locale',      locale);

  setMeta('name', 'twitter:title',       title);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image',       imageUrl);
  setMeta('name', 'twitter:url',         pageUrl);

  document.documentElement.setAttribute('lang', lang);

  // JSON-LD (Schema.org BlogPosting) — datos estructurados para Google
  const ldData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": desc,
    "image": imageUrl,
    "url": pageUrl,
    "author": {
      "@type": "Person",
      "name": "Jose Jesus Lopez Fernandez"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nakama Blog",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/img/pwa/icon-512.png`
      }
    },
    "inLanguage": lang,
    "mainEntityOfPage": pageUrl
  };
  if (data.date) { ldData.datePublished = data.date; ldData.dateModified = data.date; }

  let ldScript = document.getElementById('article-jsonld');
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id = 'article-jsonld';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(ldData);
}

function renderArticlePage(data) {
  if (!onArticlePage) return;
  const lang = currentLang;
  const t = i18n[lang] || {};

  const title = pickLang(data.title,   lang);
  const desc  = pickLang(data.desc,    lang);
  const meta  = pickLang(data.meta,    lang);
  const label = pickLang(data.label,   lang);
  const body  = pickLang(data.content, lang);

  const g = id => document.getElementById(id);

  // Dos tags: categoría (rosa) + tema/label (cian)
  if (g('article-tags')) {
    g('article-tags').innerHTML =
      `<span class="atag atag-cat">${data.category}</span>` +
      (label ? `<span class="atag atag-topic">${label}</span>` : '');
  }

  // Título con realce en degradado de la parte tras ':' o guión
  if (g('article-title')) g('article-title').innerHTML = emphasizeTitle(title);

  // Subtítulo (extracto)
  if (g('article-sub')) g('article-sub').textContent = desc || '';

  // Fila de autor: avatar + nombre + tiempo de lectura (1er campo del meta)
  if (g('article-author')) {
    const readTime = (meta || '').split('·')[0].trim();
    g('article-author').innerHTML =
      '<img class="article-author-avatar" src="img/articles/sobre-mi-avatar.jpg" alt="" loading="lazy" decoding="async">' +
      '<div class="article-author-info">' +
        '<span class="article-author-name">Jose Jesus Lopez Fernandez</span>' +
        (readTime ? '<span class="article-author-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>' + readTime + '</span>' : '') +
      '</div>';
  }

  // Hero
  if (g('article-img-top')) g('article-img-top').innerHTML = renderArticleImg(data.image, data.image_caption, 'hero');

  // Cuerpo
  const midHtml = renderArticleImg(data.image_mid, data.image_mid_caption, 'inline');
  if (g('article-body')) g('article-body').innerHTML = applyMidImg(body, midHtml);

  // Pie: tags hashtag (#categoría #tema) + compartir
  if (g('article-foot')) {
    const hash = s => '#' + String(s || '').replace(/[\s!¡?¿.·]/g, '');
    g('article-foot').innerHTML =
      '<div class="article-foot-tags">' +
        `<span class="ftag">${hash(data.category)}</span>` +
        (label ? `<span class="ftag">${hash(label)}</span>` : '') +
      '</div>' +
      '<button class="article-share-btn" id="article-share-btn" type="button">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>' +
        (t.share_label || 'Compartir') +
      '</button>';
    const sb = g('article-share-btn');
    if (sb) sb.onclick = shareArticle;
  }

  document.title = `${title} — Nakama Blog`;
  updateArticleSEO(data, lang);

  // Estado y acciones de la barra lateral
  setupArticleRail(data.id);
}

/* Realza en degradado la parte del título tras el primer ':' o ' – ' */
function emphasizeTitle(title) {
  if (!title) return '';
  const m = /[:：]|\s[–—-]\s/.exec(title);
  if (!m || m.index < 3 || m.index > title.length - 4) return title;
  const cut = m.index + m[0].length;
  return title.slice(0, cut) + ' <span class="article-title-em">' + title.slice(cut).trim() + '</span>';
}

/* Barra de acciones: me gusta / guardar (persisten en localStorage) + compartir */
function setupArticleRail(id) {
  const bind = (btn, key) => {
    if (!btn) return;
    const isOn = () => { try { return localStorage.getItem(key) === '1'; } catch (e) { return false; } };
    const paint = on => { btn.classList.toggle('is-active', on); btn.setAttribute('aria-pressed', on); };
    paint(isOn());
    btn.onclick = () => {
      const now = !isOn();
      try { localStorage.setItem(key, now ? '1' : '0'); } catch (e) {}
      paint(now);
      if (now) { btn.classList.remove('is-pop'); void btn.offsetWidth; btn.classList.add('is-pop'); }
    };
  };
  bind(document.getElementById('rail-like'), 'liked_' + id);
  bind(document.getElementById('rail-save'), 'saved_' + id);
  const share = document.getElementById('rail-share');
  if (share) share.onclick = shareArticle;
}

/* Compartir: Web Share API nativa o copiar enlace con toast de respaldo */
function shareArticle() {
  const url = window.location.href;
  const t = i18n[currentLang] || {};
  const title = currentArticleData ? pickLang(currentArticleData.title, currentLang) : document.title;
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => articleToast(t.share_copied || '¡Copiado!')).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); articleToast(t.share_copied || '¡Copiado!'); } catch (e) {}
    document.body.removeChild(ta);
  }
}

function articleToast(msg) {
  const el = document.createElement('div');
  el.className = 'article-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-show'));
  setTimeout(() => { el.classList.remove('is-show'); setTimeout(() => el.remove(), 300); }, 1800);
}

/* Cablea los botones de compartir que copian al portapapeles (Discord / enlace) en las páginas SSG. */
function wireShareCopy() {
  const t = i18n[currentLang] || {};
  document.querySelectorAll('[data-share-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = window.location.href;
      const done = () => {
        btn.classList.add('is-copied');
        articleToast(t.share_copied || '¡Copiado!');
        setTimeout(() => btn.classList.remove('is-copied'), 1600);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(done).catch(done);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  });
}

/* ═══════════════════════════════════════════════════
   EXPERIENCIA DE LECTURA (solo páginas de artículo):
   barra de progreso, índice (TOC) con sección activa y botón "volver arriba".
═══════════════════════════════════════════════════ */
const TOC_TITLE = { es: 'En este artículo', en: 'In this article', fr: 'Dans cet article', ja: 'この記事の内容', it: 'In questo articolo', de: 'In diesem Artikel', ru: 'В этой статье', pt: 'Neste artigo' };
const TOP_LABEL = { es: 'Volver arriba', en: 'Back to top', fr: 'Haut de page', ja: 'トップへ戻る', it: 'Torna su', de: 'Nach oben', ru: 'Наверх', pt: 'Voltar ao topo' };

function initReadingExperience() {
  const articleBody = document.getElementById('article-body');
  if (!articleBody) return; // solo en páginas de artículo
  const wrap = document.querySelector('.article-page-wrap');
  const t = i18n[currentLang] || {};

  // 1. Barra de progreso de lectura (arriba)
  const bar = document.createElement('div');
  bar.className = 'reading-progress';
  document.body.appendChild(bar);

  // 2. Botón "volver arriba"
  const toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', TOP_LABEL[currentLang] || TOP_LABEL.es);
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(toTop);

  // 3. Índice (TOC) a partir de los <h3> (asigna IDs en caliente)
  const heads = Array.from(articleBody.querySelectorAll('h3'));
  let toc = null;
  if (heads.length >= 3 && wrap) {
    const used = {};
    const slug = (txt) => {
      let s = String(txt || '').toLowerCase().normalize('NFD')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sec';
      if (used[s]) { const n = used[s]++; s += '-' + n; } else { used[s] = 1; }
      return s;
    };
    toc = document.createElement('nav');
    toc.className = 'article-toc';
    toc.setAttribute('aria-label', TOC_TITLE[currentLang] || TOC_TITLE.es);
    const ul = document.createElement('ul');
    heads.forEach((h) => {
      if (!h.id) h.id = slug(h.textContent);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + h.id);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    const title = document.createElement('span');
    title.className = 'article-toc-title';
    title.textContent = TOC_TITLE[currentLang] || TOC_TITLE.es;
    toc.appendChild(title);
    toc.appendChild(ul);
    wrap.appendChild(toc);

    // Sección activa con IntersectionObserver
    const links = new Map();
    toc.querySelectorAll('a').forEach((a) => links.set(a.getAttribute('href').slice(1), a));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const a = links.get(en.target.id);
        if (!a) return;
        toc.querySelectorAll('a.is-active').forEach((x) => x.classList.remove('is-active'));
        a.classList.add('is-active');
      });
    }, { rootMargin: '-18% 0px -72% 0px', threshold: 0 });
    heads.forEach((h) => spy.observe(h));
  }

  // 4. Scroll: progreso + visibilidad del botón
  let ticking = false;
  const update = () => {
    const el = document.documentElement;
    const max = (el.scrollHeight - el.clientHeight) || 1;
    const p = Math.min(1, Math.max(0, (window.scrollY || el.scrollTop) / max));
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    toTop.classList.toggle('is-show', (window.scrollY || el.scrollTop) > 600);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();
}

function showArticleError(message) {
  const root = document.getElementById('article-root');
  if (!root) return;
  root.innerHTML = `<div class="article-error">
    <h2>Artículo no disponible</h2>
    <p>${message}</p>
    <p style="margin-top:1.5rem;"><a href="index.html#articulos" class="btn btn-primary">Volver</a></p>
  </div>`;
}

async function initArticlePage() {
  // Página prerenderizada (SSG): el contenido ya está en el HTML. No re-renderizar;
  // solo cablear la barra de acciones + el botón de compartir del pie.
  if (window.__PRERENDERED) {
    setupArticleRail(window.__PRERENDERED.id);
    wireShareCopy();
    initReadingExperience();
    return;
  }
  const id = getQueryParam('id');
  if (!id) {
    showArticleError('No se ha indicado ningún artículo (?id=).');
    return;
  }
  try {
    const data = await loadArticle(id);
    currentArticleData = data;
    renderArticlePage(data);
    initReadingExperience();
  } catch (err) {
    console.error(err);
    showArticleError(`No se encontró el artículo "${id}".`);
  }
}

/* ═══════════════════════════════════════════════════
   ARRANQUE
═══════════════════════════════════════════════════ */
(async function init() {
  applyLang(currentLang);

  if (onIndexPage) {
    try {
      const index = await loadArticleIndex();
      renderCards(index);
    } catch (err) {
      console.error('Error cargando articles/index.json:', err);
    }
  }

  if (onArticlePage) {
    await initArticlePage();
  }

  if (onSavedPage) {
    try {
      await loadArticleIndex();
      renderSavedCards();
    } catch (err) {
      console.error('Error cargando articles/index.json:', err);
    }
  }
})();

/* ═══════════════════════════════════════════════════
   PWA: registro del service worker (sw.js, ámbito raíz).
   Solo corre en contextos seguros (https / localhost); en file:// no hace nada.
═══════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sin PWA, la web sigue igual */ });
  });
}

// Easter Eggs gestionados por easter-eggs/easter-eggs.js

/* ═══════════════════════════════════════════════════
   WELCOME MODAL (bienvenida)
   El contenido va en el DOM (no bloquea SEO); el modal es una capa.
   La intro/preloader (initBrandScreen) decide cuándo abrirlo en la 1ª visita;
   también lo reabre el enlace "Ver intro" del footer.
═══════════════════════════════════════════════════ */
let openOnboardingModal = null; // lo asigna initWelcome; lo usa initBrandScreen
(function initWelcome() {
  const overlay = document.getElementById('welcome-overlay');
  if (!overlay || !onIndexPage) return;

  const SEEN_KEY = 'welcome_seen';
  const startBtn = document.getElementById('welcome-start');
  const diceBtn  = document.getElementById('welcome-dice');
  const closeBtn = document.getElementById('welcome-close');
  let lastFocus = null;
  let untrap = null;

  function closeWelcome() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* noop */ }
    if (untrap) { untrap(); untrap = null; }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openWelcome() {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    untrap = trapFocus(overlay);
    if (startBtn) startBtn.focus();
  }
  openOnboardingModal = openWelcome;

  if (closeBtn) closeBtn.addEventListener('click', closeWelcome);
  if (startBtn) startBtn.addEventListener('click', () => {
    closeWelcome();
    const el = document.getElementById('articulos');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  if (diceBtn) diceBtn.addEventListener('click', () => {
    closeWelcome();
    if (typeof openRoulette === 'function') openRoulette();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWelcome(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeWelcome();
  });

})();

/* ═══════════════════════════════════════════════════
   PRELOADER + INTRO CINEMÁTICA (todas las páginas)
   El overlay .intro-cine es visible desde el 1er pintado (loader) mientras carga
   la página; se desvanece cuando la app está lista. En la 1ª visita del HOME actúa
   además de intro y encadena con el welcome modal (openOnboardingModal). Reabrible
   en el home con "Ver intro" del footer. CSS en styles.css (.intro-cine*, is-run/is-hidden).
═══════════════════════════════════════════════════ */
(function initBrandScreen() {
  const overlay = document.getElementById('intro-cine');
  if (!overlay) return;
  const SEEN_KEY = 'welcome_seen';
  const skipBtn = document.getElementById('intro-cine-skip');
  const replay  = document.getElementById('intro-replay');
  const REDUCE  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seen = false;
  try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { /* noop */ }

  let timers = [];
  let done = false;
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  // Oculta el overlay (fundido) y ejecuta `then` al acabar. Idempotente.
  function hide(then) {
    if (done) return;
    done = true;
    clearTimers();
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = ''; // desbloquea el scroll ya (el overlay deja de interceptar)
    overlay.setAttribute('aria-hidden', 'true'); // solo cuando deja de verse (contiene un botón enfocable)
    overlay.classList.add('is-hidden');
    timers.push(setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('is-hidden', 'is-intro');
      if (typeof then === 'function') then();
    }, REDUCE ? 60 : 560));
  }
  function reveal() { hide(() => { document.body.style.overflow = ''; }); }
  function toModal() {
    hide(() => {
      if (typeof openOnboardingModal === 'function') openOnboardingModal();
      else document.body.style.overflow = '';
    });
  }

  let endFn = reveal; // se ajusta según el modo (loader → reveal, intro → toModal)
  function onKey(e) { if (e.key === 'Escape') endFn(); }

  // Reproduce la intro de nuevo (enlace "Ver intro"): reinicia animaciones y encadena al modal.
  function playIntro() {
    done = false;
    clearTimers();
    endFn = toModal;
    overlay.style.display = 'flex';
    overlay.removeAttribute('aria-hidden');
    overlay.classList.remove('is-hidden', 'is-wait');
    overlay.classList.add('is-intro');
    overlay.classList.remove('is-run');
    void overlay.offsetWidth; // reflow: reinicia las animaciones de entrada
    overlay.classList.add('is-run');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    timers.push(setTimeout(toModal, REDUCE ? 1200 : 4200));
  }

  if (skipBtn) skipBtn.addEventListener('click', (e) => { e.stopPropagation(); endFn(); });
  overlay.addEventListener('click', () => { if (overlay.classList.contains('is-intro')) toModal(); });
  if (replay) replay.addEventListener('click', playIntro);

  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKey);

  if (onIndexPage && !seen) {
    // 1ª visita del home: el loader ES la intro → al terminar abre el welcome modal.
    // (el script inline ya quitó is-wait al no haber welcome_seen; esto es cinturón y tirantes)
    endFn = toModal;
    overlay.classList.remove('is-wait');
    overlay.classList.add('is-intro');
    timers.push(setTimeout(toModal, REDUCE ? 1200 : 4200));
  } else {
    // Loader "solo si tarda": el script inline lo revela a los ~300 ms si la carga sigue en curso.
    // Si nunca llegó a verse (is-wait), se retira sin mínimo; si se vio, un mínimo digno.
    endFn = reveal;
    const minDelay = () => (overlay.classList.contains('is-wait') ? 0 : (REDUCE ? 250 : 350));
    if (document.readyState === 'complete') {
      timers.push(setTimeout(reveal, minDelay()));
    } else {
      window.addEventListener('load', () => { timers.push(setTimeout(reveal, minDelay())); }, { once: true });
    }
    timers.push(setTimeout(reveal, REDUCE ? 1200 : 4000)); // salvaguarda
  }
})();

/* ═══════════════════════════════════════════════════
   NAV: transparente sobre el hero, sólida al hacer scroll
   (solo en páginas con hero; en article.html la nav no lleva .at-hero)
═══════════════════════════════════════════════════ */
(function navOnScroll() {
  const nav = document.querySelector('nav');
  const hero = document.querySelector('.hero');
  if (!nav || !hero || !nav.classList.contains('at-hero')) return;

  let ticking = false;
  function update() {
    const threshold = hero.offsetHeight - nav.offsetHeight - 40;
    nav.classList.toggle('at-hero', window.scrollY <= threshold);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

/* ═══════════════════════════════════════════════════
   BUSCADOR command-palette: Ctrl/⌘+K, resultados instantáneos,
   iluminación que sigue al cursor y placeholder dinámico.
   (No reemplaza el filtrado del grid; lo complementa.)
═══════════════════════════════════════════════════ */
(function initSearchCmd() {
  if (!onIndexPage) return;
  const cmd     = document.getElementById('search-cmd');
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!cmd || !input || !results) return;
  const card = cmd.querySelector('.search-cmd-card');
  const kbd  = document.getElementById('search-kbd');

  /* ── Atajo Ctrl/⌘ + K ── */
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
  if (kbd && kbd.firstElementChild) kbd.firstElementChild.textContent = isMac ? '⌘' : 'Ctrl';
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  /* ── Iluminación que sigue al cursor ── */
  if (card) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }

  /* ── Índice de TEXTO COMPLETO (build: scripts/generate-search-index.js) ──
     Se carga perezosamente al primer uso; permite buscar DENTRO del contenido
     de los 18 artículos (con snippet resaltado) además de título/desc/categoría. */
  let ftIndex = null;   // entradas {id,title,cat,mins,thumb,text} del idioma actual
  let ftNorm = null;    // copias plegadas (minúsculas sin acentos) para comparar
  let ftLoading = null;

  const escSnip = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function loadFtIndex() {
    if (ftIndex || ftLoading) return;
    ftLoading = fetch(`/articles/search/${currentLang}.json`)
      .then((r) => { if (!r.ok) throw new Error('sin índice'); return r.json(); })
      .then((data) => {
        ftIndex = data;
        ftNorm = data.map((e) => ({ title: fold(e.title), text: fold(e.text) }));
        // Comparte el texto plegado con el filtro del grid (ftFoldedById, nivel módulo)
        ftFoldedById = {};
        data.forEach((e, i) => { ftFoldedById[e.id] = ftNorm[i].text; });
        // Si el usuario ya escribió algo, re-lanza búsqueda y filtro con el índice cargado
        if (!results.hidden && input.value.trim()) open(search(input.value));
        if (searchQuery) filterCards();
      })
      .catch(() => { ftIndex = []; ftNorm = []; }); // sin índice → sigue la búsqueda de metadatos
  }

  /* Snippet con el término resaltado (posición sobre el texto plegado ≈ original) */
  function makeSnippet(text, pos, len) {
    const start = Math.max(0, pos - 44);
    const end = Math.min(text.length, pos + len + 64);
    const pre = (start > 0 ? '…' : '') + text.slice(start, pos);
    const hit = text.slice(pos, pos + len);
    const post = text.slice(pos + len, end) + (end < text.length ? '…' : '');
    return escSnip(pre) + '<mark>' + escSnip(hit) + '</mark>' + escSnip(post);
  }

  /* ── Resultados instantáneos ── */
  let current = [];
  let activeIdx = -1;

  function search(q) {
    const idx = articleStore.index || [];
    const term = (q || '').trim();
    if (!term) return [];
    const nterm = fold(term);
    const out = [];
    const seen = {};

    // 1) Metadatos (título/desc/categoría) del índice de tarjetas — instantáneo
    idx.forEach((it) => {
      const title = pickLang(it.title, currentLang) || '';
      const desc = pickLang(it.desc, currentLang) || '';
      const cat = it.category || '';
      if (fold(title).includes(nterm) || fold(desc).includes(nterm) || fold(cat).includes(nterm)) {
        seen[it.id] = 1;
        out.push({ id: it.id, title, cat, mins: it.mins, thumb: (it.thumb && it.thumb.src) || '' });
      }
    });

    // 2) Texto completo (se carga al primer uso; incluye artículos sin tarjeta como op-obra)
    if (!ftIndex) loadFtIndex();
    if (ftIndex && ftNorm) {
      ftIndex.forEach((e, i) => {
        if (seen[e.id]) return;
        const n = ftNorm[i];
        const pos = n.text.indexOf(nterm);
        if (pos === -1 && !n.title.includes(nterm)) return;
        out.push({
          id: e.id, title: e.title, cat: e.cat, mins: e.mins, thumb: e.thumb,
          snip: pos !== -1 ? makeSnippet(e.text, pos, nterm.length) : '',
        });
      });
    }
    return out.slice(0, 8);
  }

  function render() {
    const t = i18n[currentLang] || {};
    if (!current.length) {
      results.innerHTML = `<div class="search-result-empty">${t.no_results || 'Sin resultados'}</div>`;
    } else {
      results.innerHTML = current.map((it, i) => {
        const thumb = it.thumb
          ? `<img src="/${it.thumb}" alt="" loading="lazy" decoding="async">` : '';
        const minsTx = (it.mins !== '' && it.mins != null) ? `<span>${it.mins} ${t.read_min || ''}</span>` : '';
        return `<a class="search-result${i === activeIdx ? ' is-active' : ''}" role="option"
          data-id="${it.id}" href="${articleHref(it.id)}">
          <span class="search-result-thumb">${thumb}</span>
          <span class="search-result-main">
            <span class="search-result-title">${it.title}</span>
            ${it.snip ? `<span class="search-result-snip">${it.snip}</span>` : ''}
            <span class="search-result-meta"><span class="search-result-cat">${it.cat}</span>${minsTx}</span>
          </span>
        </a>`;
      }).join('');
    }
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function open(list) { current = list; activeIdx = -1; render(); }
  function close() {
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    activeIdx = -1;
  }
  function go(id) {
    close();
    window.location.href = articleHref(id);
  }

  input.addEventListener('input', () => {
    const q = input.value;
    if (!q.trim()) { close(); return; }
    open(search(q));
  });
  input.addEventListener('focus', () => {
    const t = i18n[currentLang] || {};
    if (t.search_placeholder) input.placeholder = t.search_placeholder;
    loadFtIndex(); // precarga el índice full-text al enfocar (antes de la 1ª tecla)
    if (input.value.trim()) open(search(input.value));
  });

  input.addEventListener('keydown', (e) => {
    if (results.hidden || !current.length) {
      if (e.key === 'Escape') { close(); input.blur(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, current.length - 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); render(); }
    else if (e.key === 'Enter' && activeIdx >= 0 && current[activeIdx]) { e.preventDefault(); go(current[activeIdx].id); }
    else if (e.key === 'Escape') { close(); input.blur(); }
  });

  results.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('.search-result');
    if (!a) return;
    e.preventDefault();
    go(a.dataset.id);
  });

  document.addEventListener('click', (e) => {
    if (!cmd.contains(e.target)) close();
  });

  /* ── Placeholder dinámico (typewriter; estático si reduced-motion) ── */
  const LEAD = { es: 'Busca', en: 'Search', fr: 'Cherche', ja: '検索:', it: 'Cerca', de: 'Suche', ru: 'Найти', pt: 'Busca' };
  const SAMPLES = ['One Piece', 'Vinland Saga', 'Hunter x Hunter', 'Berserk', 'Chainsaw Man'];
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let phTimer = null, phSi = 0, phCi = 0, phDir = 1;

  function phFull() { return `${LEAD[currentLang] || LEAD.es} "${SAMPLES[phSi % SAMPLES.length]}"…`; }
  function phTick() {
    if (document.activeElement === input || input.value) { phTimer = setTimeout(phTick, 800); return; }
    const full = phFull();
    phCi += phDir;
    input.placeholder = full.slice(0, phCi);
    let delay = phDir > 0 ? 60 : 26;
    if (phCi >= full.length) { phDir = -1; delay = 1500; }
    else if (phCi <= 0) { phDir = 1; phSi++; delay = 420; }
    phTimer = setTimeout(phTick, delay);
  }
  if (!reduceMotion) phTimer = setTimeout(phTick, 1400);
})();
