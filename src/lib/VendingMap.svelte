<!-- src/lib/VendingMap.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { oregonMachines } from "$lib/data/oregonMachines";
  import MachinePanel from "./MachinePanel.svelte";

  interface Report {
    time: string;
    upvotes: number;
    downvotes: number;
    inStock: boolean;
  }

  interface Machine {
    retailer: string;
    machineId: string;
    address: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    reports?: Report[];
  }

  // Expose to parent if you want (optional)
  export let machines: Machine[] = oregonMachines as Machine[];
  export let selected: Machine | null = null;
  export let map: any;

  const fakeReports: Report[] = [
    { time: "20 minutes ago", upvotes: 3, downvotes: 0, inStock: true },
    { time: "1 hour ago", upvotes: 5, downvotes: 1, inStock: false },
    { time: "3 hours ago", upvotes: 9, downvotes: 2, inStock: true },
  ];

  function handleSidebarSelect(loc: Machine) {
    const m = machines.find(
      (x) =>
        x.machineId === loc.machineId &&
        x.address === loc.address &&
        x.city === loc.city &&
        x.state === loc.state,
    );

    if (!m) return;

    // ensure preview reports
    m.reports = m.reports?.length ? m.reports : fakeReports;
    selected = m;

    if (m.latitude != null && m.longitude != null && map) {
      map.setView([m.latitude, m.longitude], 14, { animate: true });
    }
  }

  onMount(async () => {
    const L = (await import("leaflet")).default;
    await import("leaflet/dist/leaflet.css");

    map = L.map("map", {
      minZoom: 4,
      maxZoom: 15,
      maxBounds: [
        [24.396308, -124.848974],
        [49.384358, -66.885444],
      ],
      maxBoundsViscosity: 1.0,
      zoomControl: true,
    }).setView([37.8, -96], 4);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    ).addTo(map);

    for (const m of machines) {
      // attach fake reports for now
      m.reports = m.reports?.length ? m.reports : fakeReports;

      const marker = L.circleMarker([m.latitude, m.longitude], {
        radius: 7,
        fillColor: "#fb4934",
        color: "#fb4934",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.on("click", () => {
        selected = m;
      });
    }
  });

  function closePanel() {
    selected = null;
  }

  function submitNew() {
    alert("Submit new report for " + selected?.machineId);
  }
  function viewHistory() {
    alert("View full history for " + selected?.machineId);
  }
</script>

<div class="layout">
  <!-- Map + Panel -->
  <div class="map-wrap">
    <div id="map"></div>

    {#if selected}
      <aside class="side-panel">
        <div class="panel-header">
          <h2 class="panel-title">{selected.address}, {selected.city}</h2>
          <button class="close-button" on:click={closePanel} aria-label="Close"
            >✕</button
          >
        </div>

        <h3 class="section-title">Recent Reports</h3>
        {#each selected.reports as r}
          <div class="report-entry">
            <div class="report-left">
              {#if r.inStock}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#b8bb26"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#fb4934"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              {/if}

              <span class="flex items-center space-x-1 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#b8bb26"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                <span>{r.upvotes}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#928374"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <span>{r.downvotes}</span>
              </span>
            </div>
            <time style="color: #928374;" class="text-xs">{r.time}</time>
          </div>
        {/each}

        <button class="btn-primary" on:click={submitNew}
          >Submit New Report</button
        >
        <button class="btn-secondary" on:click={viewHistory}
          >View Full Report History</button
        >
      </aside>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "../app.css";

  .layout {
    @apply flex h-full w-full overflow-hidden;
  }

  .sidebar-wrap {
    @apply w-80 flex-shrink-0 overflow-hidden p-4 space-y-4;
    background-color: var(--gv-panel);
    color: var(--gv-fg);
  }

  .map-wrap {
    @apply relative flex-1;
  }

  #map {
    @apply h-full w-full relative z-0;
  }

  .side-panel {
    @apply fixed top-0 right-0 h-full w-80 p-4 shadow-lg overflow-y-auto z-[10000];
    background-color: #282828;
    color: #ebdbb2;
  }

  .report-entry {
    @apply flex items-center justify-between py-2 border-b;
    border-color: #3c3836;
  }

  .report-left {
    @apply flex items-center space-x-2;
  }

  .btn-primary {
    @apply mt-4 w-full py-2 rounded text-center font-medium;
    background-color: #b8bb26;
    color: #282828;

    @hover {
      background-color: #a89984;
      color: #ebdbb2;
    }
  }

  .btn-secondary {
    @apply mt-2 w-full py-2 rounded text-center font-medium;
    background-color: #3c3836;
    color: #ebdbb2;
  }

  .btn-secondary:hover {
    background-color: #504945;
  }
  .close-button {
    color: #928374;
  }
  .close-button:hover {
    color: #ebdbb2;
  }
  .panel-header {
    @apply flex justify-between items-center mb-4;
  }
  .panel-title {
    @apply text-xl font-semibold;
    color: #ebdbb2;
  }
  .section-title {
    @apply text-lg mb-2;
    color: #fe8019;
  }
</style>
