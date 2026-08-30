import { useState, useMemo, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import PokemonSprite from './PokemonSprite';

const fuseOptions = {
  keys: ['name'],
  threshold: 0.4,
  ignoreLocation: true,
};

export default function SearchBox({ label, pokemonList, exclude, onSelect, disabled }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const fuse = useMemo(() => new Fuse(pokemonList, fuseOptions), [pokemonList]);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const results = fuse
      .search(q)
      .map((r) => r.item)
      .filter((p) => !exclude.includes(p.name))
      .slice(0, 8);
    return results;
  }, [query, fuse, exclude]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function pick(p) {
    onSelect(p);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="search-box" ref={boxRef}>
      <label>{label}</label>
      <input
        type="text"
        placeholder={disabled ? 'Máximo alcanzado' : 'Escribe un Pokémon...'}
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((p) => (
            <li key={p.id} onClick={() => pick(p)}>
              {p.sprite && <PokemonSprite pokemon={p} alt="" />}
              <span>{p.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
