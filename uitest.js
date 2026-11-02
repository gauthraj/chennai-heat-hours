const { chromium } = require("playwright"); const http = require("http"), fs = require("fs"), path = require("path");
const H = require("./public/heat.js");
function mk(date, bump) { const time = [], app = [], t = [], rh = [], rain = [], uv = [], aqi = [];
  for (let h = 0; h < 24; h++) { time.push(date + "T" + String(h).padStart(2, "0") + ":00"); const f = 26 + 13 * Math.max(0, Math.sin(Math.PI * (h - 6) / 14)); app.push(+f.toFixed(1)); t.push(f - 3); rh.push(80); rain.push(10); uv.push(0); aqi.push(60); }
  return { time, app, t, rh, rain, uv, aqi }; }
const today = H.nowIST().date; const d = new Date(today + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); const tom = d.toISOString().slice(0, 10);
const a = mk(today), b = mk(tom);
const weather = { hourly: { time: a.time.concat(b.time), apparent_temperature: a.app.concat(b.app), temperature_2m: a.t.concat(b.t), relative_humidity_2m: a.rh.concat(b.rh), precipitation_probability: a.rain.concat(b.rain), uv_index: a.uv.concat(b.uv) }, daily: { time: [today, tom], sunrise: [today + "T05:58", tom + "T05:58"], sunset: [today + "T17:36", tom + "T17:36"] } };
const air = { hourly: { time: a.time.concat(b.time), us_aqi: a.aqi.concat(b.aqi) } };
const srv = http.createServer((q, r) => { const f = path.join(__dirname, "public", q.url === "/" ? "index.html" : q.url.split("?")[0]); fs.readFile(f, (e, c) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : "text/html" }); r.end(c); } }); });
let fail = 0; const ok = (n, c) => { if (!c) fail++; console.log(c ? "ok  " : "FAIL", n); };
(async () => { await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const br = await chromium.launch(); const pg = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  const errs = []; pg.on("pageerror", e => errs.push(e.message));
  await pg.route("**/api.open-meteo.com/**", r => r.fulfill({ json: weather }));
  await pg.route("**/air-quality-api.open-meteo.com/**", r => r.fulfill({ json: air }));
  await pg.goto("http://localhost:" + port + "/"); await pg.waitForSelector("#live:not([hidden])");
  ok("hero shown", (await pg.textContent("#hero")).length > 10);
  ok("best window text", /AM|PM/.test(await pg.textContent("#best")));
  ok("strip has hours", (await pg.locator("#strip .h").count()) >= 10);
  ok("whatsapp link", (await pg.getAttribute("#wa", "href")).startsWith("https://wa.me/?text="));
  ok("tabs visible", await pg.isVisible("#tabs"));
  await pg.click("#t1"); ok("tomorrow tab", (await pg.getAttribute("#t1", "aria-pressed")) === "true" && /Tomorrow/.test(await pg.textContent("#hero")));
  await pg.click("#lang"); ok("tamil", /சென்னை/.test(await pg.textContent("h1")) && /[஀-௿]/.test(await pg.textContent("#hero")));
  ok("no horizontal scroll", await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await pg.screenshot({ path: "shot.png", fullPage: true });
  // failure path
  const p2 = await (await br.newContext()).newPage(); await p2.route("**/open-meteo.com/**", r => r.abort());
  await p2.goto("http://localhost:" + port + "/"); await p2.waitForSelector("#error:not([hidden])");
  ok("error shown, guide still present", (await p2.isVisible("#fa")) && !(await p2.isVisible("#live")));
  ok("no page errors", errs.length === 0); if (errs.length) console.log(errs);
  await br.close(); srv.close(); console.log(fail ? fail + " failed" : "all passed"); })();
