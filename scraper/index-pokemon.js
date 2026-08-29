const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (pokemon-comparator-scraper; https://github.com/)';

// Categorías por generación en WikiDex (URLs ya codificadas para evitar problemas de encoding).
const CATEGORIES = [
  'Categor%C3%ADa:Pok%C3%A9mon_de_primera_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_segunda_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_tercera_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_cuarta_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_quinta_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_sexta_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_s%C3%A9ptima_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_octava_generaci%C3%B3n',
  'Categor%C3%ADa:Pok%C3%A9mon_de_novena_generaci%C3%B3n',
];

async function fetchCategoryMembers(category) {
  const url = `https://www.wikidex.net/wiki/${category}`;
  const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
  const $ = cheerio.load(res.data);
  const found = new Map(); // name -> slug

  // Los miembros de la categoría se listan dentro de div.mw-category o div#mw-pages.
  $('div.mw-category a, div#mw-pages a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const title = $(el).attr('title') || '';
    if (!href.startsWith('/wiki/')) return;
    if (title.includes(':')) return; // ignorar espacios de nombres (Categoría:, WikiDex:, etc.)
    const slug = decodeURIComponent(href.replace('/wiki/', ''));
    if (!found.has(title)) found.set(title, slug);
  });

  return [...found.entries()].map(([name, slug]) => ({ name, slug }));
}

async function getPokemonList() {
  const seen = new Map();
  for (const cat of CATEGORIES) {
    try {
      const members = await fetchCategoryMembers(cat);
      for (const m of members) {
        if (!seen.has(m.name)) seen.set(m.name, m.slug);
      }
      console.log(`Categoría ${cat}: ${members.length} entradas`);
    } catch (e) {
      console.error(`Error al procesar ${cat}: ${e.message}`);
    }
  }
  return [...seen.entries()].map(([name, slug]) => ({ name, slug }));
}

module.exports = { getPokemonList, CATEGORIES };

// Si se ejecuta directamente, genera scraper/pokemon-index.json
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  (async () => {
    const list = await getPokemonList();
    const out = path.resolve(__dirname, 'pokemon-index.json');
    fs.writeFileSync(out, JSON.stringify(list, null, 2));
    console.log(`Índice guardado: ${list.length} Pokémon en ${out}`);
  })();
}
