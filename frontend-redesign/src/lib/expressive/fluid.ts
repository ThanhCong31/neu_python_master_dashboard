/**
 * Fluid deformation math (pure, engine-agnostic).
 *
 * A moving element stretches along its direction of travel and thins across
 * it, keeping its area, so it reads like a droplet rather than a rigid box.
 * The stretch follows speed through its own underdamped spring, so when the
 * element stops, the shape overshoots into a splat and jiggles back. Speed is
 * normalised by the element's size, so a 24px handle and a 400px dialog
 * deform alike.
 */

import type { FluidTokens } from "@/lib/expressive/tokens/motion";
import type { Spring } from "@/lib/expressive/spring";

export interface FluidPose {
  /** Translation in px. */
  x: number;
  y: number;
  /** Layout scale (FLIP size changes, or growth when popping in). */
  sx: number;
  sy: number;
  /** Squash: > 0 is wider and shorter, < 0 taller and narrower (area-preserving). */
  squash: number;
}

export interface FluidShape {
  /** Length along `angle` divided by the resting length (1 = round, > 1 stretched, < 1 splatted). */
  stretch: number;
  /** Direction of travel, radians. */
  angle: number;
  /** Lean into horizontal motion, degrees. */
  lean: number;
}

export const restPose = (): FluidPose => ({ x: 0, y: 0, sx: 1, sy: 1, squash: 0 });
export const restShape = (): FluidShape => ({ stretch: 1, angle: 0, lean: 0 });

/** The spring the shape uses to follow speed: soft, and as wobbly as the tokens say. */
export const shapeSpring = (tokens: FluidTokens): Spring => ({ dampingRatio: tokens.wobble, stiffness: 380 });

/** How stretched the shape wants to be at this velocity (px/s), before the jelly spring. */
export function targetStretch(vx: number, vy: number, size: number, tokens: FluidTokens): number {
  const speed = Math.hypot(vx, vy) / Math.max(size, 1);
  return 1 + Math.min(tokens.maxStretch, speed * tokens.viscosity);
}

export function leanFor(vx: number, size: number, tokens: FluidTokens): number {
  return Math.max(-4, Math.min(4, (vx / Math.max(size, 1)) * tokens.viscosity * 12));
}

/** Keep a wobbling stretch inside the same bounds in both directions. */
export function clampStretch(stretch: number, tokens: FluidTokens): number {
  const max = 1 + tokens.maxStretch;
  return Math.min(max, Math.max(1 / max, stretch));
}

const r = (n: number) => Math.round(n * 1000) / 1000;

/** CSS transform for a pose and shape. Returns "" at rest so the element's own styles apply. */
export function poseTransform(pose: FluidPose, shape: FluidShape): string {
  const parts: string[] = [];
  if (Math.abs(pose.x) > 0.01 || Math.abs(pose.y) > 0.01) parts.push(`translate(${r(pose.x)}px, ${r(pose.y)}px)`);
  if (Math.abs(shape.lean) > 0.01) parts.push(`rotate(${r(shape.lean)}deg)`);
  if (Math.abs(shape.stretch - 1) > 0.001) {
    const deg = (shape.angle * 180) / Math.PI;
    parts.push(`rotate(${r(deg)}deg) scale(${r(shape.stretch)}, ${r(1 / shape.stretch)}) rotate(${r(-deg)}deg)`);
  }
  const squashX = 1 + pose.squash;
  const sx = pose.sx * squashX;
  const sy = pose.sy / squashX;
  if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) parts.push(`scale(${r(sx)}, ${r(sy)})`);
  return parts.join(" ");
}

/** Fluid tokens from the element's CSS variables (so themes can tune them). */
export function readFluidTokens(element: Element, fallback: FluidTokens): FluidTokens {
  const style = getComputedStyle(element);
  const read = (name: string, value: number) => {
    const parsed = Number.parseFloat(style.getPropertyValue(name));
    return Number.isFinite(parsed) ? parsed : value;
  };
  return {
    viscosity: read("--ex-fluid-viscosity", fallback.viscosity),
    maxStretch: read("--ex-fluid-max-stretch", fallback.maxStretch),
    squash: read("--ex-fluid-squash", fallback.squash),
    wobble: read("--ex-fluid-wobble", fallback.wobble),
  };
}
