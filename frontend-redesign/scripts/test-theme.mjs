/** Run offline via `npm run test:theme`. Confirms local settings without a browser/backend. */
import assert from "node:assert/strict";
import { evaluateTypescript } from "./test-loader.mjs";

const saved = new Map();
const css = { textContent: "" };
const nodes = new Map();
const classes = new Set();
const listeners = new Map();
const mqlListeners = new Map();
let systemDark = false;
const document = {
  documentElement: { classList: { toggle: (name, active) => active ? classes.add(name) : classes.delete(name) } },
  getElementById: id => nodes.get(id) ?? null,
  createElement: () => ({ ...css }),
  head: { appendChild(node) { nodes.set(node.id, node); } },
};
const context = {
  exports: {},
  document,
  localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, val) => saved.set(key, val) },
  matchMedia: () => ({ get matches() { return systemDark; }, addEventListener(_event, fn) { mqlListeners.set("change", fn); } }),
  window: { dispatchEvent: () => {}, addEventListener(name, cb) { listeners.set(name, cb); } },
  Event: class { constructor(type) { this.type = type; } },
  __colors: {
      colorRoles: ["primary", "onPrimary", "surface"],
      toKebab: x => x.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
      generateScheme: ({ seed }) => ({ light: { primary: seed, onPrimary: "#ffffff", surface: "#fafafa" }, dark: { primary: seed, onPrimary: "#000000", surface: "#121212" } }),
    },
};
const theme = evaluateTypescript(new URL("../src/shell/theme.ts", import.meta.url), {
  context,
  imports: { "@/lib/expressive/tokens/colors": context.__colors },
  exports: ["THEME_COLORS", "getTheme", "getThemeColor", "setTheme", "setThemeColor", "initializeTheme", "getThemeScheme"],
});
assert.equal(theme.getTheme(), "system");
assert.equal(theme.getThemeColor(), "campus");
theme.initializeTheme();
assert.equal(classes.has("dark"), false);
theme.setTheme("dark");
assert.equal(saved.get("neu-bi-theme"), "dark");
assert.equal(classes.has("dark"), true);
theme.setThemeColor("lagoon");
assert.equal(saved.get("neu-bi-color"), "lagoon");
assert.match(nodes.get("neu-dynamic-palette").textContent, /html\.dark/);
assert.equal(theme.getThemeColor(), "lagoon");
theme.setTheme("system");
systemDark = true;
mqlListeners.get("change")();
assert.equal(classes.has("dark"), true);
saved.set("neu-bi-color", "amber");
assert.equal(theme.getThemeColor(), "ember");
saved.set("neu-bi-color", "purple");
assert.equal(theme.getThemeColor(), "iris");
saved.set("neu-bi-color", "blue");
assert.equal(theme.getThemeColor(), "campus");
console.log("PASS  theme mode, palette persistence, dark mode, system mode and V2 preference migration");
