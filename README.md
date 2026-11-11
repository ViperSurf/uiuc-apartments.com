# UIUC Apartments — Campus Housing (2026 revival)

**Live site:** https://vipersurf.github.io/uiuc-apartments.com/

A student-built apartment finder for the University of Illinois
Urbana-Champaign: searchable listings across Champaign-Urbana with a
map and filters, plus **anonymous student reviews of landlords**
(maintenance, communication, fairness, move-out) — the piece that
holds management to a standard.

## Credit — this is a fork

This repository is a fork of
[**reteps/uiuc-apartments.com**](https://github.com/reteps/uiuc-apartments.com),
originally built in 2022 by Pete (reteps), Hassam, and Richard. Their
Vue frontend and agency scrapers are the foundation here. The fork was
revived in 2026 by [ViperSurf](https://github.com/ViperSurf) after the
original backend went quiet.

## What changed in the revival

- **Data feed instead of a dead backend.** The app now reads
  `app/public/data/listings.json` (`{ updated_at, listings: [...] }`),
  so it runs fully on static hosting. Set `VITE_DATA_ENDPOINT_URL` to
  point it at a live API — including the original scraper backend; the
  data layer (`app/src/services/listings.ts`) understands both the
  modern feed and the original Firestore document shape.
- **Campus-wide seed dataset.** Real Champaign-Urbana properties and
  agencies (Campustown, Urbana, Savoy) with approximate rents, clearly
  labeled as sample data in the UI — confirm pricing with the leasing
  office. The dataset is one JSON file; replacing it with live
  inventory is a data update, not a code change.
- **Anonymous landlord reviews.** Per-landlord scores with the four
  subscores students care about, a scoreboard page, and a one-minute
  anonymous review form (no account, no name). Published reviews live
  in `app/public/data/reviews.json` and start empty — no review on
  this site is invented. Reviews a visitor writes are stored in their
  browser and counted immediately; an admin folds them into the
  shared file to publish. A multi-campus config
  (`app/public/data/campus.json`, adopted from the CampusHousing
  schema draft in `docs/`) prepares the same app for other campuses.
- **Static deploy.** Hash routing + relative asset base, deployed to
  GitHub Pages by `.github/workflows/deploy.yml`.

## Run it

```bash
cd app
npm install --legacy-peer-deps
npm run dev     # local dev server
npm run build   # production build into app/dist
```

---

# uiuc-apartments-api

## Improving the Apartment Search Process at UIUC

### Problem

**finding apartments in champaign sucks!**
+ the only way is to go to each agency site, and check if they have something that meets your criteria
+ apartments.com / aggregators suck because each company has to upload their own apartments to each aggregator site, which they don't do

### Introducting \<cool name here>

+ We will build an aggregator site that goes to each agency and downloads the properties using a webscaper + internal APIs
+ users can just visit our site to find properties they want, which will actually be up-to-date with all properties

### How it works

1. We scrape each champaign agency site for properties, once per hour to get most updated list + statuses
2. A user visits our site, and can use simple filters to narrow down agency, location, bedrooms, bathrooms, price
3. The user can now view the properties that meet their criteria

### Implementation

1. Finish scraper
2. Have scraper turn data into database of some sort - mongo/postgres/i dont care
3. Write backend server code to interface with the database
4. Write simple frontend
5. Deploy frontend/backend to cloud (GCP/i dont care)
6. Improve frontend, get public URL
7. post on reddit and PROFIT!!!
