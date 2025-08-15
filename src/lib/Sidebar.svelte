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
  import type { FuseResultMatch } from 'fuse.js';

  export let locations: Location[] = [];

  const dispatch = createEventDispatcher();

  // Search state
  let query = '';
  let debounced = '';
  let debTimer: number;

  // Button refs for keyboard nav (ArrowUp/Down)
  let rowRefs: (HTMLButtonElement | null)[] = [];

  // Rebuild Fuse whenever locations change
  let fuse: Fuse<Location>;
  $: fuse = new Fuse(locations, {
    keys: ['retailer', 'machineId', 'address', 'city', 'state'],
    threshold: 0.3,
    ignoreLocation: true,
    includeMatches: true
  });

  // Debounce typing
  $: {
    clearTimeout(debTimer);
    debTimer = setTimeout(() => (debounced = query.trim()), 120) as unknown as number;
  }

  type SearchRow = { item: Location; matches?: FuseResultMatch[] };

  // Results (consistent shape with or without search)
  $: results = debounced
    ? fuse.search(debounced).slice(0, 7).map((r) => ({ item: r.item, matches: r.matches as FuseResultMatch[] }))
    : locations.slice(0, 7).map((item) => ({ item }));

  $: resultsCount = results.length;

  function select(loc: Location) {
    dispatch('select', loc);
    // Optional: query = '';
  }

  // Keyboard helpers
  function focusRow(i: number) {
    const el = rowRefs[i];
    if (el) el.focus();
  }

  function onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusRow(0);
    }
    if (e.key === 'Enter' && results.length === 1) {
      e.preventDefault();
      select(results[0].item);
    }
  }

  function onListKeydown(e: KeyboardEvent) {
    const idx = rowRefs.findIndex((el) => el === (document.activeElement as HTMLButtonElement | null));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusRow(Math.min(idx + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusRow(Math.max(idx - 1, 0));
    }
  }

  // Highlight helper for one field
  function highlightField(text: string, matches?: FuseResultMatch[], key?: string) {
    const safe = escapeHtml(text);
    if (!matches || !key) return safe;

    const match = matches.find((m) => m.key === key);
    if (!match) return safe;

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

  // Minimal HTML escape
  function escapeHtml(str: string) {
    return str.replace(/[&<>"']/g, (s) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[s] as string));
  }

  function clearQuery() {
    query = '';
  }
</script>

<style lang="postcss">
  @reference "../app.css";

  .sr-only {
    @apply absolute w-px h-px p-0 m-0 overflow-hidden whitespace-nowrap border-0;
    clip: rect(0, 0, 0, 0);
  }

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

  mark {
    background: #b8bb26; color: #1d2021; padding: 0 .1rem; border-radius: .2rem;
  }

  .search-wrap { @apply relative; }
  .clear-btn {
    @apply absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs;
    background: #3c3836; color: #ebdbb2;
  }
  .clear-btn:hover { background: #504945; }
</style>

<aside
  class="relative w-full rounded-lg shadow-lg p-4 overflow-visible"
  style="background-color: var(--gv-panel); color: var(--gv-fg);"
>
  <!-- Search -->
  <div class="search-wrap">
    <label for="sidebar-search" class="sr-only">Search locations</label>
    <input
      id="sidebar-search"
      type="text"
      placeholder="Search by address, city, retailer, or ID…"
      bind:value={query}
      class="w-full p-2 rounded-md bg-gray-700 text-white focus:outline-none"
      on:keydown={onInputKeydown}
      autocomplete="off"
    />
    {#if query}
      <button type="button" class="clear-btn" on:click={clearQuery} aria-label="Clear search">✕</button>
    {/if}
  </div>

  <!-- Live results count for screen readers -->
  <div class="sr-only" aria-live="polite">
    {#if debounced}{resultsCount} results for “{debounced}”{/if}
  </div>

  <!-- Results -->
  <div class="list-wrapper" on:keydown={onListKeydown}>
    {#if results.length}
      {#each results as r, i}
        <button
          type="button"
          class="row-btn"
          on:click={() => select(r.item)}
          bind:this={rowRefs[i]}
          aria-label={`${r.item.retailer} — ${r.item.machineId}, ${r.item.address}, ${r.item.city}, ${r.item.state}`}
        >
          <div class="font-semibold">
            {@html highlightField(r.item.retailer, r.matches, 'retailer')}
            &nbsp;—&nbsp;
            {@html highlightField(r.item.machineId, r.matches, 'machineId')}
          </div>
          <div class="text-xs">
            {@html highlightField(r.item.address, r.matches, 'address')},
            &nbsp;{@html highlightField(r.item.city, r.matches, 'city')},
            &nbsp;{@html highlightField(r.item.state, r.matches, 'state')}
          </div>
        </button>
      {/each}
    {:else}
      <div class="text-sm text-gray-500 px-2 py-3">No matches found</div>
    {/if}
  </div>
</aside>
