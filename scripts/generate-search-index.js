#!/usr/bin/env node
/**
 * Genera el índice de búsqueda de TEXTO COMPLETO del buscador (Ctrl+K).
 * Un fichero por idioma — articles/search/<lang>.json — con TODOS los artículos
 * (incluido op-obra, que no tiene tarjeta pero sí página pública):
 *
 *   [{ id, title, cat, mins, thumb, text }, …]
 *
 * `text` es el `content` del artículo pasado a texto plano (sin HTML, sin
 * {{MID_IMG}}, entidades básicas decodificadas, espacios colapsados). script.js
 * lo carga PEREZOSAMENTE (al primer uso del buscador) y busca dentro con
 * plegado de acentos, mostrando un snippet resaltado en los resultados.
 *
 * Sin dependencias (Node puro). Uso: node scripts/generate-search-index.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const { LANGS, ROOT } = require('./_shared');

const ARTICLES_DIR = path.join(ROOT, 'articles');
const OUT_DIR = path.join(ARTICLES_DIR, 'search');

const pickLang = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.es || field.en || '';
};

/* HTML del content → texto plano buscable. */
function stripHtml(html) {
  return String(html || '')
    .replace(/\{\{MID_IMG\}\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  const ids = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
  if (!ids.length) throw new Error('No se encontraron artículos en articles/');

  const articles = ids.map((id) => {
    const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${id}.json`), 'utf8'));
    data.id = data.id || id;
    return data;
  });

  // El generador es dueño de articles/search → limpiar antes de regenerar.
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sizes = [];
  for (const lang of LANGS) {
    const entries = articles.map((a) => ({
      id: a.id,
      title: pickLang(a.title, lang),
      cat: a.category || '',
      mins: a.mins != null ? a.mins : '',
      thumb: (a.thumb && a.thumb.src) || '',
      text: stripHtml(pickLang(a.content, lang)),
    }));
    const out = path.join(OUT_DIR, `${lang}.json`);
    fs.writeFileSync(out, JSON.stringify(entries), 'utf8');
    sizes.push(`${lang}:${Math.round(fs.statSync(out).size / 1024)}KB`);
  }
  console.log(`Índice de búsqueda OK: ${articles.length} artículos × ${LANGS.length} idiomas → /articles/search/ (${sizes.join(' ')})`);
}

main();
