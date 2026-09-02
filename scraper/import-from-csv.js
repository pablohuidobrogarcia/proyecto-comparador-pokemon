const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV = path.resolve(__dirname, 'pokemon-dataset.csv');
const OUT = path.resolve(__dirname, '../frontend/src/data/pokemon-dataset.json');

const NUM_FIELDS = ['ps', 'ataque', 'defensa', 'ataqueEsp', 'defensaEsp', 'velocidad'];

function toNumber(value, label) {
  const s = (value ?? '').toString().trim();
  if (s === '') {
    throw new Error(`campo numérico vacío en la fila "${label}"`);
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new Error(`valor no numérico "${s}" en la fila "${label}"`);
  }
  return n;
}

function main() {
  const raw = fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const out = [];
  for (const r of rows) {
    const label = r.name || '(fila sin name)';
    const id = (r.id ?? '').toString().trim();
    if (id === '') {
      throw new Error(`campo "id" vacío en la fila "${label}"`);
    }

    const stats = {
      ps: toNumber(r.ps, label),
      ataque: toNumber(r.ataque, label),
      defensa: toNumber(r.defensa, label),
      ataqueEspecial: toNumber(r.ataqueEsp, label),
      defensaEspecial: toNumber(r.defensaEsp, label),
      velocidad: toNumber(r.velocidad, label),
    };

    const types = [];
    if ((r.tipo1 ?? '').trim() !== '') types.push(r.tipo1.trim());
    if ((r.tipo2 ?? '').trim() !== '') types.push(r.tipo2.trim());

    const total = Object.values(stats).reduce((a, b) => a + b, 0);

    out.push({
      id,
      name: r.name,
      slug: r.slug || '',
      types,
      sprite: r.sprite || '',
      stats,
      total,
      pokemonBase: r.pokemonBase || '',
    });
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Dataset regenerado: ${OUT}`);
  console.log(`Entradas: ${out.length}`);
}

main();
