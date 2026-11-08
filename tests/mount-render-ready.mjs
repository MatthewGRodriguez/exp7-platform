import { chromium, webkit } from "@playwright/test";
import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function withServer(fn) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const fp = path.join(root, url === "/" ? "exp7-platform/exp7-platform-lean.html" : url.replace(/^\//, ""));
    if (!fp.startsWith(root) || !fs.existsSync(fp)) {
      res.writeHead(404);
      res.end("no");
      return;
    }
    const data = fs.readFileSync(fp);
    const ct = fp.endsWith(".html")
      ? "text/html"
      : fp.endsWith(".json")
        ? "application/json"
        : "application/octet-stream";
    res.writeHead(200, { "Content-Type": ct });
    res.end(data);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  try {
    return await fn(port);
  } finally {
    server.close();
  }
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  if (!cond) console.error("FAIL", name, detail);
  else console.log("PASS", name, detail || "");
}

async function runBrowser(browserType, label, port) {
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/exp7-platform/exp7-platform-lean.html`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });

  check(`${label}:no_iframe_element`, (await page.$("iframe")) === null);
  check(`${label}:has_appHost`, (await page.$("#appHost")) !== null);
  check(`${label}:auth_gate`, (await page.$("#tok")) !== null);
  check(`${label}:workspace_create`, (await page.$("#mk")) !== null);
  check(`${label}:update_drill`, (await page.$("#drill")) !== null);

  await page.click("#open");
  await page.waitForFunction(
    () => /render-ready|boot failed|did not report render-ready|Direct inject failed/.test(document.getElementById("appmount")?.textContent || document.getElementById("appmountBar")?.textContent || ""),
    { timeout: 60000 },
  );
  const mountText = await page.evaluate(
    () => document.getElementById("appmountBar")?.textContent || document.getElementById("appmount")?.textContent || "",
  );
  check(`${label}:shell_reports_render_ready`, /render-ready/.test(mountText), mountText);
  check(`${label}:not_inject_only_success`, !/^direct inject \d+ ms — waiting/.test(mountText), mountText);

  const probe = await page.evaluate(() => {
    const host = document.getElementById("appHost");
    document.getElementById("copyDiag")?.click();
    const panel = document.getElementById("diagPanel");
    const out = document.getElementById("diagOut");
    return {
      shellHidden: !!document.getElementById("shellChrome")?.hidden,
      appVisible: !document.getElementById("appShell")?.hidden,
      tabs: host?.querySelectorAll("#tabs button").length || 0,
      on: [...(host?.querySelectorAll("section.on") || [])].map((s) => s.id),
      bootHidden: !!document.getElementById("bootStatus")?.hidden,
      hasExp7: typeof window.exp7 !== "undefined",
      hasDiag: typeof window.exp7Diagnostics !== "undefined",
      panelHidden: panel ? panel.hidden : null,
      diagLen: out ? (out.value || "").length : 0,
      diagHasUA: !!(out && /userAgent:/.test(out.value)),
      tokenOnWindow: Object.prototype.hasOwnProperty.call(window, "S") || typeof window.S !== "undefined",
      hostHasTokenAttrs: !!host?.innerHTML && /github_pat_|ghp_[A-Za-z0-9]|S\.token/.test(host.innerHTML),
    };
  });
  check(`${label}:entered_app_mode`, probe.shellHidden && probe.appVisible, probe);
  check(`${label}:tabs_rendered`, probe.tabs === 10, probe.tabs);
  check(`${label}:section_on`, probe.on[0] === "t-atlas", probe.on);
  check(`${label}:diagnostics_plaintext`, probe.panelHidden === false && probe.diagLen > 50, {
    panelHidden: probe.panelHidden,
    diagLen: probe.diagLen,
  });
  check(`${label}:diagnostics_content`, probe.diagHasUA, probe);
  check(`${label}:no_token_on_window`, probe.tokenOnWindow === false, probe.tokenOnWindow);
  check(`${label}:no_token_in_app_dom`, probe.hostHasTokenAttrs === false);
  check(`${label}:no_diagText_referenceerror`, !errors.some((x) => /diagText is not defined/.test(x)), errors.filter((x) => /diagText|ReferenceError/.test(x)));

  await page.evaluate(() => {
    if (typeof upd === "function") upd();
  });
  const report = await page.$eval("#ta", (el) => JSON.parse(el.value || "{}"));
  const steps = report.steps || [];
  const mountPass = steps.filter((s) => s.step === "app_mount" && s.status === "pass");
  const mountInfo = steps.filter((s) => s.step === "app_mount" && s.status === "info");
  check(`${label}:report_inject_info`, mountInfo.length >= 1, mountInfo.map((s) => s.detail?.note));
  check(`${label}:report_ready_pass`, mountPass.length >= 1 && mountPass[0].detail?.proof?.mode === "direct", mountPass[0]?.detail);
  check(`${label}:measured_direct_mode`, report.measured?.appMount?.mode === "direct" && report.measured?.appMount?.renderReady === true, report.measured?.appMount);

  await browser.close();
}

await withServer(async (port) => {
  const html = fs.readFileSync(path.join(root, "exp7-platform/exp7-platform-lean.html"));
  const man = JSON.parse(fs.readFileSync(path.join(root, "exp7-platform/release.json"), "utf8"));
  check("manifest_shell_sha256", man.sha256 === sha256(html), man.sha256);
  const m = html.toString("utf8").match(/id="apppkg">([A-Za-z0-9+/=]+)</);
  const appRaw = Buffer.from(m[1], "base64");
  check("manifest_app_sha256", man.contains.appSha256 === sha256(appRaw), man.contains.appSha256);
  check("version_bump", man.version === "1.2.2");
  check("no_iframe_markup", !/<iframe\b/i.test(html.toString("utf8")));

  await runBrowser(chromium, "chromium", port);
  await runBrowser(webkit, "webkit", port);
});

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: failed.length, results }, null, 2));
process.exit(failed.length ? 1 : 0);
