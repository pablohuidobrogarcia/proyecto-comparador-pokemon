const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { MEGA_TYPES } = require('./_mega_types.cjs');

const raw = fs.readFileSync(path.resolve(__dirname, 'pokemon-dataset.csv'), 'utf8');
const hasBom = raw.charCodeAt(0) === 0xfeff;
const rows = parse(raw.replace(/^\uFEFF/, ''), { columns: true, skip_empty_lines: true });

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

console.log('=== INTEGRIDAD ===');
console.log('BOM:', hasBom, '| Filas:', rows.length);
const hdr = Object.keys(rows[0]).join(',');
console.log('Cabecera:', hdr);
console.log('Cabecera esperada:', JSON.stringify(hdr) === JSON.stringify('id,name,pokemonBase,tipo1,tipo2,ps,ataque,defensa,ataqueEsp,defensaEsp,velocidad,sprite,slug'));
console.log('IDs únicos:', new Set(rows.map((r) => r.id)).size);
console.log('Filas sin name:', rows.filter((r) => !r.name).length, '| sin id:', rows.filter((r) => !r.id).length, '| sin tipo1:', rows.filter((r) => !r.tipo1).length);

console.log('\n=== VERIFICACION TIPOS DE LA LISTA ===');
let ok = 0, bad = 0, notfound = [];
for (const [name, types] of Object.entries(MEGA_TYPES)) {
  const hits = rows.filter((r) => norm(r.name) === norm(name));
  if (hits.length === 0) { notfound.push(name); continue; }
  for (const r of hits) {
    const e1 = types[0], e2 = types[1] || '';
    if (r.tipo1 === e1 && (r.tipo2 || '') === e2) ok++;
    else { bad++; console.log('  MISMATCH:', r.id, '|', r.name, '->', r.tipo1 + (r.tipo2 ? '/' + r.tipo2 : ''), '| esperado', e1 + (e2 ? '/' + e2 : '')); }
  }
}
console.log('Filas de la lista verificadas correctas:', ok, '| con error:', bad, '| no encontradas:', notfound.length);
notfound.forEach((n) => console.log('  NO ENCONTRADA:', n));

console.log('\n=== PENDIENTES DE REVISAR (filas mega no en lista) ===');
const used = new Set(Object.keys(MEGA_TYPES).map(norm));
const pending = rows.filter((r) => /^\s*mega[\s-]+/i.test(r.name) && !used.has(norm(r.name))).sort((a, b) => a.name.localeCompare(b.name, 'es'));
console.log('Cantidad:', pending.length);
pending.forEach((r) => console.log(`  ${JSON.stringify(r.name)} -> ${r.tipo1}${r.tipo2 ? '/' + r.tipo2 : ''}`));

console.log('\n=== NOMBRES DUPLICADOS (posibles megas ocultas bajo nombre base) ===');
const groups = new Map();
for (const r of rows) {
  const key = norm(r.name);
  if (!key) continue;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}
const dups = [...groups.entries()].filter(([, v]) => v.length > 1).sort((a, b) => a[0].localeCompare(b[0], 'es'));
console.log('Grupos con nombre repetido:', dups.length);
for (const [, v] of dups) {
  console.log(`  << ${v[0].name} >> (${v.length})`);
  v.forEach((r) => console.log(`     ${r.id} | ps=${r.ps} atq=${r.ataque} def=${r.defensa} aEsp=${r.ataqueEsp} dEsp=${r.defensaEsp} vel=${r.velocidad} | ${r.tipo1}${r.tipo2 ? '/' + r.tipo2 : ''}`));
}