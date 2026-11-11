<script module="es2015" lang="ts">
import 'leaflet/dist/leaflet.css'
import Navbar from './components/Navbar.vue'

export default {
  components: {
    Navbar,
  },
}
</script>

<template>
  <Navbar />
  <RouterView />
  <footer class="mt-10 border-t border-gray-200 py-6 text-center text-sm text-gray-500">
    <p>
      UIUC Apartments — a student-built apartment finder for Champaign-Urbana.
    </p>
    <p class="mt-1">
      Forked from
      <a
        class="text-blue-600 hover:text-blue-800"
        href="https://github.com/reteps/uiuc-apartments.com"
        target="_blank"
        rel="noreferrer noopener"
      >reteps/uiuc-apartments.com</a>
      · revived and continued by
      <a
        class="text-blue-600 hover:text-blue-800"
        href="https://github.com/ViperSurf/uiuc-apartments.com"
        target="_blank"
        rel="noreferrer noopener"
      >ViperSurf</a>
      · not affiliated with the University of Illinois or any leasing agency
    </p>
  </footer>
</template>

<style scoped></style>
