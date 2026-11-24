/** Spacing tokens: a 4px-based scale. */

export const defaultSpacing = {
  none: 0,
  "3xs": 2,
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export type SpacingTokens = Record<string, number>;
