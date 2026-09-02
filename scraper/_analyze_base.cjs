const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV = path.resolve(__dirname, 'pokemon-dataset.csv');
const raw = fs.readFileSync(CSV, 'utf8').replace(/^\uFEFF/, '');
const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

const equal = new Map(); // name(lower) -> { name, count }
for (const r of rows) {
  const b = (r.pokemonBase || '').trim();
  const n = (r.name || '').trim();
  if (b.toLowerCase() === n.toLowerCase()) {
    const k = n;
    const rec = equal.get(k) || { name: n, count: 0 };
    rec.count++;
    equal.set(k, rec);
  }
}

console.log('Filas totales CSV:', rows.length);
console.log('Filas con pokemonBase == name (case-insensitive):', [...equal.values()].reduce((a, b) => a + b.count, 0));
console.log('Nombres distintos en ese grupo:', equal.size);
console.log('\n=== Nombres (con count) ===');
[...equal.values()].sort((a, b) => b.count - a.count).forEach((r) => {
  console.log(`  ${String(r.count).padStart(3)}x  "${r.name}"`);
});