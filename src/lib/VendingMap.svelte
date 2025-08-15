<script lang="ts">
  import { onMount } from "svelte";
  import { oregonMachines } from "$lib/data/oregonMachines";
  import MachinePanel from "$lib/MachinePanel.svelte";
  import { getMachineStatus } from '$lib/statusClient';

  interface Report {
    time: string;
    upvotes: number;
    downvotes: number;
    inStock: boolean;
    // id?: string; // when you move to real reports
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

  export let machines: Machine[] = oregonMachines as Machine[];
  export let selected: Machine | null = null;
  export let map: any;

  const fakeReports: Report[] = [
    { time: "20 minutes ago", upvotes: 3, downvotes: 0, inStock: true },
    { time: "1 hour ago",     upvotes: 5, downvotes: 1, inStock: false },
    { time: "3 hours ago",    upvotes: 9, downvotes: 2, inStock: true },
  ];

   async function setSelected(m: Machine) {
    if (m.latitude != null && m.longitude != null && map) {
      map.setView([m.latitude, m.longitude], 14, { animate: true });
    }

    // show placeholder immediately
    selected = { ...m, reports: m.reports?.length ? m.reports : fakeReports };

    try {
      const rows = await getReportsForMachine(m.machineId, 25);
      selected = { ...m, reports: rows.length ? rows : [] }; // real rows; empty if none
    } catch {
      // keep placeholder on failure
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

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);

    for (const m of machines) {
      m.reports = m.reports?.length ? m.reports : fakeReports;

      if (m.latitude != null && m.longitude != null) {
        const marker = L.circleMarker([m.latitude, m.longitude], {
          radius: 7, fillColor: "#fb4934", color: "#fb4934",
          weight: 1, opacity: 1, fillOpacity: 0.9
        }).addTo(map);
        marker.on("click", () => (selected = m));
      }
    }
  });

  function colorFor(p: number) {
    if (p >= 0.7) return '#b8bb26';   // green
    if (p >= 0.4) return '#fabd2f';   // yellow
    return '#fb4934';                 // red
  }

  async function paintMarker(marker: import("leaflet").CircleMarker, mid: string) {
    try {
      const s = await getMachineStatus(mid);
      const c = colorFor(s.in_stock_likelihood);
      marker.setStyle({ color: c, fillColor: c });
      marker.bindTooltip(`Likely in stock: ${(s.in_stock_likelihood*100|0)}% · ${s.confidence}`, {sticky:true});
    } catch {}
  }

  function closePanel() { selected = null; }
  function submitNew() {
    if (!selected) return;
    window.location.href = `/reports/new?machineId=${encodeURIComponent(selected.machineId)}`;
  }
  function viewHistory() {
    if (!selected) return;
    window.location.href = `/reportlist?machineId=${encodeURIComponent(selected.machineId)}`;
  }
</script>

<div class="layout">
  <div class="map-wrap">
    <div id="map"></div>

    {#if selected}
      <MachinePanel
        {selected}
        on:openreport={(e) => goto(`/reports/${e.detail.id}`)}
        on:close={closePanel}
        on:submit={submitNew}
        on:history={viewHistory}
      >
      </MachinePanel>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "../app.css";
  .layout   { @apply flex h-full w-full overflow-hidden; }
  .map-wrap { @apply relative flex-1; }
  #map      { @apply h-full w-full relative z-0; }
</style>
