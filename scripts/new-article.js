#!/usr/bin/env node
/**
 * Pipeline de artículos nuevos: scaffold + comprobador de completitud.
 *
 * Crear un artículo (esqueleto con los 14 campos, ES con TODOs y el resto de
 * idiomas vacíos — con pickLang() el sitio funciona igualmente y cae a ES
 * mientras llegan las traducciones):
 *
 *   node scripts/new-article.js <id> "<Categoría>"
 *   node scripts/new-article.js monster-moral "Monster"
 *
 * Validar que un artículo está listo para publicar (8 idiomas completos,
 * imágenes existentes, date, mins, tarjeta en index.json, {{MID_IMG}}):
 *
 *   node scripts/new-article.js --check <id>
 *
 * Al terminar imprime la checklist manual (index.json, imágenes, chip,
 * videoMap, tarjeta estática) y el comando de los 6 generadores.
 * Sin dependencias (Node puro).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const { LANGS, ROOT } = require('./_shared');

const ARTICLES_DIR = path.join(ROOT, 'articles');
const AUTHOR = 'Jose Jesus Lopez Fernandez';

const GEN_CMD = 'node scripts/generate-search-index.js && node scripts/generate-articles.js && node scripts/generate-home.js && node scripts/generate-saved.js && node scripts/generate-feed.js && node scripts/generate-sitemap.js';

/* ── esqueleto ───────────────────────────────────────────── */

function langMap(esValue) {
  const out = {};
  for (const l of LANGS) out[l] = l === 'es' ? esValue : '';
  return out;
}

function scaffold(id, category) {
  const file = path.join(ARTICLES_DIR, `${id}.json`);
  if (fs.existsSync(file)) {
    console.error(`ERROR: articles/${id}.json ya existe (no se sobrescribe).`);
    process.exit(1);
  }
  if (!/^[a-z0-9-]+$/.test(id)) {
    console.error('ERROR: el id debe ser kebab-case (minúsculas, números y guiones), p. ej. "monster-moral".');
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const contentEs = [
    '<p>TODO — párrafo de apertura (la primera letra lleva drop-cap automático; arranca fuerte).</p>\n\n',
    '      <h3>TODO — primera sección</h3>\n',
    '      <p>TODO.</p>\n',
    '      <blockquote>"TODO — cita potente."<cite>— Personaje, Obra</cite></blockquote>\n',
    '      <p>TODO.</p>\n\n',
    '      <h3>TODO — segunda sección</h3>\n',
    '      <p>TODO.</p>\n',
    '      {{MID_IMG}}\n\n',
    '      <h3>TODO — cierre</h3>\n',
    '      <p>TODO — remate del argumento.</p>',
  ].join('');

  const data = {
    id,
    date: today,
    category,
    mins: null,
    thumb: {
      class: 'op',
      type: 'img',
      src: `img/articles/TODO-portada.jpg`,
      alt: `${category} portada`,
    },
    title: langMap('TODO — Título del Artículo: Con Gancho Tras los Dos Puntos'),
    desc: langMap('TODO — subtítulo/extracto de 1-2 frases (sale en la card, el buscador y la meta description).'),
    tag: langMap(`${category} · Análisis profundo`),
    meta: langMap(`X min lectura · TEMA · ${AUTHOR}`),
    label: langMap('TODO — tema (Sociedad/Filosofía/Análisis/Psicología/…; agrupa los "relacionados")'),
    image: 'img/articles/TODO-top.jpg',
    image_caption: 'TODO — pie de la imagen principal.',
    image_mid: 'img/articles/TODO-mid.jpg',
    image_mid_caption: 'TODO — pie de la imagen intermedia.',
    content: langMap(contentEs),
  };

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✔ Creado articles/${id}.json (date: ${today})`);

  const indexSnippet = {
    id,
    category,
    mins: null,
    thumb: data.thumb,
    title: data.title,
    desc: data.desc,
    label: data.label,
  };
  console.log('\n── Snippet para articles/index.json (pégalo en la posición del grid que quieras) ──');
  console.log(JSON.stringify(indexSnippet, null, 2));

  console.log(`
── Checklist manual ──────────────────────────────────────
 1. Rellena los TODO en ES y ajusta mins/date en articles/${id}.json
 2. Traduce los 7 idiomas restantes (title/desc/tag/meta/label/content)
 3. Añade el snippet de arriba a articles/index.json (con las traducciones)
 4. Sube las imágenes a img/articles/ y actualiza thumb.src/image/image_mid
 5. Opcional: chip de filtro en index.html (#filter-chips, data-filter="${category}")
 6. Opcional: tráiler → videoMap en script.js + fichero en videos/
 7. Opcional: tarjeta estática <a class="card"> en index.html (fallback no-JS)
 8. Valida:      node scripts/new-article.js --check ${id}
 9. Regenera:    ${GEN_CMD}
10. Commit: articles/ + articulos/ + articles/search/ + feed.xml + sitemap.xml (+ index.html si tocaste chips/cards)
───────────────────────────────────────────────────────────`);
}

/* ── comprobador ─────────────────────────────────────────── */

function check(id) {
  const file = path.join(ARTICLES_DIR, `${id}.json`);
  if (!fs.existsSync(file)) {
    console.error(`ERROR: no existe articles/${id}.json`);
    process.exit(1);
  }
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error(`ERROR: JSON inválido — ${e.message}`); process.exit(1); }

  const problems = [];
  const warn = [];

  // Campos multiidioma completos y sin TODOs
  for (const field of ['title', 'desc', 'tag', 'meta', 'label', 'content']) {
    if (!data[field] || typeof data[field] !== 'object') { problems.push(`falta el campo "${field}"`); continue; }
    for (const l of LANGS) {
      const v = data[field][l];
      if (!v || !String(v).trim()) problems.push(`${field}.${l} vacío`);
      else if (/TODO/.test(v)) problems.push(`${field}.${l} contiene TODO`);
    }
  }

  // date, mins, category
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || '')) problems.push('date falta o no es YYYY-MM-DD');
  if (typeof data.mins !== 'number' || !(data.mins > 0)) problems.push('mins falta o no es un número > 0');
  if (!data.category) problems.push('category vacía');

  // Imágenes existentes
  for (const [label, p] of [['thumb.src', data.thumb && data.thumb.src], ['image', data.image], ['image_mid', data.image_mid]]) {
    if (!p) { problems.push(`${label} vacío`); continue; }
    if (/TODO/.test(p)) problems.push(`${label} contiene TODO (${p})`);
    else if (!fs.existsSync(path.join(ROOT, p))) problems.push(`${label} no existe en disco: ${p}`);
  }

  // {{MID_IMG}} exactamente una vez por idioma (si hay image_mid)
  if (data.content && data.image_mid && !/TODO/.test(data.image_mid)) {
    for (const l of LANGS) {
      const n = (String(data.content[l] || '').match(/\{\{MID_IMG\}\}/g) || []).length;
      if (n !== 1) warn.push(`content.${l}: {{MID_IMG}} aparece ${n} veces (lo normal es 1)`);
    }
  }

  // Tarjeta en index.json
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, 'index.json'), 'utf8'));
    if (!idx.some((e) => e.id === id)) warn.push('sin tarjeta en articles/index.json (como op-obra: página pública pero fuera del grid — ¿intencionado?)');
  } catch (e) { warn.push('no se pudo leer articles/index.json'); }

  if (problems.length) {
    console.log(`✘ ${id}: NO listo — ${problems.length} problema(s):`);
    problems.forEach((p) => console.log('   · ' + p));
  } else {
    console.log(`✔ ${id}: los 14 campos completos en los ${LANGS.length} idiomas y las imágenes existen.`);
  }
  if (warn.length) {
    console.log('⚠ Avisos:');
    warn.forEach((w) => console.log('   · ' + w));
  }
  if (!problems.length) {
    console.log('\nSiguiente paso — regenera y commitea:\n  ' + GEN_CMD);
  }
  process.exit(problems.length ? 2 : 0);
}

/* ── cli ─────────────────────────────────────────────────── */

const [, , a, b] = process.argv;
if (a === '--check' && b) check(b);
else if (a && a !== '--check' && b) scaffold(a, b);
else {
  console.log('Uso:\n  node scripts/new-article.js <id> "<Categoría>"   (crear esqueleto)\n  node scripts/new-article.js --check <id>          (validar completitud)');
  process.exit(1);
}
