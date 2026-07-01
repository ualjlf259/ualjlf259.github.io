#!/usr/bin/env node
/**
 * Prerender de la página "Guardados" por idioma, en URLs limpias:
 *   ES (por defecto):  /guardados/index.html        → /guardados/
 *   Otros idiomas:     /guardados/<lang>/index.html → /guardados/<lang>/
 *
 * La página es PERSONAL (lista lo que el usuario marcó con 🔖, leído de
 * localStorage por script.js), así que va con `noindex` y NO entra en el sitemap.
 * Aun así se generan las 8 variantes para que el chrome (nav, selector de idioma)
 * funcione igual que en el resto del sitio: /guardados/ es ADAPTATIVA (recuerda el
 * idioma) y /guardados/<lang>/ están fijadas — mismo modelo que el home.
 *
 * Reutiliza guardados.html como "shell" (extrae su <body>, reescribe el <head> y
 * pasa las rutas a root-absolutas). Sin dependencias. Uso: node scripts/generate-saved.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const { SITE, DEFAULT_LANG, LANGS, ROOT, escHtml: esc, absolutize } = require('./_shared');

const OUT_DIR = path.join(ROOT, 'guardados');

// SEO mínimo por idioma (título de pestaña + descripción). La página es noindex.
const SAVED_SEO = {
  es: { title: 'Tus guardados', desc: 'Tus artículos guardados en Nakama Blog.' },
  en: { title: 'Saved articles', desc: 'Your saved articles on Nakama Blog.' },
  fr: { title: 'Vos articles enregistrés', desc: 'Vos articles enregistrés sur Nakama Blog.' },
  ja: { title: '保存した記事', desc: 'Nakama Blog で保存した記事。' },
  it: { title: 'I tuoi salvati', desc: 'I tuoi articoli salvati su Nakama Blog.' },
  de: { title: 'Gespeicherte Artikel', desc: 'Deine gespeicherten Artikel auf Nakama Blog.' },
  ru: { title: 'Сохранённые статьи', desc: 'Ваши сохранённые статьи на Nakama Blog.' },
  pt: { title: 'Seus salvos', desc: 'Seus artigos salvos no Nakama Blog.' },
};

const savedPath = (lang) => (lang === DEFAULT_LANG ? '/guardados/' : `/guardados/${lang}/`);
const savedUrl = (lang) => SITE + savedPath(lang);

function buildHead(lang) {
  const seo = SAVED_SEO[lang] || SAVED_SEO.es;
  const pageUrl = savedUrl(lang);
  const docTitle = `${seo.title} — Nakama Blog`;
  const localeScripts = LANGS.map((l) => `  <script defer src="/locales/${l}.js"></script>`).join('\n');
  const langUrls = Object.fromEntries(LANGS.map((l) => [l, savedPath(l)]));
  // ES = adaptativa (sin `lang` en el marcador, recuerda idioma); el resto fijadas.
  const marker = lang === DEFAULT_LANG ? { saved: true, langUrls } : { saved: true, lang, langUrls };

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, follow">
  <meta name="description" content="${esc(seo.desc)}">
  <title>${esc(docTitle)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <link rel="canonical" href="${esc(pageUrl)}">

  <link rel="alternate" type="application/rss+xml" title="Nakama Blog · RSS" href="/feed.xml">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&family=Cinzel:wght@700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet">
${localeScripts}
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/easter-eggs/easter-eggs.css">
  <link rel="stylesheet" href="/flags/flag-icons-local.css">

  <!-- Guardados prerenderizado por idioma (SSG): fija el idioma de esta URL y hace que el selector navegue -->
  <script>window.__PRERENDERED=${JSON.stringify(marker)};</script>
  <noscript><style>#intro-cine{display:none!important}</style></noscript>
</head>`;
}

function main() {
  const shell = fs.readFileSync(path.join(ROOT, 'guardados.html'), 'utf8');
  const bodyMatch = shell.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error('No se pudo extraer <body> de guardados.html');
  const bodyInner = absolutize(bodyMatch[1]);

  // El generador es dueño de /guardados → limpiar antes de regenerar.
  fs.rmSync(OUT_DIR, { recursive: true, force: true });

  let count = 0;
  for (const lang of LANGS) {
    const html = `<!DOCTYPE html>\n<html lang="${lang}">\n${buildHead(lang)}\n<body>\n${bodyInner}\n</body>\n</html>\n`;
    const dir = lang === DEFAULT_LANG ? OUT_DIR : path.join(OUT_DIR, lang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    count++;
  }
  console.log(`Guardados prerender OK: ${count} páginas (/guardados/ + /guardados/<lang>/)`);
}

main();
