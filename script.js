/* ═══════════════════════════════════════════════════
   TRANSLATIONS — UI strings desde locales/*.js
═══════════════════════════════════════════════════ */
const i18n = {
  es: window.LANG_ES,
  en: window.LANG_EN,
  fr: window.LANG_FR,
  ja: window.LANG_JA
};

const SUPPORTED_LANGS = ['es', 'en', 'fr', 'ja'];

function detectInitialLang() {
  const saved = localStorage.getItem('lang');
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : 'es';
}

let currentLang = detectInitialLang();

/* ═══════════════════════════════════════════════════
   ARTICLE STORE
═══════════════════════════════════════════════════ */
const articleStore = {
  index: null,
  full: {},
};

async function loadArticleIndex() {
  if (articleStore.index) return articleStore.index;
  const res = await fetch('articles/index.json');
  if (!res.ok) throw new Error('No se pudo cargar articles/index.json');
  articleStore.index = await res.json();
  return articleStore.index;
}

async function loadArticle(id) {
  if (articleStore.full[id]) return articleStore.full[id];
  const res = await fetch(`articles/${id}.json`);
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

/* ═══════════════════════════════════════════════════
   APLICAR IDIOMA
═══════════════════════════════════════════════════ */
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  const t = i18n[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  const si = document.getElementById('search-input');
  if (si && t.search_placeholder) si.placeholder = t.search_placeholder;

  // Hero
  const ey = document.querySelector('.hero-eyebrow');
  if (ey && t.hero_eyebrow) ey.innerHTML = t.hero_eyebrow;
  const h1 = document.querySelector('.hero h1');
  if (h1 && t.hero_h1) h1.innerHTML = t.hero_h1;
  const hs = document.querySelector('.hero-sub');
  if (hs && t.hero_sub) hs.innerHTML = t.hero_sub;
  const ctaBtns = document.querySelectorAll('.hero-cta .btn');
  if (ctaBtns[0] && t.btn_read)     ctaBtns[0].textContent = t.btn_read;
  if (ctaBtns[1] && t.btn_roulette) ctaBtns[1].textContent = t.btn_roulette;
  if (ctaBtns[2] && t.btn_about)    ctaBtns[2].textContent = t.btn_about;

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
  const rankingEmojis = ['⚓','✨','🪓','⚔️','🍃','📓','👁️','💥','🐉'];
  const rankBars = [100,91,85,80,74,68,62,56,50];
  const rankClasses = ['rank-1','rank-2','rank-3','rank-other','rank-other','rank-other','rank-other','rank-other','rank-other'];
  const rankingList = document.querySelector('.ranking-list');
  if (rankingList && t.ranking_items) {
    rankingList.innerHTML = t.ranking_items.map((item, i) => `
      <div class="ranking-item">
        <span class="rank-num ${rankClasses[i]}">${i+1}</span>
        <span class="rank-emoji">${rankingEmojis[i]}</span>
        <div class="rank-info">
          <strong>${item.name}</strong>
          <span>${item.desc}</span>
        </div>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:${rankBars[i]}%"></div></div>
      </div>`).join('');
  }

  // About
  const at = document.querySelector('#sobre-mi .section-header h2');
  if (at && t.about_title) at.textContent = t.about_title;
  const as_ = document.querySelector('#sobre-mi .section-header span');
  if (as_ && t.about_sub) as_.textContent = t.about_sub;
  const aboutTextDiv = document.querySelector('.about-text-content');
  if (aboutTextDiv && t.about_p1) {
    aboutTextDiv.innerHTML = `
      <h3>${t.about_h3 || 'Jose Jesus Lopez Fernandez'}</h3>
      <p>${t.about_p1}</p>
      <p>${t.about_p2}</p>
      <p>${t.about_p3}</p>
      <p style="margin-top:1.2rem;"><a href="https://github.com/ualjlf259" style="color:var(--gold);text-decoration:none;font-size:.85rem;letter-spacing:.05em;font-weight:600;">→ GitHub: ualjlf259</a></p>`;
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

  // Re-render modal si está abierto
  if (onIndexPage && currentModalData) {
    fillModal(currentModalData, lang);
  }

  // Re-render artículo (article.html)
  if (onArticlePage && currentArticleData) {
    renderArticlePage(currentArticleData);
  }

  if (typeof updateLangUI === 'function') updateLangUI(lang);
  document.documentElement.lang = lang;
}

/* ═══════════════════════════════════════════════════
   RENDER DE TARJETAS (index.html)
═══════════════════════════════════════════════════ */
function renderCards(index) {
  const grid = document.getElementById('articles-grid');
  if (!grid) return;
  const t = i18n[currentLang] || {};
  const noResults = document.getElementById('no-results');

  grid.innerHTML = '';
  if (noResults) grid.appendChild(noResults);

  index.forEach(item => {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = '#';
    a.dataset.category = item.category;
    a.dataset.title = (item.title && item.title[currentLang]) || '';
    a.dataset.id = item.id;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openArticle(item.id);
    });

    const thumb = item.thumb || {};
    const visual = thumb.type === 'img'
      ? `<img src="${thumb.src}" alt="${thumb.alt || ''}" class="card-thumb-img">`
      : (thumb.value || '');

    const title = (item.title && item.title[currentLang]) || '';
    const desc  = (item.desc  && item.desc[currentLang])  || '';
    const label = (item.label && item.label[currentLang]) || '';

    a.innerHTML = `
      <div class="card-thumb ${thumb.class || ''}">${visual}</div>
      <div class="card-body">
        <span class="card-tag">${item.category}</span>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="card-meta"><span>${item.mins} ${t.read_min || ''}</span><span>${label}</span></div>
      </div>`;
    grid.appendChild(a);
  });

  filterCards();
}

/* ═══════════════════════════════════════════════════
   DROPDOWN DE IDIOMA
═══════════════════════════════════════════════════ */
const langMeta = {
  es: { flag: '🇪🇸', name: 'Español' },
  en: { flag: '🇬🇧', name: 'English' },
  fr: { flag: '🇫🇷', name: 'Français' },
  ja: { flag: '🇯🇵', name: '日本語' }
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
  const flag  = document.getElementById('lang-flag');
  const label = document.getElementById('lang-label');
  if (flag)  flag.textContent  = meta.flag;
  if (label) label.textContent = meta.name;
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
let activeFilter = 'all';
let searchQuery  = '';

function filterCards() {
  const cards = document.querySelectorAll('#articles-grid .card');
  const noResults = document.getElementById('no-results');
  const term = document.getElementById('no-results-term');
  let visible = 0;

  cards.forEach(card => {
    const cat   = card.dataset.category || '';
    const cardText = card.textContent.toLowerCase();

    const matchFilter = activeFilter === 'all' || cat === activeFilter;
    const matchSearch = searchQuery === '' || cardText.includes(searchQuery);

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

  return `
    <div class="${wrapCls}">
      <img src="${src}" alt="${caption || ''}" class="${imgCls}" loading="lazy"
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

/* ═══════════════════════════════════════════════════
   MODAL (index.html)
═══════════════════════════════════════════════════ */
let currentModalData = null;

function fillModal(data, lang) {
  const tag   = pickLang(data.tag,     lang);
  const title = pickLang(data.title,   lang);
  const meta  = pickLang(data.meta,    lang);
  const body  = pickLang(data.content, lang);

  const g = id => document.getElementById(id);
  if (g('modal-tag'))   g('modal-tag').textContent   = tag;
  if (g('modal-title')) g('modal-title').textContent = title;
  if (g('modal-meta'))  g('modal-meta').textContent  = meta;
  if (g('modal-img-top')) g('modal-img-top').innerHTML = renderArticleImg(data.image, data.image_caption, 'hero');

  const midHtml = renderArticleImg(data.image_mid, data.image_mid_caption, 'inline');
  if (g('modal-body')) g('modal-body').innerHTML = applyMidImg(body, midHtml);

  const modalBox = document.getElementById('modal-box');
  if (modalBox) modalBox.scrollTop = 0;

  document.title = `${title} — Nakama Blog`;
  updateShareLinks(data.id, title);
}

async function openArticle(id) {
  try {
    const data = await loadArticle(id);
    currentModalData = data;
    fillModal(data, currentLang);
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  } catch (err) {
    console.error('Error abriendo artículo:', err);
  }
}

function closeArticle() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  currentModalData = null;
}

function closeOnOverlay(event) {
  if (event.target === document.getElementById('modal-overlay')) {
    closeArticle();
  }
}

function copyArticleLink() {
  const t = i18n[currentLang] || {};
  const id = currentModalData ? currentModalData.id : '';
  const url = id
    ? `${location.origin}${location.pathname.replace(/\/[^/]*$/, '/')  }article.html?id=${id}`
    : window.location.href;
  const shareCpBtn = document.getElementById('share-cp');
  const finish = () => {
    if (shareCpBtn) {
      shareCpBtn.classList.add('copied');
      const spanEl = shareCpBtn.querySelector('[data-i18n]');
      const original = spanEl ? spanEl.textContent : '';
      if (spanEl && t.share_copied) spanEl.textContent = t.share_copied;
      setTimeout(() => {
        shareCpBtn.classList.remove('copied');
        if (spanEl) spanEl.textContent = original;
      }, 2000);
    }
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(finish).catch(finish);
  } else {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    finish();
  }
}

window.openArticle    = openArticle;
window.closeArticle   = closeArticle;
window.closeOnOverlay = closeOnOverlay;
window.copyArticleLink = copyArticleLink;

// Cerrar modal con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && currentModalData) closeArticle();
});

/* ═══════════════════════════════════════════════════
   SHARE (modal)
═══════════════════════════════════════════════════ */
function updateShareLinks(id, title) {
  const articleUrl = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '/')}article.html?id=${encodeURIComponent(id)}`;
  const text = encodeURIComponent((title || '') + ' — NAKAMA.BLOG');
  const url  = encodeURIComponent(articleUrl);

  const tw = document.getElementById('share-tw');
  const wa = document.getElementById('share-wa');
  if (tw) tw.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  if (wa) wa.href = `https://wa.me/?text=${text}%20${url}`;
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

function openRoulette() {
  if (!rouletteOverlay || !rouletteWheel) return;
  rouletteOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

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
  if (!rouletteOverlay) return;
  rouletteOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function closeRouletteOnOverlay(e) {
  if (e.target === rouletteOverlay) closeRoulette();
}

window.closeRoulette = closeRoulette;
window.closeRouletteOnOverlay = closeRouletteOnOverlay;

if (btnRoulette) {
  btnRoulette.addEventListener('click', () => openRoulette());
}

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
      closeRoulette();
      const id = rouletteItems[randomItemIndex];
      openArticle(id);
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

function renderArticlePage(data) {
  if (!onArticlePage) return;
  const lang = currentLang;

  const tag   = pickLang(data.tag,     lang);
  const title = pickLang(data.title,   lang);
  const meta  = pickLang(data.meta,    lang);
  const body  = pickLang(data.content, lang);

  const g = id => document.getElementById(id);
  if (g('article-tag'))   g('article-tag').textContent   = tag;
  if (g('article-title')) g('article-title').textContent = title;
  if (g('article-meta'))  g('article-meta').textContent  = meta;
  if (g('article-img-top')) g('article-img-top').innerHTML = renderArticleImg(data.image, data.image_caption, 'hero');

  const midHtml = renderArticleImg(data.image_mid, data.image_mid_caption, 'inline');
  if (g('article-body')) g('article-body').innerHTML = applyMidImg(body, midHtml);

  document.title = `${title} — Nakama Blog`;

  const shareRow = document.getElementById('article-share-row');
  if (shareRow) shareRow.style.display = '';

  const articleUrl = window.location.href;
  const text = encodeURIComponent(title + ' — NAKAMA.BLOG');
  const url  = encodeURIComponent(articleUrl);
  const tw = document.getElementById('share-tw');
  const wa = document.getElementById('share-wa');
  if (tw) tw.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  if (wa) wa.href = `https://wa.me/?text=${text}%20${url}`;
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
  const id = getQueryParam('id');
  if (!id) {
    showArticleError('No se ha indicado ningún artículo (?id=).');
    return;
  }
  try {
    const data = await loadArticle(id);
    currentArticleData = data;
    renderArticlePage(data);
  } catch (err) {
    console.error(err);
    showArticleError(`No se encontró el artículo "${id}".`);
  }
}

// Botón copiar en article.html
const shareCpBtn = document.getElementById('share-cp');
if (shareCpBtn && onArticlePage) {
  shareCpBtn.addEventListener('click', () => {
    const t = i18n[currentLang] || {};
    const url = window.location.href;
    const finish = () => {
      shareCpBtn.classList.add('copied');
      const spanEl = shareCpBtn.querySelector('[data-i18n]');
      const original = spanEl ? spanEl.textContent : '';
      if (spanEl && t.share_copied) spanEl.textContent = t.share_copied;
      setTimeout(() => {
        shareCpBtn.classList.remove('copied');
        if (spanEl) spanEl.textContent = original;
      }, 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(finish).catch(finish);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      finish();
    }
  });
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
})();

/* ═══════════════════════════════════════════════════
   EASTER EGGS — Módulo autocontenido
   No depende del flujo de tarjetas, idioma o tema.
   - 1) Tatakae : "tatakae" → shake + borde rojo + modal
   - 2) Sakura  : 3 clics rápidos sobre .nav-logo → lluvia de pétalos
   - 3) Rasengan: "rasengan" → esfera de chakra centrada
   - 4) Saiyan  : "saiyan" → aura dorada + shake fuerte
   - 5) Joyboy  : "joyboy" → latido de la página + risa de Nika
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
