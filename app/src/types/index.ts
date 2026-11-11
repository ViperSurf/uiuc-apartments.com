export interface Apartment {
  address: string
  agency: string
  available_date: string
  bathrooms: number
  bedrooms: number
  id: number | string
  is_studio: boolean
  link: string
  rent: number
  latitude: number
  longitude: number
  // Revival additions (2026). All optional so the original scraped
  // Firestore-shaped payloads keep working unchanged.
  title?: string
  city?: string
  sqft?: number | null
  furnished?: string
  pets?: string
  amenities?: string[]
  property_type?: string
  /** 'seed' = demonstration dataset; 'property_manager' = live feed. */
  source?: string
  /** Sponsorship (see docs/listing-schema.ts): featured placement must
   *  always render with its disclosure label. */
  sponsored?: boolean
  sponsor_tier?: 'top' | 'featured' | 'standard' | null
}

export type Filter = {
  minBedrooms: number
  maxBedrooms: number
  minBathrooms: number
  maxBathrooms: number
  dateRange: Array<Date>
  minRent: number
  maxRent: number
  selectedAgencies: Array<string>
}

/**
 * An anonymous student review of an agency / landlord.
 * Modeled on the subscores students actually care about
 * (maintenance, communication, fairness, move-out).
 */
export interface Review {
  id: string
  agency: string
  /** Optional: the specific listing the reviewer lived in. */
  listing_id?: string | null
  /** 1-5 */
  overall: number
  maintenance: number
  communication: number
  fairness: number
  moveout: number
  rent_paid?: number | null
  would_rent_again?: boolean
  text: string
  created_at: string
}

export interface AgencyScores {
  agency: string
  count: number
  overall: number
  maintenance: number
  communication: number
  fairness: number
  moveout: number
  /** 0-100 */
  wouldRentAgainPct: number
}
