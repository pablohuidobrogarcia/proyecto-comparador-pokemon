import { useMemo, useState, useRef, useCallback } from 'react';
import { animatedSpriteUrl } from '../utils/spriteUrl';

export default function PokemonSprite({ pokemon, className, alt }) {
  const animated = useMemo(
    () => animatedSpriteUrl(pokemon.name, pokemon.pokemonBase),
    [pokemon.name, pokemon.pokemonBase]
  );
  const fallback = pokemon.sprite || '';

  const [src, setSrc] = useState(animated || fallback);
  const tried = useRef(false);

  const onError = useCallback(() => {
    if (tried.current) return;
    tried.current = true;
    if (fallback && src !== fallback) setSrc(fallback);
  }, [fallback, src]);

  return (
    <img
      className={className}
      src={src}
      alt={alt ?? pokemon.name}
      loading="lazy"
      onError={onError}
    />
  );
}