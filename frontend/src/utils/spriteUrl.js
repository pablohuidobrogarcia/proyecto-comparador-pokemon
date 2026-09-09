const REGION_SUFFIX = {
  alola: 'alola',
  galar: 'galar',
  hisui: 'hisui',
  paldea: 'paldea',
};

const FORM_SUFFIX = {
  rotom: {
    calor: 'heat',
    lavado: 'wash',
    frío: 'frost',
    ventilador: 'fan',
    corte: 'mow',
  },
  wormadam: { 'tronco planta': 'base', 'tronco arena': 'sandy', 'tronco basura': 'trash' },
  deoxys: { normal: 'base', ataque: 'attack', defensa: 'defense', velocidad: 'speed' },
  giratina: { origen: 'origin' },
  shaymin: { tierra: 'base', cielo: 'sky' },
  landorus: { avatar: 'therian' },
  thundurus: { avatar: 'therian' },
  tornadus: { avatar: 'therian' },
  enamorus: { avatar: 'therian' },
  zacian: { 'espada suprema': 'crowned', 'guerrero avezado': 'crowned' },
  zamazenta: { 'escudo supremo': 'crowned', 'guerrero avezado': 'crowned' },
  groudon: { primigenio: 'primal' },
  kyogre: { primigenio: 'primal' },
  aegislash: { filo: 'blade' },
  zygarde: { '10%': '10', '50%': 'base', completa: 'complete' },
  terapagos: { normal: 'base', astral: 'stellar', teracristal: 'terastal' },
};

// Pokémon sin sprite en Pokémon Showdown (ni animado ni estático): se usará
// el arte oficial de PokeAPI (HOME). La clave es el slug base en español.
const NO_SHOWDOWN = {
  bramaluna: { slug: 'roaring-moon', id: 1005 },
  colagrito: { slug: 'scream-tail', id: 985 },
  colmilargo: { slug: 'great-tusk', id: 984 },
  electrofuria: { slug: 'raging-bolt', id: 1021 },
  ferrocuello: { slug: 'iron-jugulis', id: 993 },
  ferrodada: { slug: 'iron-valiant', id: 1006 },
  ferromole: { slug: 'iron-bundle', id: 991 },
  ferropaladin: { slug: 'iron-boulder', id: 1022 },
  ferropalmas: { slug: 'iron-hands', id: 992 },
  ferropolilla: { slug: 'iron-moth', id: 994 },
  ferropuas: { slug: 'iron-thorns', id: 995 },
  ferrosaco: { slug: 'iron-treads', id: 990 },
  ferrotesta: { slug: 'iron-crown', id: 1023 },
  ferroverdor: { slug: 'iron-leaves', id: 1010 },
  flamariete: { slug: 'gouging-fire', id: 1020 },
  furioseta: { slug: 'slither-wing', id: 988 },
  melenaleteo: { slug: 'flutter-mane', id: 987 },
  ondulagua: { slug: 'walking-wake', id: 1009 },
  pelarena: { slug: 'sandy-shocks', id: 989 },
  reptalada: { slug: 'brute-bonnet', id: 986 },
  'tauros-paldea': { slug: 'tauros-paldea-combat', id: 10250 },
};

// Renombres de slug hacia Pokémon Showdown (nombres en español distintos).
const SLUG_OVERRIDES = { codigocero: 'typenull' };

function slugifyBase(base) {
  return String(base || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function stripBase(name, baseSlug) {
  let rest = name;
  if (baseSlug) {
    rest = name.replace(new RegExp('^' + baseSlug + '[-\\s]*', 'i'), '');
  }
  return rest.replace(/^forma[\s]+/i, '').trim().toLowerCase();
}

export function showdownSpriteSlug(name, pokemonBase) {
  const raw = String(name || '').trim();
  if (!raw) return '';

  const baseSlug = slugifyBase(pokemonBase) || slugifyBase(raw);

  if (SLUG_OVERRIDES[baseSlug]) return SLUG_OVERRIDES[baseSlug];

  const region = /^(.+)\s+de\s+(alola|galar|hisui|paldea)$/i.exec(raw);
  if (region) return `${baseSlug}-${region[2].toLowerCase()}`;

  const mega = /^mega[\s-]+(.+)$/i.exec(raw);
  if (mega) {
    const rest = mega[1].trim().toLowerCase();
    if (rest.endsWith(' x')) return `${baseSlug}-megax`;
    if (rest.endsWith(' y')) return `${baseSlug}-megay`;
    return `${baseSlug}-mega`;
  }

  if (/^gigamax[\s-]+/i.test(raw) || /\s+gigamax$/i.test(raw)) return baseSlug;

  const qualifier = stripBase(raw, baseSlug);
  if (qualifier) {
    const mapped = FORM_SUFFIX[baseSlug]?.[qualifier];
    if (mapped === 'base') return baseSlug;
    if (mapped) return `${baseSlug}-${mapped}`;
  }

  return baseSlug;
}

export function showdownSpriteUrl(name, pokemonBase, kind) {
  const slug = showdownSpriteSlug(name, pokemonBase);
  if (!slug) return '';
  if (kind === 'gen5') return `https://play.pokemonshowdown.com/sprites/gen5/${slug}.png`;
  return `https://play.pokemonshowdown.com/sprites/ani/${slug}.gif`;
}

export function animatedSpriteUrl(name, pokemonBase) {
  return showdownSpriteUrl(name, pokemonBase, 'ani');
}

export function staticSpriteUrl(name, pokemonBase) {
  return showdownSpriteUrl(name, pokemonBase, 'gen5');
}

// Arte oficial de PokeAPI (HOME) para Pokémon sin sprite en Showdown.
export function homeArtworkUrl(name, pokemonBase) {
  const slug = showdownSpriteSlug(name, pokemonBase);
  const entry = slug && NO_SHOWDOWN[slug];
  return entry
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${entry.id}.png`
    : '';
}