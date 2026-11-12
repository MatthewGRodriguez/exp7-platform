import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const E = require(join(dirname(fileURLToPath(import.meta.url)), '../scripts/eval.js'));

let n = 0, failed = 0;
function ok(name, cond) { n++; if (!cond) { failed++; console.error('FAIL ' + name); } }
function eq(name, a, b) { n++; if (JSON.stringify(a) !== JSON.stringify(b) && a !== b) { failed++; console.error('FAIL ' + name, a, b); } }

eq('monthDays Feb 2026 length', E.monthDays('2026-02').length, 28);
eq('monthDays Feb last', E.monthDays('2026-02').slice(-1)[0], '2026-02-28');
eq('monthDays April last', E.monthDays('2026-04').slice(-1)[0], '2026-04-30');
ok('no 31 February', E.monthDays('2026-02').indexOf('2026-02-31') < 0);

// final-payment month cap must use the last valid day, not month+'-31'
const it = { values: { date: '2026-01-31', repeat: 'monthly', amount: -10, until: '2026-02-28', lastAmount: -10, charge: 'total' } };
const ch = E.charges(it, '2026-02');
ok('charges in February is an object', ch && typeof ch === 'object');
ok('no invalid 31 Feb key in charges', !Object.prototype.hasOwnProperty.call(ch, '2026-02-31'));

const occ = E.occurrences({ values: { date: '2026-02-01', repeat: 'daily' } }, '2026-02');
ok('daily February has 28 days', occ.length === 28);

if (failed) { console.error(failed + ' of ' + n + ' unit-eval-cap failed'); process.exit(1); }
console.log('unit-eval-cap: ' + n + ' passed');
