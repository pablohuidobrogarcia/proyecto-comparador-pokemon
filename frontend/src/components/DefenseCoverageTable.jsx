import PokemonSprite from './PokemonSprite';
import { checkTypeEffectiveness } from '../utils/typeEffectiveness';
import { typeColor } from '../utils/typeColors';

const TYPE_ORDER = [
  'Normal',
  'Fuego',
  'Agua',
  'Eléctrico',
  'Planta',
  'Hielo',
  'Lucha',
  'Veneno',
  'Tierra',
  'Volador',
  'Psíquico',
  'Bicho',
  'Roca',
  'Fantasma',
  'Dragón',
  'Siniestro',
  'Acero',
  'Hada',
];

function multLabel(mult) {
  if (mult === 0) return { text: '0', cls: 'cov-zero' };
  if (mult === 0.25) return { text: '¼', cls: 'cov-resist' };
  if (mult === 0.5) return { text: '½', cls: 'cov-resist' };
  if (mult === 2) return { text: '2×', cls: 'cov-weak' };
  if (mult === 4) return { text: '4×', cls: 'cov-weak' };
  return { text: '', cls: '' };
}

function totalStyle(show, count, isWeak) {
  if (!show) return undefined;
  const alpha = Math.min(0.7, 0.06 + count * 0.11);
  return isWeak
    ? { backgroundColor: `rgba(220, 38, 38, ${alpha})`, color: '#fff' }
    : { backgroundColor: `rgba(16, 128, 70, ${alpha})`, color: '#fff' };
}

export default function DefenseCoverageTable({ pokemon, colors }) {
  if (!pokemon.length) return null;

  const rows = TYPE_ORDER.map((attacker) => {
    const mults = pokemon.map((p) =>
      checkTypeEffectiveness(attacker, p.types ?? [])
    );
    const weakCount = mults.filter((m) => m > 1).length;
    const resistCount = mults.filter((m) => m < 1).length;
    return { attacker, mults, weakCount, resistCount };
  });

  return (
    <section className="table-section coverage-section">
      <h2>La cobertura defensiva</h2>
      <div className="table-wrapper">
        <table className="coverage-table">
          <thead>
            <tr>
              <th className="cov-attr">Ataq. ↓</th>
              {pokemon.map((p, i) => (
                <th key={p.id}>
                  <div className="cov-poke">
                    {p.sprite && <PokemonSprite pokemon={p} alt="" />}
                    <span style={{ color: colors[i % colors.length] }}>{p.name}</span>
                  </div>
                </th>
              ))}
              <th>Total<br />Débil.</th>
              <th>Total<br />Resist.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ attacker, mults, weakCount, resistCount }, r) => (
              <tr key={attacker} className={r % 2 === 1 ? 'cov-even' : 'cov-odd'}>
                <td className="cov-type-cell">
                  <span
                    className="type-badge cov-type-badge"
                    style={{ backgroundColor: typeColor(attacker) }}
                  >
                    {attacker}
                  </span>
                </td>
                {mults.map((m, mi) => {
                  const { text, cls } = multLabel(m);
                  return (
                    <td key={mi} className={cls}>
                      {text}
                    </td>
                  );
                })}
                <td
                  className="cov-total"
                  style={totalStyle(weakCount > 0, weakCount, true)}
                >
                  {weakCount}
                </td>
                <td
                  className="cov-total"
                  style={totalStyle(resistCount > 0, resistCount, false)}
                >
                  {resistCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}