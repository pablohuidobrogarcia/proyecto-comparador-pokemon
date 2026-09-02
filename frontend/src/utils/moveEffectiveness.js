import typeChart from '../data/type-chart.json';

const VOLADOR = 'Volador';
const LUCHA = 'Lucha';
const HIELO = 'Hielo';
const TIERRA = 'Tierra';
const AGUA = 'Agua';

function baseMultiplier(attackerType, defenderTypes) {
  const defs = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
  let m = 1;
  defs.forEach((t) => {
    const v = typeChart[attackerType]?.[t];
    if (typeof v === 'number') m *= v;
  });
  return m;
}

export function moveEffectiveness(moveType, moveName, defenderTypes) {
  const name = (moveName || '').trim();

  // Mil Flechas: es un movimiento Tierra que, a diferencia de otros, SÍ afecta a
  // Pokémon Volador — pero a multiplicador ×1 (neutro), no ×0. Se calcula el
  // multiplicador de Tierra por cada tipo del defensor por separado; si el
  // componente Volador sería 0 (la inmunidad normal de Tierra contra Volador),
  // se sustituye por 1 (neutro) solo para ese componente. El resto de tipos se
  // calculan exactamente como Tierra estándar. No se simulan habilidades
  // rivales ni estados de vuelo.
  if (name === 'Mil Flechas') {
    const defs = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
    let m = 1;
    for (const t of defs) {
      let v = typeChart[TIERRA]?.[t];
      if (typeof v !== 'number') v = 1;
      if (t === VOLADOR && v === 0) v = 1;
      m *= v;
    }
    return m;
  }

  // Plancha Voladora: calcula el multiplicador como Lucha Y Volador
  // simultáneamente — multiplica el multiplicador de Lucha por el de Volador
  // contra el tipo defensor de cada fila.
  if (name === 'Plancha Voladora') {
    return baseMultiplier(LUCHA, defenderTypes) * baseMultiplier(VOLADOR, defenderTypes);
  }

  // Liofilización: se trata como tipo Hielo normal para TODOS los tipos
  // EXCEPTO Agua, donde el multiplicador se fija manualmente en x2
  // (ignorando lo que diría la tabla estándar de Hielo, que sería x0.5).
  if (name === 'Liofilización') {
    const defs = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
    if (defs.includes(AGUA)) return 2;
    return baseMultiplier(HIELO, defenderTypes);
  }

  // Caso general: usa el tipo del movimiento con la tabla de tipos.
  return baseMultiplier(moveType, defenderTypes);
}