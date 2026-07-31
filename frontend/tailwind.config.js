/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Fundo em tom médio, névoa violeta — nem claro nem escuro
        mist: {
          DEFAULT: "#2b2740",
          surface: "rgba(255,255,255,0.045)",
          hover: "rgba(255,255,255,0.085)",
          border: "rgba(255,255,255,0.11)",
        },
        // Gradiente principal (aurora): violeta -> verde-água suave
        aurora: {
          DEFAULT: "#a78bfa",
          soft: "#c4b5fd",
          teal: "#5eead4",
        },
        // Destaque secundário: rosa suave, usado em curtidas
        bloom: {
          DEFAULT: "#f472b6",
          soft: "#f9a8d4",
        },
        ghost: "#f2eefb", // texto principal
        hush: "#a99ec7", // texto apagado
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      boxShadow: {
        aurora: "0 0 0 1px rgba(167,139,250,0.35), 0 0 28px rgba(94,234,212,0.18)",
        bloom: "0 0 0 1px rgba(244,114,182,0.35), 0 0 20px rgba(244,114,182,0.18)",
        card: "0 4px 24px rgba(10,8,20,0.25)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(3%, -4%) scale(1.05)" },
        },
        driftReverse: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-4%, 3%) scale(1.08)" },
        },
        breathe: {
          "0%, 100%": { opacity: 0.55 },
          "50%": { opacity: 1 },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "drift-reverse": "driftReverse 22s ease-in-out infinite",
        breathe: "breathe 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
