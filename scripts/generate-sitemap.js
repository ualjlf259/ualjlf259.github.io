#!/usr/bin/env node
/**
 * Genera sitemap.xml a partir de las páginas reales del sitio.
 * Fuente única de verdad → sin drift, sin mantenimiento manual.
 * Sin dependencias (Node puro).
 *
 * Páginas incluidas:
 *   - Home (1 por idioma).
 *   - Cada artículo = un fichero articles/<id>.json (excepto index.json),
 *     1 URL por idioma. OJO: se enumeran los FICHEROS, no index.json, porque
 *     index.json solo lista las tarjetas del grid y deja fuera artículos como
 *     `op-obra` (el destacado del banner), que sí es una página pública.
 *
 * Uso:
 *   node scripts/generate-sitemap.js
 *   SITEMAP_LASTMOD=2026-05-06 node scripts/generate-sitemap.js   (fija la fecha)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = 'https://ualjlf259.github.io';
const DEFAULT_LANG = 'es';
// Orden de los <xhtml:link hreflang> (coincide con el sitemap previo; el orden no afecta al SEO).
const LANGS = ['es', 'en', 'fr', 'it', 'de', 'ru', 'ja', 'pt'];
const LASTMOD = process.env.SITEMAP_LASTMOD || new Date().toISOString().slice(0, 10);

const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const OUT = path.join(ROOT, 'sitemap.xml');

const xmlEscape = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const homeUrl = (lang) => (lang === DEFAULT_LANG ? `${SITE}/` : `${SITE}/${lang}/`);
// URLs estáticas (SSG, directorio limpio). Coincide con scripts/generate-articles.js.
const articleUrl = (id, lang) => (lang === DEFAULT_LANG ? `${SITE}/articulos/${id}/` : `${SITE}/articulos/${id}/${lang}/`);

function urlBlock({ loc, priority, changefreq, urlFor }) {
  const lines = ['  <url>', `    <loc>${xmlEscape(loc)}</loc>`, `    <lastmod>${LASTMOD}</lastmod>`];
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  lines.push(`    <priority>${priority}</priority>`);
  for (const l of LANGS) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(urlFor(l))}"/>`);
  }
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(urlFor(DEFAULT_LANG))}"/>`);
  lines.push('  </url>');
  return lines.join('\n');
}

function articleIds() {
  return fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.replace(/\.json$/, ''))
    .filter((id) => {
      try {
        JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${id}.json`), 'utf8'));
        return true;
      } catch (e) {
        console.warn(`AVISO: omito "${id}" (JSON inválido): ${e.message}`);
        return false;
      }
    })
    .sort();
}

function main() {
  const ids = articleIds();
  if (!ids.length) throw new Error('No se encontraron artículos en articles/');

  const home = LANGS.map((lang) => urlBlock({
    loc: homeUrl(lang),
    priority: lang === DEFAULT_LANG ? '1.0' : '0.9',
    changefreq: lang === DEFAULT_LANG ? 'weekly' : null,
    urlFor: homeUrl,
  }));

  const arts = [];
  for (const id of ids) {
    for (const lang of LANGS) {
      arts.push(urlBlock({
        loc: articleUrl(id, lang),
        priority: lang === DEFAULT_LANG ? '0.8' : '0.7',
        changefreq: null,
        urlFor: (l) => articleUrl(id, l),
      }));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- ── Home (${LANGS.length} idiomas) ── -->
${home.join('\n\n')}

  <!-- ── Artículos (${ids.length} × ${LANGS.length} idiomas) — generado desde articles/*.json ── -->
${arts.join('\n\n')}
</urlset>
`;

  fs.writeFileSync(OUT, xml, 'utf8');
  console.log(
    `sitemap.xml generado: ${home.length + arts.length} URLs ` +
    `(${LANGS.length} home + ${ids.length}×${LANGS.length} artículos) · lastmod ${LASTMOD}`,
  );
}

main();
