import { z } from 'zod';

/**
 * Unified housing listing schema (wire format v1).
 *
 * This is the single source of truth shared by:
 *   - the ingestion pipeline (validates every normalized record before publishing),
 *   - the web client and browser extension (validates the feed at runtime),
 *   - third parties consuming the public JSON endpoints (via the generated JSON Schema).
 *
 * Conventions:
 *   - snake_case keys (stable, language-neutral wire format).
 *   - All money is in whole currency units (USD dollars), monthly.
 *   - All timestamps are ISO-8601 strings; dates without time use `YYYY-MM-DD`.
 *   - Non-breaking additions bump the minor `schema_version`; breaking changes ship under `/api/v2`.
 */
export const LISTING_SCHEMA_VERSION = '1.0' as const;

const isoDateTime = z.iso.datetime({ offset: true });
const isoDate = z.iso.date();
const slug = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase kebab-case slug');

/** e.g. `uiuc-champaign`, `purdue-west-lafayette`. Registered in `campuses/index.ts`. */
export const CampusIdSchema = slug;
export type CampusId = z.infer<typeof CampusIdSchema>;

/** e.g. `champaign-urbana-il`. A region can host several campuses (Parkland + UIUC). */
export const RegionIdSchema = slug;
export type RegionId = z.infer<typeof RegionIdSchema>;

export const SourceKindSchema = z.enum([
  'property_manager', // first-party landlord / management company site or feed
  'listing_platform', // AppFolio, RentCafe, Entrata, etc. tenant portals
  'sublease_group', // student sublease boards / groups
  'community', // submitted by students via GitHub (PR / issue form)
  'partner_feed', // direct feed from a sponsoring partner
  'seed', // mock/demo data — never shown as real inventory
]);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const ListingTypeSchema = z.enum(['full_lease', 'sublease', 'room_share']);
export type ListingType = z.infer<typeof ListingTypeSchema>;

export const PropertyTypeSchema = z.enum([
  'apartment',
  'house',
  'townhouse',
  'duplex',
  'studio',
  'room',
  'private_dorm',
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

/** Academic terms a lease covers. `academic_year` = Fall + Spring; `full_year` = 12 months. */
export const LeaseTermSchema = z.enum(['fall', 'spring', 'summer', 'academic_year', 'full_year']);
export type LeaseTerm = z.infer<typeof LeaseTermSchema>;

export const UtilitySchema = z.enum([
  'water',
  'sewer',
  'trash',
  'electric',
  'gas',
  'heat',
  'internet',
  'cable',
]);
export type Utility = z.infer<typeof UtilitySchema>;

export const PetPolicySchema = z.enum(['no_pets', 'cats_only', 'dogs_only', 'cats_and_dogs', 'unknown']);
export type PetPolicy = z.infer<typeof PetPolicySchema>;

export const FurnishedSchema = z.enum(['furnished', 'unfurnished', 'partial', 'optional', 'unknown']);
export type Furnished = z.infer<typeof FurnishedSchema>;

export const SponsorTierSchema = z.enum(['top', 'featured', 'standard']);
export type SponsorTier = z.infer<typeof SponsorTierSchema>;

export const ListingStatusSchema = z.enum(['active', 'pending', 'leased', 'stale']);
export type ListingStatus = z.infer<typeof ListingStatusSchema>;

export const SponsorshipSchema = z
  .object({
    is_sponsored: z.boolean(),
    sponsor_tier: SponsorTierSchema.nullable(),
    /** Sponsorship ends at this instant. Clients re-check at render time, so stale feeds can't over-serve. */
    expiry_date: isoDateTime.nullable(),
    /** Opaque id joining analytics events to a billing campaign. */
    campaign_id: z.string().max(64).nullable().default(null),
    /** Required disclosure label override (defaults are derived from tier). */
    disclosure_label: z.string().max(32).nullable().default(null),
  })
  .refine((s) => !s.is_sponsored || (s.sponsor_tier !== null && s.expiry_date !== null), {
    message: 'sponsored listings require sponsor_tier and expiry_date',
  });
export type Sponsorship = z.infer<typeof SponsorshipSchema>;

export const NOT_SPONSORED: Sponsorship = {
  is_sponsored: false,
  sponsor_tier: null,
  expiry_date: null,
  campaign_id: null,
  disclosure_label: null,
};

export const ListingImageSchema = z.object({
  /** Absolute URL, or a path relative to the data host (resolved with `resolveAssetUrl`). */
  url: z.string().min(1),
  alt: z.string().max(200).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type ListingImage = z.infer<typeof ListingImageSchema>;

export const ListingSchema = z.object({
  schema_version: z.literal(LISTING_SCHEMA_VERSION),

  /** Stable, deterministic id: `${source.id}:${hash(source_listing_id)}`. Survives re-ingestion. */
  id: z.string().min(3).max(128),
  campus_id: CampusIdSchema,
  region_id: RegionIdSchema,

  source: z.object({
    id: slug,
    name: z.string().min(1),
    kind: SourceKindSchema,
    url: z.url(),
  }),
  source_listing_id: z.string().min(1),
  /** Canonical outbound link where a student can apply / contact. */
  url: z.url(),

  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().default(null),
  listing_type: ListingTypeSchema,
  property_type: PropertyTypeSchema,

  landlord: z.object({
    name: z.string().min(1),
    slug,
    website: z.url().nullable().default(null),
    phone: z.string().nullable().default(null),
  }),

  address: z.object({
    line1: z.string().min(1),
    unit: z.string().nullable().default(null),
    city: z.string().min(1),
    state: z.string().length(2),
    postal_code: z.string().nullable().default(null),
  }),
  /** Null when geocoding failed; such listings render in the grid but not on the map. */
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      precision: z.enum(['rooftop', 'street', 'approximate']),
      source: z.enum(['listing', 'geocoder', 'manual']),
    })
    .nullable(),

  pricing: z.object({
    /** Total monthly rent for the whole unit (or the room, for room_share / per-bed subleases). */
    rent_total: z.number().nonnegative(),
    /** Monthly rent per bedroom/bed. Always present to make cross-listing comparison trivial. */
    rent_per_bed: z.number().nonnegative(),
    /** How the source quoted the price — helps students sanity check. */
    quoted_basis: z.enum(['per_unit', 'per_bed']),
    currency: z.literal('USD'),
    deposit: z.number().nonnegative().nullable().default(null),
    /** Recurring mandatory fees not included in rent (e.g. "tech fee"), monthly. */
    monthly_fees: z.number().nonnegative().nullable().default(null),
  }),

  layout: z.object({
    /** 0 = studio/efficiency. */
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().min(0).max(20),
    sqft: z.number().int().positive().nullable().default(null),
  }),

  lease: z.object({
    terms: z.array(LeaseTermSchema).min(1),
    available_from: isoDate.nullable(),
    available_until: isoDate.nullable().default(null),
    length_months: z.number().int().min(1).max(24).nullable().default(null),
  }),

  utilities_included: z.array(UtilitySchema).default([]),
  amenities: z.array(z.string().max(48)).default([]),
  pet_policy: PetPolicySchema,
  furnished: FurnishedSchema,
  images: z.array(ListingImageSchema).max(30).default([]),
  tags: z.array(z.string().max(32)).default([]),

  sponsorship: SponsorshipSchema.default(NOT_SPONSORED),

  status: ListingStatusSchema,
  first_seen_at: isoDateTime,
  last_seen_at: isoDateTime,
  updated_at: isoDateTime,
});

/** Fully validated listing (what clients consume). */
export type Listing = z.infer<typeof ListingSchema>;
/** Input shape (defaults optional) — what adapters/community submissions may produce. */
export type ListingInput = z.input<typeof ListingSchema>;

