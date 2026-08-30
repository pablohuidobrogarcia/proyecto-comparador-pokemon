import PokemonSprite from './PokemonSprite';

const TYPE_COLORS = {
  Planta: '#78C850',
  Veneno: '#A040A0',
  Fuego: '#F08030',
  Agua: '#6890F0',
  Bicho: '#A8B820',
  Normal: '#A8A878',
  Eléctrico: '#F8D030',
  Tierra: '#E0C068',
  Volador: '#A890F0',
  Psíquico: '#F85888',
  Lucha: '#C03028',
  Fantasma: '#705898',
  Acero: '#B8B8D0',
  Hada: '#EE99AC',
  Siniestro: '#705848',
  Dragón: '#7038F8',
  Roca: '#B8A038',
  Hielo: '#98D8D8',
  Volador2: '#A890F0',
};

export function typeColor(type) {
  return TYPE_COLORS[type] || '#777';
}

export default function PokemonCard({ pokemon, color, onRemove }) {
  if (!pokemon) return null;
  return (
    <div className="pokemon-card" style={{ borderColor: color }}>
      <button className="remove-btn" onClick={onRemove} title="Quitar">
        ×
      </button>
      {pokemon.sprite && <PokemonSprite pokemon={pokemon} className="card-sprite" />}
      <h3 className="card-name" style={{ color }}>
        {pokemon.name}
      </h3>
      <div className="card-types">
        {pokemon.types.map((t) => (
          <span
            key={t}
            className="type-badge"
            style={{ backgroundColor: typeColor(t) }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="card-total">Total: {pokemon.total}</div>
    </div>
  );
}
