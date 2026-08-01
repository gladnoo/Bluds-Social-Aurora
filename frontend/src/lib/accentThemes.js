// Temas de cor de destaque. Cada um troca o par de cores usado em botões,
// gradientes e links por todo o app (guardados como CSS variables).
export const ACCENT_THEMES = [
  { id: "aurora", name: "Aurora", swatch: ["#a78bfa", "#5eead4"], colors: { aurora: "167 139 250", soft: "196 181 253", teal: "94 234 212" } },
  { id: "ember", name: "Brasa", swatch: ["#ff7a45", "#facc15"], colors: { aurora: "255 122 69", soft: "255 179 133", teal: "250 204 21" } },
  { id: "ocean", name: "Oceano", swatch: ["#38bdf8", "#2dd4bf"], colors: { aurora: "56 189 248", soft: "125 211 252", teal: "45 212 191" } },
  { id: "bloom", name: "Flor", swatch: ["#f472b6", "#fb923c"], colors: { aurora: "244 114 182", soft: "249 168 212", teal: "251 146 60" } },
  { id: "forest", name: "Floresta", swatch: ["#4ade80", "#a3e635"], colors: { aurora: "74 222 128", soft: "134 239 172", teal: "163 230 53" } },
];

const STORAGE_KEY = "bluds_accent_theme";

export function applyAccentTheme(id) {
  const theme = ACCENT_THEMES.find((t) => t.id === id) || ACCENT_THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--color-aurora", theme.colors.aurora);
  root.style.setProperty("--color-aurora-soft", theme.colors.soft);
  root.style.setProperty("--color-aurora-teal", theme.colors.teal);
}

export function getSavedAccentTheme() {
  return localStorage.getItem(STORAGE_KEY) || "aurora";
}

export function saveAccentTheme(id) {
  localStorage.setItem(STORAGE_KEY, id);
  applyAccentTheme(id);
}
