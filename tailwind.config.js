/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./loan app/src/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#6B46C1",
          foreground: "#FFFFFF",
          50: "#F3F4F6",
          100: "#E5E7EB",
          500: "#6B46C1",
          600: "#5B21B6",
          700: "#4C1D95",
          800: "#3730A3",
          900: "#312E81",
        },
        secondary: {
          DEFAULT: "#FCD34D",
          foreground: "#4C1D95",
          400: "#FDE047",
          500: "#FCD34D",
          600: "#F59E0B",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          foreground: "#D1D5DB",
        },
        popover: {
          DEFAULT: "rgba(255, 255, 255, 0.95)",
          foreground: "#1F2937",
        },
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          foreground: "#FFFFFF",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "purple-gradient": "linear-gradient(135deg, #6B46C1 0%, #4C1D95 100%)",
        "yellow-gradient": "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
