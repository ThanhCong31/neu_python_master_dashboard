import { colorRoles, generateScheme, toKebab } from "@/lib/expressive/tokens/colors";

export type ThemeMode = "system" | "light" | "dark";
export type ThemeColor = "campus" | "iris" | "lagoon" | "ember" | "moss";

const key = "neu-bi-theme";
const colorKey = "neu-bi-color";

/**
 * Five curated tonal palettes. Google Material color utilities supply their
 * complete light and dark semantic roles; never mix raw seed colors into UI.
 * The original product logo remains blue even when the theme changes.
 */
export const THEME_COLORS: ReadonlyArray<{ id: ThemeColor; name: string; seed: string }> = [
  { id: "campus", name: "Campus Blue", seed: "#2A78D6" },
  { id: "iris", name: "Iris Violet", seed: "#7358A9" },
  { id: "lagoon", name: "Lagoon Teal", seed: "#006E75" },
  { id: "ember", name: "Ember Coral", seed: "#B55544" },
  { id: "moss", name: "Moss Green", seed: "#506D4E" },
];

const previewCache = new Map<ThemeColor, ReturnType<typeof generateScheme>>();
export function getThemeScheme(color: ThemeColor) {
  const existing = previewCache.get(color);
  if (existing) return existing;
  const entry = THEME_COLORS.find((item) => item.id === color) ?? THEME_COLORS[0];
  // Calm Material tonal spot color roles; Expressive motion remains separate.
  const scheme = generateScheme({ seed: entry.seed, variant: "tonal-spot" });
  previewCache.set(color, scheme);
  return scheme;
}

export function getTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(key);
    if (value === "light" || value === "dark") return value;
  } catch { /* Browser storage may be unavailable. */ }
  return "system";
}
export function getThemeColor(): ThemeColor {
  try {
    const value = localStorage.getItem(colorKey);
    if (THEME_COLORS.some((color) => color.id === value)) return value as ThemeColor;
    // Preserve previous V2/V3 preferences when migrating to the curated set.
    if (value === "purple") return "iris";
    if (value === "neu" || value === "rose" || value === "amber") return "ember";
    if (value === "blue") return "campus";
    if (value === "teal") return "lagoon";
  } catch { /* Browser storage may be unavailable. */ }
  return "campus";
}

function applyPalette(color: ThemeColor) {
  const scheme = getThemeScheme(color);
  const root = colorRoles.map((role) => `--ex-color-${toKebab(role)}:${scheme.light[role]};`).join("");
  const dark = colorRoles.map((role) => `--ex-color-${toKebab(role)}:${scheme.dark[role]};`).join("");
  let node = document.getElementById("neu-dynamic-palette") as HTMLStyleElement | null;
  if (!node) {
    node = document.createElement("style");
    node.id = "neu-dynamic-palette";
    document.head.appendChild(node);
  }
  // Update all Material roles in one stylesheet to prevent mixed-color frames.
  node.textContent = `:root{${root}}html.dark{${dark}}`;
}
function updateClass(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark" ||
    (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
}
function changed() { window.dispatchEvent(new Event("neu-theme-change")); }

export function setTheme(mode: ThemeMode) {
  updateClass(mode);
  try { localStorage.setItem(key, mode); } catch { /* Keep in memory. */ }
  changed();
}
export function setThemeColor(color: ThemeColor) {
  applyPalette(color);
  try { localStorage.setItem(colorKey, color); } catch { /* Keep in memory. */ }
  changed();
}
export function initializeTheme() {
  updateClass(getTheme());
  applyPalette(getThemeColor());
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getTheme() === "system") updateClass("system");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === colorKey) {
      updateClass(getTheme());
      applyPalette(getThemeColor());
      changed();
    }
  });
}
