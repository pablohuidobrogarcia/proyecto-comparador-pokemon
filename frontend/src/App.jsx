import { useState } from 'react';
import dataset from './data/pokemon-dataset.json';
import SearchBox from './components/SearchBox';
import PokemonCard from './components/PokemonCard';
import StatsRadarChart from './components/RadarChart';
import ComparisonTable from './components/ComparisonTable';
import DefenseCoverageTable from './components/DefenseCoverageTable';
import OffensiveCoverageTable from './components/OffensiveCoverageTable';
import ConsolidatedOffensiveCoverage from './components/ConsolidatedOffensiveCoverage';

const MAX_COMPARE = 6;
const COLORS = ['#e63946', '#1d6fb8', '#2a9d8f', '#e9a000', '#8e44ad', '#d81b60'];

export default function App() {
  const [slots, setSlots] = useState(Array(MAX_COMPARE).fill(null));
  const [selections, setSelections] = useState({});
  const [moveSelections, setMoveSelections] = useState({});

  const selected = slots.filter(Boolean);
  const sorted = [...selected].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const exclude = selected.map((p) => p.name);

  function addPokemonToSlot(p, slotIndex) {
    if (slots.some((s) => s && s.id === p.id)) return;
    if (slots[slotIndex]) return;
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? p : s)));
  }

  function removeFromSlot(slotIndex) {
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
  }

  function updateSelection(id, patch) {
    setSelections((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function updateMoves(id, moves) {
    setMoveSelections((prev) => ({ ...prev, [id]: moves }));
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚔️ Comparador de Pokémon</h1>
        <p className="subtitle">
          Compara las estadísticas base de hasta {MAX_COMPARE} Pokémon. Datos obtenidos de
          Wikidex.
        </p>
      </header>

      <section className="search-section">
        {slots.map((occ, i) => (
          <SearchBox
            key={i}
            label={`Pokémon ${i + 1}`}
            pokemonList={dataset}
            exclude={exclude}
            occupied={occ}
            onSelect={(p) => addPokemonToSlot(p, i)}
          />
        ))}
      </section>

      {sorted.length === 0 && (
        <p className="empty-hint">
          Busca y selecciona Pokémon arriba para empezar a comparar.
        </p>
      )}

      {sorted.length > 0 && (
        <>
          <section className="cards-section">
            {slots.map((occ, i) =>
              occ ? (
                <PokemonCard
                  key={occ.id}
                  pokemon={occ}
                  color={COLORS[i % COLORS.length]}
                  onRemove={() => removeFromSlot(i)}
                  selection={selections[occ.id]}
                  onSelectionChange={(patch) => updateSelection(occ.id, patch)}
                  moveSelection={moveSelections[occ.id]}
                  onMoveChange={(moves) => updateMoves(occ.id, moves)}
                />
              ) : null
            )}
          </section>

          <div className="comparison-layout">
            <section className="chart-section">
              <h2>Gráfico de radar</h2>
              <StatsRadarChart pokemon={sorted} colors={COLORS} />
            </section>

            <section className="table-section">
              <h2>Tabla comparativa</h2>
              <div className="table-wrapper">
                <ComparisonTable pokemon={sorted} colors={COLORS} />
              </div>
            </section>
          </div>

          <DefenseCoverageTable pokemon={sorted} colors={COLORS} selections={selections} />

          <ConsolidatedOffensiveCoverage
            pokemon={sorted}
            moveSelections={moveSelections}
            colors={COLORS}
          />

          <OffensiveCoverageTable
            pokemon={sorted}
            moveSelections={moveSelections}
            colors={COLORS}
          />
        </>
      )}

      <footer className="app-footer">
        <p>
          Datos extraídos de{' '}
          <a href="https://www.wikidex.net" target="_blank" rel="noreferrer">
            Wikidex
          </a>{' '}
          mediante un scraper offline. Sitio estático sin backend.
        </p>
      </footer>
    </div>
  );
}
