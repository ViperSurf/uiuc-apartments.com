#!/usr/bin/env python3
"""
Campus Housing ingestion: scrape live AppFolio listing portals for
Champaign-Urbana landlords and write the app's data feed
(app/public/data/listings.json).

Design rules:
- One request per portal (the /listings page is server-rendered with
  every card on it). AppFolio's robots.txt asks for a 10s crawl delay
  between requests to a host; we never need a second one.
- Identifies itself with an honest User-Agent.
- Addresses are geocoded through OpenStreetMap Nominatim at ~1 req/s,
  with a committed cache (geocode-cache.json) so re-runs are cheap.
- Seed listings (the big student properties that don't list on
  AppFolio) are kept for agencies the scrape doesn't cover, and stay
  labeled source='seed'. Scraped listings are source='property_manager'.

Usage:
    ingestion/.venv/bin/python ingestion/scrape.py [--no-geocode]
"""
import hashlib
import json
import re
import sys
import time
from datetime import date, datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
FEED_PATH = ROOT / "app" / "public" / "data" / "listings.json"
CACHE_PATH = Path(__file__).resolve().parent / "geocode-cache.json"

UA = {"User-Agent": "CampusHousingBot/1.0 (student project; contact: zalloumbara@gmail.com)"}

PORTALS = [
    ("https://campuspm.appfolio.com/listings", "CPM"),
    ("https://ccr.appfolio.com/listings", "Champaign County Realty"),
    ("https://weinercompanies.appfolio.com/listings", "Weiner Companies"),
    ("https://ram.appfolio.com/listings", "Ramshaw Real Estate"),
]

CITY_CENTERS = {
    "champaign": (40.1164, -88.2434),
    "urbana": (40.1106, -88.2073),
    "savoy": (40.0581, -88.2519),
}
# Rough Champaign-Urbana metro bounding box; listings geocoding outside
# it are dropped (portals occasionally list other towns).
BBOX = (39.95, 40.25, -88.45, -88.05)


def parse_portal(url: str, agency: str) -> list[dict]:
    base = url.split("/listings")[0]
    html = requests.get(url, headers=UA, timeout=30).text
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for div in soup.find_all("div", class_="listing-item__body"):
        lookup = {}
        for detail in div.find_all("div", class_="detail-box__item"):
            dt, dd = detail.find("dt"), detail.find("dd")
            if dt and dd:
                lookup[dt.text.strip()] = dd.text.strip()
        addr_el = div.find("span", class_="js-listing-address")
        title_el = div.find("h2", class_="js-listing-title")
        link_el = div.find("a", target="_blank")
        if not addr_el or not lookup.get("RENT"):
            continue
        rent_raw = lookup["RENT"].replace("$", "").replace(",", "").split(".")[0]
        if not rent_raw.isdigit():
            continue
        rent = int(rent_raw)

        bed_bath = lookup.get("Bed / Bath", "0 / 0").split("/")
        raw_bed = bed_bath[0].strip().split(" ")[0]
        is_studio = raw_bed.lower() == "studio" or raw_bed == "0"
        try:
            bed = 1 if is_studio else int(raw_bed)
        except ValueError:
            bed = 1
        try:
            bath = float(bed_bath[1].strip().split(" ")[0]) if len(bed_bath) > 1 else 1.0
        except ValueError:
            bath = 1.0

        title = title_el.text.strip() if title_el else ""
        desc_el = div.find("p", class_="js-listing-description")
        blob = (title + " " + (desc_el.text if desc_el else "")).lower()
        # Same per-bed correction the original 2022 scraper used:
        # individual leases quote per-person rent on multi-bed units.
        if "individual" in blob or (bed > 1 and rent < 600):
            rent = rent * bed

        avail_raw = (lookup.get("Available") or "").strip()
        if avail_raw.lower() == "now" or avail_raw == "":
            available = date.today().isoformat()
        else:
            available = avail_raw
            for fmt in ("%m/%d/%y", "%m/%d/%Y", "%b %d, %Y", "%B %d, %Y"):
                try:
                    available = datetime.strptime(avail_raw, fmt).date().isoformat()
                    break
                except ValueError:
                    continue

        address = " ".join(addr_el.text.split())
        out.append(
            {
                "id": "af-" + hashlib.sha1(f"{agency}|{address}|{bed}".encode()).hexdigest()[:10],
                "title": title or address,
                "agency": agency,
                "address": address,
                "rent": rent,
                "bedrooms": bed,
                "bathrooms": bath,
                "is_studio": is_studio,
                "available_date": available,
                "link": (base + link_el["href"]) if link_el and link_el.get("href") else url,
                "source": "property_manager",
                "property_type": "studio" if is_studio else "apartment",
            }
        )
    return out


def load_cache() -> dict:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text())
    return {}


def geocode(address: str, cache: dict) -> tuple[float, float] | None:
    if address in cache:
        return tuple(cache[address]) if cache[address] else None
    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers=UA,
            timeout=20,
        )
        results = r.json()
        time.sleep(1.1)  # Nominatim usage policy: max 1 req/s
        if results:
            lat, lng = float(results[0]["lat"]), float(results[0]["lon"])
            cache[address] = [lat, lng]
            return lat, lng
    except Exception:
        pass
    cache[address] = None
    return None


def city_of(address: str) -> str:
    m = re.search(r",\s*(Champaign|Urbana|Savoy)\s*,?\s*IL", address, re.I)
    return m.group(1).title() if m else ""


def main() -> None:
    no_geocode = "--no-geocode" in sys.argv
    scraped: list[dict] = []
    for url, agency in PORTALS:
        try:
            rows = parse_portal(url, agency)
            print(f"{agency}: {len(rows)} listings")
            scraped.extend(rows)
        except Exception as e:  # keep going if one portal is down
            print(f"{agency}: FAILED ({e})")

    cache = load_cache()
    kept = []
    for row in scraped:
        city = city_of(row["address"])
        row["city"] = city or "Champaign"
        coords = None if no_geocode else geocode(row["address"], cache)
        if coords:
            lat, lng = coords
            if not (BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lng <= BBOX[3]):
                continue  # outside the metro area
            row["latitude"], row["longitude"] = lat, lng
        else:
            # Fall back to the city center with a stable small jitter so
            # the listing still appears on the map near its city.
            clat, clng = CITY_CENTERS[row["city"].lower()]
            j = int(hashlib.sha1(row["id"].encode()).hexdigest()[:4], 16) % 100 / 100.0
            row["latitude"] = clat + (j - 0.5) * 0.01
            row["longitude"] = clng + (0.5 - j) * 0.01
        kept.append(row)
    CACHE_PATH.write_text(json.dumps(cache, indent=1))

    # Keep seed listings only for agencies the scrape does not cover.
    old = json.loads(FEED_PATH.read_text())
    covered = {r["agency"] for r in kept}
    seeds = [
        l
        for l in old.get("listings", [])
        if l.get("source") == "seed" and l["agency"] not in covered
    ]
    feed = {
        "updated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "note": (
            "Live listings scraped from landlord AppFolio portals "
            "(source=property_manager), plus clearly labeled sample "
            "listings (source=seed) for major student properties. "
            "Regenerate with ingestion/scrape.py."
        ),
        "listings": kept + seeds,
    }
    FEED_PATH.write_text(json.dumps(feed, indent=1))
    print(f"TOTAL: {len(kept)} scraped + {len(seeds)} seed = {len(feed['listings'])} listings")


if __name__ == "__main__":
    main()
