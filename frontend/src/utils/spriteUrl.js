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
  wormadam: { 'tronco planta': 'plant', 'tronco arena': 'sandy', 'tronco basura': 'trash' },
  deoxys: { normal: 'normal', ataque: 'attack', defensa: 'defense', velocidad: 'speed' },
  giratina: { origen: 'origin' },
  shaymin: { tierra: 'land', cielo: 'sky' },
  landorus: { avatar: 'therian' },
  thundurus: { avatar: 'therian' },
  tornadus: { avatar: 'therian' },
  enamorus: { avatar: 'therian' },
  zacian: { 'espada suprema': 'crowned', 'guerrero avezado': 'crowned' },
  zamazenta: { 'escudo supremo': 'crowned', 'guerrero avezado': 'crowned' },
  groudon: { primigenio: 'primal' },
  kyogre: { primigenio: 'primal' },
  aegislash: { filo: 'blade' },
  zygarde: { '10%': '10', '50%': '50', completa: 'complete' },
};

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
    if (mapped) return `${baseSlug}-${mapped}`;
  }

  return baseSlug;
}

export function animatedSpriteUrl(name, pokemonBase) {
  const slug = showdownSpriteSlug(name, pokemonBase);
  return slug ? `https://play.pokemonshowdown.com/sprites/ani/${slug}.gif` : '';
}