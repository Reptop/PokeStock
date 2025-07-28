<!-- src/routes/reports/new/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { oregonMachines } from '$lib/data/oregonMachines';

  interface ReportForm {
    machineId: string;
    inStock: boolean;
    comment: string;
    photo: File | null;
  }

  let form: ReportForm = {
    machineId: '',
    inStock: true,
    comment: '',
    photo: null
  };

  let machines = oregonMachines;
  let submitting = false;
  let success = false;
  let errorMsg = '';

  // file picker refs
  let fileInput: HTMLInputElement;
  let fileName = '';

  onMount(() => {
    const q = new URLSearchParams($page.url.search);
    const mid = q.get('machineId');
    if (mid) form.machineId = mid;
  });

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    form.photo = f;
    fileName = f ? f.name : '';
  }

  async function submitReport() {
    if (!form.machineId) {
      errorMsg = 'Please pick a machine.';
      return;
    }

    submitting = true;
    errorMsg = '';
    success  = false;

    try {
      const fd = new FormData();
      fd.append('machineId', form.machineId);
      fd.append('inStock', String(form.inStock));
      fd.append('comment', form.comment);
      if (form.photo) fd.append('photo', form.photo);

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: fd
      });

      if (!res.ok) throw new Error(await res.text());

      success = true;
      form.comment = '';
      form.photo = null;
      fileName = '';
    } catch (err: any) {
      errorMsg = err?.message ?? 'Unknown error';
    } finally {
      submitting = false;
    }
  }
</script>

<style lang="postcss">
  /* FIX path depth: /src/routes/reports/new/+page.svelte -> /src/app.css */
  @reference "../../../app.css";

  :root {
    --gv-bg0: #282828;
    --gv-bg1: #3c3836;
    --gv-fg:  #ebdbb2;
    --gv-yellow: #fabd2f;
    --gv-yellow-dark: #d79921;
    --gv-green: #b8bb26;
    --gv-orange: #fe8019;
  }

  .page {
    @apply min-h-screen flex items-start justify-center py-12 px-4;
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
  }

  .card {
    @apply w-full max-w-lg p-6 space-y-6 rounded-2xl shadow-2xl;
    background-color: var(--gv-bg0);
    box-shadow: 0 0 0 1px #3c3836, 0 8px 30px rgba(0,0,0,.45);
  }

  .heading {
    @apply font-mono text-2xl mb-2;
    color: var(--gv-orange);
  }

  label {
    @apply block font-mono text-sm mb-1;
    color: var(--gv-yellow);
  }

  input, select, textarea {
    @apply w-full rounded-md p-2 outline-none border border-transparent;
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
    transition: box-shadow .15s, border-color .15s;
  }

  input:focus, select:focus, textarea:focus {
    box-shadow: 0 0 0 2px var(--gv-yellow);
    border-color: var(--gv-yellow-dark);
  }

  textarea {
    @apply resize-none;
    height: 11rem;
  }

  .error   { color: #fb4934; font-size: .875rem; }
  .success { color: var(--gv-green); font-size: .875rem; }

  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 font-mono text-sm rounded-lg;
    transition: background-color .15s, transform .05s;
  }
  .btn:active { transform: scale(.98); }

  .btn-primary {
    background-color: var(--gv-yellow);
    color: #282828;
  }
  .btn-primary:hover {
    background-color: var(--gv-yellow-dark);
  }

  .btn-secondary {
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
    box-shadow: 0 0 0 1px #504945 inset;
  }
  .btn-secondary:hover {
    background-color: #504945;
  }

  /* Inline checkbox row */
  .stock-toggle {
    @apply flex items-center gap-2 cursor-pointer select-none;
    color: var(--gv-fg);
  }
  .stock-toggle input {
    @apply w-4 h-4;
    accent-color: #b8bb26;
    background-color: #3c3836;
  }

  /* File chooser */
  .file-row {
    @apply flex items-center gap-3;
  }
  .btn-file {
    background-color: var(--gv-yellow);
    color: #282828;
    @apply px-3 py-2 rounded-lg font-mono text-sm transition-colors duration-150;
  }
  .btn-file:hover {
    background-color: var(--gv-yellow-dark);
  }
  .file-name {
    @apply text-sm truncate;
    max-width: 12rem;
    color: #a89984;
  }
</style>

<svelte:head>
  <title>Submit Report | PokéStock</title>
</svelte:head>

<main class="page">
  <div class="card">
    <h1 class="heading">Submit New Report</h1>

    {#if success}
      <p class="success mb-4">Thanks! Your report was submitted.</p>
    {/if}

    {#if errorMsg}
      <p class="error mb-4">{errorMsg}</p>
    {/if}

    <form on:submit|preventDefault={submitReport} class="space-y-5">
      <!-- Machine select -->
      <div>
        <label for="machine">Machine</label>
        <select id="machine" bind:value={form.machineId}>
          <option value="" disabled>Select a machine…</option>
          {#each machines as m}
            <option value={m.machineId}>
              {m.machineId} — {m.retailer} ({m.city})
            </option>
          {/each}
        </select>
      </div>

      <!-- In stock -->
      <div>
        <label class="stock-toggle">
          <input type="checkbox" bind:checked={form.inStock} />
          <span>In stock</span>
        </label>
      </div>

      <!-- Comment -->
      <div>
        <label for="comment">Notes / Details</label>
        <textarea
          id="comment"
          bind:value={form.comment}
          placeholder="What did you see? Which packs are there?"></textarea>
      </div>

      <!-- Photo -->
      <div>
        <label class="block font-mono text-sm mb-1" for="photo">Photo (optional)</label>

        <input
          id="photo"
          type="file"
          accept="image/*"
          bind:this={fileInput}
          class="hidden"
          on:change={onFileChange}
        />

        <div class="file-row">
          <button
            type="button"
            class="btn-file"
            on:click={() => fileInput.click()}
          >
            Choose Photo
          </button>
          <span class="file-name">{fileName || 'No file chosen'}</span>
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <button class="btn btn-primary" type="submit" disabled={submitting}>
          {#if submitting}Submitting…{/if}
          {#if !submitting}Submit Report{/if}
        </button>
        <a class="btn btn-secondary" href="/">Cancel</a>
      </div>
    </form>
  </div>
</main>
