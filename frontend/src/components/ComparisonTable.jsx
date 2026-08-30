const ROWS = [
  { key: 'ps', label: 'PS' },
  { key: 'ataque', label: 'Ataque' },
  { key: 'defensa', label: 'Defensa' },
  { key: 'ataqueEspecial', label: 'Ataque Especial' },
  { key: 'defensaEspecial', label: 'Defensa Especial' },
  { key: 'velocidad', label: 'Velocidad' },
  { key: 'total', label: 'Total' },
];

export default function ComparisonTable({ pokemon, colors }) {
  if (!pokemon.length) return null;

  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th>Estadística</th>
          {pokemon.map((p, i) => (
            <th key={p.id} style={{ color: colors[i % colors.length] }}>
              {p.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map(({ key, label }) => {
          const values = pokemon.map((p) =>
            key === 'total' ? p.total : p.stats?.[key] ?? 0
          );
          const max = Math.max(...values);
          return (
            <tr key={key}>
              <td className="stat-label">{label}</td>
              {pokemon.map((p, i) => {
                const v = values[i];
                const isMax = max > 0 && v === max;
                return (
                  <td
                    key={p.id}
                    className={isMax ? 'cell-max' : ''}
                    style={isMax ? { color: colors[i % colors.length] } : undefined}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
