<script lang="ts">
  import VoteWidget from '$lib/VoteWidget.svelte';
  import { reportPostId, machinePostId } from '$lib/postIds';

  export let data: {
    notFound: boolean;
    report: {
      id: string;
      machineId: string;
      inStock: boolean;
      comment?: string;
      photoURL?: string;
      createdAt: string;
    } | null;
    machine: {
      retailer: string;
      machineId: string;
      address: string;
      city: string;
      state: string;
      latitude: number | null;
      longitude: number | null;
    } | null;
  };

  const r = data.report;
  const m = data.machine;

  function fmt(ts: string) { try { return new Date(ts).toLocaleString(); } catch { return ts; } }
</script>

<svelte:head>
  <title>{data.notFound ? 'Report not found' : `Report ${r?.id?.slice(0,8)} • PokéStock`}</title>
</svelte:head>

{#if data.notFound}
  <main class="page"><p class="muted">Report not found.</p></main>
{:else if r}
  <main class="page">
    <nav class="crumbs">
      <a href="/">Home</a><span>/</span>
      <a href="/reportlist">Reports</a><span>/</span>
      <span>Report {r.id.slice(0,8)}</span>
    </nav>

    <article class="post">
      <!-- reddit-style left vote column -->
      <div class="vote-col">
        <VoteWidget postId={reportPostId(r.id)} />
      </div>

      <div class="content">
        <header class="header">
          <h1 class="title">
            {m ? `${m.retailer} – ${m.address}, ${m.city}` : `Machine ${r.machineId}`}
          </h1>
          <div class="meta">
            <span class:stock={r.inStock} class:out={!r.inStock}>
              {r.inStock ? 'In stock' : 'Out of stock'}
            </span>
            <span>•</span>
            <time datetime={r.createdAt}>{fmt(r.createdAt)}</time>
          </div>
        </header>

        {#if r.photoURL}
          <div class="media">
            <img src={r.photoURL} alt="Report photo" />
          </div>
        {/if}

        <section class="body">
          <p>{r.comment || 'No additional notes.'}</p>
        </section>

        <footer class="footer">
          {#if m}
            <div class="loc">
              <div>{m.address}, {m.city}, {m.state}</div>
              <div class="machine-vote">
                <span class="label">Machine score:</span>
                <VoteWidget postId={machinePostId(m.machineId)} />
              </div>
            </div>
          {/if}

          <div class="actions">
            <a class="btn" href={`/?machine=${encodeURIComponent(r.machineId)}`}>Open on map</a>
            <a class="btn" href={`/reports/new?machineId=${encodeURIComponent(r.machineId)}`}>Submit follow-up</a>
          </div>
        </footer>
      </div>
    </article>

    <section class="comments">
      <h2>Comments</h2>
      <p class="muted">Comments coming soon.</p>
    </section>
  </main>
{/if}

<style lang="postcss">
  @reference "../../../app.css";
  :root { --bg0:#282828; --bg1:#3c3836; --fg:#ebdbb2; --muted:#a89984; --green:#b8bb26; --red:#fb4934; --orange:#fe8019; }

  .page { @apply min-h-screen p-6; background-color: var(--bg1); color: var(--fg); }
  .crumbs { @apply mb-4 text-sm; color: var(--muted); }
  .crumbs a { color: var(--fg); } .crumbs span { @apply mx-2; }

  .post { @apply grid gap-4 p-4 rounded-2xl shadow-xl mb-8; grid-template-columns: 64px 1fr;
          background-color: var(--bg0); box-shadow: 0 0 0 1px #3c3836, 0 8px 30px rgba(0,0,0,.4); }
  .vote-col { @apply pt-2; }
  .title { @apply text-2xl font-mono; color: var(--orange); }
  .meta { @apply text-sm flex items-center gap-2; color: var(--muted); }
  .meta .stock { color: var(--green); } .meta .out { color: var(--red); }

  .media img { @apply rounded-lg max-h-[420px] w-auto; }
  .body p { @apply leading-relaxed; }

  .footer { @apply mt-4 space-y-4; }
  .loc { @apply flex items-center justify-between gap-4 flex-wrap; }
  .machine-vote { @apply flex items-center gap-2; }
  .label { @apply text-xs text-[var(--muted)]; }

  .actions { @apply flex gap-3; }
  .btn { @apply px-3 py-2 rounded-lg font-mono text-sm; background-color: var(--bg1); color: var(--fg);
         box-shadow: 0 0 0 1px #504945 inset; }
  .btn:hover { background-color:#504945; }

  .comments { @apply p-4 rounded-2xl; background-color: var(--bg0);
              box-shadow: 0 0 0 1px #3c3836, 0 8px 30px rgba(0,0,0,.3); }
  .comments h2 { @apply text-lg font-mono mb-2; color: var(--orange); }
  .muted { color: var(--muted); }
</style>
