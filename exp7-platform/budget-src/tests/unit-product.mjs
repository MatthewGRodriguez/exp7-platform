import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../scripts');
let n = 0, failed = 0;
function ok(name, cond) { n++; if (!cond) { failed++; console.error('FAIL ' + name); } }

const flows = readFileSync(join(src, 'budget-flows.js'), 'utf8');
const journal = readFileSync(join(src, 'journal-views.js'), 'utf8');
const rules = readFileSync(join(src, 'budget-rules.js'), 'utf8');
const evalJs = readFileSync(join(src, 'eval.js'), 'utf8');
const app = readFileSync(join(here, '../app/budgetpkg.html'), 'utf8');

ok('no name-inference regex in flows', !/check\|saving\|cash\|bank\|wallet/.test(flows));
ok('isCashAsset delegates to rules', /BR\.isCashAsset/.test(flows));
ok('startLinks has no Enter assets setup', !/Enter assets and cash/.test(flows));
ok('startLinks has no Enter debts setup', !/Enter debts/.test(flows));
ok('startLinks has no Schedule paydays setup', !/Schedule paydays/.test(flows));
ok('actions page exists', /function actionsVM/.test(flows) && /occ:actions:/.test(flows));
ok('add chooser has four kinds', /add:kind:activity/.test(flows) && /add:kind:pay/.test(flows) && /add:kind:debt/.test(flows) && /add:kind:cash/.test(flows));
ok('preferred star on add-alternative', /alt2:star/.test(flows) && /Continue to requirements/.test(flows));
ok('requirement seed from JReq', /function seedReqs/.test(flows));
ok('as-of locked from the day', /asOfLocked/.test(flows));
ok('eval does not cap with month+\'-31\'', !/month \+ '-31'/.test(evalJs));
ok('rules lastDay exists', /function lastDay/.test(rules));
ok('journal has no No date set group', !/No date set/.test(journal));
ok('journal has Needs a date group', /Needs a date/.test(journal));
ok('journal 44 pt targets', /var body=17, sec=15, cap=13, titleSz=22, hit=44/.test(journal));
ok('mini month shape cues', /rk==='L'/.test(journal) && /rk==='C'/.test(journal));
ok('Home links include cash', /Cash and owned items/.test(journal));
ok('inline date picker, not hover open', /phone-first: the picker is an inline expansion/.test(journal));
ok('Home date opens the day not a month page', /onNavigate\('agenda'/.test(journal));
ok('app Home row opens actions not Record', /occ:actions:/.test(app) && !/occ:actual:'\+extra.entry/.test(app));
ok('app has no first-visit Board setup path as destination', /leftover Board setup paths go to the calendar day/.test(app));
ok('calendar tab forced to day', /n.level='day'/.test(app));
ok('HTML tab bar hidden', /#budgetTabs, #boardTypeTabs, #budgetFacts\{display:none/.test(app));

if (failed) { console.error(failed + ' of ' + n + ' unit-product failed'); process.exit(1); }
console.log('unit-product: ' + n + ' passed');
