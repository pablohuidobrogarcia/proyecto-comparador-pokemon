import PokemonSprite from './PokemonSprite';
import { typeColor } from '../utils/typeColors';

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
