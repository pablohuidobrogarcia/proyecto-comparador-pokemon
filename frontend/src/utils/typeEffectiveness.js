import typeChart from '../data/type-chart.json';

export function checkTypeEffectiveness(attackerType, defenderTypes) {
  const defTypes = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
  let mult = 1;
  defTypes.forEach((t) => {
    const m = typeChart[attackerType]?.[t];
    if (typeof m === 'number') mult *= m;
  });
  return mult;
}

const VOLADOR = 'Volador';

export function effectiveMultiplier(attackerType, defender, ability, multiType) {
  const mods = ability?.modifiers || {};

  // 1. Multitipo: sustituye el/los tipo(s) real(es) por el tipo elegido.
  //    Si no hay tipo elegido, no se aplica ningún efecto (se usa el tipo real).
  let types = defender.types ?? [];
  if (mods.overrideType && multiType) types = [multiType];

  // 2. Multiplicador base con la tabla de tipos.
  const contributions = types.map((t) => typeChart[attackerType]?.[t] ?? 1);

  // 3. Ráfaga Delta: neutraliza la contribución del tipo Volador si es una
  //    debilidad (>= 2), dejando intacta la contribución del otro tipo.
  if (mods.neutralizeFlyingComponent && types.includes(VOLADOR)) {
    const flying = contributions[types.indexOf(VOLADOR)];
    if (flying >= 2) {
      let mult = 1;
      for (let i = 0; i < contributions.length; i += 1) {
        mult *= types[i] === VOLADOR ? 1 : contributions[i];
      }
      return mult;
    }
  }

  let mult = contributions.reduce((a, b) => a * b, 1);

  // 4. immune(tipo): máxima prioridad, el resultado final es 0.
  if (mods.immune?.includes(attackerType)) return 0;

  // 5. Teracaparazón: fija en 0.5 cualquier debilidad (>= 2). Se aplica
  //    siempre, sin condición de PS: el comparador no rastrea PS, así que se
  //    asume el caso favorable de que el Pokémon está con PS completos.
  if (mods.capWeaknessToHalf && mult >= 2) mult = 0.5;

  // 6. Armadura Prisma / Filtro / Roca Sólida: reduce el daño de supereficaces.
  if (mods.reduceSuperEffective != null && mult >= 2) mult *= mods.reduceSuperEffective;

  // 7. multiply(tipo, factor): para cada modificador cuyo tipo coincide con el
  //    de la fila (una habilidad puede tener varios, ej. Piel Seca o Sebo).
  (mods.multiply || []).forEach(({ type, factor }) => {
    if (type === attackerType) mult *= factor;
  });

  return mult;
}