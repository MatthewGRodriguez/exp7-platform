import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }

async function withServer(fn){
  const server = http.createServer((req,res)=>{
    const url = decodeURIComponent(req.url.split('?')[0]);
    const fp = path.join(root, url === '/' ? 'exp7-platform/exp7-platform-lean.html' : url.replace(/^\//,''));
    if(!fp.startsWith(root) || !fs.existsSync(fp)){ res.writeHead(404); res.end('no'); return; }
    const data = fs.readFileSync(fp);
    const ct = fp.endsWith('.html') ? 'text/html' : fp.endsWith('.json') ? 'application/json' : 'application/octet-stream';
    res.writeHead(200, {'Content-Type': ct}); res.end(data);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const {port} = server.address();
  try { return await fn(port); } finally { server.close(); }
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: ['--no-sandbox','--disable-gpu']
});

const results = [];
function check(name, cond, detail){
  results.push({name, ok:!!cond, detail});
  if(!cond) console.error('FAIL', name, detail);
  else console.log('PASS', name, detail||'');
}

await withServer(async (port)=>{
  // Manifest SHA matches exact HTML bytes
  const html = fs.readFileSync(path.join(root,'exp7-platform/exp7-platform-lean.html'));
  const man = JSON.parse(fs.readFileSync(path.join(root,'exp7-platform/release.json'),'utf8'));
  check('manifest_shell_sha256', man.sha256 === sha256(html), man.sha256);
  // Extract app and verify appSha256
  const m = html.toString('utf8').match(/id="apppkg">([A-Za-z0-9+/=]+)</);
  const appRaw = Buffer.from(m[1], 'base64');
  check('manifest_app_sha256', man.contains.appSha256 === sha256(appRaw), man.contains.appSha256);
  check('version_bump', man.version === '1.2.1');

  const page = await browser.newPage();
  const msgs=[];
  page.on('pageerror', e=>msgs.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/exp7-platform/exp7-platform-lean.html`, {waitUntil:'networkidle0', timeout:120000});
  // sandbox attribute preserved (no same-origin)
  const sandbox = await page.$eval('#appframe', el=>el.getAttribute('sandbox'));
  check('sandbox_allow_scripts_only', sandbox === 'allow-scripts', sandbox);

  await page.click('#open');
  // Wait for render-ready handshake reflected in shell status / records — not mere load
  await page.waitForFunction(()=>{
    const t = document.getElementById('appmount')?.textContent||'';
    return /render-ready|boot failed|did not report render-ready/.test(t);
  }, {timeout:30000});
  const mountText = await page.$eval('#appmount', el=>el.textContent);
  check('shell_status_not_load_only', !/^iframe load \d+ ms — waiting/.test(mountText), mountText);
  check('shell_reports_render_ready', /render-ready/.test(mountText), mountText);

  const frame = page.frames().find(f=>f.name()==='appframe');
  const probe = await frame.evaluate(()=>{
    const tabs=[...document.querySelectorAll('#tabs button')].map(b=>b.textContent);
    const on=[...document.querySelectorAll('section.on')].map(s=>s.id);
    const bootHidden=!!document.getElementById('bootStatus')?.hidden;
    // click diagnostics
    document.getElementById('copyDiag').click();
    const panel=document.getElementById('diagPanel');
    const out=document.getElementById('diagOut');
    return {
      tabs:tabs.length,
      on,
      bootHidden,
      hasExp7:!!window.exp7,
      hasDiag:!!window.exp7Diagnostics,
      panelHidden: panel?panel.hidden:null,
      diagLen: out?(out.value||'').length:0,
      diagHasUA: !!(out&&/userAgent:/.test(out.value)),
      lastDiagSet: !!window.exp7lastDiag,
      codec: document.getElementById('codecStat')?.textContent||'',
      // prove tokens not present in frame
      hasShellToken: typeof window.S!=='undefined',
    };
  });
  check('iframe_tabs_rendered', probe.tabs===10, probe.tabs);
  check('iframe_section_on', probe.on[0]==='t-atlas', probe.on);
  check('bootStatus_hidden_on_success', probe.bootHidden===true, probe.bootHidden);
  check('diagnostics_api_present', probe.hasDiag===true);
  check('diagnostics_plaintext_fallback_visible', probe.panelHidden===false && probe.diagLen>50, {panelHidden:probe.panelHidden,diagLen:probe.diagLen});
  check('diagnostics_has_content', probe.diagHasUA && probe.lastDiagSet, probe);
  check('no_shell_token_object_in_frame', probe.hasShellToken===false);
  check('no_diagText_referenceerror', !msgs.some(x=>/diagText is not defined/.test(x)), msgs.filter(x=>/diagText|ReferenceError/.test(x)));

  // Parent measured distinguishes load vs ready via #ta report
  await page.evaluate(()=>{ if(typeof upd==='function') upd(); });
  const report = await page.$eval('#ta', el=>JSON.parse(el.value||'{}'));
  const steps = report.steps||[];
  const mountPass = steps.filter(s=>s.step==='app_mount'&&s.status==='pass');
  const mountInfo = steps.filter(s=>s.step==='app_mount'&&s.status==='info');
  check('report_has_load_info_step', mountInfo.length>=1, mountInfo.map(s=>s.detail));
  check('report_has_render_ready_pass', mountPass.length>=1 && mountPass[0].detail && mountPass[0].detail.proof, mountPass[0]?.detail);
  check('load_not_treated_as_pass', mountInfo.every(s=>/load event/.test(s.detail?.note||'') && !/render-ready handshake \(not load-only\)/.test(s.detail?.note||'')), mountInfo.map(s=>s.detail?.note));
  check('measured_appMount_renderReady', !!(report.measured&&report.measured.appMount&&report.measured.appMount.renderReady), report.measured?.appMount);

  // Workspace/auth controls still present (not broken)
  check('auth_gate_still_present', await page.$('#tok')!==null);
  check('workspace_create_still_present', await page.$('#mk')!==null);
  check('update_drill_still_present', await page.$('#drill')!==null);
});

await browser.close();
const failed = results.filter(r=>!r.ok);
console.log(JSON.stringify({passed:results.filter(r=>r.ok).length, failed:failed.length, results},null,2));
process.exit(failed.length?1:0);
