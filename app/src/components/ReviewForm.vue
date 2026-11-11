<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Review } from '../types'
import { addReview } from '../services/reviews'

const props = defineProps<{
  agency: string
  listingId?: string | null
}>()
const emit = defineEmits<{ (e: 'submitted', review: Review): void }>()

const form = reactive({
  overall: 3,
  maintenance: 3,
  communication: 3,
  fairness: 3,
  moveout: 3,
  rent_paid: null as number | null,
  would_rent_again: true,
  text: '',
})
const done = ref(false)
const error = ref('')

const categories = [
  { key: 'overall', label: 'Overall' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'communication', label: 'Communication' },
  { key: 'fairness', label: 'Fairness (deposits, fees)' },
  { key: 'moveout', label: 'Move-out experience' },
] as const

function submit() {
  if (!form.text.trim()) {
    error.value = 'A sentence or two helps the next student most.'
    return
  }
  const review: Review = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agency: props.agency,
    listing_id: props.listingId ?? null,
    overall: form.overall,
    maintenance: form.maintenance,
    communication: form.communication,
    fairness: form.fairness,
    moveout: form.moveout,
    rent_paid: form.rent_paid,
    would_rent_again: form.would_rent_again,
    text: form.text.trim(),
    created_at: new Date().toISOString(),
  }
  addReview(review)
  done.value = true
  emit('submitted', review)
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
    <h4 class="font-semibold text-gray-900">
      Review {{ agency }} — anonymously
    </h4>
    <p class="text-xs text-gray-500 mb-3">
      No name, no account. Takes about a minute, and it's how landlords
      here get held to a standard.
    </p>
    <div v-if="done" class="text-sm text-emerald-700">
      Thanks — your review is saved on this device and counted in the
      scores right away. Published reviews are folded into the shared
      data file by the site admin.
    </div>
    <form v-else @submit.prevent="submit" class="space-y-3">
      <div
        v-for="cat in categories"
        :key="cat.key"
        class="flex items-center justify-between gap-3"
      >
        <label class="text-sm text-gray-700">{{ cat.label }}</label>
        <span class="flex gap-1">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="text-xl leading-none"
            :class="form[cat.key] >= n ? 'text-amber-500' : 'text-gray-300'"
            @click="form[cat.key] = n"
            :aria-label="`${cat.label}: ${n} of 5`"
          >
            ★
          </button>
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <label class="text-sm text-gray-700">
          Rent you paid ($/mo)
          <input
            v-model.number="form.rent_paid"
            type="number"
            min="0"
            placeholder="optional"
            class="ml-2 w-28 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label class="text-sm text-gray-700 flex items-center gap-2">
          <input v-model="form.would_rent_again" type="checkbox" />
          I'd rent from them again
        </label>
      </div>
      <textarea
        v-model="form.text"
        rows="3"
        placeholder="What should the next student know? Maintenance speed, deposit surprises, noise, management…"
        class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button
        type="submit"
        class="rounded bg-[#13294B] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d3a66]"
      >
        Post anonymous review
      </button>
    </form>
  </div>
</template>
