<script lang="ts">
  // Expect an array of { message: string, timeAgo: string }
  export let reports: { message: string; timeAgo: string }[] = [];
</script>

<section
  style="
    background-color: var(--gv-panel);
    color: var(--gv-fg);
    border-radius: 1rem;
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
    padding: 1rem;
    overflow: auto;
  "
>
  <h2
    style="
      font-family: 'JetBrains Mono Nerd Font', monospace;
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    "
  >
    Recent Reports
  </h2>
  <ul>
    {#each reports as { message, timeAgo }}
      <li
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background-color: var(--gv-bg);
          border-radius: 0.5rem;
        "
      >
        <span>{message}</span>
        <span
          style="
            font-size: 0.875rem;
            color: var(--gv-light1);
          "
        >
          {timeAgo}
        </span>
      </li>
    {/each}
  </ul>
</section>
