<!-- src/routes/reports/new/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { oregonMachines } from "$lib/data/oregonMachines";
  import { createReport, uploadPhoto } from "$lib/reportClient";

  // Anti-abuse service base URL
  const ABUSE_BASE = "http://localhost:5006";

  interface FormState {
    machineId: string;
    inStock: boolean;
    comment: string;
    photoFile: File | null;
    photoPreview: string | null;
  }

  let machines = oregonMachines;
  let form: FormState = {
    machineId: "",
    inStock: true,
    comment: "",
    photoFile: null,
    photoPreview: null
  };

  let submitting = false;
  let validating = false;
  let success = false;
  let errorMsg = "";

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const mid = params.get("machineId");
    if (mid) form.machineId = mid;
  });

  function ensureUserId(): string {
    const KEY = "pokestock_user_id";
    let id = localStorage.getItem(KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
    return id;
  }

  function onPhotoChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    form.photoFile = file;
    if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
    form.photoPreview = file ? URL.createObjectURL(file) : null;
  }

  async function validateWithAbuse(comment: string) {
    validating = true;
    try {
      const resp = await fetch(`${ABUSE_BASE}/api/mod/validate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post_report",
          userId: ensureUserId(),
          text: comment || ""
        })
      });

      const payload = await resp.json().catch(() => ({}));

      // Block on non-OK (e.g., 422 banned words in strict, 429 rate limit)
      if (!resp.ok) {
        const terms = Array.isArray(payload?.reasons)
          ? payload.reasons.filter((r: string) => r !== "banned")
          : [];
        const suffix = terms.length ? ` Offending terms: ${terms.join(", ")}.` : "";
        const message =
          payload?.message ||
          (resp.status === 422
            ? "Your report contains sensitive language and cannot be submitted."
            : resp.status === 429
            ? "You’re doing that too often. Please wait a bit and try again."
            : "Unable to submit right now.");
        throw new Error(message + suffix);
      }

      // If service says toxic (non-strict), still block per your requirement
      if (payload?.toxic) {
        const terms = Array.isArray(payload?.reasons)
          ? payload.reasons.filter((r: string) => r !== "banned")
          : [];
        const suffix = terms.length ? ` Offending terms: ${terms.join(", ")}.` : "";
        throw new Error(
          (payload?.message ||
            "Your report contains sensitive language and cannot be submitted.") + suffix
        );
      }
    } finally {
      validating = false;
    }
  }

  async function submitReport() {
    errorMsg = "";
    success = false;

    if (!form.machineId) {
      errorMsg = "Please pick a machine.";
      return;
    }
    const ok = confirm("Submit this report? You can’t edit it afterward.");
    if (!ok) return;

    // 1) Validate comment with anti-abuse before any uploads
    try {
      await validateWithAbuse(form.comment || "");

    } catch (e: any) {
      errorMsg = e?.message ?? "Validation failed.";
      return; // BLOCK submission
    }

    // 2) Proceed to upload + create
    submitting = true;
    try {
      let photoURL: string | undefined;
      if (form.photoFile) {
        const { publicUrl } = await uploadPhoto(form.photoFile);
        photoURL = publicUrl;
      }

      await createReport({
        machineId: form.machineId,
        inStock: form.inStock,
        comment: form.comment || "",
        photoURL
      });

      success = true;

      // Clear (keep machineId so multiple submissions are easy)
      form.comment = "";
      if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
      form.photoFile = null;
      form.photoPreview = null;
    } catch (e: any) {
      errorMsg = e?.message ?? "Failed to submit report";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Submit Report | PokéStock</title>
</svelte:head>

<main class="page">
  <div class="card" aria-live="polite">
    <h1 class="heading">Submit New Report</h1>
    <p class="explain">Submitting a report only takes 30&nbsp;seconds and helps others plan their visits better.</p>

    {#if success}<p class="success">Thanks! Your report was submitted.</p>{/if}
    {#if errorMsg}<p class="error">Error: {errorMsg}</p>{/if}

    <form class="space-y-5" on:submit|preventDefault={submitReport}>
      <!-- Machine -->
      <div>
        <label for="machine" class="label">Machine</label>
        <select id="machine" bind:value={form.machineId} class="field">
          <option value="" disabled>Select a machine…</option>
          {#each machines as m}
            <option value={m.machineId}>{m.machineId} — {m.retailer} ({m.city})</option>
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

      <!-- Notes -->
      <div>
        <label for="notes" class="label">Notes / Details</label>
        <textarea
          id="notes"
          bind:value={form.comment}
          class="field textarea"
          placeholder="What did you see? Which packs are there?"></textarea>
        {#if validating}
          <p class="checking">Checking language…</p>
        {/if}
      </div>

      <!-- Photo (Gruvbox-styled button + hidden input) -->
      <div>
        <span class="label">Photo (optional)</span>

        <div class="flex items-center gap-3">
          <label
            for="photo"
            class="inline-block cursor-pointer rounded-lg px-4 py-2 font-mono text-sm font-bold
                   bg-[#d79921] text-[#282828] hover:bg-[#fabd2f] focus:ring-2 focus:ring-[#fabd2f]
                   transition-colors duration-150"
            title="Upload Photo"
          >
            Upload Photo
          </label>

          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            class="hidden"
            on:change={onPhotoChange}
          />

          <!-- Filename display -->
          <span class="text-xs text-[#a89984] truncate max-w-[12rem]">
            {form.photoFile ? form.photoFile.name : 'No file chosen'}
          </span>
        </div>

        {#if form.photoPreview}
          <div class="preview">
            <img src={form.photoPreview} alt="Photo preview" />
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button class="btn btn-primary" type="submit" disabled={submitting || validating}>
          {submitting ? "Submitting…" : validating ? "Checking…" : "Submit Report"}
        </button>
        <a class="btn btn-secondary" href="/">Cancel</a>
      </div>
    </form>
  </div>
</main>

<style lang="postcss">
  @reference "../../../app.css";

  :root {
    --gv-bg0:#282828; --gv-bg1:#3c3836; --gv-fg:#ebdbb2;
    --gv-yellow:#fabd2f; --gv-yellow-dark:#d79921;
    --gv-green:#b8bb26; --gv-orange:#fe8019;
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

  .heading { @apply font-mono text-2xl mb-1; color: var(--gv-orange); }
  .explain { @apply text-xs mb-2; color: #a89984; }

  .label {
    @apply block font-mono text-sm mb-1;
    color: var(--gv-yellow);
  }

  .field {
    @apply w-full rounded-md p-2 outline-none border border-transparent;
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
    transition: box-shadow .15s, border-color .15s;
  }
  .field:focus { box-shadow: 0 0 0 2px var(--gv-yellow); border-color: var(--gv-yellow-dark); }
  .textarea { @apply resize-none; height: 10.5rem; }

  .checking { @apply text-xs mt-1; color: #a89984; }

  .stock-toggle {
    @apply flex items-center gap-2 cursor-pointer select-none;
    color: var(--gv-fg);
  }
  .stock-toggle input {
    @apply w-4 h-4;
    accent-color: #b8bb26;
    background-color: #3c3836;
  }

  .preview { @apply mt-2; }
  .preview img { @apply max-h-64 rounded-lg; }

  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 font-mono text-sm rounded-lg;
    transition: background-color .15s, transform .05s;
  }
  .btn:active { transform: scale(.98); }

  .btn-primary { background-color: var(--gv-yellow); color: #282828; }
  .btn-primary:hover { background-color: var(--gv-yellow-dark); }

  .btn-secondary {
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
    box-shadow: 0 0 0 1px #504945 inset;
  }
  .btn-secondary:hover { background-color: #504945; }

  .error { color:#fb4934; font-size:.875rem; }
  .success { color:var(--gv-green); font-size:.875rem; }
</style>
