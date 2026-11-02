const H = require("./public/heat.js");
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log("FAIL", n); } else console.log("ok  ", n); };
ok("levels", [20, 26.9, 27, 31.9, 32, 38.9, 39, 45].map(H.heatLevel).join() === "0,0,1,1,2,2,3,3");
ok("aqi levels", [30, 100, 101, 150, 151, 201, null].map(H.aqiLevel).join() === "0,0,1,1,2,3,0");
// synthetic Chennai day: cool dawn, 39C feels-like at 1 pm
function mk(date) { const time = [], app = [], t = [], rh = [], rain = [], uv = [], aqi = [];
  for (let h = 0; h < 24; h++) { time.push(date + "T" + String(h).padStart(2, "0") + ":00"); const f = 26 + 13 * Math.max(0, Math.sin(Math.PI * (h - 6) / 14)); app.push(+f.toFixed(1)); t.push(f - 3); rh.push(80); rain.push(10); uv.push(h > 8 && h < 17 ? 9 : 0); aqi.push(60); }
  return { time, app, t, rh, rain, uv, aqi }; }
const d1 = mk("2026-11-02"), d2 = mk("2026-11-03");
const w = { hourly: { time: d1.time.concat(d2.time), apparent_temperature: d1.app.concat(d2.app), temperature_2m: d1.t.concat(d2.t), relative_humidity_2m: d1.rh.concat(d2.rh), precipitation_probability: d1.rain.concat(d2.rain), uv_index: d1.uv.concat(d2.uv) }, daily: { time: ["2026-11-02", "2026-11-03"], sunrise: ["2026-11-02T05:58", "2026-11-03T05:58"], sunset: ["2026-11-02T17:36", "2026-11-03T17:35"] } };
const a = { hourly: { time: d1.time.concat(d2.time), us_aqi: d1.aqi.concat(d2.aqi) } };
const b = H.build(w, a);
ok("two days", b.dates.length === 2 && b.days["2026-11-02"].length === 24);
ok("sun times", b.sun["2026-11-02"].rise === "05:58");
const hs = b.days["2026-11-02"];
ok("peak is danger", hs[13].level === 3 && Math.abs(hs[13].feels - 39) < 0.1);
const win = H.windows(hs, 5, 21);
ok("best windows are dawn and evening", win.level === 0 && win.runs.length === 2 && win.runs.some(r => r.from === 5) && win.runs.some(r => r.from === 20), JSON.stringify(win));
const av = H.avoid(hs, 5, 21, 2);
ok("avoid window is midday", av.length === 1 && av[0].from >= 9 && av[0].from <= 11 && av[0].to >= 15 && av[0].to <= 17, JSON.stringify(av));
// bad air overrides cool temperature
const a2 = { hourly: { time: a.hourly.time, us_aqi: a.hourly.us_aqi.map((v, i) => i === 5 ? 180 : v) } };
ok("AQI raises rating", H.build(w, a2).days["2026-11-02"][5].level === 2);
ok("works without air data", H.build(w, null).days["2026-11-02"][5].aqi === null);
const n = H.nowIST(new Date("2026-11-02T00:10:00Z")); ok("IST conversion", n.date === "2026-11-02" && n.hour === 5, JSON.stringify(n));
const n2 = H.nowIST(new Date("2026-11-02T19:00:00Z")); ok("IST rolls over date", n2.date === "2026-11-03" && n2.hour === 0, JSON.stringify(n2));
ok("urls", H.urls().weather.includes("apparent_temperature") && H.urls().air.includes("us_aqi"));
console.log(fail ? fail + " failed" : "all passed");
