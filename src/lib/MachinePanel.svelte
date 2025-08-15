<!-- src/lib/MachinePanel.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { getMachineStatus, type MachineStatus } from "$lib/statusClient";

  // ---- Config (frontend env or sensible default) ----
  const REPORTS_BASE =
    import.meta.env.VITE_REPORTS_BASE || "http://localhost:5003";

  // ---- Types to match reports-svc ----
  export interface Report {
    id: string;
    machineId: string;
    userId?: string;
    inStock: boolean;
    comment?: string;
    photoURL?: string;
    createdAt: string; // ISO
    status: "visible" | "flagged" | "removed";
  }

  export interface Machine {
    retailer: string;
    machineId: string;
    address: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    reports?: Report[]; // optional, but we will fetch fresh anyway
  }

  export let selected: Machine;

  const dispatch = createEventDispatcher();

  // ---- State ----
  let status: MachineStatus | null = null;
  let statusErr = "";

  let reports: Report[] = [];
  let loadingReports = false;
  let reportsErr = "";

  // ---- Loaders ----
  async function loadStatus() {
    status = null;
    statusErr = "";
    if (!selected?.machineId) return;
    try {
      status = await getMachineStatus(selected.machineId);
    } catch (e: any) {
      statusErr = e?.message ?? "Status unavailable";
    }
  }

  async function loadReports() {
    reports = [];
    reportsErr = "";
    if (!selected?.machineId) return;
    loadingReports = true;
    try {
      const r = await fetch(
        `${REPORTS_BASE}/api/reports/machine/${encodeURIComponent(
          selected.machineId
        )}?limit=25`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as Report[];
      // Endpoint already filters status === "visible"; if not, you can uncomment:
      // reports = data.filter((x) => x.status === "visible");
      reports = data;
    } catch (e: any) {
      reportsErr = e?.message ?? "Failed to load reports";
    } finally {
      loadingReports = false;
    }
  }

  // Initial + reactive reload when machine changes
  onMount(() => {
    loadStatus();
    loadReports();
  });
  $: selected?.machineId, (async () => {
    await loadStatus();
    await loadReports();
  })();

  // ---- Events ----
  function closePanel()  { dispatch("close"); }
  function submitNew()   { dispatch("submit", selected); }
  function viewHistory() { dispatch("history", selected); }
  function openReport(id: string) {
    dispatch("openreport", { id, machine: selected });
  }

  // ---- Helpers ----
  function fmtTime(iso?: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
</script>

<aside class="side-panel" role="complementary" aria-label="Machine details">
  <div class="panel-header">
    <div class="hdr-left">
      <h2 class="panel-title">{selected.address}, {selected.city}</h2>
      <div class="subtle">{selected.retailer} • {selected.machineId} • {selected.state}</div>
    </div>

    <div class="hdr-right">
      {#if status}
        <div class="status-pill" title={`Sample: ${status.sample_size}`}>
          {(status.in_stock_likelihood * 100).toFixed(0)}% likely · {status.confidence}
        </div>
      {:else if statusErr}
        <div class="status-pill muted" title={statusErr}>status n/a</div>
      {/if}

      <button
        type="button"
        class="close-button"
        on:click={closePanel}
        aria-label="Close panel"
        title="Close"
      >✕</button>
    </div>
  </div>

  {#if status}
    <div class="status-times">
      <span>
        <span class="lbl">Last report:</span>
        <span class="val">{fmtTime(status.last_report_at)}</span>
      </span>
      <span>
        <span class="lbl">Last seen in stock:</span>
        <span class="val">{fmtTime(status.last_seen_in_stock_at)}</span>
      </span>
    </div>
  {/if}

  <h3 class="section-title">Recent Reports</h3>

  {#if loadingReports}
    <div class="loading">Loading…</div>
  {:else if reportsErr}
    <div class="error">Error: {reportsErr}</div>
  {:else if !reports.length}
    <div class="empty">No recent reports yet.</div>
  {:else}
    <div class="report-list">
      {#each reports as r}
        <article class="report-entry">
          <div class="report-left">
            {#if r.inStock}
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="#b8bb26">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="badge badge-stock">In stock</span>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="#fb4934">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <span class="badge badge-out">Out</span>
            {/if}
          </div>

          <div class="report-main">
            <div class="report-top">
              <time class="time">{fmtTime(r.createdAt)}</time>

              <!-- Open detail page -->
              <button
                type="button"
                class="btn-link"
                on:click={() => openReport(r.id)}
                aria-label="Open full report"
                title="Open full report"
              >
                View
              </button>
            </div>

            {#if r.comment}
              <p class="comment">{r.comment}</p>
            {/if}

            {#if r.photoURL}
              <a
                class="thumb"
                href={r.photoURL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open report photo"
                title="Open photo"
                on:click|stopPropagation
              >
                <img src={r.photoURL} alt="Report photo" />
              </a>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}

  <div class="actions">
    <button class="btn-primary" type="button" on:click={submitNew}>
      Submit New Report
    </button>
    <button class="btn-secondary" type="button" on:click={viewHistory}>
      View Full Report History
    </button>
  </div>
</aside>

<style lang="postcss">
  /* point to your global Tailwind build */
  @reference "../app.css";

  .side-panel {
    @apply fixed top-0 right-0 h-full w-80 p-4 overflow-y-auto z-[10000];
    background-color: #282828;          /* bg0 */
    color: #ebdbb2;                      /* fg1 */
    box-shadow:
      0 0 0 1px #3c3836,
      0 10px 30px rgba(0,0,0,.55);
    border-left: 4px solid #b8bb26;      /* green accent */
    border-top-left-radius: 1rem;
    border-bottom-left-radius: 1rem;
  }

  .panel-header { @apply flex items-start justify-between mb-3 gap-3; }
  .hdr-left { @apply flex flex-col; }
  .panel-title { @apply text-xl font-semibold leading-tight; color: #ebdbb2; }
  .subtle { @apply text-xs mt-1; color: #a89984; }
  .hdr-right { @apply flex items-center gap-2; }

  .close-button {
    @apply text-lg font-mono;
    color: #928374;
    transition: color .15s;
  }
  .close-button:hover { color: #ebdbb2; }

  .status-pill {
    @apply inline-flex items-center gap-1 px-2 py-[2px] rounded-md font-mono text-xs;
    background: #3c3836;
    color: #ebdbb2;
    border: 1px solid #504945;
  }
  .status-pill.muted { opacity: .7; }

  .status-times {
    @apply flex items-center justify-between gap-3 mb-3;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: .75rem;
    color: #a89984;
  }
  .status-times .lbl { opacity: .75; margin-right: .25rem; }
  .status-times .val { color: #ebdbb2; }

  .section-title { @apply text-lg mb-2 font-mono; color: #fe8019; }

  .loading { color: #a89984; font-size: .875rem; }
  .error   { color: #fb4934; font-size: .875rem; }
  .empty   { color: #a89984; font-size: .875rem; }

  .report-list { @apply space-y-2; }

  .report-entry { @apply flex items-start gap-3 py-2 border-b; border-color: #3c3836; }
  .report-left  { @apply flex items-center gap-2 mt-1; }
  .icon { width: 24px; height: 24px; }

  .badge {
    @apply text-[10px] px-2 py-[2px] rounded font-mono;
    background: #3c3836;
    color: #ebdbb2;
    border: 1px solid #504945;
  }
  .badge-stock { background: #b8bb26; color: #282828; border-color: #98971a; }
  .badge-out   { background: #fb4934; color: #282828; border-color: #cc241d; }

  .report-main { @apply flex-1 min-w-0; }
  .report-top  { @apply flex items-center justify-between gap-2; }
  .time { @apply text-xs; color: #a89984; }

  .btn-link {
    @apply text-xs underline;
    color: #fabd2f;
  }
  .btn-link:hover { color: #fe8019; }

  .comment { @apply text-sm mt-1; color: #ebdbb2; }

  .thumb { @apply inline-block mt-2 rounded-md overflow-hidden border; border-color: #504945; }
  .thumb img { display: block; width: 100%; max-height: 140px; object-fit: cover; }

  .actions { @apply mt-4; }
  .btn-primary {
    @apply mt-2 w-full py-2 rounded text-center font-medium;
    background-color: #b8bb26;
    color: #282828;
    transition: background-color .15s, color .15s;
  }
  .btn-primary:hover { background-color: #a89984; color: #ebdbb2; }
  .btn-secondary {
    @apply mt-2 w-full py-2 rounded text-center font-medium;
    background-color: #3c3836;
    color: #ebdbb2;
    transition: background-color .15s;
  }
  .btn-secondary:hover { background-color: #504945; }
</style>
