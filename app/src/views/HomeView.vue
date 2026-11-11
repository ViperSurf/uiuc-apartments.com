<script module="es2015" lang="ts">
import ApartmentCard from '../components/ApartmentCard.vue'
import MapCard from '../components/MapCard.vue'
import FilterControls from '../components/FilterControls.vue'
import ListingDetail from '../components/ListingDetail.vue'
import { fetchListings } from '../services/listings'
import { onMounted, type Ref } from 'vue'
import VirtualList from 'vue3-virtual-scroll-list'
import { ref } from 'vue'
import type { Apartment, Filter } from '../types'
import leaflet from 'leaflet'

function dateIsBetween(date: Date, start: Date, end: Date) {
  // create new date without the time component
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return d >= s && d <= e
}

function getData(): Promise<Apartment[]> {
  // Data layer: bundled feed by default, live API when
  // VITE_DATA_ENDPOINT_URL is set (see services/listings.ts).
  return fetchListings()
}

// source: https://stackoverflow.com/a/42532563
function isLatLongInsidePolygon(x: number, y: number, poly) {
  var inside = false
  for (var ii = 0; ii < poly.getLatLngs().length; ii++) {
    var polyPoints = poly.getLatLngs()[ii]
    for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
      var xi = polyPoints[i].lat,
        yi = polyPoints[i].lng
      var xj = polyPoints[j].lat,
        yj = polyPoints[j].lng

      var intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }
  }

  return inside
}

export default {
  components: {
    ApartmentCard,
    FilterControls,
    MapCard,
    VirtualList,
    ListingDetail,
  },
  computed: {
    agencies(): Array<string> {
      return [
        ...new Set(
          this.allApartments.map((apartment: Apartment) => apartment.agency)
        ),
      ]
    },
    boundedFilteredApartments(): Apartment[] {
      return this.filteredApartments.filter((apartment: Apartment) => {
        return (
          apartment.latitude >= this.bounds.getSouthWest().lat &&
          apartment.latitude <= this.bounds.getNorthEast().lat &&
          apartment.longitude >= this.bounds.getSouthWest().lng &&
          apartment.longitude <= this.bounds.getNorthEast().lng
        )
      })
    },
    shapesFilteredApartments(): Apartment[] {
      return this.allApartments.filter((apartment) => {
        if (this.filterShapes.length === 0) {
          return true
        }
        for (const shape of this.filterShapes) {
          if (shape instanceof L.Polygon) {
            if (
              isLatLongInsidePolygon(
                apartment.latitude,
                apartment.longitude,
                shape
              )
            ) {
              return true
            }
          }
        }
        return false
      })
    },
    filteredApartments(): Apartment[] {
      // console.log('received event', filter)
      return this.shapesFilteredApartments
        .filter((apartment) => {
          return (
            apartment.bedrooms >= this.filter.minBedrooms &&
            apartment.bedrooms <= this.filter.maxBedrooms &&
            apartment.bathrooms >= this.filter.minBathrooms &&
            apartment.bathrooms <= this.filter.maxBathrooms &&
            apartment.rent / Math.max(1, apartment.bedrooms) >=
              this.filter.minRent &&
            apartment.rent / Math.max(1, apartment.bedrooms) <=
              this.filter.maxRent &&
            (this.filter.selectedAgencies.length == 0 ||
              this.filter.selectedAgencies.includes(apartment.agency))
          )
        })
        .filter((apartment) => {
          return typeof apartment.available_date === 'string' &&
            this.filter.dateRange?.length == 2
            ? dateIsBetween(
                // remove timezone from date
                new Date(
                  apartment.available_date.replace(' 00:00:00 GMT', '') +
                    ' GMT-0500'
                ),
                this.filter.dateRange[0],
                this.filter.dateRange[1]
              )
            : true
        })
        .sort((a, b) => {
          const perPersonA = a.rent / Math.max(1, a.bedrooms)
          const perPersonB = b.rent / Math.max(1, b.bedrooms)
          return perPersonA - perPersonB
        })
    },
    searchedApartments(): Apartment[] {
      const q = (this.searchText ?? '').trim().toLowerCase()
      if (!q) return this.boundedFilteredApartments
      return this.boundedFilteredApartments.filter((a: Apartment) =>
        [a.title, a.address, a.agency, a.city]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(q))
      )
    },
    listApartments(): Apartment[] {
      // List view: no map bounds — every match, searchable + sortable.
      // Sponsored listings pin to the top and are always labeled.
      const q = (this.searchText ?? '').trim().toLowerCase()
      let rows = this.filteredApartments
      if (q) {
        rows = rows.filter((a: Apartment) =>
          [a.title, a.address, a.agency, a.city]
            .filter(Boolean)
            .some((s) => (s as string).toLowerCase().includes(q))
        )
      }
      const perBed = (a: Apartment) => a.rent / Math.max(1, a.bedrooms)
      const sorted = [...rows].sort((a, b) => {
        switch (this.sortBy) {
          case 'perBedDesc':
            return perBed(b) - perBed(a)
          case 'bedsDesc':
            return b.bedrooms - a.bedrooms
          case 'dateAsc':
            return String(a.available_date).localeCompare(String(b.available_date))
          default:
            return perBed(a) - perBed(b)
        }
      })
      return [
        ...sorted.filter((a) => a.sponsored),
        ...sorted.filter((a) => !a.sponsored),
      ]
    },
  },
  setup() {
    const allApartments: Ref<Array<Apartment>> = ref([])
    const selectedApartment: Ref<Apartment> = ref({} as Apartment)
    const detailApartment: Ref<Apartment | null> = ref(null)
    const viewMode = ref('split')
    const searchText = ref('')
    const sortBy = ref('perBedAsc')
    const loading = ref(true)
    const error = ref(null)
    const apartmentCard = ApartmentCard
    const bounds: Ref<leaflet.LatLngBounds> = ref(
      leaflet.latLngBounds(new leaflet.LatLng(0, 0), new leaflet.LatLng(0, 0))
    )
    const filterShapes: Ref<Array<L.Draw.PolyLine>> = ref([])
    const filter: Ref<Filter> = ref({} as Filter)
    onMounted(async () => {
      if (localStorage.data && localStorage.last_stored) {
        const day = 1000 * 60 * 60 * 24
        const day_ago = Date.now() - day
        if (new Date(localStorage.last_stored) < day_ago) {
          getData().then((data) => {
            localStorage.data = JSON.stringify(data)
            allApartments.value = data
            // filteredApartments.value = data.sort((a: Apartment, b: Apartment) => {
            //   const perPersonA = a.rent / Math.max(1, a.bedrooms)
            //   const perPersonB = b.rent / Math.max(1, b.bedrooms)
            //   return perPersonA - perPersonB
            // })
          })
        } else {
          allApartments.value = JSON.parse(localStorage.data)
          // filteredApartments.value = allApartments.value.sort((a: Apartment, b: Apartment) => {
          //   const perPersonA = a.rent / Math.max(1, a.bedrooms)
          //   const perPersonB = b.rent / Math.max(1, b.bedrooms)
          //   return perPersonA - perPersonB
          // })
        }
      } else {
        getData().then((data) => {
          localStorage.data = JSON.stringify(data)
          allApartments.value = data
          // filteredApartments.value = data.sort((a: Apartment, b: Apartment) => {
          //   const perPersonA = a.rent / Math.max(1, a.bedrooms)
          //   const perPersonB = b.rent / Math.max(1, b.bedrooms)
          //   return perPersonA - perPersonB
          // })
        })
      }

      // } catch (err: any) {
      //   error.value = err.message
      // } finally {
      //   loading.value = false
      // }
    })

    return {
      apartmentCard,
      selectedApartment,
      detailApartment,
      viewMode,
      searchText,
      sortBy,
      allApartments,
      filter,
      bounds,
      filterShapes,
      loading,
      error,
    }
  },
  methods: {
    onApartmentHover(apartment: Apartment) {
      this.selectedApartment = apartment
    },
    onApartmentSelect(apartment: Apartment) {
      this.detailApartment = apartment
    },
  },
}
</script>

<template>
  <main>
    <h1 class="my-8 text-4xl font-bold text-center">UIUC Apartments</h1>
    <p class="mx-auto -mt-4 mb-2 max-w-2xl px-4 text-center text-sm text-gray-500">
      Apartment listings across Champaign-Urbana, plus anonymous student
      reviews of every landlord — so management has to do better.
      Most listings are pulled from live landlord portals; a few major
      properties are sample listings, so confirm pricing with the
      leasing office.
    </p>
    <div class="mx-auto mb-2 flex max-w-3xl flex-wrap items-center justify-center gap-2 px-4">
      <div class="flex overflow-hidden rounded-lg border border-gray-300" role="group" aria-label="View mode">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium"
          :class="viewMode === 'split' ? 'bg-[#13294B] text-white' : 'bg-white text-gray-700'"
          @click="viewMode = 'split'"
        >
          Map view
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium"
          :class="viewMode === 'list' ? 'bg-[#13294B] text-white' : 'bg-white text-gray-700'"
          @click="viewMode = 'list'"
        >
          List view
        </button>
      </div>
      <input
        v-model="searchText"
        type="search"
        placeholder="Search by name, street, landlord, or city…"
        aria-label="Search listings"
        class="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <select
        v-if="viewMode === 'list'"
        v-model="sortBy"
        aria-label="Sort listings"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="perBedAsc">Price per bed: low to high</option>
        <option value="perBedDesc">Price per bed: high to low</option>
        <option value="bedsDesc">Most bedrooms</option>
        <option value="dateAsc">Available soonest</option>
      </select>
      <span class="text-sm text-gray-500" aria-live="polite">
        {{ viewMode === 'list' ? listApartments.length : searchedApartments.length }} places
      </span>
    </div>
    <div v-if="viewMode === 'split'" class="md:grid md:grid-cols-2 lg:grid-cols-4 mt-4">
      <div class="col-span-1 mx-4">
        <FilterControls
          :agencies="agencies"
          v-model:filter-apartments="filter"
        />
      </div>
      <div class="col-span-2 m-4">
        <MapCard
          v-model:bounds="bounds"
          v-model:filter-shapes="filterShapes"
          :apartments="filteredApartments"
          :selectedApartment="selectedApartment"
        />
      </div>
      <div class="col-span-1 mx-4">
        <VirtualList
          style="height: 75vh; overflow-y: auto"
          :data-key="'id'"
          :data-sources="searchedApartments"
          :data-component="apartmentCard"
          @apartment-hover="onApartmentHover"
          @apartment-select="onApartmentSelect"
        />
        <!-- <ApartmentCard
          v-for="apartment in filteredApartments"
          :key="apartment.id"
          :apartment="apartment"
        /> -->
      </div>
    </div>
    <div v-else class="mx-auto max-w-5xl px-4">
      <div class="grid gap-2 md:grid-cols-2">
        <ApartmentCard
          v-for="apartment in listApartments"
          :key="apartment.id"
          :source="apartment"
          @apartment-select="onApartmentSelect"
        />
      </div>
      <p v-if="listApartments.length === 0" class="py-10 text-center text-gray-500">
        No places match those filters yet. Try widening the rent range,
        clearing the search, or choosing “Any date”.
      </p>
    </div>
    <ListingDetail
      v-if="detailApartment"
      :apartment="detailApartment"
      @close="detailApartment = null"
    />
  </main>
</template>
