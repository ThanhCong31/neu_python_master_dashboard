import * as React from "react";
import { type MotionScheme, type SpringSpeed, type SpringType, adapter, defaultMotion, getSpring } from "@/lib/expressive/tokens/motion";
import type { Keyframes, MotionAdapter, MotionControls } from "@/lib/expressive/adapters/types";
import { useReducedMotion } from "@/lib/expressive/use-reduced-motion";

export type MotionProp = MotionScheme | "none";

export interface MotionAnimateOptions {
  type?: SpringType;
  speed?: SpringSpeed;
  delay?: number;
}

/**
 * Override the engine from `tokens/motion.ts` for part of the tree,
 * e.g. `<MotionAdapterContext value={gsapAdapter}>` in tests or demos.
 */
export const MotionAdapterContext = React.createContext<MotionAdapter>(adapter);

const noop: MotionControls = { finished: Promise.resolve(), cancel() {} };

/** The scheme that applies to `element`: the prop, else `--ex-motion-scheme` from the theme. */
function schemeOf(element: Element, motion?: MotionProp): MotionScheme | "none" {
  if (motion) return motion;
  if (typeof getComputedStyle === "undefined") return defaultMotion.scheme;
  const value = getComputedStyle(element).getPropertyValue("--ex-motion-scheme").trim();
  return (value as MotionScheme | "none") || defaultMotion.scheme;
}

/**
 * Imperative animations through the active motion adapter (CSS, Motion, GSAP
 * or your own). Without a `motion` argument the element's own scheme applies.
 * Respects `prefers-reduced-motion` and `motion="none"` by jumping straight to
 * the final keyframe. `fluid` falls back to `expressive` on engines without a
 * fluid driver.
 */
export function useMotion(motion?: MotionProp) {
  const engine = React.useContext(MotionAdapterContext);
  const reducedMotion = useReducedMotion();

  const animate = React.useCallback(
    (element: Element | null, keyframes: Keyframes, { type = "spatial", speed = "default", delay }: MotionAnimateOptions = {}) => {
      if (!element) return noop;
      let scheme = schemeOf(element, motion);
      if (reducedMotion || scheme === "none") {
        const style = (element as HTMLElement).style;
        for (const [property, values] of Object.entries(keyframes)) {
          style.setProperty(property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), String(values[values.length - 1]));
        }
        return noop;
      }
      if (scheme === "fluid" && !engine.fluid) scheme = "expressive";
      return engine.animate(element, keyframes, { spring: getSpring(scheme, type, speed), delay });
    },
    [reducedMotion, engine, motion],
  );

  /** Whether `element` currently animates with the fluid scheme. */
  const isFluid = React.useCallback(
    (element: Element | null) => Boolean(element && engine.fluid && !reducedMotion && schemeOf(element, motion) === "fluid"),
    [engine, reducedMotion, motion],
  );

  return { animate, isFluid, reducedMotion: reducedMotion || motion === "none", engine: engine.name };
}
