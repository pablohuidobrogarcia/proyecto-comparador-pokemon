const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { getPokemonList } = require('./index-pokemon');

const BASE = 'https://www.wikidex.net';
const USER_AGENT = 'Mozilla/5.0 (pokemon-comparator-scraper; https://github.com/)';
const DELAY = Number(process.env.SCRAPE_DELAY || 500); // ms entre peticiones
const OUTPUT = path.resolve(__dirname, '../frontend/src/data/pokemon-dataset.json');
const SAVE_EVERY = 25; // guardar progreso parcial cada N Pokémon

const STAT_MAP = {
  PS: 'ps',
  Ataque: 'ataque',
  Defensa: 'defensa',
  'At. Esp.': 'ataqueEspecial',
  'Def. Esp.': 'defensaEspecial',
  Velocidad: 'velocidad',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 20000,
  });
  return res.data;
}

function extractTypes($) {
  const cls = $('.cuadro_pokemon').attr('class') || '';
  const types = [];
  const m1 = cls.match(/tipo1-([A-Za-záéíóúñÁÉÍÓÚÑ]+)/);
  const m2 = cls.match(/tipo2-([A-Za-záéíóúñÁÉÍÓÚÑ]+)/);
  if (m1) types.push(m1[1]);
  if (m2) types.push(m2[1]);
  return types;
}

function extractImage($) {
  const img = $('.cuadro_pokemon .imagen img').first();
  return img.attr('src') || img.attr('data-src') || '';
}

function extractNationalNumber($) {
  const raw = $('#numeronacional').first().text().trim();
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// NUEVO MODELO DE DATOS: una entrada por TABLA (sin filtrar ni deduplicar)
// ---------------------------------------------------------------------------
// Cada tabla de stats dentro de "Características de combate" genera una entrada
// independiente en el dataset. El nombre de la entrada es el encabezado (h3) más
// cercano por encima de la tabla (puede repetirse si varias generaciones
// comparten el mismo encabezado). El tipo se toma de la infobox principal de la
// página (igual para todas las entradas de esa página). El campo opcional
// `pokemonBase` indica la forma base de la página, útil para agrupar variantes.

// Nombre de la forma base de la página (para agrupar variantes en el frontend).
// Elimina prefijos/sufijos de forma alternativa comunes del título de la página.
function baseFormName(pageTitle) {
  let n = (pageTitle || '').trim();
  n = n.replace(/^(Mega|Gigamax|Gigantamax|Primigenio|Primal)[- ]/i, '');
  n = n.replace(/\s+(de|forma)\s+(Alola|Galar|Hisui|Paldea)$/i, '');
  n = n.replace(/\s+forma\s+.*$/i, '');
  return n.trim();
}

// Busca un sprite específico de la subsección justo por encima de la tabla.
// Si no lo hay, devuelve '' (el llamador usará el sprite principal de la página).
function extractSubsectionSprite($, tableEl) {
  let prev = $(tableEl).prev();
  let g = 0;
  while (prev.length && g < 10) {
    const imgs = prev
      .find('img')
      .filter((_, im) => !$(im).closest('table.tabpokemon.caracteristicas').length);
    if (imgs.length) {
      const src = $(imgs[0]).attr('src') || $(imgs[0]).attr('data-src') || '';
      if (src) return src;
    }
    prev = prev.prev();
    g++;
  }
  return '';
}

// Extrae los 6 stats base de una tabla concreta.
function statsFromTable($, $table) {
  const stats = {};
  $table.find('tbody tr').each((_, el) => {
    const th = $(el).find('th').first();
    const name = (th.find('a').last().text().trim() || th.text().trim()).replace(/\s+/g, ' ');
    const td = $(el).find('td').first();
    const value = parseInt(td.text().trim(), 10);
    if (name && STAT_MAP[name] && !Number.isNaN(value)) {
      stats[STAT_MAP[name]] = value;
    }
  });
  return stats;
}

// Devuelve todas las tablas de stats dentro de "Características de combate",
// junto con el encabezado (h3) más cercano por encima de cada una en el DOM.
function extractSectionTables($) {
  const root = $('.mw-parser-output').length ? $('.mw-parser-output') : $('#mw-content-text');
  const nodes = [];
  root.find('*').each((_, el) => {
    const tag = el.tagName;
    if (tag === 'h2' || tag === 'h3') {
      nodes.push({ type: 'head', tag, text: $(el).find('.mw-headline').text().trim() || $(el).text().trim() });
    } else if (tag === 'table' && $(el).hasClass('tabpokemon') && $(el).hasClass('caracteristicas')) {
      nodes.push({ type: 'table', el });
    }
  });

  const out = [];
  let inCombate = false;
  let currentSub = null;
  for (const n of nodes) {
    if (n.type === 'head') {
      if (n.tag === 'h2') {
        inCombate = n.text === 'Características de combate';
        currentSub = null;
      } else if (inCombate) {
        currentSub = n.text;
      }
      continue;
    }
    if (inCombate) out.push({ heading: currentSub, tableEl: n.el });
  }
  return out;
}

function extractName($) {
  return ($('.mw-page-title-main').first().text() || $('h1#firstHeading').text()).trim();
}

function makeEntry({ id, name, slug, types, sprite, stats, base }) {
  const statValues = Object.values(stats);
  const total = statValues.length ? statValues.reduce((a, b) => a + b, 0) : 0;
  return { id, name, slug, types, sprite, stats, total, pokemonBase: base };
}

// Genera UNA entrada por cada tabla de stats de la página.
function buildEntries($, slug) {
  const pageTitle = extractName($);
  const types = extractTypes($);
  const mainSprite = extractImage($);
  const nationalNumber = extractNationalNumber($);
  const base = baseFormName(pageTitle);

  const sectionTables = extractSectionTables($);
  const entries = [];
  const warns = [];

  if (sectionTables.length) {
    for (const { heading, tableEl } of sectionTables) {
      const stats = statsFromTable($, $(tableEl));
      if (!Object.keys(stats).length) continue;
      const sprite = extractSubsectionSprite($, tableEl) || mainSprite;
      const name = heading && heading !== 'Características de combate' ? heading : pageTitle;
      entries.push(makeEntry({ id: nationalNumber, name, slug, types, sprite, stats, base }));
    }
  }

  // Fallback: si la página no tiene la sección, usa todas las tablas de stats.
  if (!entries.length) {
    $('table.tabpokemon.caracteristicas').each((_, el) => {
      const stats = statsFromTable($, $(el));
      if (!Object.keys(stats).length) return;
      entries.push(makeEntry({ id: nationalNumber, name: pageTitle, slug, types, sprite: mainSprite, stats, base }));
    });
    if (entries.length) {
      warns.push(`Sin sección "Características de combate"; usado fallback (todas las tablas) para ${pageTitle}.`);
    }
  }

  return { entries, warns };
}

async function main() {
  const list = await getPokemonList();
  console.log(`Total de Pokémon a procesar: ${list.length}`);

  const results = [];
  const errors = [];
  const warnings = [];

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const url = `${BASE}/wiki/${encodeURIComponent(p.slug)}`;
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const { entries, warns } = buildEntries($, p.slug);
      if (!entries.length) {
        throw new Error('No se encontraron stats');
      }
      for (const e of entries) results.push(e);
      for (const w of warns) {
        warnings.push({ name: p.name, slug: p.slug, warning: w });
        console.warn(`[${i + 1}/${list.length}] WARN ${p.name}: ${w}`);
      }
      console.log(`[${i + 1}/${list.length}] OK  ${p.name} -> ${entries.length} entrada(s)`);
    } catch (e) {
      errors.push({ name: p.name, slug: p.slug, error: e.message });
      console.error(`[${i + 1}/${list.length}] FAIL ${p.name}: ${e.message}`);
    }

    if ((i + 1) % 50 === 0) save(results, errors, warnings);
    if (i < list.length - 1) await sleep(DELAY);
  }

  save(results, errors, warnings);
  console.log(`\n=== Finalizado ===`);
  console.log(`Guardados: ${results.length}`);
  console.log(`Fallidos: ${errors.length}`);
  console.log(`Advertencias (revisar scrape-warnings.json): ${warnings.length}`);
  if (errors.length) {
    console.log('Pokémon que fallaron:');
    errors.forEach((e) => console.log(`  - ${e.name}: ${e.error}`));
  }
}

function save(results, errors, warnings = []) {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  fs.writeFileSync(
    path.resolve(__dirname, 'scrape-errors.json'),
    JSON.stringify(errors, null, 2)
  );
  fs.writeFileSync(
    path.resolve(__dirname, 'scrape-warnings.json'),
    JSON.stringify(warnings, null, 2)
  );
  console.log(`  (progreso guardado: ${results.length} Pokémon)`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('Error fatal en el scraper:', e);
    process.exit(1);
  });
}

module.exports = { buildEntries, extractTypes };
