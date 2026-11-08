import { chromium, webkit } from "@playwright/test";

async function probe(browserType, name, url, mode) {
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console:" + m.text().slice(0, 200));
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    if (mode === "iframe") {
      await page.waitForTimeout(6000);
      const frames = page.frames();
      const child = frames.find((f) => f.url().startsWith("blob:"));
      let childProbe = null;
      if (child) {
        try {
          childProbe = await child.evaluate(() => ({
            title: document.title,
            tabs: document.querySelectorAll("#tabs button").length,
            on: [...document.querySelectorAll("section.on")].map((s) => s.id),
            boot: document.getElementById("bootStatus")?.textContent?.slice(0, 160) || null,
            bootHidden: !!document.getElementById("bootStatus")?.hidden,
            hasExp7: typeof window.exp7 !== "undefined",
            scripts: document.scripts.length,
            readyState: document.readyState,
          }));
        } catch (e) {
          childProbe = { evalError: String(e) };
        }
      }
      const host = await page.evaluate(() => ({
        load: !!window.__load,
        last: window.__last || null,
        st: (document.getElementById("st")?.textContent || "").slice(0, 200),
      }));
      await browser.close();
      return {
        name,
        mode,
        host,
        childProbe,
        childFrames: frames.map((f) => f.url().slice(0, 60)),
        errors: errors.slice(0, 10),
      };
    }
    await page.waitForTimeout(4000);
    const topProbe = await page.evaluate(() => ({
      title: document.title,
      tabs: document.querySelectorAll("#tabs button").length,
      on: [...document.querySelectorAll("section.on")].map((s) => s.id),
      boot: document.getElementById("bootStatus")?.textContent?.slice(0, 160) || null,
      bootHidden: !!document.getElementById("bootStatus")?.hidden,
      hasExp7: typeof window.exp7 !== "undefined",
      scripts: document.scripts.length,
    }));
    await browser.close();
    return { name, mode, probe: topProbe, errors: errors.slice(0, 10) };
  } catch (e) {
    await browser.close();
    return { name, mode, fatal: String(e), errors };
  }
}

const base = "http://127.0.0.1:8765/_harness";
const jobs = [
  [chromium, "chromium:top", `${base}/pr2-app.html`, "top"],
  [chromium, "chromium:blob-sandbox", `${base}/blob-sandbox.html`, "iframe"],
  [chromium, "chromium:blob-nosandbox", `${base}/blob-nosandbox.html`, "iframe"],
  [webkit, "webkit:top", `${base}/pr2-app.html`, "top"],
  [webkit, "webkit:blob-sandbox", `${base}/blob-sandbox.html`, "iframe"],
  [webkit, "webkit:blob-nosandbox", `${base}/blob-nosandbox.html`, "iframe"],
];

const out = [];
for (const [bt, name, url, mode] of jobs) {
  console.error("running", name);
  out.push(await probe(bt, name, url, mode));
}
console.log(JSON.stringify(out, null, 2));
