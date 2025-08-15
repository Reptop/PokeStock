<!-- src/routes/reportlist/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { oregonMachines } from "$lib/data/oregonMachines";
  import VoteWidget from "$lib/VoteWidget.svelte";
  import { reportPostId } from "$lib/postIds";

  // Raw shape from the reports microservice
  type ApiReport = {
    id: string;
    machineId: string;
    inStock: boolean;
    comment: string;
    photoURL?: string;
    createdAt: string; // ISO timestamp
    status: "visible" | "flagged" | "removed";
  };

  // Enriched UI shape
  type Report = {
    id: string;
    machineId: string;
    retailer: string;
    city: string;
    inStock: boolean;
    comment: string;
    timestamp: Date;
    photoUrl?: string;
  };

  // --- simplest: call the microservice directly ---
  const REPORTS_BASE = "http://localhost:5003"; // change if you use a different port
  const ABUSE_BASE = "http://localhost:5006";

  let reports: Report[] = [];
  let loading = true;
  let errorMsg = "";

  // Filters / sort
  let search = "";
  let onlyInStock = false;
  let sortBy: "newest" | "instock" = "newest";

  // Lightbox
  let lightboxUrl: string | null = null;

  // Optional: allow filtering by machine via query (?machineId=Q00832)
  let initialMachineFilter = "";

  if (typeof window !== "undefined") {
    const m = new URLSearchParams(window.location.search).get("machineId");
    if (m) initialMachineFilter = m;
  }

  const machineIndex = new Map(oregonMachines.map((m) => [m.machineId, m]));

  // Call the anti-abuse microservice
  async function flagReport(id: string) {
    try {
      const res = await fetch(`${ABUSE_BASE}/api/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "report",
          targetId: id,
          userId: 123,
          reason: "spam",
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Flag failed: HTTP ${res.status} — ${msg}`);
      }

      // UX ping; swap with a toast if you have one
      alert("Thanks! Our moderators will review this report.");
    } catch (err) {
      console.error("flagReport error:", err);
      alert("Could not flag this report. Check console for details.");
    }
  }

  async function fetchRecent() {
    loading = true;
    errorMsg = "";
    try {
      const res = await fetch(`${REPORTS_BASE}/api/reports/recent?limit=200`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Fetch failed: ${res.status} — ${text}`);
      }
      const data: ApiReport[] = await res.json();

      reports = data
        .filter((r) => r.status !== "removed")
        .map((r) => {
          const m = machineIndex.get(r.machineId);
          return {
            id: r.id,
            machineId: r.machineId,
            retailer: m?.retailer ?? "Unknown",
            city: m?.city ?? "Unknown",
            inStock: r.inStock,
            comment: r.comment ?? "",
            timestamp: new Date(r.createdAt),
            photoUrl: r.photoURL,
          } as Report;
        });
    } catch (e: any) {
      errorMsg = e?.message ?? "Failed to load reports";
      reports = [];
    } finally {
      loading = false;
    }
  }

  onMount(fetchRecent);

  // Grouping helpers
  function groupByDay(list: Report[]) {
    const today = new Date();
    const yday = new Date(today);
    yday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    const groups: Record<string, Report[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    for (const r of list) {
      if (sameDay(r.timestamp, today)) groups.Today.push(r);
      else if (sameDay(r.timestamp, yday)) groups.Yesterday.push(r);
      else groups.Earlier.push(r);
    }
    return groups;
  }

  // Filter + sort pipeline
  $: filtered = reports.filter((r) => {
    if (onlyInStock && !r.inStock) return false;

    if (initialMachineFilter && r.machineId !== initialMachineFilter)
      return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      r.machineId.toLowerCase().includes(q) ||
      r.retailer.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q)
    );
  });

  $: sorted = (() => {
    if (sortBy === "newest") {
      return [...filtered].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
    }
    // inStock first, then newest
    return [...filtered].sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  })();

  $: grouped = groupByDay(sorted);

  const fmtTime = (d: Date) =>
    d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  function openReport(id: string) {
    goto(`/reports/${id}`);
  }
</script>

<svelte:head>
  <title>Reports | PokéStock</title>
</svelte:head>

<main>
  <div class="container">
    <div class="heading-row">
      <h1 class="heading">Reports</h1>
      <button class="btn btn-refresh" on:click={fetchRecent} disabled={loading}>
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        type="text"
        class="search-input"
        placeholder="Search reports…"
        bind:value={search}
      />

      <label class="stock-toggle">
        <input type="checkbox" bind:checked={onlyInStock} />
        <span>In stock only</span>
      </label>

      <select class="select-sort" bind:value={sortBy} title="Sort by">
        <option value="newest">Newest</option>
        <option value="instock">In-stock first</option>
      </select>
    </div>

    {#if errorMsg}
      <p class="error mt-4">Error: {errorMsg}</p>
    {/if}

    {#if loading}
      <p class="text-sm mt-8" style="color: var(--gv-gray);">Loading…</p>
    {:else if sorted.length === 0}
      <p class="text-sm mt-8" style="color: var(--gv-gray);">
        No reports match your filters.
      </p>
    {:else}
      {#each Object.entries(grouped) as [label, list]}
        {#if list.length}
          <section class="day-section">
            <h2 class="day-title">{label}</h2>

            {#each list as r}
              <article class="card" on:click={() => openReport(r.id)}>
                {#if r.photoUrl}
                  <div
                    class="photo"
                    on:click|stopPropagation={() => (lightboxUrl = r.photoUrl!)}
                  >
                    <img src={r.photoUrl} alt="report photo" />
                  </div>
                {/if}

                <div class="info">
                  <div class="title-line">
                    <div class="machine">
                      {r.machineId} — {r.retailer} ({r.city})
                    </div>
                    <time class="time">{fmtTime(r.timestamp)}</time>
                  </div>

                  <p class="comment">{r.comment || "No additional notes."}</p>

                  <div class="row-bottom">
                    <span
                      class="badge {r.inStock ? 'badge-stock' : 'badge-out'}"
                    >
                      {#if r.inStock}✓ In stock{:else}✕ Out{/if}
                    </span>

                    <!-- Voting widget (microservice) -->
                    <div class="votes" on:click|stopPropagation>
                      <VoteWidget postId={reportPostId(r.id)} />
                    </div>

                    <!-- Flag button -->
                    <button
                      class="btn-flag"
                      title="Flag this report"
                      on:click|stopPropagation={() => flagReport(r.id)}
                    >
                      Flag
                    </button>
                  </div>
                </div>
              </article>
            {/each}
          </section>
        {/if}
      {/each}
    {/if}
  </div>

  {#if lightboxUrl}
    <div class="lightbox-backdrop" on:click={() => (lightboxUrl = null)}>
      <span
        class="lightbox-close"
        on:click|stopPropagation={() => (lightboxUrl = null)}>✕</span
      >
      <img src={lightboxUrl} alt="report photo large" class="lightbox-img" />
    </div>
  {/if}
</main>

<style lang="postcss">
  @reference "../../app.css";

  :root {
    --gv-bg0: #282828;
    --gv-bg1: #3c3836;
    --gv-fg: #ebdbb2;
    --gv-yellow: #fabd2f;
    --gv-green: #b8bb26;
    --gv-red: #fb4934;
    --gv-orange: #fe8019;
    --gv-aqua: #8ec07c;
    --gv-gray: #a89984;
  }

  main {
    @apply min-h-screen py-10 px-6;
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
  }
  .container {
    @apply max-w-5xl mx-auto space-y-8;
  }

  .heading-row {
    @apply flex items-center justify-between gap-3;
  }
  .heading {
    @apply font-mono text-3xl;
    color: var(--gv-orange);
  }

  .btn-flag {
    background: #fb4934;
    color: #282828;
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: filter 0.15s;
  }
  .btn-flag:hover {
    filter: brightness(0.9);
  }

  .btn {
    @apply inline-flex items-center justify-center px-3 py-2 font-mono text-sm rounded-lg transition-colors;
  }
  .btn-refresh {
    background-color: var(--gv-bg0);
    color: var(--gv-fg);
    box-shadow: 0 0 0 1px #504945 inset;
  }
  .btn-refresh:hover {
    background-color: #504945;
  }
  .btn-refresh:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .filters {
    @apply flex flex-wrap gap-3 items-center;
  }
  .search-input {
    @apply rounded-md px-3 py-2 outline-none border border-transparent;
    background-color: var(--gv-bg0);
    color: var(--gv-fg);
    width: 16rem;
  }
  .search-input:focus {
    box-shadow: 0 0 0 2px var(--gv-yellow);
    border-color: var(--gv-yellow);
  }

  .select-sort {
    @apply rounded-md px-3 py-2 outline-none border border-transparent;
    background-color: var(--gv-bg0);
    color: var(--gv-fg);
  }
  .select-sort:focus {
    box-shadow: 0 0 0 2px var(--gv-yellow);
    border-color: var(--gv-yellow);
  }

  .stock-toggle {
    @apply flex items-center gap-2 cursor-pointer select-none text-sm;
    color: var(--gv-fg);
  }
  .stock-toggle input {
    @apply w-4 h-4;
    accent-color: var(--gv-green);
    background-color: var(--gv-bg0);
  }

  .day-section {
    @apply space-y-4;
  }
  .day-title {
    @apply font-mono text-xl;
    color: var(--gv-yellow);
  }

  .card {
    @apply rounded-xl p-4 shadow-lg flex gap-4 cursor-pointer;
    background-color: var(--gv-bg0);
    box-shadow:
      0 0 0 1px #3c3836,
      0 6px 18px rgba(0, 0, 0, 0.35);
    transition: background-color 0.15s;
  }
  .card:hover {
    background-color: #32302f;
  }

  .photo {
    @apply rounded-md overflow-hidden flex-shrink-0;
    width: 220px;
    height: 120px;
    background: #504945;
  }
  .photo img {
    @apply w-full h-full object-cover;
  }

  .info {
    @apply flex-1 flex flex-col gap-2;
  }
  .title-line {
    @apply flex items-center justify-between gap-2 flex-wrap;
  }

  .machine {
    @apply font-mono font-semibold text-lg;
    color: var(--gv-aqua);
  }
  .time {
    @apply text-xs;
    color: var(--gv-gray);
  }
  .comment {
    @apply text-sm;
    color: var(--gv-fg);
  }

  .row-bottom {
    @apply flex items-center gap-3 justify-between;
  }
  .badge {
    @apply inline-flex items-center gap-1 px-2 py-[2px] rounded-md font-mono text-xs;
  }
  .badge-stock {
    background-color: var(--gv-green);
    color: #282828;
  }
  .badge-out {
    background-color: var(--gv-red);
    color: #282828;
  }

  .votes {
    @apply ml-auto;
  }

  .error {
    color: var(--gv-red);
  }
  .text-sm {
    font-size: 0.875rem;
  }

  /* Lightbox */
  .lightbox-backdrop {
    @apply fixed inset-0 z-[9999] flex items-center justify-center;
    background: rgba(0, 0, 0, 0.7);
  }
  .lightbox-img {
    max-width: 90vw;
    max-height: 90vh;
    border: 2px solid var(--gv-yellow);
    border-radius: 0.5rem;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
  }
  .lightbox-close {
    @apply absolute top-4 right-6 text-2xl cursor-pointer font-mono;
    color: var(--gv-yellow);
  }
  .lightbox-close:hover {
    color: var(--gv-orange);
  }
</style>
