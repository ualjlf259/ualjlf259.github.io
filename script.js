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

    const videoIds = ['op-esclavitud', 'jjk-maldicion', 'mha-heroes', 'vinland-guerra', 'aot-libertad', 'chainsaw-caos'];
    const playBtn = videoIds.includes(item.id)
      ? `<button class="card-play-btn" aria-label="Ver vídeo"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>`
      : '';

    a.innerHTML = `
      <div class="card-thumb ${thumb.class || ''}">${visual}${playBtn}</div>
      <div class="card-body">
        <span class="card-tag">${item.category}</span>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="card-meta"><span>${item.mins} ${t.read_min || ''}</span><span>${label}</span></div>
      </div>`;

    const videoMap = {
      'op-esclavitud':  'videos/video-one-piece.mp4',
      'jjk-maldicion':  'videos/video-jujutsu.mp4',
      'mha-heroes':     'videos/video-boku-no-hero.mp4',
      'vinland-guerra': 'videos/video-vinland.mp4',
      'aot-libertad':   'videos/video-shingeki.mp4',
      'chainsaw-caos':  'videos/video-chainsaw.mp4'
    };
    if (videoMap[item.id]) {
      a.querySelector('.card-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        openVideoModal(videoMap[item.id]);
      });
    }

    grid.appendChild(a);
  });

  filterCards();
}

/* ═══════════════════════════════════════════════════
   VIDEO MODAL
═══════════════════════════════════════════════════ */
function openVideoModal(src) {
  const modal  = document.getElementById('vmodal');
  const video  = document.getElementById('vmodal-video');
  const splash = document.getElementById('earphone-splash');
  if (!modal || !video) return;

  video.src = src;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

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
  if (!modal) return;
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
}

(function () {
  const closeBtn  = document.getElementById('vmodal-close');
  const backdrop  = document.getElementById('vmodal-backdrop');
  const motivBtn  = document.getElementById('motiv-play-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
  if (backdrop) backdrop.addEventListener('click', closeVideoModal);
  if (motivBtn) motivBtn.addEventListener('click', () => openVideoModal('videos/video-motivacion.mp4'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoModal();
  });
})();

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

// Easter Eggs gestionados por easter-eggs/easter-eggs.js
