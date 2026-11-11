import type { Apartment } from '../types'

/**
 * Listings data layer.
 *
 * Default: fetches the bundled feed at `data/listings.json`
 * ({ updated_at, listings: [...] }), so the site is fully functional
 * as a static deployment. Point VITE_DATA_ENDPOINT_URL at a live API
 * (for example the original scraper backend) and the same UI runs on
 * live inventory instead.
 *
 * Two payload shapes are understood:
 *  - the modern feed: an array, or { listings: [...] }
 *  - the original 2022 Firestore document shape
 *    ({ updateTime, fields: { id: { stringValue: "<json>" } } })
 */
const FEED_URL =
  (import.meta.env.VITE_DATA_ENDPOINT_URL as string | undefined) ??
  'data/listings.json'

export async function fetchListings(): Promise<Apartment[]> {
  const response = await fetch(FEED_URL)
  const doc: any = await response.json()

  if (Array.isArray(doc)) return doc as Apartment[]
  if (doc && Array.isArray(doc.listings)) {
    if (doc.updated_at) localStorage.last_stored = doc.updated_at
    return doc.listings as Apartment[]
  }
  if (doc && doc.fields) {
    // Original scraper/Firestore shape.
    localStorage.last_stored = doc.updateTime
    return Object.entries(doc.fields).map(([id, value]: [string, any]) => {
      const elem = JSON.parse(value.stringValue)
      elem['id'] = id
      return elem as Apartment
    })
  }
  return []
}
