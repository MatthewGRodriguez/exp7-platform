#!/usr/bin/env node
/** Budget sidecar unit tests. Load shipped scripts in Node. [MOCK] */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const files = ['unit-rules.mjs', 'unit-eval-cap.mjs', 'unit-product.mjs', 'unit-static-lean.mjs'];
let failed = 0, passed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [join(here, f)], { encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0) {
    console.error('FAIL ' + f + ' (exit ' + r.status + ')');
    failed++;
  } else {
    passed++;
  }
}
console.log('\nSuites passed: ' + passed + ' / ' + (passed + failed));
process.exit(failed ? 1 : 0);
