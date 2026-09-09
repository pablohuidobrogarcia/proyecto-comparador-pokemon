import { useEffect, useMemo, useState, useCallback } from 'react';
import { showdownSpriteUrl, homeArtworkUrl } from '../utils/spriteUrl';

function megaBaseName(name) {
  return String(name).replace(/^mega[\s-]+/i, '').trim();
}

function buildCandidates(pokemon) {
  const out = [];
  const push = (url) => {
    if (url && !out.includes(url)) out.push(url);
  };

  push(showdownSpriteUrl(pokemon.name, pokemon.pokemonBase, 'ani'));
  push(showdownSpriteUrl(pokemon.name, pokemon.pokemonBase, 'gen5'));

  const baseName = megaBaseName(pokemon.name);
  if (baseName && baseName !== pokemon.name) {
    push(showdownSpriteUrl(baseName, pokemon.pokemonBase, 'ani'));
    push(showdownSpriteUrl(baseName, pokemon.pokemonBase, 'gen5'));
  }

  push(homeArtworkUrl(pokemon.name, pokemon.pokemonBase));
  push(pokemon.sprite || '');

  return out;
}

export default function PokemonSprite({ pokemon, className, alt }) {
  const urls = useMemo(() => buildCandidates(pokemon), [pokemon]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [urls]);

  const onError = useCallback(() => {
    setIndex((i) => (i + 1 < urls.length ? i + 1 : urls.length));
  }, [urls.length]);

  const src = index < urls.length ? urls[index] : '';
  if (!src) return null;

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