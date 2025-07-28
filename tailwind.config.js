// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,js,svelte,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        "gruvbox-bg":    "#282828",
        "gruvbox-dark1": "#3c3836",
        "gruvbox-dark0": "#1d2021",

        // Foregrounds
        "gruvbox-fg":    "#ebdbb2",
        "gruvbox-light1": "#fbf1c7",

        // Accents
        "gruvbox-red":    "#fb4934",
        "gruvbox-green":  "#b8bb26",
        "gruvbox-yellow": "#fabd2f",
        "gruvbox-blue":   "#83a598",
        "gruvbox-purple": "#d3869b",
        "gruvbox-aqua":   "#8ec07c",
        "gruvbox-orange": "#fe8019"
      }
    }
  },
  plugins: []
}
