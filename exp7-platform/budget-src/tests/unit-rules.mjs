import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const BR = require(join(dirname(fileURLToPath(import.meta.url)), '../scripts/budget-rules.js'));

let n = 0, failed = 0;
function eq(name, a, b) {
  n++;
  const ok = Object.is(a, b) || (a && b && typeof a === 'object' && JSON.stringify(a) === JSON.stringify(b));
  if (!ok) { failed++; console.error('FAIL ' + name + ': got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function ok(name, cond) { n++; if (!cond) { failed++; console.error('FAIL ' + name); } }

// debt: documented example shape — level payment, last may differ
const d = BR.debtSchedule({ balance: 1000, asOf: '2026-01-15', apr: 12, terms: 4, every: 30 });
ok('debt ok', d.ok);
ok('debt payment > 0', d.payment > 0);
eq('debt first date', d.first, BR.addDays('2026-01-15', 30));
eq('debt rows', d.rows.length, 4);
ok('debt last date is after first', d.lastDate > d.first);
ok('final balance 0', d.rows[3].balance === 0);
ok('errors on bad balance', !BR.debtSchedule({ balance: 0, asOf: '2026-01-15', apr: 0, terms: 12, every: 30 }).ok);

// zero APR
const z = BR.debtSchedule({ balance: 1200, asOf: '2026-01-01', apr: 0, terms: 12, every: 30 });
eq('zero APR payment', z.payment, 100);

// take-home
const t = BR.takeHome({ gross: 2000, deductions: [{ name: 'Tax', kind: 'percent', value: 10 }, { name: 'Health', kind: 'fixed', value: 50 }] });
ok('take-home ok', t.ok);
eq('percent of gross rounded', t.lines[0].amount, 200);
eq('net', t.net, 1750);

ok('percent over 100 fails', !BR.takeHome({ gross: 100, deductions: [{ name: 'X', kind: 'percent', value: 110 }] }).ok);
ok('deductions > gross fails', !BR.takeHome({ gross: 100, deductions: [{ name: 'X', kind: 'fixed', value: 120 }] }).ok);

// lastDay: never month+'-31' on a short month
eq('Feb 2026 last day', BR.lastDay('2026-02'), '2026-02-28');
eq('Feb 2028 leap', BR.lastDay('2028-02'), '2028-02-29');
eq('April last day', BR.lastDay('2026-04'), '2026-04-30');
eq('January last day', BR.lastDay('2026-01'), '2026-01-31');
eq('bad month', BR.lastDay('2026-13'), null);

// cash kind: no name inference
ok('cash only when marked cash', BR.isCashAsset({ name: 'Checking', values: { assetKind: 'cash' } }));
ok('checking name is not cash if unmarked', !BR.isCashAsset({ name: 'Checking account', values: {} }));
ok('wallet name is not cash if unmarked', !BR.isCashAsset({ name: 'Wallet', values: { amount: 20 } }));
ok('owned is not cash', !BR.isCashAsset({ name: 'Car', values: { assetKind: 'owned' } }));
ok('owned helper', BR.isOwnedAsset({ values: { assetKind: 'owned' } }));

eq('monthDayList', BR.monthDayList('1, 15, 1, 32'), [1, 15]);
eq('money', BR.money(1234.5), '$1,234.50');

if (failed) { console.error(failed + ' of ' + n + ' unit-rules failed'); process.exit(1); }
console.log('unit-rules: ' + n + ' passed');
