import { useState, useMemo, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import moves from '../data/moves-dataset.json';
import { typeColor } from '../utils/typeColors';

const fuseOptions = {
  keys: ['name'],
  threshold: 0.4,
  ignoreLocation: true,
};

const fuse = new Fuse(moves, fuseOptions);
const MAX_MOVES = 4;

export default function MovePicker({ selected, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const selectedNames = new Set(selected.map((m) => m.name));
    return fuse
      .search(q)
      .map((r) => r.item)
      .filter((m) => !selectedNames.has(m.name))
      .slice(0, 8);
  }, [query, selected]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function pick(m) {
    if (selected.length >= MAX_MOVES) return;
    onChange([...selected, m]);
    setQuery('');
    setOpen(false);
  }

  function remove(name) {
    onChange(selected.filter((m) => m.name !== name));
  }

  return (
    <div className="move-picker" ref={wrapRef}>
      <div className="move-picker-header">
        <label>Movimientos ({selected.length}/{MAX_MOVES})</label>
      </div>

      {selected.length > 0 && (
        <div className="move-selected-list">
          {selected.map((m) => (
            <span key={m.name} className="move-selected-chip">
              <span
                className="move-chip-type"
                style={{ backgroundColor: typeColor(m.tipo) }}
              >
                {m.tipo}
              </span>
              <span className="move-chip-name">{m.name}</span>
              {m.categoria === 'Estado' && <span className="move-chip-estado">Estado</span>}
              <button type="button" className="move-chip-remove" onClick={() => remove(m.name)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length < MAX_MOVES && (
        <div className="move-search-wrap">
          <input
            type="text"
            placeholder="Buscar movimiento..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {open && suggestions.length > 0 && (
            <ul className="suggestions move-suggestions">
              {suggestions.map((m) => (
                <li key={m.name} onClick={() => pick(m)}>
                  <span
                    className="move-list-type"
                    style={{ backgroundColor: typeColor(m.tipo) }}
                  >
                    {m.tipo}
                  </span>
                  <span className="move-list-name">{m.name}</span>
                  <span className="move-list-cat">{m.categoria}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}