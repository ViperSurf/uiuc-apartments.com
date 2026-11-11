<template>
  <div class="flex min-h-screen flex-col px-10">
    <h1 class="text-4xl mt-5 mb-5">About</h1>
    <p>
      This is an app to help you find apartments in Champaign-Urbana. We noticed that popular apartment search sites
      like
      <a class="text-blue-600 hover:text-blue-800" href="https://www.zillow.com/">Zillow</a>, <a class="text-blue-600 hover:text-blue-800" href="https://www.apartments.com/">apartments.com</a>, and
      <a class="text-blue-600 hover:text-blue-800" href="https://www.rentcollegepads.com/">College Pads</a> don't contain up to date information about apartments
      on campus. Rental agencies do not update their listings on these sites, and the information is often incorrect. We
      wanted to create a site that would allow students to find apartments that are actually available.
    </p>
    <p>
      It is a work in progress, and is not affiliated with any real estate
      agencies. Found a bug?
      Submit an issue on  <a class="text-blue-600 hover:text-blue-800" href="https://github.com/ViperSurf/uiuc-apartments.com/issues">Github</a>.
    </p>
    <div>
      <h2 class="text-4xl mt-5 mb-5">The 2026 revival</h2>
      <p>
        This site began in 2022 as
        <a class="text-blue-600 hover:text-blue-800" href="https://github.com/reteps/uiuc-apartments.com">reteps/uiuc-apartments.com</a>,
        built by Pete, Hassam, and Richard (below), who scraped agency
        sites so students could search every listing in one place. The
        original backend went quiet after 2022. In 2026
        <a class="text-blue-600 hover:text-blue-800" href="https://github.com/ViperSurf">Bara Zalloum (ViperSurf)</a>
        forked and revived it: the frontend now runs on a data feed
        (<code>data/listings.json</code>) that any source can publish to,
        and it adds the piece the original never had — anonymous student
        reviews of landlords, scored on maintenance, communication,
        fairness, and move-out, so management has to do better.
      </p>
      <p class="mt-3">
        Until live agency feeds are reconnected, the listings shown are
        a clearly labeled sample dataset of real Champaign-Urbana
        properties with approximate rents. Always confirm pricing and
        availability with the leasing office. Reviews are never
        invented: the review board starts empty and fills with real
        student submissions.
      </p>
    </div>
    <div>
      <h2 class="text-4xl mt-5 mb-5">Contributors</h2>
      <div class="flex flex-col md:flex-row w-full justify-around">
        <div class="rounded shadow px-5 mx-10 flex-grow">
          <img src="@/assets/hassam_pfp.jpeg" alt="avatar"
            class="w-60 h-60 rounded-full mx-auto" />
          <div class="text-center pt-10">
            <h3 class="text-3xl">Hassam</h3>
            <p><a href="https://github.com/heasummn"><font-awesome-icon icon="fa-brands fa-github" /> Github </a></p>
          </div>
        </div>
        <div class="rounded shadow px-5 mx-10 flex-grow">
          <img src="@/assets/richard_pfp.png" alt="avatar"
            class="w-60 h-60 rounded-full mx-auto" />
          <div class="text-center pt-10">
            <h3 class="text-3xl">Richard</h3>
            <p><a href="https://github.com/richyliu"><font-awesome-icon icon="fa-brands fa-github" /> Github </a></p>
          </div>
        </div>
        <div class="rounded shadow px-5 mx-10 flex-grow">
          <img src="@/assets/pete_pfp.jpeg" alt="avatar"
            class="w-60 h-60 rounded-full mx-auto" />
          <div class="text-center pt-10">
            <h3 class="text-3xl">Pete</h3>
            <p><a href="https://github.com/reteps"><font-awesome-icon icon="fa-brands fa-github" /> Github </a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
</style>
