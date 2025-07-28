<!-- src/lib/MachinePanel.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export interface Report {
    time: string;
    upvotes: number;
    downvotes: number;
    inStock: boolean;
  }

  export interface Machine {
    retailer: string;
    machineId: string;
    address: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    reports?: Report[];
  }

  export let selected: Machine;

  const dispatch = createEventDispatcher();

  // Fake reports for preview
  const fakeReports: Report[] = [
    { time: "50 minutes ago", upvotes: 3, downvotes: 0, inStock: true },
    { time: "1 hour ago", upvotes: 5, downvotes: 1, inStock: false },
    { time: "3 hours ago", upvotes: 9, downvotes: 2, inStock: true },
  ];

  // Use real reports if present, otherwise fake ones
  $: reports = selected?.reports?.length ? selected.reports : fakeReports;

  function closePanel() {
    dispatch("close");
  }

  function submitNew() {
    dispatch("submit", selected);
  }

  function viewHistory() {
    dispatch("history", selected);
  }
</script>

<aside class="side-panel">
  <div class="panel-header">
    <h2 class="panel-title">{selected.address}, {selected.city}</h2>
    <button class="close-button" on:click={closePanel} aria-label="Close"
      >✕</button
    >
  </div>

  <h3 class="section-title">Recent Reports</h3>
  {#each reports as r}
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

  <button class="btn-primary" on:click={submitNew}>Submit New Report</button>
  <button class="btn-secondary" on:click={viewHistory}
    >View Full Report History</button
  >
</aside>
