import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * BOP palette — monochrome premium: deep black + brushed silver/platinum.
 *
 * A single, clean token system under the `bop.*` namespace. No accent colour:
 * the "accent" ramp is metallic chrome (silver gradient). Functional states
 * (`positive`, `alert`) carry the only, heavily desaturated, hint of tint.
 */
const bop = {
  // Background / surface ramp (darkest → lightest)
  void: "#050506",        // base background, deepest black
  onyx: "#0a0b0d",        // body fill
  graphite: "#101216",    // surface
  slate: "#181b21",       // elevated surface
  ash: "#262a31",         // borders / hover
  // Metallic text
  silver: "#b7bcc4",      // secondary metallic text
  platinum: "#eceef1",    // brightest text
  // Metallic accent ramp (brushed chrome — replaces any colour accent)
  chrome: "#c4c9d1",
  "chrome-light": "#e9ecf0",
  "chrome-dark": "#7c818b",
  gleam: "#f4f6f8",       // specular highlight (near white)
  mist: "#8a8f98",        // muted neutral metal
  // Functional states — the only, minimal, desaturated tints.
  positive: "#a9b3ad",    // silver-green: target reached / saved
  alert: "#c79090",       // muted rose: errors / danger
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
          "linear-gradient(rgba(196,201,209,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(196,201,209,0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        "bop-glow": "0 0 24px rgba(196,201,209,0.22)",
        "bop-rim": "inset 0 0 0 1px rgba(183,188,196,0.18)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
