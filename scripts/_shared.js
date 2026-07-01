'use strict';
/**
 * Helpers y constantes compartidos por los generadores (prerender de artículos,
 * home y sitemap). Node puro, sin dependencias.
 */
const path = require('path');

const SITE = 'https://ualjlf259.github.io';
const DEFAULT_LANG = 'es';
// Idiomas soportados. El orden no afecta al SEO (hreflang).
const LANGS = ['es', 'en', 'fr', 'ja', 'it', 'de', 'ru', 'pt'];
const LOCALE_TAG = { es: 'es_ES', en: 'en_US', fr: 'fr_FR', ja: 'ja_JP', de: 'de_DE', it: 'it_IT', ru: 'ru_RU', pt: 'pt_PT' };
const ROOT = path.resolve(__dirname, '..');

/* Escapa &, <, >, " para incrustar en HTML/atributos o XML. */
const escHtml = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Pasa rutas relativas de assets a root-absolutas (la página puede vivir en subdirectorios). */
function absolutize(html) {
  return html.replace(/(src|href)="(?!https?:|\/\/|\/|#|data:|mailto:|tel:)([^"]+)"/g, (m, attr, url) => {
    if (/^index\.html/.test(url)) return `${attr}="${url.replace(/^index\.html/, '/')}"`;
    return `${attr}="/${url}"`;
  });
}

module.exports = { SITE, DEFAULT_LANG, LANGS, LOCALE_TAG, ROOT, escHtml, absolutize };
