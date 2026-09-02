const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const CSV = path.resolve(__dirname, 'pokemon-dataset.csv');
const raw = fs.readFileSync(CSV, 'utf8').replace(/^\uFEFF/, '');

const outer = parse(raw, { columns: false, relax_column_count: true, skip_empty_lines: true });
const records = outer.map((rec) => {
  const inner = rec[0] || '';
  return parse(inner, { columns: false, relax_column_count: true })[0] || [];
});

const header = records[0];
const data = records.slice(1);
console.log('Records decodificados:', data.length, '| columnas:', header.length);

const out = stringify(data, { header: true, columns: header, quoted: true });
fs.writeFileSync(CSV, '\uFEFF' + out, 'utf8');
console.log('CSV reescrito limpio.');

const check = parse(fs.readFileSync(CSV, 'utf8').replace(/^\uFEFF/, ''), { columns: true });
check
  .filter((r) => /tronco/i.test(r.name) || /braviary.+hisui/i.test(r.name))
  .forEach((r) => console.log(JSON.stringify(r.name), '->', r.tipo1 + (r.tipo2 ? '/' + r.tipo2 : '')));