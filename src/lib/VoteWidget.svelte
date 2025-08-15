<!-- src/lib/VoteWidget.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { submitVote, getStats, getUserVote, type VoteType } from '$lib/voteClient';

  export let postId: string;           // required
  export let userId: string | null = null; // ✅ use union instead of "?:"

  let up = 0, down = 0, net = 0, total = 0;
  let current: VoteType | null = null;
  let loading = true;
  let submitting: VoteType | null = null;
  let error = '';

  function mintId() {
    try {
      // Prefer crypto if available
      // @ts-ignore - crypto may not exist in SSR
      if (crypto?.randomUUID) return crypto.randomUUID();
    } catch {}
    // fallback
    return `anon-${Math.random().toString(36).slice(2)}`;
  }

  function ensureUserId(): string {
    if (userId) return userId;
    try {
      const key = 'pokestock_user_id';
      let id = localStorage.getItem(key);
      if (!id) { id = mintId(); localStorage.setItem(key, id); }
      return id;
    } catch {
      return mintId();
    }
  }

  async function refresh() {
    loading = true; error = '';
    try {
      const uid = ensureUserId();
      const [s, u] = await Promise.all([
        getStats(postId),
        getUserVote(uid, postId)
      ]);
      up = s.upvotes ?? 0;
      down = s.downvotes ?? 0;
      net = s.net_score ?? (up - down);
      total = s.total_votes ?? (up + down);
      current = (u?.vote ?? null) as VoteType | null;
    } catch (e: any) {
      error = e?.message ?? 'Failed to load votes';
    } finally {
      loading = false;
    }
  }

  async function cast(v: VoteType) {
    if (submitting) return;
    submitting = v; error = '';

    // optimistic update
    const before = current;
    if (v === 'upvote') {
      if (before === 'downvote') { down--; up++; net += 2; }
      else if (before !== 'upvote') { up++; net++; }
    } else {
      if (before === 'upvote') { up--; down++; net -= 2; }
      else if (before !== 'downvote') { down++; net--; }
    }
    total = up + down;
    current = v;

    try {
      const r = await submitVote(ensureUserId(), postId, v);
      up = r.upvotes; down = r.downvotes; net = r.net_score; total = up + down;
    } catch (e: any) {
      await refresh(); // rollback on failure
      error = e?.message ?? 'Vote failed';
    } finally {
      submitting = null;
    }
  }

  onMount(refresh);
</script>

<div class="vote-root" aria-live="polite">
  {#if loading}
    <span class="loading">Loading…</span>
  {:else}
    <div class="buttons">
      <button
        type="button"
        class:active={current === 'upvote'}
        disabled={!!submitting}
        on:click={() => cast('upvote')}
        aria-pressed={current === 'upvote'}
        title="Upvote"
      >▲ {up}</button>

      <button
        type="button"
        class:active={current === 'downvote'}
        disabled={!!submitting}
        on:click={() => cast('downvote')}
        aria-pressed={current === 'downvote'}
        title="Downvote"
      >▼ {down}</button>

      <span class="score" title="Net score">Net: {net}</span>
    </div>
    {#if error}<div class="error">{error}</div>{/if}
  {/if}
</div>

<style>
  .vote-root { display:inline-flex; flex-direction:column; gap:4px; }
  .buttons { display:inline-flex; align-items:center; gap:8px; }

  button {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.9rem;
    padding: 4px 8px;
    border-radius: 8px;
    background: #3c3836;
    color: #ebdbb2;
    border: 1px solid #504945;
    cursor: pointer;
    transition: transform .05s, background-color .15s, border-color .15s;
  }
  button:hover { background: #504945; }
  button:active { transform: scale(0.98); }
  button.active { background: #b8bb26; color: #282828; border-color: #98971a; }

  .score { font-size: 0.85rem; color: #a89984; }
  .loading { color: #a89984; font-size: 0.85rem; }
  .error { color: #fb4934; font-size: 0.85rem; }
</style>
