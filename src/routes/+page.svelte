<!-- src/routes/+page.svelte -->
<script lang="ts">
  import Sidebar from "$lib/Sidebar.svelte";
  import VendingMap from "$lib/VendingMap.svelte";
  import RecentReports from "$lib/RecentReports.svelte";
  import { oregonMachines } from "$lib/data/oregonMachines";

  const reports = [
    { message: "Restocked inventory at Q00832", timeAgo: "2 hours ago" },
    { message: "Low stock at Q00959", timeAgo: "1 day ago" },
    { message: "Restocked inventory at Q01121", timeAgo: "3 days ago" }
  ];

  let selected: (typeof oregonMachines)[number] | null = null;
  let mapRef: any;

  function handleSidebarSelect(loc) {
    const m = oregonMachines.find(
      (x) =>
        x.machineId === loc.machineId &&
        x.address   === loc.address   &&
        x.city      === loc.city      &&
        x.state     === loc.state
    );
    if (!m) 
      return;

    // Ensure preview reports if none (since the panel lives inside VendingMap and uses selected.reports)
    m.reports = m.reports?.length ? m.reports : fakeReports;
    selected = m;

    if (mapRef && m.latitude != null && m.longitude != null) {
      mapRef.setView([m.latitude, m.longitude], 14, { animate: true });
    }
  }

  function closePanel() {
    selected = null;
  }
</script>

<main class="flex flex-col h-screen bg-gruvbox-dark1 text-gruvbox-fg">
  <div class="flex flex-1 overflow-hidden">
    <!-- LEFT COLUMN -->
    <div class="flex flex-col w-1/3 bg-gruvbox-dark1 overflow-hidden p-4 space-y-4 rounded-lg">
      <Sidebar
        locations={oregonMachines}
        on:select={(e) => handleSidebarSelect(e.detail)}
      />

      <hr class="border-gruvbox-dark0 my-2" />

      <RecentReports {reports} />
    </div>

    <!-- RIGHT COLUMN -->
    <div class="relative flex-1 p-4">
      <div class="bg-gruvbox-dark1 rounded-2xl shadow-lg overflow-hidden h-full">
        <!-- Bind selected & map OUT of the map component -->
        <VendingMap machines={oregonMachines} bind:selected bind:map={mapRef} />
      </div>

    </div>
  </div>
</main>
