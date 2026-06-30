#!/usr/bin/env node
/**
 * Prerender del HOME por idioma. ES vive en la raíz (index.html, hecho a mano);
 * este script genera /<lang>/index.html para los otros 7 idiomas, con <head> SEO
 * traducido (title/description/OG/Twitter/canonical/hreflang/JSON-LD) + URL limpia.
 *
 * Reutiliza index.html como "shell" (extrae su <body>, reescribe el <head> y pasa
 * las rutas a root-absolutas). El cuerpo estático queda en español (fallback no-JS),
 * pero script.js lo re-renderiza en el idioma de la URL gracias al marcador
 * window.__PRERENDERED (lang + langUrls del home). El selector de idioma navega
 * entre /, /en/, … y `articleHref()`/los fetch usan rutas absolutas (funcionan en /<lang>/).
 *
 * Sin dependencias. Uso: node scripts/generate-home.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = 'https://ualjlf259.github.io';
const DEFAULT_LANG = 'es';
const LANGS = ['es', 'en', 'fr', 'ja', 'it', 'de', 'ru', 'pt'];
const LOCALE_TAG = { es: 'es_ES', en: 'en_US', fr: 'fr_FR', ja: 'ja_JP', de: 'de_DE', it: 'it_IT', ru: 'ru_RU', pt: 'pt_PT' };
const ROOT = path.resolve(__dirname, '..');
const OG_IMAGE = `${SITE}/img/articles/oyasumy-punpun-portada.jpg`;

// SEO del home por idioma (marca + descripción). Título de marca común.
const HOME_SEO = {
  es: { title: 'Nakama Blog — Anime & Manga', desc: 'Análisis profundo de anime y manga: One Piece, Hunter x Hunter, Vinland Saga, Shingeki no Kyojin y más.' },
  en: { title: 'Nakama Blog — Anime & Manga', desc: 'In-depth anime and manga analysis: One Piece, Hunter x Hunter, Vinland Saga, Attack on Titan and more.' },
  fr: { title: 'Nakama Blog — Anime & Manga', desc: "Analyse approfondie d'anime et de manga : One Piece, Hunter x Hunter, Vinland Saga, L'Attaque des Titans et plus." },
  ja: { title: 'Nakama Blog — Anime & Manga', desc: 'アニメと漫画の深掘り分析：ワンピース、HUNTER×HUNTER、ヴィンランド・サガ、進撃の巨人など。' },
  it: { title: 'Nakama Blog — Anime & Manga', desc: "Analisi approfondita di anime e manga: One Piece, Hunter x Hunter, Vinland Saga, L'Attacco dei Giganti e altro." },
  de: { title: 'Nakama Blog — Anime & Manga', desc: 'Tiefgehende Anime- und Manga-Analysen: One Piece, Hunter x Hunter, Vinland Saga, Attack on Titan und mehr.' },
  ru: { title: 'Nakama Blog — Anime & Manga', desc: 'Глубокий анализ аниме и манги: One Piece, Hunter x Hunter, Vinland Saga, «Атака титанов» и многое другое.' },
  pt: { title: 'Nakama Blog — Anime & Manga', desc: 'Análise profunda de anime e mangá: One Piece, Hunter x Hunter, Vinland Saga, Attack on Titan e mais.' },
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const homePath = (lang) => (lang === DEFAULT_LANG ? '/' : `/${lang}/`);
const homeUrl = (lang) => SITE + homePath(lang);

function absolutize(html) {
  return html.replace(/(src|href)="(?!https?:|\/\/|\/|#|data:|mailto:|tel:)([^"]+)"/g, (m, attr, url) => {
    if (/^index\.html/.test(url)) return `${attr}="${url.replace(/^index\.html/, '/')}"`;
    return `${attr}="/${url}"`;
  });
}

function buildHead(lang) {
  const seo = HOME_SEO[lang] || HOME_SEO.es;
  const pageUrl = homeUrl(lang);
  const alternates = LANGS.map((l) =>
    `  <link rel="alternate" hreflang="${l}" href="${esc(homeUrl(l))}">`).join('\n') +
    `\n  <link rel="alternate" hreflang="x-default" href="${esc(homeUrl(DEFAULT_LANG))}">`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    name: 'Nakama Blog', alternateName: 'ualjlf259.github.io', url: pageUrl,
    description: seo.desc, inLanguage: lang,
    author: { '@type': 'Person', name: 'Jose Jesus Lopez Fernandez' },
  };
  const localeScripts = LANGS.map((l) => `  <script defer src="/locales/${l}.js"></script>`).join('\n');
  const marker = { home: true, lang, langUrls: Object.fromEntries(LANGS.map((l) => [l, homePath(l)])) };

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(seo.desc)}">
  <title>${esc(seo.title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <link rel="canonical" href="${esc(pageUrl)}">

  <!-- ── Open Graph ── -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:title" content="${esc(seo.title)}">
  <meta property="og:description" content="${esc(seo.desc)}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:locale" content="${LOCALE_TAG[lang] || 'es_ES'}">
  <meta property="og:site_name" content="Nakama Blog">

  <!-- ── Twitter Card ── -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${esc(pageUrl)}">
  <meta name="twitter:title" content="${esc(seo.title)}">
  <meta name="twitter:description" content="${esc(seo.desc)}">
  <meta name="twitter:image" content="${OG_IMAGE}">

  <!-- ── hreflang (home por idioma) ── -->
${alternates}

  <!-- ── JSON-LD (WebSite) ── -->
  <script type="application/ld+json">${JSON.stringify(ld)}</script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&family=Cinzel:wght@700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet">
${localeScripts}
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/easter-eggs/easter-eggs.css">
  <link rel="stylesheet" href="/welcome.css">
  <link rel="stylesheet" href="/flags/flag-icons-local.css">

  <!-- Home prerenderizado por idioma (SSG): fija el idioma de esta URL y hace que el selector navegue -->
  <script>window.__PRERENDERED=${JSON.stringify(marker)};</script>
</head>`;
}

function main() {
  const shell = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const bodyMatch = shell.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error('No se pudo extraer <body> de index.html');
  const bodyInner = absolutize(bodyMatch[1]);

  let count = 0;
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue; // ES = index.html (raíz, a mano)
    const html = `<!DOCTYPE html>\n<html lang="${lang}">\n${buildHead(lang)}\n<body>\n${bodyInner}\n</body>\n</html>\n`;
    const dir = path.join(ROOT, lang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    count++;
  }
  console.log(`Home prerender OK: ${count} páginas (/<lang>/) + raíz ES en index.html`);
}

main();
