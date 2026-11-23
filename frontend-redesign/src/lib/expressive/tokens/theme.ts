/**
 * Theme — combines every token system into one object and serializes it to
 * CSS custom properties. Change the theme, and every component follows.
 */
import { type ColorOptions, type ColorScheme, colorRoles, generateScheme, toKebab } from "./colors";
import { type ElevationLevel, type ElevationToken, defaultElevation, elevationLevels } from "./elevation";
import { type InteractionTokens, defaultInteraction } from "./interaction";
import { type MotionScheme, type MotionTokens, type SpringSpeed, type SpringType, defaultMotion } from "./motion";
import { type ShapeTokens, defaultShape } from "./shape";
import { type SpacingTokens, defaultSpacing } from "./spacing";
import { type Fonts, type TypeScale, defaultFonts, defaultTypeScale } from "./typography";
import { springDuration, springToLinear } from "@/lib/expressive/spring";

export interface Theme {
  colors: ColorScheme;
  typography: { fonts: Fonts; scale: TypeScale };
  motion: MotionTokens;
  shape: ShapeTokens;
  spacing: SpacingTokens;
  elevation: Record<ElevationLevel, ElevationToken>;
  interaction: InteractionTokens;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export interface ThemeOptions {
  colors?: ColorOptions | ColorScheme;
  typography?: DeepPartial<Theme["typography"]>;
  motion?: DeepPartial<MotionTokens>;
  shape?: DeepPartial<ShapeTokens>;
  spacing?: SpacingTokens;
  elevation?: DeepPartial<Theme["elevation"]>;
  interaction?: DeepPartial<InteractionTokens>;
}

export const DEFAULT_SEED = "#6750A4";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function merge<T>(base: T, override: unknown): T {
  if (!isPlainObject(override)) return base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    result[key] = isPlainObject(value) && isPlainObject(result[key]) ? merge(result[key], value) : value;
  }
  return result as T;
}

export function createTheme(options: ThemeOptions = {}): Theme {
  const colors =
    options.colors && "light" in options.colors
      ? options.colors
      : generateScheme(options.colors ?? { seed: DEFAULT_SEED });

  return {
    colors,
    typography: merge({ fonts: defaultFonts, scale: defaultTypeScale }, options.typography),
    motion: merge(defaultMotion, options.motion),
    shape: merge(defaultShape, options.shape),
    spacing: options.spacing ?? defaultSpacing,
    elevation: merge(defaultElevation, options.elevation),
    interaction: merge(defaultInteraction, options.interaction),
  };
}

const px = (n: number) => (n === 0 ? "0" : `${n}px`);
/** Percentages work for both `opacity` and Tailwind's `color-mix()` opacity modifiers. */
const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const block = (selector: string, vars: Array<[string, string]>) =>
  `${selector} {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`;

const springTypes: SpringType[] = ["spatial", "effects"];
const springSpeeds: SpringSpeed[] = ["fast", "default", "slow"];
const motionSchemes: MotionScheme[] = ["expressive", "standard", "fluid"];

/**
 * Springs for one scheme, plus `--ex-motion-scheme` so script-driven motion
 * (ripple, fluid deformation) can read which scheme applies to an element.
 */
function motionAliases(scheme: MotionScheme): Array<[string, string]> {
  return [["--ex-motion-scheme", scheme], ...springAliases(scheme)];
}

function springAliases(scheme: MotionScheme): Array<[string, string]> {
  return springTypes.flatMap((type) =>
    springSpeeds.flatMap((speed): Array<[string, string]> => [
      [`--ex-spring-${type}-${speed}-easing`, `var(--ex-motion-${scheme}-${type}-${speed}-easing)`],
      [`--ex-spring-${type}-${speed}-duration`, `var(--ex-motion-${scheme}-${type}-${speed}-duration)`],
    ]),
  );
}

/** Serialize a theme to CSS custom properties (`--ex-*`). */
export function themeToCss(theme: Theme, { darkSelector = ".dark" } = {}): string {
  const root: Array<[string, string]> = [];

  for (const role of colorRoles) root.push([`--ex-color-${toKebab(role)}`, theme.colors.light[role]]);

  root.push(["--ex-font-brand", theme.typography.fonts.brand], ["--ex-font-plain", theme.typography.fonts.plain]);
  for (const [role, style] of Object.entries(theme.typography.scale)) {
    root.push(
      [`--ex-type-${role}-family`, `var(--ex-font-${style.family})`],
      [`--ex-type-${role}-size`, `${style.size / 16}rem`],
      [`--ex-type-${role}-line-height`, `${style.lineHeight / 16}rem`],
      [`--ex-type-${role}-weight`, String(style.weight)],
      [`--ex-type-${role}-tracking`, px(style.tracking)],
    );
    if (style.axes) {
      const axes = Object.entries(style.axes).map(([axis, value]) => `"${axis}" ${value}`);
      root.push([`--ex-type-${role}-axes`, axes.join(", ")]);
    }
  }

  for (const [name, value] of Object.entries(theme.shape.corners)) root.push([`--ex-shape-corner-${name}`, px(value)]);
  for (const [name, value] of Object.entries(theme.spacing)) root.push([`--ex-space-${name}`, px(value)]);
  for (const level of elevationLevels) root.push([`--ex-elevation-${level}`, theme.elevation[level].shadow]);

  const { stateLayer, disabled, focusRing, ripple } = theme.interaction;
  root.push(
    ["--ex-state-hover", pct(stateLayer.hover)],
    ["--ex-state-focus", pct(stateLayer.focus)],
    ["--ex-state-pressed", pct(stateLayer.pressed)],
    ["--ex-state-dragged", pct(stateLayer.dragged)],
    ["--ex-disabled-content", pct(disabled.content)],
    ["--ex-disabled-container", pct(disabled.container)],
    ["--ex-focus-ring-width", px(focusRing.width)],
    ["--ex-focus-ring-offset", px(focusRing.offset)],
    ["--ex-focus-ring-color", focusRing.color],
    ["--ex-ripple-duration", `${ripple.duration}ms`],
    ["--ex-ripple-opacity", pct(ripple.opacity)],
  );

  for (const scheme of motionSchemes) {
    for (const type of springTypes) {
      for (const speed of springSpeeds) {
        const spring = theme.motion.springs[scheme][type][speed];
        root.push(
          [`--ex-motion-${scheme}-${type}-${speed}-easing`, springToLinear(spring)],
          [`--ex-motion-${scheme}-${type}-${speed}-duration`, `${springDuration(spring)}ms`],
        );
      }
    }
  }
  for (const [name, value] of Object.entries(theme.motion.durations)) root.push([`--ex-duration-${name}`, `${value}ms`]);
  for (const [name, value] of Object.entries(theme.motion.easings)) root.push([`--ex-easing-${name}`, value]);
  const { viscosity, maxStretch, squash, wobble } = theme.motion.fluid;
  root.push(
    ["--ex-fluid-viscosity", String(viscosity)],
    ["--ex-fluid-max-stretch", String(maxStretch)],
    ["--ex-fluid-squash", String(squash)],
    ["--ex-fluid-wobble", String(wobble)],
  );
  root.push(...motionAliases(theme.motion.scheme));

  const dark = colorRoles.map((role): [string, string] => [`--ex-color-${toKebab(role)}`, theme.colors.dark[role]]);
  const noMotion: Array<[string, string]> = [
    ["--ex-motion-scheme", "none"],
    ...springTypes.flatMap((type) =>
      springSpeeds.map((speed): [string, string] => [`--ex-spring-${type}-${speed}-duration`, "0ms"]),
    ),
  ];

  return [
    `/* Generated by Expressive from seed ${theme.colors.seed} (${theme.colors.variant}). */`,
    block(":root", root),
    block(darkSelector, [["color-scheme", "dark"], ...dark]),
    ...motionSchemes.map((scheme) => block(`[data-motion="${scheme}"]`, motionAliases(scheme))),
    block(`[data-motion="none"]`, noMotion),
    `@media (prefers-reduced-motion: reduce) {\n${block(":root, [data-motion]", noMotion)}\n}`,
  ].join("\n\n");
}

/**
 * The static Tailwind v4 mapping from `--ex-*` variables to utilities
 * (`bg-primary`, `text-title-large`, `rounded-shape-large`, `shadow-elevation-2`,
 * `p-ex-md` — spacing is prefixed so it never shadows `max-w-2xl` and friends).
 */
export function themeToTailwind(theme: Theme = createTheme()): string {
  const vars: Array<[string, string]> = [];
  for (const role of colorRoles) vars.push([`--color-${toKebab(role)}`, `var(--ex-color-${toKebab(role)})`]);
  vars.push(["--font-brand", "var(--ex-font-brand)"], ["--font-plain", "var(--ex-font-plain)"]);
  for (const role of Object.keys(theme.typography.scale)) {
    vars.push(
      [`--text-${role}`, `var(--ex-type-${role}-size)`],
      [`--text-${role}--line-height`, `var(--ex-type-${role}-line-height)`],
      [`--text-${role}--letter-spacing`, `var(--ex-type-${role}-tracking)`],
      [`--text-${role}--font-weight`, `var(--ex-type-${role}-weight)`],
    );
  }
  for (const name of Object.keys(theme.shape.corners)) vars.push([`--radius-shape-${name}`, `var(--ex-shape-corner-${name})`]);
  for (const name of Object.keys(theme.spacing)) vars.push([`--spacing-ex-${name}`, `var(--ex-space-${name})`]);
  for (const level of elevationLevels) vars.push([`--shadow-elevation-${level}`, `var(--ex-elevation-${level})`]);
  for (const type of springTypes) {
    for (const speed of springSpeeds) vars.push([`--ease-${type}-${speed}`, `var(--ex-spring-${type}-${speed}-easing)`]);
  }
  return block("@theme inline", vars);
}
