import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#06080f",
          900: "#0a0e1a",
          850: "#0e1322",
          800: "#131a2c",
          700: "#1b2438",
          600: "#27324a",
        },
        gold: {
          DEFAULT: "#f5b642",
          300: "#f9cd76",
          400: "#f7c054",
          500: "#f5b642",
          600: "#dd9a26",
        },
        azure: "#6aa8ff",
        mint: "#4fe3c1",
        coral: "#ff6f6f",
        violet: "#b794f6",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,182,66,0.18), 0 18px 60px -18px rgba(245,182,66,0.45)",
        glass: "0 24px 70px -28px rgba(0,0,0,0.75)",
        ringlift: "0 10px 40px -12px rgba(106,168,255,0.5)",
      },
      backgroundImage: {
        "mesh-exec":
          "radial-gradient(1100px 700px at 12% -8%, rgba(245,182,66,0.16), transparent 60%), radial-gradient(900px 600px at 100% 0%, rgba(106,168,255,0.16), transparent 55%), radial-gradient(800px 700px at 50% 120%, rgba(79,227,193,0.12), transparent 60%)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.92)", opacity: "0.7" },
          "70%": { transform: "scale(1.35)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 2.4s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
