import type { AgencyScores, Review } from '../types'

/**
 * Reviews data layer (same pattern as the listings feed).
 *
 * Published reviews live in `data/reviews.json`, shared by every
 * visitor. Reviews a visitor writes are stored in their browser
 * (LocalStorage overlay) and marked as their own until an admin
 * publishes them into the shared file. A real backend can replace
 * this layer later without touching the UI.
 */
const FEED_URL = 'data/reviews.json'
const LS_KEY = 'campushousing.myReviews'

let cache: Review[] | null = null

export function myReviews(): Review[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Review[]
  } catch {
    return []
  }
}

export async function loadReviews(force = false): Promise<Review[]> {
  if (cache && !force) return cache
  let shared: Review[] = []
  try {
    const res = await fetch(FEED_URL)
    const doc: any = await res.json()
    shared = Array.isArray(doc) ? doc : (doc.reviews ?? [])
  } catch {
    shared = []
  }
  const mine = myReviews()
  const seen = new Set(shared.map((r) => r.id))
  cache = [...shared, ...mine.filter((r) => !seen.has(r.id))].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
  return cache
}

export function addReview(review: Review): Review[] {
  const mine = myReviews()
  mine.unshift(review)
  localStorage.setItem(LS_KEY, JSON.stringify(mine))
  cache = null
  return mine
}

export function scoresFor(reviews: Review[], agency: string): AgencyScores | null {
  const rs = reviews.filter((r) => r.agency === agency)
  if (rs.length === 0) return null
  const avg = (pick: (r: Review) => number) =>
    Math.round((rs.reduce((s, r) => s + pick(r), 0) / rs.length) * 10) / 10
  return {
    agency,
    count: rs.length,
    overall: avg((r) => r.overall),
    maintenance: avg((r) => r.maintenance),
    communication: avg((r) => r.communication),
    fairness: avg((r) => r.fairness),
    moveout: avg((r) => r.moveout),
    wouldRentAgainPct: Math.round(
      (rs.filter((r) => r.would_rent_again).length / rs.length) * 100,
    ),
  }
}

export function allScores(reviews: Review[], agencies: string[]): AgencyScores[] {
  return agencies
    .map((a) => scoresFor(reviews, a))
    .filter((s): s is AgencyScores => s !== null)
    .sort((a, b) => b.overall - a.overall || b.count - a.count)
}
