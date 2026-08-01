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
        // Gradiente principal (aurora): violeta -> verde-água suave por padrão,
        // mas trocável em Configurações > Aparência (usa CSS variables por baixo)
        aurora: {
          DEFAULT: "rgb(var(--color-aurora) / <alpha-value>)",
          soft: "rgb(var(--color-aurora-soft) / <alpha-value>)",
          teal: "rgb(var(--color-aurora-teal) / <alpha-value>)",
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
        aurora: "0 0 0 1px rgb(var(--color-aurora) / 0.35), 0 0 28px rgb(var(--color-aurora-teal) / 0.18)",
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
