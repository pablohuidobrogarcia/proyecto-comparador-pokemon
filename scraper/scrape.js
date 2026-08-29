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

function extractStats($) {
  const stats = {};
  const table = $('table.tabpokemon.caracteristicas');
  table.find('tbody tr').each((_, el) => {
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

function extractName($) {
  return ($('.mw-page-title-main').first().text() || $('h1#firstHeading').text()).trim();
}

function buildEntry($, slug) {
  const name = extractName($);
  const types = extractTypes($);
  const sprite = extractImage($);
  const nationalNumber = extractNationalNumber($);
  const stats = extractStats($);
  const statValues = Object.values(stats);
  const total = statValues.length ? statValues.reduce((a, b) => a + b, 0) : 0;
  return {
    id: nationalNumber,
    name,
    slug,
    types,
    sprite,
    stats,
    total,
  };
}

async function main() {
  const list = await getPokemonList();
  console.log(`Total de Pokémon a procesar: ${list.length}`);

  const results = [];
  const errors = [];

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const url = `${BASE}/wiki/${encodeURIComponent(p.slug)}`;
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const entry = buildEntry($, p.slug);
      if (!entry.stats || Object.keys(entry.stats).length === 0) {
        throw new Error('No se encontraron stats base');
      }
      results.push(entry);
      console.log(`[${i + 1}/${list.length}] OK  ${entry.name} (#${entry.id})`);
    } catch (e) {
      errors.push({ name: p.name, slug: p.slug, error: e.message });
      console.error(`[${i + 1}/${list.length}] FAIL ${p.name}: ${e.message}`);
    }

    if (results.length % SAVE_EVERY === 0) save(results, errors);
    if (i < list.length - 1) await sleep(DELAY);
  }

  save(results, errors);
  console.log(`\n=== Finalizado ===`);
  console.log(`Guardados: ${results.length}`);
  console.log(`Fallidos: ${errors.length}`);
  if (errors.length) {
    console.log('Pokémon que fallaron:');
    errors.forEach((e) => console.log(`  - ${e.name}: ${e.error}`));
  }
}

function save(results, errors) {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  fs.writeFileSync(
    path.resolve(__dirname, 'scrape-errors.json'),
    JSON.stringify(errors, null, 2)
  );
  console.log(`  (progreso guardado: ${results.length} Pokémon)`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('Error fatal en el scraper:', e);
    process.exit(1);
  });
}

module.exports = { buildEntry, extractStats, extractTypes };
