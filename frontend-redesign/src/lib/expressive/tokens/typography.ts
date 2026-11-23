/**
 * Typography tokens.
 *
 * Semantic roles instead of font sizes. Any variable font works: families are
 * resolved through `--ex-font-brand` (display/headline/title) and
 * `--ex-font-plain` (body/label), which `createTheme` fills from `fonts`.
 */

export interface TypeStyle {
  family: "brand" | "plain";
  /** Font size in px. */
  size: number;
  /** Line height in px. */
  lineHeight: number;
  weight: number;
  /** Letter spacing in px. */
  tracking: number;
  /** Extra variable-font axes, e.g. `{ opsz: 36, wdth: 100 }`. */
  axes?: Record<string, number>;
}

export const typeRoles = [
  "display-large",
  "display-medium",
  "display-small",
  "headline-large",
  "headline-medium",
  "headline-small",
  "title-large",
  "title-medium",
  "title-small",
  "body-large",
  "body-medium",
  "body-small",
  "label-large",
  "label-medium",
  "label-small",
] as const;

export type TypeRole = (typeof typeRoles)[number];
export type TypeScale = Record<TypeRole | `${TypeRole}-emphasized`, TypeStyle>;

export interface Fonts {
  brand: string;
  plain: string;
}

export const defaultFonts: Fonts = {
  brand: `"Roboto Flex", ui-sans-serif, system-ui, sans-serif`,
  plain: `"Roboto Flex", ui-sans-serif, system-ui, sans-serif`,
};

const baseline: Record<TypeRole, TypeStyle> = {
  "display-large": { family: "brand", size: 57, lineHeight: 64, weight: 400, tracking: -0.25 },
  "display-medium": { family: "brand", size: 45, lineHeight: 52, weight: 400, tracking: 0 },
  "display-small": { family: "brand", size: 36, lineHeight: 44, weight: 400, tracking: 0 },
  "headline-large": { family: "brand", size: 32, lineHeight: 40, weight: 400, tracking: 0 },
  "headline-medium": { family: "brand", size: 28, lineHeight: 36, weight: 400, tracking: 0 },
  "headline-small": { family: "brand", size: 24, lineHeight: 32, weight: 400, tracking: 0 },
  "title-large": { family: "brand", size: 22, lineHeight: 28, weight: 400, tracking: 0 },
  "title-medium": { family: "plain", size: 16, lineHeight: 24, weight: 500, tracking: 0.15 },
  "title-small": { family: "plain", size: 14, lineHeight: 20, weight: 500, tracking: 0.1 },
  "body-large": { family: "plain", size: 16, lineHeight: 24, weight: 400, tracking: 0.5 },
  "body-medium": { family: "plain", size: 14, lineHeight: 20, weight: 400, tracking: 0.25 },
  "body-small": { family: "plain", size: 12, lineHeight: 16, weight: 400, tracking: 0.4 },
  "label-large": { family: "plain", size: 14, lineHeight: 20, weight: 500, tracking: 0.1 },
  "label-medium": { family: "plain", size: 12, lineHeight: 16, weight: 500, tracking: 0.5 },
  "label-small": { family: "plain", size: 11, lineHeight: 16, weight: 500, tracking: 0.5 },
};

/** M3 Expressive "emphasized" styles: same metrics, heavier weight. */
function emphasize(style: TypeStyle): TypeStyle {
  return { ...style, weight: style.weight >= 500 ? 700 : 500 };
}

export const defaultTypeScale = Object.fromEntries(
  typeRoles.flatMap((role) => [
    [role, baseline[role]],
    [`${role}-emphasized`, emphasize(baseline[role])],
  ]),
) as TypeScale;
