import { useState } from 'react';
import dataset from './data/pokemon-dataset.json';
import SearchBox from './components/SearchBox';
import PokemonCard from './components/PokemonCard';
import StatsRadarChart from './components/RadarChart';
import ComparisonTable from './components/ComparisonTable';

const MAX_COMPARE = 4;
const COLORS = ['#e63946', '#1d6fb8', '#2a9d8f', '#e9a000'];

export default function App() {
  const [selected, setSelected] = useState([]);

  const sorted = [...selected].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  const exclude = selected.map((p) => p.name);

  function addPokemon(p) {
    if (selected.find((s) => s.name === p.name)) return;
    if (selected.length >= MAX_COMPARE) return;
    setSelected([...selected, p]);
  }

  function removePokemon(slug) {
    setSelected(selected.filter((s) => s.slug !== slug));
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
        {Array.from({ length: MAX_COMPARE }).map((_, i) => (
          <SearchBox
            key={i}
            label={`Pokémon ${i + 1}`}
            pokemonList={dataset}
            exclude={exclude}
            onSelect={addPokemon}
            disabled={selected.length >= MAX_COMPARE}
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
            {sorted.map((p, i) => (
              <PokemonCard
                key={p.slug}
                pokemon={p}
                color={COLORS[i % COLORS.length]}
                onRemove={() => removePokemon(p.slug)}
              />
            ))}
          </section>

          <section className="chart-section">
            <h2>Gráfico de radar</h2>
            <StatsRadarChart pokemon={sorted} colors={COLORS} />
          </section>

          <section className="table-section">
            <h2>Tabla comparativa</h2>
            <ComparisonTable pokemon={sorted} colors={COLORS} />
          </section>
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
