<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Review } from '../types'
import { fetchListings } from '../services/listings'
import { allScores, loadReviews } from '../services/reviews'
import ReviewForm from '../components/ReviewForm.vue'

const reviews = ref<Review[]>([])
const agencies = ref<string[]>([])
const open = ref<string | null>(null)

onMounted(async () => {
  const [listings, rs] = await Promise.all([fetchListings(), loadReviews()])
  reviews.value = rs
  agencies.value = [...new Set(listings.map((l) => l.agency))].sort()
})

const scored = computed(() => allScores(reviews.value, agencies.value))
const scoredNames = computed(() => new Set(scored.value.map((s) => s.agency)))
const unscored = computed(() => agencies.value.filter((a) => !scoredNames.value.has(a)))

function reviewsFor(agency: string) {
  return reviews.value.filter((r) => r.agency === agency)
}
function refresh(review: Review) {
  reviews.value = [review, ...reviews.value]
}
</script>

<template>
  <main class="mx-auto max-w-4xl px-4">
    <h1 class="my-8 text-center text-4xl font-bold">Landlord Reviews</h1>
    <p class="mx-auto mb-8 max-w-2xl text-center text-gray-600">
      Anonymous reviews by students, for students. Scores cover the things
      that actually decide a lease: maintenance, communication, fairness,
      and move-out. When students can compare landlords honestly,
      management has to do better.
    </p>

    <div v-if="scored.length" class="space-y-3">
      <div
        v-for="s in scored"
        :key="s.agency"
        class="rounded-lg border border-gray-300 bg-white shadow-sm"
      >
        <button
          class="flex w-full items-center justify-between px-5 py-4 text-left"
          @click="open = open === s.agency ? null : s.agency"
        >
          <span>
            <span class="font-semibold text-gray-900">{{ s.agency }}</span>
            <span class="ml-2 text-sm text-gray-500">
              {{ s.count }} review{{ s.count === 1 ? '' : 's' }} · {{ s.wouldRentAgainPct }}% would rent again
            </span>
          </span>
          <span class="text-lg font-bold text-amber-600">{{ s.overall.toFixed(1) }} ★</span>
        </button>
        <div v-if="open === s.agency" class="border-t border-gray-200 px-5 py-4">
          <div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div v-for="(label, key) in { maintenance: 'Maintenance', communication: 'Communication', fairness: 'Fairness', moveout: 'Move-out' }" :key="key" class="rounded bg-gray-50 p-2 text-center">
              <div class="font-bold">{{ s[key as keyof typeof s] }} ★</div>
              <div class="text-xs text-gray-500">{{ label }}</div>
            </div>
          </div>
          <ul class="mt-3 space-y-3">
            <li v-for="r in reviewsFor(s.agency)" :key="r.id" class="rounded-lg border border-gray-200 p-3 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-amber-500">{{ '★'.repeat(Math.round(r.overall)) }}</span>
                <span class="text-xs text-gray-400">{{ r.created_at.slice(0, 10) }}</span>
                <span v-if="r.rent_paid" class="text-xs text-gray-500">paid ${{ r.rent_paid }}/mo</span>
              </div>
              <p class="mt-1 text-gray-700">{{ r.text }}</p>
            </li>
          </ul>
          <div class="mt-3">
            <ReviewForm :agency="s.agency" @submitted="refresh" />
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-center text-gray-500">
      No reviews yet — the scoreboard fills in as students post.
    </p>

    <h2 class="mb-3 mt-10 text-xl font-semibold">Not yet reviewed</h2>
    <div class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="agency in unscored"
        :key="agency"
        class="rounded-lg border border-dashed border-gray-300 bg-white"
      >
        <button
          class="flex w-full items-center justify-between px-5 py-4 text-left"
          @click="open = open === agency ? null : agency"
        >
          <span class="font-medium text-gray-800">{{ agency }}</span>
          <span class="text-sm text-[#FF5F05]">Be the first to review</span>
        </button>
        <div v-if="open === agency" class="border-t border-gray-200 px-5 py-4">
          <ReviewForm :agency="agency" @submitted="refresh" />
        </div>
      </div>
    </div>
    <p class="my-8 text-center text-xs text-gray-400">
      Reviews you write are stored on your device and counted immediately;
      the site admin folds them into the shared data file so everyone sees them.
    </p>
  </main>
</template>
