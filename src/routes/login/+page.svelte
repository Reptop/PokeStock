<script lang="ts">
  import { enhance } from "$app/forms";
  export let form; // populated by +page.server.ts after submission

  let showPw = false;
</script>

<svelte:head>
  <title>Log In | PokéStock</title>
</svelte:head>

<main class="page">
  <form class="card" method="POST" use:enhance>
    <h1 class="heading">Log In</h1>

    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}

    {#if form?.success}
      <p class="success">{form.success}</p>
    {/if}

    <!-- Email -->
    <div>
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        name="email"
        required
        autocomplete="email"
      />
    </div>

    <!-- Password with toggle -->
    <div>
      <label for="password">Password</label>
      <div class="pw-wrap">
        <input
          id="password"
          type={showPw ? "text" : "password"}
          name="password"
          required
          autocomplete="current-password"
        />
        <span class="toggle-btn" on:click={() => (showPw = !showPw)}>
          {showPw ? "hide" : "show"}
        </span>
      </div>
    </div>

    <!-- Remember me -->
    <div class="flex items-center gap-2">
      <input id="remember" type="checkbox" name="remember" class="w-4 h-4" />
      <label class="mb-0" for="remember">Remember me</label>
    </div>

    <div class="pt-2 flex gap-3">
      <button class="btn btn-primary" type="submit">Log In</button>
      <a class="btn btn-secondary" href="/">Cancel</a>
    </div>

    <div class="foot">
      No account? <a href="/signup">Sign up</a>
    </div>
  </form>
</main>

<style lang="postcss">
  @reference "../../app.css";

  :root {
    --gv-bg0: #282828;
    --gv-bg1: #3c3836;
    --gv-fg: #ebdbb2;
    --gv-yellow: #fabd2f;
    --gv-yellow-dark: #d79921;
    --gv-green: #b8bb26;
    --gv-orange: #fe8019;
    --gv-red: #fb4934;
  }

  .page {
    @apply min-h-screen flex items-center justify-center px-4;
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
  }

  .card {
    @apply w-full max-w-md p-6 space-y-6 rounded-2xl shadow-2xl;
    background-color: var(--gv-bg0);
    box-shadow:
      0 0 0 1px #3c3836,
      0 8px 30px rgba(0, 0, 0, 0.45);
  }

  .heading {
    @apply font-mono text-2xl mb-2;
    color: var(--gv-orange);
  }

  label {
    @apply block font-mono text-sm mb-1;
    color: var(--gv-yellow);
  }

  input[type="email"],
  input[type="password"],
  input[type="text"] {
    @apply w-full rounded-md p-2 outline-none border border-transparent;
    background-color: var(--gv-bg1);
    color: var(--gv-fg);
    transition:
      box-shadow 0.15s,
      border-color 0.15s;
  }
  input:focus {
    box-shadow: 0 0 0 2px var(--gv-yellow);
    border-color: var(--gv-yellow-dark);
  }

  .pw-wrap {
    @apply relative;
  }
  .toggle-btn {
    @apply absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono cursor-pointer;
    color: #a89984;
  }
  .toggle-btn:hover {
    color: var(--gv-yellow);
  }

  .error {
    color: var(--gv-red);
    font-size: 0.875rem;
  }
  .success {
    color: var(--gv-green);
    font-size: 0.875rem;
  }

  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 font-mono text-sm rounded-lg;
    transition:
      background-color 0.15s,
      transform 0.05s;
  }

  .btn:active {
    transform: scale(0.98);
  }
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

  .foot {
    @apply text-xs text-center mt-4;
    color: #a89984;
  }

  .foot a {
    color: var(--gv-yellow);
  }

  .foot a:hover {
    text-decoration: underline;
  }
</style>
