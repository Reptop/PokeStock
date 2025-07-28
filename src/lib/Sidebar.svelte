<!-- src/lib/Sidebar.svelte -->
<script context="module" lang="ts">
  export interface Location {
    retailer: string;
    machineId: string;
    address: string;
    city: string;
    state: string;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Fuse from 'fuse.js';

  export let locations: Location[] = [];

  const dispatch = createEventDispatcher();
  let query = '';

  // Fuse with matches so we can highlight
  const fuse = new Fuse(locations, {
    keys: ['retailer', 'machineId', 'address', 'city', 'state'],
    threshold: 0.3,
    includeMatches: true,
  });

  // When there is a query, we keep match info.
  // When empty, we just show first N without matches.
  $: results = query.trim()
    ? fuse.search(query).slice(0, 7)
    : locations.slice(0, 7).map((item) => ({ item, matches: undefined })); // shim to keep same shape

  function select(loc: Location) {
    dispatch('select', loc);
    // Optional: clear query after selection
    query = '';
  }

  // Highlight helper for one field
  import type { FuseResultMatch } from 'fuse.js';

  function highlightField(text: string, matches?: FuseResultMatch[], key?: string) {
    if (!matches || !key) 
      return text;

    const match = matches.find((m) => m.key === key);

    if (!match) 
      return text;

    let result = '';
    let lastIndex = 0;

    for (const [start, end] of match.indices) {
      result += escapeHtml(text.slice(lastIndex, start));
      result += `<mark>${escapeHtml(text.slice(start, end + 1))}</mark>`;
      lastIndex = end + 1;
    }

    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  // very small HTMLEscape
  function escapeHtml(str: string) {
    return str.replace(/[&<>"']/g, (s) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[s] as string));
  }
</script>

<style lang="postcss">
  @reference "../app.css";

  .list-wrapper {
    @apply overflow-auto mt-3;
    max-height: calc(100vh - 10rem);
  }

  .row-btn {
    @apply w-full text-left px-3 py-2 font-mono text-sm;
    background-color: #282828;      /* gruvbox bg0 */
    color: #ebdbb2;                  /* fg1 */
    border-bottom: 1px solid #3c3836;/* bg1 */
    transition: background-color .15s ease;
  }
  .row-btn:hover,
  .row-btn:focus {
    background-color: #3c3836;       /* bg1 */
    outline: none;
  }

  input::placeholder {
    color: var(--gv-fg);
    opacity: 0.6;
  }

</style>

<aside
  class="relative w-full rounded-lg shadow-lg p-4 overflow-visible"
  style="background-color: var(--gv-panel); color: var(--gv-fg);"
>
  <!-- Search box -->
  <input
    type="text"
    placeholder="Search by address, city, or ID…"
    bind:value={query}
    class="w-full p-2 rounded-md bg-gray-700 text-white focus:outline-none"
  />

  <!-- Unified clickable list -->
  <div class="list-wrapper">
    {#if results.length}
      {#each results as r}
        <button
          type="button"
          class="row-btn"
          on:click={() => select(r.item)}
        >
          <div class="font-semibold">
            {@html highlightField(r.item.retailer, r.matches ? Array.from(r.matches) : undefined, 'retailer')}
            &nbsp;—&nbsp;
            {@html highlightField(r.item.machineId, r.matches ? Array.from(r.matches) : undefined, 'machineId')}
          </div>
          <div class="text-xs">
            {@html highlightField(r.item.address, r.matches ? Array.from(r.matches) : undefined, 'address')},
            &nbsp;{@html highlightField(r.item.city, r.matches ? Array.from(r.matches) : undefined, 'city')},
            &nbsp;{@html highlightField(r.item.state, r.matches ? Array.from(r.matches) : undefined, 'state')}
          </div>
        </button>
      {/each}
    {:else}
      <div class="text-sm text-gray-500 px-2 py-3">No matches found</div>
    {/if}
  </div>
</aside>
