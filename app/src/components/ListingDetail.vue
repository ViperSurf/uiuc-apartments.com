<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Apartment, Review } from '../types'
import { loadReviews, scoresFor } from '../services/reviews'
import ReviewForm from './ReviewForm.vue'

const props = defineProps<{ apartment: Apartment }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const reviews = ref<Review[]>([])
onMounted(async () => {
  reviews.value = await loadReviews()
})
const agencyReviews = computed(() =>
  reviews.value.filter((r) => r.agency === props.apartment.agency),
)
const listingReviews = computed(() =>
  agencyReviews.value.filter(
    (r) => !r.listing_id || r.listing_id === String(props.apartment.id),
  ),
)
const scores = computed(() => scoresFor(reviews.value, props.apartment.agency))
const perBed = computed(() =>
  Math.round(props.apartment.rent / Math.max(1, props.apartment.bedrooms)),
)
const mapsUrl = computed(
  () =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${props.apartment.title ?? props.apartment.address} ${props.apartment.address} ${props.apartment.city ?? ''} IL`,
    )}`,
)

function refresh(review: Review) {
  reviews.value = [review, ...reviews.value]
}
</script>

<template>
  <div
    class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
    @click.self="emit('close')"
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900">
            {{ apartment.title ?? apartment.address }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ apartment.address }}<span v-if="apartment.city">, {{ apartment.city }}</span>
            · {{ apartment.agency }}
          </p>
        </div>
        <button
          class="text-2xl leading-none text-gray-400 hover:text-gray-700"
          @click="emit('close')"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div class="rounded bg-gray-50 p-3">
          <div class="font-bold text-gray-900">${{ apartment.rent }}/mo</div>
          <div class="text-gray-500">${{ perBed }} per bed</div>
        </div>
        <div class="rounded bg-gray-50 p-3">
          <div class="font-bold text-gray-900">
            <span v-if="apartment.is_studio">Studio</span>
            <span v-else>{{ apartment.bedrooms }} bed · {{ apartment.bathrooms }} bath</span>
          </div>
          <div class="text-gray-500">
            <span v-if="apartment.sqft">{{ apartment.sqft }} sqft · </span>{{ apartment.property_type ?? 'apartment' }}
          </div>
        </div>
        <div class="rounded bg-gray-50 p-3">
          <div class="font-bold text-gray-900">Available</div>
          <div class="text-gray-500">{{ apartment.available_date }}</div>
        </div>
        <div class="rounded bg-gray-50 p-3">
          <div class="font-bold text-gray-900">Landlord score</div>
          <div class="text-gray-500">
            <span v-if="scores" class="text-amber-600 font-semibold">
              {{ scores.overall.toFixed(1) }} ★
            </span>
            <span v-if="scores"> ({{ scores.count }} review{{ scores.count === 1 ? '' : 's' }})</span>
            <span v-else>No reviews yet</span>
          </div>
        </div>
      </div>

      <p v-if="apartment.amenities?.length" class="mt-3 text-sm text-gray-600">
        <span class="font-medium text-gray-800">Amenities:</span>
        {{ apartment.amenities.join(' · ') }}
        <span v-if="apartment.furnished && apartment.furnished !== 'unknown'">
          · {{ apartment.furnished }}</span
        >
      </p>
      <p v-if="apartment.source === 'seed'" class="mt-2 text-xs text-gray-400">
        Sample listing (seed data): rent and availability are approximate —
        confirm with the leasing office.
      </p>

      <div class="mt-4 flex gap-3">
        <a
          :href="apartment.link"
          target="_blank"
          rel="noreferrer noopener"
          class="rounded bg-[#FF5F05] px-4 py-2 text-sm font-medium text-white hover:bg-[#e04f00]"
        >
          View listing / leasing office
        </a>
        <a
          :href="mapsUrl"
          target="_blank"
          rel="noreferrer noopener"
          class="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Directions
        </a>
      </div>

      <div class="mt-6">
        <h4 class="font-semibold text-gray-900">
          Student reviews of {{ apartment.agency }}
        </h4>
        <div v-if="scores" class="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          <div v-for="(label, key) in { maintenance: 'Maintenance', communication: 'Communication', fairness: 'Fairness', moveout: 'Move-out' }" :key="key" class="rounded bg-gray-50 p-2 text-center">
            <div class="font-bold">{{ scores[key as keyof typeof scores] }} ★</div>
            <div class="text-xs text-gray-500">{{ label }}</div>
          </div>
          <div class="rounded bg-gray-50 p-2 text-center">
            <div class="font-bold">{{ scores.wouldRentAgainPct }}%</div>
            <div class="text-xs text-gray-500">would rent again</div>
          </div>
        </div>
        <ul v-if="listingReviews.length" class="mt-3 space-y-3">
          <li
            v-for="r in listingReviews"
            :key="r.id"
            class="rounded-lg border border-gray-200 p-3 text-sm"
          >
            <div class="flex items-center gap-2">
              <span class="text-amber-500">{{ '★'.repeat(Math.round(r.overall)) }}</span>
              <span class="text-gray-400 text-xs">{{ r.created_at.slice(0, 10) }}</span>
              <span v-if="r.rent_paid" class="text-gray-500 text-xs">paid ${{ r.rent_paid }}/mo</span>
              <span class="text-xs" :class="r.would_rent_again ? 'text-emerald-600' : 'text-red-500'">
                {{ r.would_rent_again ? 'would rent again' : 'would not rent again' }}
              </span>
            </div>
            <p class="mt-1 text-gray-700">{{ r.text }}</p>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-gray-500">
          No reviews yet for {{ apartment.agency }}. Lived here? Be the
          first — it takes a minute and it's anonymous.
        </p>
        <div class="mt-3">
          <ReviewForm
            :agency="apartment.agency"
            :listing-id="String(apartment.id)"
            @submitted="refresh"
          />
        </div>
      </div>
    </div>
  </div>
</template>
