/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#0A090D",
          900: "#0E0C12",
          850: "#131118",
          800: "#16141C",
          750: "#191620",
          700: "#1A1721",
          650: "#1E1B26",
        },
        plum: {
          50: "#F3EDF4",
          200: "#E2C6E5",
          300: "#CBB0CC",
          400: "#B89BB9",
          500: "#A688AA",
          600: "#8B6F8E",
          700: "#7D6380",
          800: "#725B75",
        },
        ink: {
          950: "#07090E",
          900: "#0A0C12",
          850: "#0D111A",
          800: "#131926",
          700: "#1A2230",
          600: "#232D3E",
          500: "#2D3A50",
          400: "#3D4D66",
          300: "#546580",
          200: "#6E7E98",
          100: "#8A9AB5",
        },
        accent: {
          cyan: "#38BDF8",
          "cyan-dim": "#0284C7",
          amber: "#F59E0B",
          "amber-glow": "rgba(251, 191, 36, 0.4)",
          crimson: "#EF4444",
          "crimson-glow": "rgba(239, 68, 68, 0.6)",
          emerald: "#10B981",
          "emerald-glow": "rgba(16, 185, 129, 0.3)",
          purple: "#A855F7",
          blue: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(56, 189, 248, 0.4)",
        "glow-lg": "0 0 60px -15px rgba(168, 85, 247, 0.5)",
        "crimson-glow": "0 0 20px rgba(239, 68, 68, 0.18)",
        "amber-glow": "0 0 15px rgba(251, 191, 36, 0.4)",
        "plum-soft": "0 10px 30px -10px rgba(166, 136, 170, 0.35)",
      },
      borderRadius: {
        bento: "16px",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};