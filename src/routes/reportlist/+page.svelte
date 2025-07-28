<!-- src/routes/reports/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";

  type Report = {
    id: string;
    machineId: string;
    retailer: string;
    city: string;
    inStock: boolean;
    upvotes: number;
    downvotes: number;
    comment: string;
    timestamp: Date;
    photoUrl?: string;
  };

  // ---- Fake data ----
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
  const fakeReports: Report[] = [
    {
      id: "r1",
      machineId: "Q00832",
      retailer: "Fred Meyer",
      city: "Albany",
      inStock: true,
      upvotes: 6,
      downvotes: 0,
      comment: "Booster packs restocked. Plenty of stock.",
      timestamp: hoursAgo(1),
      photoUrl:
        "https://m.media-amazon.com/images/I/71aX5MmNCFL._AC_SL1500_.jpg",
    },

    {
      id: "r2",
      machineId: "Q00959",
      retailer: "WinCo Foods",
      city: "Beaverton",
      inStock: false,
      upvotes: 2,
      downvotes: 3,
      comment: "Empty machine :(",
      timestamp: hoursAgo(5),
    },

    {
      id: "r3",
      machineId: "Q01121",
      retailer: "Albertsons",
      city: "Eugene",
      inStock: true,
      upvotes: 10,
      downvotes: 1,
      comment: "New set arrived! Scarlet & Violet packs spotted.",
      timestamp: hoursAgo(26),
      photoUrl: "https://placehold.co/600x350?text=SV",
    },

    {
      id: "r4",
      machineId: "Q00119",
      retailer: "Safeway",
      city: "Portland",
      inStock: false,
      upvotes: 1,
      downvotes: 4,
      comment: "Someone just cleaned it out.",
      timestamp: hoursAgo(52),
    },
  ];

  let reports: Report[] = fakeReports;

  // Filters / sort
  let search = "";
  let onlyInStock = false;
  let sortBy: "newest" | "upvotes" | "instock" = "newest";

  // Lightbox
  let lightboxUrl: string | null = null;

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
    if (sortBy === "upvotes") {
      return [...filtered].sort(
        (a, b) =>
          b.upvotes - a.upvotes ||
          b.timestamp.getTime() - a.timestamp.getTime(),
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

  function openMachine(mId: string) {
    // adjust this route to your actual machine detail/history page
    goto(`/machines/${mId}`);
  }
</script>

<svelte:head>
  <title>Reports | PokéStock</title>
</svelte:head>

<main>
  <div class="container">
    <h1 class="heading">Reports</h1>

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

      <select class="select-sort" bind:value={sortBy}>
        <option value="newest">Newest</option>
        <option value="upvotes">Most upvotes</option>
        <option value="instock">In-stock first</option>
      </select>
    </div>

    <!-- Grouped sections -->
    {#if sorted.length === 0}
      <p class="text-sm mt-8" style="color: var(--gv-gray);">
        No reports match your filters.
      </p>
    {:else}
      {#each Object.entries(grouped) as [label, list]}
        {#if list.length}
          <section class="day-section">
            <h2 class="day-title">{label}</h2>

            {#each list as r}
              <article class="card" on:click={() => openMachine(r.machineId)}>
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

                  <p class="comment">{r.comment}</p>

                  <div class="badges">
                    <span
                      class="badge {r.inStock ? 'badge-stock' : 'badge-out'}"
                    >
                      {#if r.inStock}✓ In stock{:else}✕ Out{/if}
                    </span>

                    <span class="vote up">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      {r.upvotes}
                    </span>

                    <span class="vote down">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      {r.downvotes}
                    </span>
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

  .heading {
    @apply font-mono text-3xl;
    color: var(--gv-orange);
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

  .badges {
    @apply flex items-center gap-3 text-xs font-mono;
  }
  .badge {
    @apply inline-flex items-center gap-1 px-2 py-[2px] rounded-md;
  }
  .badge-stock {
    background-color: var(--gv-green);
    color: #282828;
  }
  .badge-out {
    background-color: var(--gv-red);
    color: #282828;
  }

  .vote {
    @apply inline-flex items-center gap-1;
    color: var(--gv-gray);
  }
  .vote.up svg {
    stroke: var(--gv-green);
  }
  .vote.down svg {
    stroke: var(--gv-gray);
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
