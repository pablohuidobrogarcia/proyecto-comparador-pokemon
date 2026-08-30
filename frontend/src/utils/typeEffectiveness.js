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