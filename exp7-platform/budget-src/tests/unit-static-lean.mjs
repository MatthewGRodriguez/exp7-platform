import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const lean = join(dirname(fileURLToPath(import.meta.url)), '../../exp7-platform-lean.html');
let n = 0, failed = 0;
function ok(name, cond) { n++; if (!cond) { failed++; console.error('FAIL ' + name); } }

if (!existsSync(lean)) {
  console.log('unit-static-lean: skipped (lean file not found yet)');
  process.exit(0);
}
const t = readFileSync(lean, 'utf8');
ok('version 1.8.62 in shell', t.includes('SHELL_VERSION="1.8.62"'));
ok('private data repo default', t.includes('private:true') && !t.includes('private:false,auto_init:true'));
ok('no public-only repo rule', !t.includes('Repo must be yours and public.'));
ok('auto-create on 404', t.includes('Creating a private one'));
ok('create button not offered on 404', !t.includes('Create public '));
ok('eval cap not month-31', !t.includes("month + '-31'"));
ok('budget-rules lastDay embedded', t.includes('function lastDay'));
ok('actions path embedded', t.includes('occ:actions:'));

if (failed) { console.error(failed + ' of ' + n + ' unit-static-lean failed'); process.exit(1); }
console.log('unit-static-lean: ' + n + ' passed');
