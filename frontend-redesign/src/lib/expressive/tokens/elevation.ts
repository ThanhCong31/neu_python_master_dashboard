/**
 * Elevation tokens.
 *
 * Material expresses depth primarily through surface tone; shadows are a
 * secondary cue. Each level pairs a shadow with a surface container role.
 */

export const elevationLevels = [0, 1, 2, 3, 4, 5] as const;
export type ElevationLevel = (typeof elevationLevels)[number];

export interface ElevationToken {
  shadow: string;
  surface: "surface" | "surfaceContainerLow" | "surfaceContainer" | "surfaceContainerHigh" | "surfaceContainerHighest";
}

const key = "rgb(from var(--ex-color-shadow) r g b / 0.3)";
const ambient = "rgb(from var(--ex-color-shadow) r g b / 0.15)";

export const defaultElevation: Record<ElevationLevel, ElevationToken> = {
  0: { shadow: "none", surface: "surface" },
  1: { shadow: `0 1px 2px 0 ${key}, 0 1px 3px 1px ${ambient}`, surface: "surfaceContainerLow" },
  2: { shadow: `0 1px 2px 0 ${key}, 0 2px 6px 2px ${ambient}`, surface: "surfaceContainer" },
  3: { shadow: `0 1px 3px 0 ${key}, 0 4px 8px 3px ${ambient}`, surface: "surfaceContainerHigh" },
  4: { shadow: `0 2px 3px 0 ${key}, 0 6px 10px 4px ${ambient}`, surface: "surfaceContainerHigh" },
  5: { shadow: `0 4px 4px 0 ${key}, 0 8px 12px 6px ${ambient}`, surface: "surfaceContainerHighest" },
};
