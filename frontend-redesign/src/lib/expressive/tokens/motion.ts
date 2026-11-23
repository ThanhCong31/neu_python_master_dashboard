/**
 * Motion tokens — the single source of truth for animation.
 *
 * Components never hardcode durations, easings or springs; they read the
 * semantic tokens below (via CSS variables emitted by `createTheme`) or call
 * the active `adapter` for imperative animations.
 *
 * Switch engines by changing the adapter import:
 *   - "@/lib/expressive/adapters/css"     Web Animations + CSS transitions (no dependency)
 *   - "@/lib/expressive/adapters/motion"  Motion (formerly Framer Motion)
 *   - "@/lib/expressive/adapters/gsap"    GSAP
 *   - "./my-motion"             your own adapter implementing `MotionAdapter`
 *
 * The `fluid` scheme needs the Motion or GSAP engine: it reads velocity every
 * frame to stretch and wobble shapes. With the CSS engine it falls back to
 * `expressive`.
 */
import type { Spring } from "@/lib/expressive/spring";

export { adapter } from "@/lib/expressive/adapters/css";

export type MotionScheme = "standard" | "expressive" | "fluid";
export type SpringType = "spatial" | "effects";
export type SpringSpeed = "fast" | "default" | "slow";

export type SpringTokens = Record<SpringType, Record<SpringSpeed, Spring>>;

/**
 * Material 3 Expressive motion schemes.
 * Spatial springs move things (position, size, shape) and may overshoot;
 * effects springs fade and recolor, and never overshoot.
 */
export const springs: Record<MotionScheme, SpringTokens> = {
  expressive: {
    spatial: {
      fast: { dampingRatio: 0.6, stiffness: 800 },
      default: { dampingRatio: 0.8, stiffness: 380 },
      slow: { dampingRatio: 0.8, stiffness: 200 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 3800 },
      default: { dampingRatio: 1, stiffness: 1600 },
      slow: { dampingRatio: 1, stiffness: 800 },
    },
  },
  /*
   * Fluid: soft, low-stiffness springs that glide into place with very little
   * overshoot. The liveliness lives in the shape instead (see FluidTokens):
   * it stretches with speed, splats when it stops, and jiggles back.
   */
  fluid: {
    spatial: {
      fast: { dampingRatio: 0.78, stiffness: 420 },
      default: { dampingRatio: 0.82, stiffness: 200 },
      slow: { dampingRatio: 0.86, stiffness: 110 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 1400 },
      default: { dampingRatio: 1, stiffness: 700 },
      slow: { dampingRatio: 1, stiffness: 360 },
    },
  },
  standard: {
    spatial: {
      fast: { dampingRatio: 0.9, stiffness: 1400 },
      default: { dampingRatio: 0.9, stiffness: 700 },
      slow: { dampingRatio: 0.9, stiffness: 300 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 3800 },
      default: { dampingRatio: 1, stiffness: 1600 },
      slow: { dampingRatio: 1, stiffness: 800 },
    },
  },
};

/** Duration + easing tokens for transitions that are not spring-based. */
export const durations = {
  short: 100,
  medium: 250,
  long: 450,
  "extra-long": 700,
} as const;

export const easings = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  "standard-decelerate": "cubic-bezier(0, 0, 0, 1)",
  "standard-accelerate": "cubic-bezier(0.3, 0, 1, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  "emphasized-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
  "emphasized-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)",
} as const;

/**
 * How fluid motion bends shapes. Speed is measured in element-sizes per
 * second, so small and large elements deform alike.
 */
export interface FluidTokens {
  /** Stretch per (size / second) of speed along the direction of travel. */
  viscosity: number;
  /** Upper bound on stretch; 0.3 = up to 30% longer and ~23% thinner. */
  maxStretch: number;
  /** How far a press squashes an element (0.06 = 6% wider, ~6% shorter). */
  squash: number;
  /** Damping ratio of the shape's jelly wobble: after moving, pressing or popping (lower = wobblier). */
  wobble: number;
}

export const fluid: FluidTokens = { viscosity: 0.05, maxStretch: 0.3, squash: 0.07, wobble: 0.3 };

export interface MotionTokens {
  /** Scheme used when a component has no `motion` prop. */
  scheme: MotionScheme;
  springs: Record<MotionScheme, SpringTokens>;
  durations: Record<string, number>;
  easings: Record<string, string>;
  fluid: FluidTokens;
}

export const defaultMotion: MotionTokens = { scheme: "expressive", springs, durations, easings, fluid };

/** Resolve a spring token, e.g. `getSpring("expressive", "spatial", "fast")`. */
export function getSpring(scheme: MotionScheme, type: SpringType, speed: SpringSpeed = "default"): Spring {
  return springs[scheme][type][speed];
}
