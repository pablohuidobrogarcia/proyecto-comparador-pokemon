import PokemonSprite from './PokemonSprite';
import { moveEffectiveness } from '../utils/moveEffectiveness';
import { typeColor } from '../utils/typeColors';
import typeChart from '../data/type-chart.json';

const TYPE_ORDER = Object.keys(typeChart);

function fmt(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function multLabel(mult) {
  if (mult === 0) return { text: '0', cls: 'cov-zero' };
  if (mult === 0.25) return { text: '¼', cls: 'cov-resist' };
  if (mult === 0.5) return { text: '½', cls: 'cov-resist' };
  if (mult === 1) return { text: '', cls: '' };
  if (mult > 1) return { text: `${fmt(mult)}×`, cls: 'cov-weak' };
  return { text: fmt(mult), cls: 'cov-resist' };
}

export default function OffensiveCoverageTable({ pokemon, moveSelections, colors }) {
  const pokemonWithMoves = pokemon.filter((p) => {
    const moves = moveSelections?.[p.id] || [];
    return moves.some((m) => m.esDaño);
  });

  if (!pokemonWithMoves.length) return null;

  return (
    <section className="table-section coverage-section offensive-section">
      <h2>Cobertura ofensiva</h2>
      {pokemonWithMoves.map((p, pi) => {
        const allMoves = moveSelections?.[p.id] || [];
        const damageMoves = allMoves.filter((m) => m.esDaño);
        if (!damageMoves.length) return null;

        return (
          <div key={p.id} className="offensive-block">
            <div className="offensive-poke-header">
              {p.sprite && <PokemonSprite pokemon={p} alt="" />}
              <span style={{ color: colors[pi % colors.length] }}>{p.name}</span>
            </div>
            <div className="table-wrapper">
              <table className="coverage-table offensive-table">
                <thead>
                  <tr>
                    <th className="cov-attr">Defensor ↓</th>
                    {damageMoves.map((m) => (
                      <th key={m.name}>
                        <div className="offensive-move-header">
                          <span
                            className="move-header-type"
                            style={{ backgroundColor: typeColor(m.tipo) }}
                          >
                            {m.tipo}
                          </span>
                          <span className="move-header-name">{m.name}</span>
                        </div>
                      </th>
                    ))}
                    <th>Mejor</th>
                  </tr>
                </thead>
                <tbody>
                  {TYPE_ORDER.map((defender, r) => {
                    const mults = damageMoves.map((m) =>
                      moveEffectiveness(m.tipo, m.name, [defender])
                    );
                    const best = Math.max(...mults);
                    const bestLabel = multLabel(best);
                    return (
                      <tr key={defender} className={r % 2 === 1 ? 'cov-even' : 'cov-odd'}>
                        <td className="cov-type-cell">
                          <span
                            className="type-badge cov-type-badge"
                            style={{ backgroundColor: typeColor(defender) }}
                          >
                            {defender}
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
                        <td className={bestLabel.cls}>{bestLabel.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}