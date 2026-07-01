#!/usr/bin/env node
/**
 * Genera feed.xml (RSS 2.0) a partir de los artículos. Un único feed en el idioma
 * por defecto (ES), que es el "feed del blog". Enlaza a las URLs limpias (SSG).
 *
 * Orden: el de articles/index.json (orden curado del home) y, al final, los
 * artículos que tienen fichero pero no tarjeta (p. ej. op-obra, el destacado).
 * No hay campo `date` en los artículos → se omite <pubDate> por ítem; el canal
 * lleva <lastBuildDate> con la fecha de generación.
 *
 * Sin dependencias (Node puro). Uso:
 *   node scripts/generate-feed.js
 *   FEED_DATE="Wed, 01 Jul 2026 00:00:00 GMT" node scripts/generate-feed.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const { SITE, DEFAULT_LANG, ROOT, escHtml: esc } = require('./_shared');

const ARTICLES_DIR = path.join(ROOT, 'articles');
const OUT = path.join(ROOT, 'feed.xml');
const LASTBUILD = process.env.FEED_DATE || new Date().toUTCString();

const FEED_TITLE = 'Nakama Blog — Anime & Manga';
const FEED_DESC = 'Análisis profundo de anime y manga: filosofía, sociedad y psicología a través de las grandes obras del género.';

const pickLang = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.es || field.en || '';
};

const articleUrl = (id) => (DEFAULT_LANG === 'es' ? `${SITE}/articulos/${id}/` : `${SITE}/articulos/${id}/${DEFAULT_LANG}/`);

/* Devuelve los ids de artículo ordenados: primero los de index.json (orden curado),
   después el resto de ficheros articles/*.json (sin tarjeta) en orden alfabético. */
function orderedIds() {
  const fileIds = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.replace(/\.json$/, ''));
  let indexIds = [];
  try {
    indexIds = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, 'index.json'), 'utf8')).map((e) => e.id);
  } catch (e) { /* sin index → solo ficheros */ }
  const inIndex = indexIds.filter((id) => fileIds.includes(id));
  const rest = fileIds.filter((id) => !inIndex.includes(id)).sort();
  return inIndex.concat(rest);
}

function main() {
  const ids = orderedIds();
  if (!ids.length) throw new Error('No se encontraron artículos en articles/');

  const items = [];
  for (const id of ids) {
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${id}.json`), 'utf8')); }
    catch (e) { console.warn(`AVISO: omito "${id}" (JSON inválido): ${e.message}`); continue; }
    const url = articleUrl(id);
    const title = pickLang(data.title, DEFAULT_LANG);
    const rawDesc = pickLang(data.desc, DEFAULT_LANG);
    const desc = (rawDesc && rawDesc.trim()) ? rawDesc : (pickLang(data.tag, DEFAULT_LANG) || title);
    const category = pickLang(data.label, DEFAULT_LANG) || data.category || '';
    items.push(
      '    <item>\n' +
      `      <title>${esc(title)}</title>\n` +
      `      <link>${esc(url)}</link>\n` +
      `      <guid isPermaLink="true">${esc(url)}</guid>\n` +
      (category ? `      <category>${esc(category)}</category>\n` : '') +
      `      <description>${esc(desc)}</description>\n` +
      '    </item>'
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(FEED_TITLE)}</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(FEED_DESC)}</description>
    <language>es-ES</language>
    <lastBuildDate>${LASTBUILD}</lastBuildDate>
    <image>
      <url>${SITE}/img/articles/oyasumy-punpun-portada.jpg</url>
      <title>${esc(FEED_TITLE)}</title>
      <link>${SITE}/</link>
    </image>
${items.join('\n')}
  </channel>
</rss>
`;

  fs.writeFileSync(OUT, xml, 'utf8');
  console.log(`feed.xml generado: ${items.length} artículos · lastBuildDate ${LASTBUILD}`);
}

main();
