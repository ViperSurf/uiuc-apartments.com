# Design notes

`listing-schema.ts` is the unified listing schema (Zod) from the
CampusHousing monorepo design draft: one validated wire format shared
by ingestion, the web client, and third parties, with campus/region
ids, per-bed pricing, lease terms, sponsorship disclosure, and a
`seed` source kind for demonstration data.

The running app uses the lighter feed in `app/public/data/` today.
The campus configuration the draft produced for UIUC ships as
`app/public/data/campus.json` (map center, campus hubs, Illini theme
colors), which is the seam for adding more campuses later.
