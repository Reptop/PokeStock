<!-- src/lib/Nav.svelte -->
<script lang="ts">
  import { page } from '$app/stores';

  const navItems = [
    { name: 'Home',     href: '/' },
    { name: 'Reports',  href: '/reportlist' },
    { name: 'Submit Report',  href: '/reports/new' }, 
    { name: 'Log In',   href: '/login' }
  ];
</script>

<nav class="nav-root font-mono">
  <!-- Left “prompt” -->
  <a href="/" class="brand">
    <span class="prompt">λ</span> PokéStock&nbsp;Tracker
    <span class="cursor" aria-hidden="true">▋</span>
  </a>

  <!-- Links -->
  <ul class="links">
    {#each navItems as { name, href }}
      <li>
        <a
          href={href}
          class="link {$page.url.pathname === href ? 'active' : ''}"
        >
          <span class="bracket">[</span>{name}<span class="bracket">]</span>

        </a>
      </li>
    {/each}
  </ul>

  <!-- tiny glitch bar -->
  <div class="scanline" aria-hidden="true"></div>
</nav>

<style lang="postcss">
  /* pull tailwind utilities */
  @reference "../app.css";

  /* Colors (Gruvbox) */
  :root {
    --gv-bg0:  #282828;
    --gv-bg1:  #3c3836;
    --gv-fg1:  #ebdbb2;
    --gv-yellow: #fabd2f;
    --gv-green:  #b8bb26;
    --gv-orange: #fe8019;
    --gv-red:    #fb4934;
  }

  .nav-root {
    @apply flex items-center justify-between px-6 py-3 shadow-md relative;
    background-color: var(--gv-bg0);
    color: var(--gv-fg1);
  }

  .brand {
    @apply text-xl font-bold flex items-center gap-1 hover:text-[var(--gv-yellow)] transition-colors;
  }

  .prompt {
    color: var(--gv-green);
  }

  .cursor {
    animation: blink 1s steps(2, start) infinite;
    color: var(--gv-yellow);
    margin-left: 2px;
  }

  .links {
    @apply flex items-center gap-6;
  }

  .link {
    @apply transition-colors duration-150;
    color: var(--gv-fg1);
    position: relative;
  }

  .link .bracket {
    color: var(--gv-bg1);
    transition: color .15s;
  }

  .link:hover .bracket {
    color: var(--gv-green);
  }

  .link:hover {
    color: var(--gv-yellow);
  }

  .link.active {
    color: var(--gv-orange);
    font-weight: 600;
  }

  /* glitchy scanline at bottom */
  .scanline {
    position: absolute;
    left: 0; right: 0; bottom: -1px;
    height: 2px;
    background: linear-gradient(90deg,
      var(--gv-green) 0%,
      var(--gv-yellow) 20%,
      var(--gv-orange) 40%,
      var(--gv-red) 60%,
      var(--gv-yellow) 80%,
      var(--gv-green) 100%);
    opacity: .25;
    animation: slide 5s linear infinite;
  }

  @keyframes blink {
    to { opacity: 0; }
  }

  @keyframes slide {
    0%   { transform: translateX(-50%); }
    100% { transform: translateX(50%);  }
  }
</style>
