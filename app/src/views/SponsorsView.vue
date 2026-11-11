<script setup lang="ts">
import { computed, reactive } from 'vue'

const form = reactive({
  company: '',
  name: '',
  email: '',
  website: '',
  message: '',
})

const mailto = computed(() => {
  const subject = encodeURIComponent(`Sponsorship inquiry — ${form.company || 'Campus Housing'}`)
  const body = encodeURIComponent(
    `Company: ${form.company}\nContact: ${form.name}\nEmail: ${form.email}\nWebsite: ${form.website}\n\n${form.message}`,
  )
  return `mailto:zalloumbara@gmail.com?subject=${subject}&body=${body}`
})
</script>

<template>
  <main class="mx-auto max-w-4xl px-4">
    <h1 class="my-8 text-center text-4xl font-bold">For Landlords &amp; Companies</h1>
    <p class="mx-auto mb-8 max-w-2xl text-center text-gray-600">
      Students searching for Champaign-Urbana housing start here — one
      search across every landlord, with the reviews students actually
      trust. Sponsorship puts your properties at the top of that search,
      clearly labeled.
    </p>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="font-semibold text-gray-900">Top placement</h2>
        <p class="mt-1 text-sm text-gray-600">
          Your listings pin above organic results in list view and carry
          a “Sponsored” badge everywhere they appear.
        </p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="font-semibold text-gray-900">Always disclosed</h2>
        <p class="mt-1 text-sm text-gray-600">
          Paid placement is labeled, every time. Students trust the site
          because sponsorship is never disguised as ranking.
        </p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="font-semibold text-gray-900">Reviews stay honest</h2>
        <p class="mt-1 text-sm text-gray-600">
          Sponsorship buys placement, never scores. Your review average
          is whatever students say it is — doing right by tenants is the
          ranking strategy.
        </p>
      </div>
    </div>

    <div class="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
      <p class="text-xs uppercase tracking-wide text-gray-400">
        Example — sample sponsored card (not a real sponsor)
      </p>
      <div class="mt-2 flex items-center justify-between rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-900">Example Realty — 2 bed near the Quad</p>
          <p class="text-sm text-gray-500">$1,450 ($725 / person) · Available 2027-08-01</p>
        </div>
        <span class="rounded-full bg-[#FF5F05] px-2 py-0.5 text-xs font-semibold text-white">Sponsored</span>
      </div>
    </div>

    <div class="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-semibold text-gray-900">Become a pilot sponsor</h2>
      <p class="mt-1 text-sm text-gray-600">
        Pilot partners are featured free for the first semester while
        traffic grows. Tell us about your properties and we'll set up
        your listings and placement.
      </p>
      <form class="mt-4 grid gap-3 sm:grid-cols-2" @submit.prevent>
        <label class="text-sm text-gray-700">
          Company
          <input v-model="form.company" required class="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Acme Properties" />
        </label>
        <label class="text-sm text-gray-700">
          Your name
          <input v-model="form.name" class="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Jordan Smith" />
        </label>
        <label class="text-sm text-gray-700">
          Email
          <input v-model="form.email" type="email" required class="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="you@company.com" />
        </label>
        <label class="text-sm text-gray-700">
          Website
          <input v-model="form.website" class="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="https://…" />
        </label>
        <label class="text-sm text-gray-700 sm:col-span-2">
          What would you like to feature?
          <textarea v-model="form.message" rows="3" class="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Properties, number of units, move-in specials…" />
        </label>
        <div class="sm:col-span-2">
          <a
            :href="mailto"
            class="inline-block rounded bg-[#13294B] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d3a66]"
          >
            Send sponsorship inquiry
          </a>
          <span class="ml-2 text-xs text-gray-400">Opens your email app — nothing is stored by this site.</span>
        </div>
      </form>
    </div>
    <p class="my-8 text-center text-xs text-gray-400">
      Sponsored listings in the data feed carry an expiry date and stop
      being featured automatically when it passes.
    </p>
  </main>
</template>
