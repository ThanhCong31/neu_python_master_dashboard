import {
  type DynamicScheme,
  Hct,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

/**
 * Color tokens.
 *
 * Provide a seed color and Expressive derives five tonal palettes and every
 * semantic color role from it, using Google's Material color algorithm
 * (HCT color space, 2025 / Expressive spec).
 */

export const schemeVariants = {
  "tonal-spot": SchemeTonalSpot,
  expressive: SchemeExpressive,
  vibrant: SchemeVibrant,
  neutral: SchemeNeutral,
  monochrome: SchemeMonochrome,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  rainbow: SchemeRainbow,
  "fruit-salad": SchemeFruitSalad,
} as const;

export type SchemeVariant = keyof typeof schemeVariants;

export const colorRoles = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "primaryFixed",
  "primaryFixedDim",
  "onPrimaryFixed",
  "onPrimaryFixedVariant",
  "inversePrimary",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "secondaryFixed",
  "secondaryFixedDim",
  "onSecondaryFixed",
  "onSecondaryFixedVariant",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "tertiaryFixed",
  "tertiaryFixedDim",
  "onTertiaryFixed",
  "onTertiaryFixedVariant",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "background",
  "onBackground",
  "surface",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "inverseSurface",
  "inverseOnSurface",
  "outline",
  "outlineVariant",
  "shadow",
  "scrim",
  "surfaceTint",
] as const;

export type ColorRole = (typeof colorRoles)[number];
export type ColorRoles = Record<ColorRole, string>;

export const paletteNames = ["primary", "secondary", "tertiary", "neutral", "neutralVariant", "error"] as const;
export type PaletteName = (typeof paletteNames)[number];

export const paletteTones = [0, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100] as const;
export type TonalPalette = Record<(typeof paletteTones)[number], string>;

export interface ColorScheme {
  seed: string;
  variant: SchemeVariant;
  contrast: number;
  light: ColorRoles;
  dark: ColorRoles;
  palettes: Record<PaletteName, TonalPalette>;
}

export interface ColorOptions {
  /** Seed color as a hex string, e.g. `#6750A4`. */
  seed: string;
  variant?: SchemeVariant;
  /** -1 (reduced) … 0 (standard) … 1 (high contrast). */
  contrast?: number;
  /** Override individual roles after generation. */
  overrides?: { light?: Partial<ColorRoles>; dark?: Partial<ColorRoles> };
}

function createDynamicScheme(seed: string, variant: SchemeVariant, isDark: boolean, contrast: number): DynamicScheme {
  const Scheme = schemeVariants[variant];
  return new Scheme(Hct.fromInt(argbFromHex(seed)), isDark, contrast, "2025");
}

function rolesFrom(scheme: DynamicScheme): ColorRoles {
  const roles = {} as ColorRoles;
  for (const role of colorRoles) {
    roles[role] = hexFromArgb(scheme[role]);
  }
  return roles;
}

export function generateScheme({ seed, variant = "expressive", contrast = 0, overrides }: ColorOptions): ColorScheme {
  const light = createDynamicScheme(seed, variant, false, contrast);
  const dark = createDynamicScheme(seed, variant, true, contrast);

  const palettes = {} as Record<PaletteName, TonalPalette>;
  for (const name of paletteNames) {
    const palette = light[`${name}Palette`];
    const tones = {} as TonalPalette;
    for (const tone of paletteTones) {
      tones[tone] = hexFromArgb(palette.tone(tone));
    }
    palettes[name] = tones;
  }

  return {
    seed,
    variant,
    contrast,
    light: { ...rolesFrom(light), ...overrides?.light },
    dark: { ...rolesFrom(dark), ...overrides?.dark },
    palettes,
  };
}

/** `surfaceContainerHigh` → `surface-container-high` */
export function toKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
