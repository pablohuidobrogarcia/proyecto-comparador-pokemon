import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const STAT_KEYS = [
  { key: 'ps', label: 'PS' },
  { key: 'ataque', label: 'Ataque' },
  { key: 'defensa', label: 'Defensa' },
  { key: 'ataqueEspecial', label: 'At. Esp.' },
  { key: 'defensaEspecial', label: 'Def. Esp.' },
  { key: 'velocidad', label: 'Velocidad' },
];

export default function StatsRadarChart({ pokemon, colors }) {
  if (!pokemon.length) return null;

  const data = STAT_KEYS.map(({ key, label }) => {
    const row = { stat: label };
    pokemon.forEach((p) => {
      row[p.name] = p.stats?.[key] ?? 0;
    });
    return row;
  });

  return (
    <div className="radar-wrap">
      <ResponsiveContainer width="100%" height={330}>
        <RadarChart data={data} outerRadius="62%">
          <PolarGrid />
          <PolarAngleAxis dataKey="stat" />
          <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
          {pokemon.map((p, i) => (
            <Radar
              key={p.id}
              name={p.name}
              dataKey={p.name}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.18}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
