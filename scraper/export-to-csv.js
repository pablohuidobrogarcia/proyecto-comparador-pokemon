const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');

const DATA = path.resolve(__dirname, '../frontend/src/data/pokemon-dataset.json');
const OUT = path.resolve(__dirname, 'pokemon-dataset.csv');

const COLUMNS = [
  'id',
  'name',
  'pokemonBase',
  'tipo1',
  'tipo2',
  'ps',
  'ataque',
  'defensa',
  'ataqueEsp',
  'defensaEsp',
  'velocidad',
  'sprite',
  'slug',
];

function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));

  const rows = data.map((e) => ({
    id: e.id ?? '',
    name: e.name ?? '',
    pokemonBase: e.pokemonBase ?? '',
    tipo1: Array.isArray(e.types) && e.types[0] ? e.types[0] : '',
    tipo2: Array.isArray(e.types) && e.types[1] ? e.types[1] : '',
    ps: e.stats?.ps ?? '',
    ataque: e.stats?.ataque ?? '',
    defensa: e.stats?.defensa ?? '',
    ataqueEsp: e.stats?.ataqueEspecial ?? '',
    defensaEsp: e.stats?.defensaEspecial ?? '',
    velocidad: e.stats?.velocidad ?? '',
    sprite: e.sprite ?? '',
    slug: e.slug ?? '',
  }));

  rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const csv = stringify(rows, { header: true, columns: COLUMNS, quoted: true });
  // BOM para que Excel en Windows muestre bien tildes y "ó"/"é".
  fs.writeFileSync(OUT, '﻿' + csv, 'utf8');

  console.log(`CSV generado: ${OUT}`);
  console.log(`Filas: ${rows.length}`);
  console.log(`Columnas: ${COLUMNS.join(', ')}`);
}

main();
