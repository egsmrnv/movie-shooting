import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(255,255,255,0.08)",
        background: "#050505",
        foreground: "#FFFFFF",
        muted: "#71717A",
        "muted-foreground": "#A1A1AA",
        card: "#09090B",
        "card-foreground": "#FFFFFF",
        primary: "#E50914",
        "primary-foreground": "#FFFFFF",
        destructive: "#FF3B3B"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
