#!/usr/bin/env node
/**
 * Prerender / SSG de los artículos a HTML estático por artículo × idioma.
 *
 * Por qué: GitHub Pages no puede prerenderizar `article.html?id=…` (los query
 * params no generan páginas distintas para crawlers ni para los previews al
 * compartir). Este script genera HTML REAL con el contenido y los OG/canonical/
 * hreflang ya escritos en el <head>, en URLs de directorio limpias:
 *
 *   ES (por defecto):  /articulos/<id>/index.html        → /articulos/<id>/
 *   Otros idiomas:     /articulos/<id>/<lang>/index.html → /articulos/<id>/<lang>/
 *
 * El "shell" (nav, footer, barra de acciones, scripts) se TOMA de article.html
 * para no desincronizar el chrome; solo se reescribe el <head> (SEO) y se
 * rellenan los #article-* con el contenido renderizado. Las rutas relativas se
 * pasan a root-absolutas (/...) porque la página vive 2–3 niveles de profundidad.
 *
 * Las páginas cargan los mismos script.js + easter-eggs.js; un marcador
 * window.__PRERENDERED le dice a script.js que NO re-renderice el contenido y que
 * el selector de idioma NAVEGUE a la URL hermana en vez de traducir en sitio.
 *
 * Sin dependencias (Node puro). Uso:
 *   node scripts/generate-articles.js            (todos los artículos)
 *   node scripts/generate-articles.js op-obra    (solo ese id, para validar)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://ualjlf259.github.io';
const DEFAULT_LANG = 'es';
const LANGS = ['es', 'en', 'fr', 'ja', 'it', 'de', 'ru', 'pt'];
const LOCALE_TAG = { es: 'es_ES', en: 'en_US', fr: 'fr_FR', ja: 'ja_JP', de: 'de_DE', it: 'it_IT', ru: 'ru_RU', pt: 'pt_PT' };

const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const LOCALES_DIR = path.join(ROOT, 'locales');
const OUT_DIR = path.join(ROOT, 'articulos');
const AUTHOR = 'Jose Jesus Lopez Fernandez';

/* ── utilidades ─────────────────────────────────────────── */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const pickLang = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.es || field.en || '';
};

/* Carga locales/*.js (que asignan window.LANG_XX) en un sandbox y devuelve i18n. */
function loadLocales() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const map = { es: 'LANG_ES', en: 'LANG_EN', fr: 'LANG_FR', ja: 'LANG_JA', it: 'LANG_IT', de: 'LANG_DE', ru: 'LANG_RU', pt: 'LANG_PT' };
  const out = {};
  for (const [lang, glob] of Object.entries(map)) {
    const code = fs.readFileSync(path.join(LOCALES_DIR, `${lang}.js`), 'utf8');
    vm.runInContext(code, sandbox);
    out[lang] = sandbox.window[glob] || {};
  }
  return out;
}

/* URL pública (directorio limpio) de un artículo en un idioma. */
const artPath = (id, lang) => (lang === DEFAULT_LANG ? `/articulos/${id}/` : `/articulos/${id}/${lang}/`);
const artUrl = (id, lang) => SITE + artPath(id, lang);

/* Réplica de renderArticleImg() de script.js, con rutas ABSOLUTAS desde la raíz. */
function renderArticleImg(src, caption, type) {
  if (!src) return '';
  const abs = '/' + String(src).replace(/^\/+/, '');
  const isHero = type === 'hero';
  const imgCls = isHero ? 'article-img-hero-img' : 'article-img-inline-img';
  const phCls = isHero ? 'img-ph img-ph-hero' : 'img-ph img-ph-inline';
  const label = isHero ? 'Imagen principal' : 'Imagen del artículo';
  const wrapCls = isHero ? 'article-img-block article-img-block-hero' : 'article-img-block article-img-block-inline';
  const loadAttrs = isHero ? 'loading="eager" fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  const captionHtml = caption ? `<p class="article-img-caption">${esc(caption)}</p>` : '';
  return `
    <div class="${wrapCls}">
      <img src="${abs}" alt="${esc(caption || '')}" class="${imgCls}" ${loadAttrs}
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="${phCls}" style="display:none;">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="img-ph-lbl">${label}</span>
        <span class="img-ph-path">${esc(abs)}</span>
      </div>
      ${captionHtml}
    </div>`;
}

/* Réplica de emphasizeTitle(): realza tras el primer ':' o ' – '. */
function emphasizeTitle(title) {
  if (!title) return '';
  const m = /[:：]|\s[–—-]\s/.exec(title);
  const safe = esc(title);
  if (!m || m.index < 3 || m.index > title.length - 4) return safe;
  const cut = m.index + m[0].length;
  return esc(title.slice(0, cut)) + ' <span class="article-title-em">' + esc(title.slice(cut).trim()) + '</span>';
}

/* Pasa rutas relativas de assets a root-absolutas (la página vive en /articulos/<id>/...). */
function absolutize(html) {
  return html.replace(/(src|href)="(?!https?:|\/\/|\/|#|data:|mailto:|tel:)([^"]+)"/g, (m, attr, url) => {
    if (/^index\.html/.test(url)) return `${attr}="${url.replace(/^index\.html/, '/')}"`;
    return `${attr}="/${url}"`;
  });
}

/* Botonera de compartir (enlaces de intent pre-rellenados — sin JS ni SDKs).
   Discord y "copiar enlace" copian al portapapeles (los cablea script.js vía [data-share-copy]). */
const SHARE_SVG = {
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 2C6.477 2 2 6.477 2 12.001a9.994 9.994 0 001.388 5.094L2 22l5.042-1.362A9.956 9.956 0 0011.998 22C17.523 22 22 17.523 22 12.001 22 6.477 17.523 2 11.998 2z"/></svg>',
  tg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  dc: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>',
  cp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
};
function shareSet(title, url, label) {
  const u = encodeURIComponent(url);
  const tt = encodeURIComponent(title);
  const tu = encodeURIComponent(`${title} ${url}`);
  const x = `https://twitter.com/intent/tweet?text=${tt}&url=${u}`;
  const wa = `https://wa.me/?text=${tu}`;
  const tg = `https://t.me/share/url?url=${u}&text=${tt}`;
  return '<div class="article-share-set">' +
    `<span class="article-share-lbl">${esc(label)}</span>` +
    `<a class="ashare ashare-x" href="${esc(x)}" target="_blank" rel="noopener" aria-label="X / Twitter">${SHARE_SVG.x}</a>` +
    `<a class="ashare ashare-wa" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="WhatsApp">${SHARE_SVG.wa}</a>` +
    `<a class="ashare ashare-tg" href="${esc(tg)}" target="_blank" rel="noopener" aria-label="Telegram">${SHARE_SVG.tg}</a>` +
    `<button class="ashare ashare-dc" type="button" data-share-copy aria-label="Copiar enlace para Discord">${SHARE_SVG.dc}</button>` +
    `<button class="ashare ashare-cp" type="button" data-share-copy aria-label="Copiar enlace">${SHARE_SVG.cp}</button>` +
    '</div>';
}

/* Construye el <head> con SEO real para un artículo/idioma. */
function buildHead(data, lang) {
  const title = pickLang(data.title, lang);
  const rawDesc = pickLang(data.desc, lang);
  const desc = (rawDesc && rawDesc.trim()) ? rawDesc : (pickLang(data.tag, lang) || title);
  const imageUrl = `${SITE}/${String(data.image || '').replace(/^\/+/, '')}`;
  const pageUrl = artUrl(data.id, lang);
  const docTitle = `${title} — Nakama Blog`;

  const alternates = LANGS.map((l) =>
    `  <link rel="alternate" hreflang="${l}" href="${esc(artUrl(data.id, l))}">`).join('\n') +
    `\n  <link rel="alternate" hreflang="x-default" href="${esc(artUrl(data.id, DEFAULT_LANG))}">`;

  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: title, description: desc, image: imageUrl, url: pageUrl,
    author: { '@type': 'Person', name: AUTHOR },
    publisher: { '@type': 'Organization', name: 'Nakama Blog', logo: { '@type': 'ImageObject', url: `${SITE}/favicon.svg` } },
    inLanguage: lang, mainEntityOfPage: pageUrl,
  };

  const localeScripts = LANGS.map((l) => `  <script defer src="/locales/${l}.js"></script>`).join('\n');

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(desc)}">
  <title>${esc(docTitle)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <link rel="canonical" href="${esc(pageUrl)}">

  <!-- ── Open Graph ── -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:locale" content="${LOCALE_TAG[lang] || 'es_ES'}">
  <meta property="og:site_name" content="Nakama Blog">

  <!-- ── Twitter Card ── -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">
  <meta name="twitter:url" content="${esc(pageUrl)}">

  <!-- ── hreflang (estático: una página real por idioma) ── -->
${alternates}

  <!-- ── JSON-LD (BlogPosting) ── -->
  <script type="application/ld+json">${JSON.stringify(ld)}</script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&family=Cinzel:wght@700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet">
${localeScripts}
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/easter-eggs/easter-eggs.css">
  <link rel="stylesheet" href="/flags/flag-icons-local.css">

  <!-- Marcador de página prerenderizada: script.js no re-renderiza y el selector de idioma navega -->
  <script>window.__PRERENDERED=${JSON.stringify({ id: data.id, lang, langUrls: Object.fromEntries(LANGS.map((l) => [l, artPath(data.id, l)])) })};</script>
</head>`;
}

/* Rellena los #article-* del shell con el contenido renderizado. */
function fillBody(body, data, lang, i18n) {
  const t = i18n[lang] || {};
  const title = pickLang(data.title, lang);
  const desc = pickLang(data.desc, lang);
  const meta = pickLang(data.meta, lang);
  const label = pickLang(data.label, lang);
  const category = data.category || '';
  let content = pickLang(data.content, lang);
  const readTime = (meta || '').split('·')[0].trim();
  const hash = (s) => '#' + String(s || '').replace(/[\s!¡?¿.·]/g, '');

  const tags = `<span class="atag atag-cat">${esc(category)}</span>` +
    (label ? `<span class="atag atag-topic">${esc(label)}</span>` : '');

  const author =
    '<img class="article-author-avatar" src="img/articles/sobre-mi-avatar.jpg" alt="" loading="lazy" decoding="async">' +
    '<div class="article-author-info">' +
      `<span class="article-author-name">${esc(AUTHOR)}</span>` +
      (readTime ? '<span class="article-author-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>' + esc(readTime) + '</span>' : '') +
    '</div>';

  const heroImg = renderArticleImg(data.image, data.image_caption, 'hero');
  const midHtml = renderArticleImg(data.image_mid, data.image_mid_caption, 'inline');
  content = content.replace('{{MID_IMG}}', midHtml).replace(/\{\{MID_IMG\}\}/g, '');

  const foot =
    '<div class="article-foot-tags">' +
      `<span class="ftag">${esc(hash(category))}</span>` +
      (label ? `<span class="ftag">${esc(hash(label))}</span>` : '') +
    '</div>' +
    shareSet(title, artUrl(data.id, lang), t.share_label || 'Compartir');

  return body
    .replace('<div class="article-tags" id="article-tags"></div>', `<div class="article-tags" id="article-tags">${tags}</div>`)
    .replace('<h1 class="article-title" id="article-title">Cargando…</h1>', `<h1 class="article-title" id="article-title">${emphasizeTitle(title)}</h1>`)
    .replace('<p class="article-sub" id="article-sub"></p>', `<p class="article-sub" id="article-sub">${esc(desc)}</p>`)
    .replace('<div class="article-author" id="article-author"></div>', `<div class="article-author" id="article-author">${author}</div>`)
    .replace('<div id="article-img-top"></div>', `<div id="article-img-top">${heroImg}</div>`)
    .replace('<div class="modal-body" id="article-body"></div>', `<div class="modal-body" id="article-body">${content}</div>`)
    .replace('<div class="article-foot" id="article-foot"></div>', `<div class="article-foot" id="article-foot">${foot}</div>`);
}

function main() {
  const shell = fs.readFileSync(path.join(ROOT, 'article.html'), 'utf8');
  const bodyMatch = shell.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error('No se pudo extraer <body> de article.html');
  const bodyInner = bodyMatch[1];

  const i18n = loadLocales();

  const only = process.argv[2];
  let ids = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
  if (only) ids = ids.filter((id) => id === only);
  if (!ids.length) throw new Error(only ? `No existe el artículo "${only}"` : 'No hay artículos');

  // Al regenerar TODO, limpiar /articulos para no dejar páginas huérfanas (ids renombrados/borrados).
  if (!only) fs.rmSync(OUT_DIR, { recursive: true, force: true });

  let count = 0;
  for (const id of ids) {
    const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${id}.json`), 'utf8'));
    data.id = data.id || id;
    for (const lang of LANGS) {
      const head = buildHead(data, lang);
      let body = fillBody(bodyInner, data, lang, i18n);
      body = absolutize(body);
      const html = `<!DOCTYPE html>\n<html lang="${lang}">\n${head}\n<body>\n${body}\n</body>\n</html>\n`;
      const dir = lang === DEFAULT_LANG ? path.join(OUT_DIR, id) : path.join(OUT_DIR, id, lang);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
      count++;
    }
  }
  console.log(`Prerender OK: ${count} páginas (${ids.length} artículo(s) × ${LANGS.length} idiomas) → /articulos/`);
}

main();
