const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const URL_MOVES = 'https://www.wikidex.net/wiki/Lista_de_movimientos';
const USER_AGENT = 'Mozilla/5.0 (pokemon-comparator-scraper; https://github.com/)';
const OUTPUT = path.resolve(__dirname, '../frontend/src/data/moves-dataset.json');

const TYPE_MAP = {
  Normal: 'Normal', Fuego: 'Fuego', Agua: 'Agua', Eléctrico: 'Eléctrico',
  Planta: 'Planta', Hielo: 'Hielo', Pelea: 'Lucha', Lucha: 'Lucha',
  Veneno: 'Veneno', Tierra: 'Tierra', Volador: 'Volador', Psíquico: 'Psíquico',
  Insecto: 'Bicho', Bicho: 'Bicho', Roca: 'Roca', Fantasma: 'Fantasma',
  Dragón: 'Dragón', Siniestro: 'Siniestro', Acero: 'Acero', Hada: 'Hada',
};

const CATEGORY_MAP = {
  físico: 'Físico',
  especial: 'Especial',
  'de estado': 'Estado',
};

function cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function stripSup(html) {
  return (html || '').replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '');
}

function extractName($cell) {
  const regional = $cell.find('span.regional-lang-switch span[lang="es-419"]').first();
  if (regional.length) {
    return cleanText(regional.text()).replace(/[\d]+$/, '');
  }
  const link = $cell.find('a').first();
  if (link.length) {
    return cleanText(link.text()).replace(/[\d]+$/, '');
  }
  return cleanText(stripSup($cell.html())).replace(/[\d]+$/, '');
}

function extractType($cell) {
  const regional = $cell.find('span[lang="es-419"] img[alt^="Tipo "]').first();
  const img = regional.length ? regional : $cell.find('img[alt^="Tipo "]').first();
  if (!img.length) return null;
  const alt = img.attr('alt') || '';
  let raw = alt.replace(/^Tipo\s+/i, '');
  raw = raw.charAt(0).toUpperCase() + raw.slice(1);
  return TYPE_MAP[raw] || raw;
}

function extractCategory($cell) {
  const img = $cell.find('img[alt^="Clase "]').first();
  if (!img.length) return null;
  const alt = img.attr('alt') || '';
  const raw = alt.replace(/^Clase\s+/i, '');
  return CATEGORY_MAP[raw] || raw;
}

function parseNumeric($cell) {
  if (!$cell.length) return null;
  const html = stripSup($cell.html());
  const text = cleanText(html);
  if (text === '-' || text === 'Varía' || text === 'Variable') return null;
  const num = parseInt(text, 10);
  return isNaN(num) ? null : num;
}

function extractMovesFromTable($, tableEl, isGigamax) {
  const moves = [];
  let cached = null;

  $(tableEl).find('tr').each((_, row) => {
    const tds = $(row).find('td');
    if (!tds.length) return;

    let name, desc, type, categoria, power, accuracy, pp;
    const cols = tds.length;

    const nameCell = tds.eq(1);
    const hasRowspan = nameCell.attr('rowspan') !== undefined;

    if (hasRowspan) {
      name = extractName(nameCell);
      desc = cleanText(tds.eq(3).text());
      type = extractType(tds.eq(4));
      power = parseNumeric(tds.eq(6));
      accuracy = isGigamax ? null : parseNumeric(tds.eq(7));
      pp = isGigamax ? null : parseNumeric(tds.eq(8));
      categoria = extractCategory(tds.eq(5));

      cached = { name, desc, type, power, accuracy, pp };
    } else if (cols <= 3 && cached) {
      name = cached.name;
      desc = cached.desc;
      type = cached.type;
      power = cached.power;
      accuracy = cached.accuracy;
      pp = cached.pp;
      categoria = extractCategory(tds.eq(1));
    } else {
      name = extractName(nameCell);
      desc = cleanText(tds.eq(3).text());
      type = extractType(tds.eq(4));
      categoria = extractCategory(tds.eq(5));
      power = parseNumeric(tds.eq(6));
      accuracy = isGigamax ? null : parseNumeric(tds.eq(7));
      pp = isGigamax ? null : parseNumeric(tds.eq(8));
    }

    const descLower = (desc || '').toLowerCase();
    const esZMove = descLower.includes('poder z');
    const esMax = isGigamax || descLower.includes('pokémon dinamax');

    moves.push({
      id: moves.length + 1,
      name,
      tipo: type,
      categoria,
      potencia: power,
      precision: accuracy,
      pp,
      esDaño: categoria === 'Físico' || categoria === 'Especial',
      esZMove,
      esMax,
    });
  });

  return moves;
}

async function main() {
  console.log('Fetching moves list from Wikidex...');
  const res = await axios.get(URL_MOVES, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 30000,
  });

  const $ = cheerio.load(res.data);

  const tables = $('table.tabpokemon.sortable.tablemanager').toArray();
  console.log(`Found ${tables.length} table(s)`);

  const mainMoves = extractMovesFromTable($, tables[0], false);
  console.log(`Main table: ${mainMoves.length} moves`);

  let allMoves = mainMoves;

  if (tables.length >= 2) {
    const gigamaxMoves = extractMovesFromTable($, tables[1], true);
    console.log(`Gigamax table: ${gigamaxMoves.length} moves`);
    for (const m of gigamaxMoves) {
      m.id = allMoves.length + 1;
      allMoves.push(m);
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(allMoves, null, 2));
  console.log(`\nSaved ${allMoves.length} moves to ${OUTPUT}`);

  const damage = allMoves.filter(m => m.esDaño).length;
  const status = allMoves.filter(m => !m.esDaño).length;
  const zMoves = allMoves.filter(m => m.esZMove).length;
  const maxMoves = allMoves.filter(m => m.esMax).length;

  console.log(`\n=== Stats ===`);
  console.log(`Total: ${allMoves.length}`);
  console.log(`Damage moves: ${damage}`);
  console.log(`Status moves: ${status}`);
  console.log(`Z-moves: ${zMoves}`);
  console.log(`Max moves: ${maxMoves}`);

  for (const name of ['Mil Flechas', 'Plancha Voladora', 'Liofilización']) {
    const m = allMoves.find(x => x.name === name);
    console.log(`\n${name}:`);
    console.log(JSON.stringify(m, null, 2));
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
}

module.exports = { extractType, extractCategory, parseNumeric };
