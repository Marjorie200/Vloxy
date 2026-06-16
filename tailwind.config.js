/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",
        accent: "#22D3EE",
        bgdark: "#0B0F19",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124,58,237,0.5)" },
          "50%": { boxShadow: "0 0 50px rgba(124,58,237,0.9)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        glow: "glow 2.5s ease-in-out infinite",
        pulseRing: "pulseRing 1.5s ease-out infinite",
      },
    },
  },
  plugins: [],
};
