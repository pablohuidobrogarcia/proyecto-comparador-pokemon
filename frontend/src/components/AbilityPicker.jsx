import { useState, useRef, useEffect } from 'react';
import abilities from '../data/abilities.json';
import typeChart from '../data/type-chart.json';

const TYPES = Object.keys(typeChart);
const DEFAULT_ABILITY = 'Ninguna';

export default function AbilityPicker({ selection, onChange }) {
  const ability = selection?.ability || DEFAULT_ABILITY;
  const multiType = selection?.multiType || '';
  const [infoOpen, setInfoOpen] = useState(false);
  const wrapRef = useRef(null);

  const current = abilities.find((a) => a.name === ability) || abilities[0];

  useEffect(() => {
    if (!infoOpen) return undefined;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setInfoOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [infoOpen]);

  function changeAbility(name) {
    onChange({ ability: name, multiType: name === 'Multitipo' ? multiType : '' });
  }

  return (
    <div className="ability-picker" ref={wrapRef}>
      <div className="ability-row">
        <div className="ability-field">
          <label>Elegir una habilidad</label>
          <select value={ability} onChange={(e) => changeAbility(e.target.value)}>
            {abilities.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="ability-info"
          title="Ver descripción"
          aria-label="Ver descripción"
          onClick={() => setInfoOpen((o) => !o)}
        >
          ⓘ
        </button>
      </div>

      {ability === 'Multitipo' && (
        <div className="ability-field ability-type-field">
          <label>¿Qué tipo?</label>
          <select
            value={multiType}
            onChange={(e) => onChange({ ability, multiType: e.target.value })}
          >
            <option value="">— Elige un tipo —</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {infoOpen && <div className="ability-popover">{current.description}</div>}
    </div>
  );
}