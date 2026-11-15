/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2E2A5C",
        secondary: "#5B3E96",
        accent: "#C9A227",
        cta: "#F08A24",
        ivory: "#FBF7EE",
        mist: "#EFEAF8",
        ink: "#2B2A3D",
      },
      fontFamily: {
        heading: ["'Cormorant Garamond'", "serif"],
        body: ["'Poppins'", "sans-serif"],
      },
      animation: {
        'spin-slow': 'spin-slow 180s linear infinite',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
