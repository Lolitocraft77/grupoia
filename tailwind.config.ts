import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Group I.A palette — dark mode, dichromatic: GOLD (hero accent) + CHROME/SILVER
 * (working metal) over a black canvas.
 *
 * Kept in exact sync with the `--bop-*` tokens in src/index.css. Gold is the
 * only true accent and is reserved for hero moments (amounts, closed sales,
 * CTA, standout borders, recognition flash). Chrome/silver carry structure and
 * text. Functional states (`positive`, `alert`) are the only, minimal tints.
 */
const bop = {
  // Background / surface ramp (darkest → lightest)
  void: "#060607",        // base background, deepest black
  onyx: "#121216",        // body fill
  graphite: "#16161b",    // surface
  slate: "#1d1d23",       // elevated surface
  ash: "#2a2a31",         // borders / hover
  // Metallic text
  silver: "#c9cace",      // secondary metallic text
  platinum: "#e8e8ea",    // brightest text
  // Chrome (working-metal) accent ramp
  chrome: "#b8b8bd",
  "chrome-light": "#f0f0f2",
  "chrome-dark": "#6e6e73",
  gleam: "#f7f7f9",       // specular highlight (near white)
  mist: "#8a8a90",        // muted neutral metal
  // Gold (hero-accent) axis
  gold: "#c9a227",
  "gold-light": "#f4e4a6",
  "gold-dark": "#8a6d1b",
  // Functional states — the only, minimal, desaturated tints.
  positive: "#9db3a4",    // soft metal-green: target reached / saved
  alert: "#c79090",       // muted rose: errors / danger
  // Acento héroe (podio + faltante) → oro.
  emerald: "#c9a227",
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bop,
      },
      fontFamily: {
        display: ['"Jost"', '"Inter"', "system-ui", "sans-serif"],
        digital: ['"JetBrains Mono"', '"IBM Plex Mono"', "monospace"],
        sans: ['"Inter"', '"Manrope"', "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "bop-grid":
          "linear-gradient(rgba(184,184,189,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(184,184,189,0.05) 1px, transparent 1px)",
        "metal-gold":
          "linear-gradient(135deg, #8a6d1b, #c9a227 35%, #f4e4a6 50%, #c9a227 65%, #8a6d1b)",
        "metal-chrome":
          "linear-gradient(135deg, #6e6e73, #b8b8bd 40%, #f0f0f2 50%, #b8b8bd 60%, #6e6e73)",
      },
      boxShadow: {
        "bop-glow": "0 0 24px rgba(184,184,189,0.22)",
        "bop-gold-glow": "0 0 24px rgba(201,162,39,0.30)",
        "bop-rim": "inset 0 0 0 1px rgba(201,202,206,0.18)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
