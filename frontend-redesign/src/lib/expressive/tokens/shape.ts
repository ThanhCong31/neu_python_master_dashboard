/**
 * Shape tokens.
 *
 * A corner scale plus named presets. Components consume `shape="…"` props
 * that resolve to these tokens, never raw radius values.
 */

export const cornerScale = {
  none: 0,
  "extra-small": 4,
  small: 8,
  medium: 12,
  large: 16,
  "large-increased": 20,
  "extra-large": 28,
  "extra-large-increased": 32,
  "extra-extra-large": 48,
  full: 9999,
} as const;

export type Corner = keyof typeof cornerScale;
export type CornerScale = Record<Corner, number>;

/**
 * Corner styles. `squircle` and `cut` rely on CSS `corner-shape`
 * (progressive enhancement: browsers without support render `round`).
 */
export type CornerStyle = "round" | "squircle" | "cut";

export interface ShapePreset {
  corner: Corner;
  style: CornerStyle;
}

export const shapePresets = {
  rounded: { corner: "medium", style: "round" },
  pill: { corner: "full", style: "round" },
  circular: { corner: "full", style: "round" },
  squircle: { corner: "extra-large", style: "squircle" },
  cut: { corner: "small", style: "cut" },
  small: { corner: "small", style: "round" },
  medium: { corner: "medium", style: "round" },
  large: { corner: "large", style: "round" },
  "extra-large": { corner: "extra-large", style: "round" },
} as const satisfies Record<string, ShapePreset>;

export type ShapeName = keyof typeof shapePresets;

export interface ShapeTokens {
  corners: CornerScale;
  presets: Record<string, ShapePreset>;
}

export const defaultShape: ShapeTokens = { corners: { ...cornerScale }, presets: { ...shapePresets } };
