# Chennai Heat Hours

Static site. Shows the best hours to run in Chennai today and tomorrow from the Open-Meteo heat and air-quality forecast, with advice by level, heat-illness signs and a seasons guide. English and Tamil.

Deploy: import this repo in Vercel (no env vars, no build). Output directory is `public`.

Run tests: `node test.js` (logic), `node uitest.js` (needs playwright).

Notes
- Levels use US NWS heat-index bands on the "feels like" temperature (27/32/39 °C) and US AQI bands. Good and Care are about comfort; Hard and Skip are about safety.
- Open-Meteo free tier is for non-commercial use; fine for a community project.
- Tamil text needs a native-speaker review. Advice needs a coach or physio glance before wide promotion.
- No cookies, no accounts, no data stored (only a language preference in the browser).
- `public/heat.js` is shared with Run Chennai's Today card: keep the two copies identical.
