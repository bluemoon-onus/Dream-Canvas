import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "#0a0a1a",
        "bg-elev": "#15152b",
        "text-primary": "#f5f5ff",
        "text-muted": "#8a8aa8",
        accent: "#a78bfa",
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto"],
      },
      keyframes: {
        cardIn: {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.92)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        gaugeFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--gauge-target)" },
        },
        pulseRing: {
          "0%,100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.15)", opacity: "0.2" },
        },
      },
      animation: {
        "card-in": "cardIn 600ms cubic-bezier(.2,.8,.2,1) both",
        "gauge-fill": "gaugeFill 800ms ease-out 200ms both",
        "pulse-ring": "pulseRing 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
