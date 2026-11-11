# Ingestion

Builds the app's data feed (`app/public/data/listings.json`) from
live landlord portals.

## scrape.py — AppFolio portals

One server-rendered `/listings` request per portal (CPM, Champaign
County Realty, Weiner Companies, Ramshaw) — the same sources and
parsing approach as the original 2022 scrapers in `function_build/`.
Addresses are geocoded via OpenStreetMap Nominatim (1 req/s, honest
User-Agent) with results cached in `geocode-cache.json`.

Seed listings are kept only for agencies the scrape doesn't cover
(the large student properties), and stay labeled `source: "seed"`.

```bash
python3 -m venv ingestion/.venv
ingestion/.venv/bin/pip install beautifulsoup4 requests
ingestion/.venv/bin/python ingestion/scrape.py
```

Politeness: AppFolio's robots.txt requests a 10s crawl delay per
host — one request per host per run is far inside that. Re-runs are
cheap thanks to the geocode cache. Intended cadence: weekly, by hand
or from CI, committing the refreshed feed.
