import type { Spring } from "@/lib/expressive/spring";

export type Keyframes = Record<string, Array<string | number>>;

export interface AnimateOptions {
  spring: Spring;
  delay?: number;
}

export interface MotionControls {
  finished: Promise<void>;
  cancel(): void;
}

export interface FluidSpringOptions {
  from: number;
  to: number;
  /** Starting velocity in units per second (carry it over when retargeting). */
  velocity?: number;
  spring: Spring;
  /** Called every frame with the current value and velocity (units/s). */
  onUpdate: (value: number, velocity: number) => void;
  onComplete?: () => void;
}

export interface FluidSpring {
  stop(): void;
}

/**
 * Velocity-aware springs for the `fluid` scheme. Engines that can report
 * velocity every frame (Motion, GSAP) provide this; CSS can't.
 */
export interface FluidDriver {
  spring(options: FluidSpringOptions): FluidSpring;
}

/**
 * Contract every motion engine implements. Write your own (`my-motion.ts`)
 * and export it as `adapter` from `tokens/motion.ts`.
 */
export interface MotionAdapter {
  name: string;
  animate(element: Element, keyframes: Keyframes, options: AnimateOptions): MotionControls;
  /** Present only on engines that support the `fluid` scheme. */
  fluid?: FluidDriver;
}
