const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const CSV = path.resolve(__dirname, 'pokemon-dataset.csv');
const { MEGA_TYPES } = require('./_mega_types.cjs');

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const raw = fs.readFileSync(CSV, 'utf8');
const hasBom = raw.charCodeAt(0) === 0xfeff;
const rows = parse(raw.replace(/^\uFEFF/, ''), { columns: true, skip_empty_lines: true });

const usedKeys = new Set();
const updatedLog = [];
const notFound = [];

for (const [name, types] of Object.entries(MEGA_TYPES)) {
  const key = norm(name);
  const hits = rows.filter((r) => norm(r.name) === key);
  if (hits.length === 0) {
    notFound.push(name);
    continue;
  }
  usedKeys.add(key);
  for (const r of hits) {
    r.tipo1 = types[0];
    r.tipo2 = types[1] || '';
    updatedLog.push(`${r.id} | ${r.name} -> ${r.tipo1}${r.tipo2 ? '/' + r.tipo2 : ''}`);
  }
}

const pending = rows
  .filter((r) => /^\s*mega[\s-]+/i.test(r.name) && !usedKeys.has(norm(r.name)))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

const out = stringify(rows, { header: true, quoted: true });
fs.writeFileSync(CSV, (hasBom ? '\uFEFF' : '') + out, 'utf8');

console.log('Entradas en lista del usuario:', Object.keys(MEGA_TYPES).length);
console.log('Filas actualizadas:', updatedLog.length);
console.log('\n--- ACTUALIZADAS (' + updatedLog.length + ') ---');
updatedLog.sort((a, b) => a.localeCompare(b, 'es')).forEach((l) => console.log('  ' + l));

console.log('\n--- NO ENCONTRADAS EN EL DATASET (' + notFound.length + ') ---');
notFound.forEach((n) => console.log('  ' + n));

console.log('\n--- MEGAS PENDIENTES DE REVISAR (' + pending.length + ') ---');
pending.forEach((r) => console.log(`  ${r.name} | tipo1=${r.tipo1} tipo2=${r.tipo2 || '-'}`));