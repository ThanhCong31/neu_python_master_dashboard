import * as React from "react";
import { type MotionScheme, defaultMotion, getSpring } from "@/lib/expressive/tokens/motion";
import type { FluidDriver, FluidSpring } from "@/lib/expressive/adapters/types";
import { type Spring, springSettled, stepSpring } from "@/lib/expressive/spring";
import {
  type FluidPose,
  clampStretch,
  leanFor,
  poseTransform,
  readFluidTokens,
  restPose,
  restShape,
  shapeSpring,
  targetStretch,
} from "@/lib/expressive/fluid";
import { MotionAdapterContext, type MotionProp } from "@/lib/expressive/use-motion";
import { useReducedMotion } from "@/lib/expressive/use-reduced-motion";

/*
 * Fluid motion hooks. Each one is inert unless the element's motion scheme
 * (its `motion` prop, else `--ex-motion-scheme` from the theme / data-motion)
 * is "fluid" AND the engine provides a fluid driver (Motion or GSAP).
 * While active, the element gets `data-fluid`, so its classes can hand
 * transform animation over to script with the `fluid:` variant.
 */

let warned = false;

/** The motion scheme that applies to `element`. */
export function resolveScheme(element: Element | null, motion?: MotionProp): MotionScheme | "none" {
  if (motion) return motion;
  if (!element || typeof getComputedStyle === "undefined") return defaultMotion.scheme;
  const value = getComputedStyle(element).getPropertyValue("--ex-motion-scheme").trim();
  return (value as MotionScheme | "none") || defaultMotion.scheme;
}

function useFluidDriver(motion?: MotionProp) {
  const engine = React.useContext(MotionAdapterContext);
  const reducedMotion = useReducedMotion();
  return React.useCallback(
    (element: Element | null): FluidDriver | undefined => {
      if (!element || reducedMotion || resolveScheme(element, motion) !== "fluid") {
        element?.removeAttribute("data-fluid");
        return undefined;
      }
      if (!engine.fluid) {
        if (!warned && typeof console !== "undefined") {
          warned = true;
          console.warn(
            `[expressive] The "fluid" motion scheme needs the Motion or GSAP engine (current: ${engine.name}). Falling back to "expressive".`,
          );
        }
        element.removeAttribute("data-fluid");
        return undefined;
      }
      element.setAttribute("data-fluid", "");
      return engine.fluid;
    },
    [engine, reducedMotion, motion],
  );
}

type Channel = keyof FluidPose;

/**
 * One element's pose, driven by a spring per channel through the engine.
 * Retargeting keeps the current value and velocity, so interrupted motion
 * carries its momentum. The shape (stretch) follows the speed through its own
 * wobbly spring, stepped here every frame until it settles.
 */
class FluidBody {
  pose = restPose();
  private velocity: Record<Channel, number> = { x: 0, y: 0, sx: 0, sy: 0, squash: 0 };
  private springs: Partial<Record<Channel, FluidSpring>> = {};
  private shape = restShape();
  private stretch = { value: 1, velocity: 0 };
  private frame = 0;
  private last = 0;
  private element: HTMLElement;
  private driver: FluidDriver;

  constructor(element: HTMLElement, driver: FluidDriver) {
    this.element = element;
    this.driver = driver;
  }

  setDriver(driver: FluidDriver) {
    this.driver = driver;
  }

  to(channel: Channel, target: number, spring: Spring, { from, velocity }: { from?: number; velocity?: number } = {}) {
    this.springs[channel]?.stop();
    if (from !== undefined) this.pose[channel] = from;
    this.springs[channel] = this.driver.spring({
      from: this.pose[channel],
      to: target,
      velocity: velocity ?? this.velocity[channel],
      spring,
      onUpdate: (value, v) => {
        this.pose[channel] = value;
        this.velocity[channel] = v;
        this.wake();
      },
      onComplete: () => {
        this.velocity[channel] = 0;
        delete this.springs[channel];
        this.wake();
      },
    });
    this.wake();
  }

  stop() {
    for (const spring of Object.values(this.springs)) spring?.stop();
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.springs = {};
    this.pose = restPose();
    this.shape = restShape();
    this.stretch = { value: 1, velocity: 0 };
    this.velocity = { x: 0, y: 0, sx: 0, sy: 0, squash: 0 };
    this.element.style.transform = "";
  }

  private wake() {
    if (this.frame) return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const dt = Math.min(Math.max((now - this.last) / 1000, 0), 0.064);
    this.last = now;
    const tokens = readFluidTokens(this.element, defaultMotion.fluid);
    const size = Math.max(this.element.offsetWidth, this.element.offsetHeight, 1);
    const { x: vx, y: vy } = this.velocity;

    // The shape chases the speed through a jelly spring: stretched while moving,
    // splatted (stretch < 1) for a moment after stopping, then round again.
    if (Math.hypot(vx, vy) > size * 0.05) this.shape.angle = Math.atan2(vy, vx);
    stepSpring(this.stretch, targetStretch(vx, vy, size, tokens), shapeSpring(tokens), dt);
    this.shape.stretch = clampStretch(this.stretch.value, tokens);
    this.shape.lean = leanFor(vx, size, tokens);

    this.element.style.transform = poseTransform(this.pose, this.shape);

    const moving = Object.keys(this.springs).length > 0;
    const settled = !moving && springSettled(this.stretch, 1, tokens.maxStretch);
    if (settled) {
      this.stretch = { value: 1, velocity: 0 };
      this.shape = restShape();
      this.element.style.transform = poseTransform(this.pose, this.shape);
      this.frame = 0;
    } else {
      this.frame = requestAnimationFrame(this.tick);
    }
  };
}

function useBody(ref: React.RefObject<HTMLElement | null>) {
  const body = React.useRef<FluidBody | null>(null);
  React.useEffect(() => () => body.current?.stop(), []);
  return React.useCallback(
    (driver: FluidDriver) => {
      const element = ref.current!;
      if (!body.current) body.current = new FluidBody(element, driver);
      else body.current.setDriver(driver);
      return body.current;
    },
    [ref],
  );
}

/** Run `callback` whenever one of `attributes` changes on the element (before paint). */
function useAttributeChange(ref: React.RefObject<HTMLElement | null>, attributes: string[], callback: () => void) {
  const latest = React.useRef(callback);
  latest.current = callback;
  const key = attributes.join(" ");
  React.useEffect(() => {
    const element = ref.current;
    if (!element || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => latest.current());
    observer.observe(element, { attributes: true, attributeFilter: key.split(" ") });
    return () => observer.disconnect();
  }, [ref, key]);
}

const jelly = (wobble: number): Spring => ({ dampingRatio: wobble, stiffness: 420 });

/**
 * Press jelly + touch response: squashes on press, wobbles back on release,
 * and gives a small squash impulse when the pointer crosses the element.
 */
export function useFluidPress(ref: React.RefObject<HTMLElement | null>, motion?: MotionProp, enabled = true) {
  const driverFor = useFluidDriver(motion);
  const bodyFor = useBody(ref);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    let pressed = false;
    let entered = false;

    const start = () => {
      const driver = driverFor(element);
      return driver ? bodyFor(driver) : undefined;
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const body = start();
      if (!body) return;
      pressed = true;
      body.to("squash", readFluidTokens(element, defaultMotion.fluid).squash, getSpring("fluid", "spatial", "fast"));
    };
    const release = () => {
      if (!pressed) return;
      pressed = false;
      const body = start();
      body?.to("squash", 0, jelly(readFluidTokens(element, defaultMotion.fluid).wobble));
    };
    const move = (event: PointerEvent) => {
      if (entered || pressed || event.pointerType !== "mouse") return;
      entered = true;
      const body = start();
      if (!body) return;
      // Pointer speed (px/frame → px/s) relative to size becomes a squash impulse.
      const speed = Math.hypot(event.movementX, event.movementY) * 60;
      const size = Math.max(element.offsetWidth, element.offsetHeight, 1);
      const impulse = Math.min(1.6, (speed / size) * 0.08);
      body.to("squash", 0, jelly(readFluidTokens(element, defaultMotion.fluid).wobble), { velocity: impulse });
    };
    const leave = () => {
      entered = false;
      release();
    };

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [ref, enabled, driverFor, bodyFor]);
}

/**
 * Pop: when one of `attributes` turns on (e.g. `data-checked`), the element
 * grows from `from` with a jelly wobble; turning off gives a softer ripple.
 */
export function useFluidPop(
  ref: React.RefObject<HTMLElement | null>,
  { attributes, target, from = 0.7, motion }: { attributes: string[]; target?: React.RefObject<HTMLElement | null>; from?: number; motion?: MotionProp },
) {
  const animated = target ?? ref;
  const driverFor = useFluidDriver(motion);
  const bodyFor = useBody(animated);
  const was = React.useRef<boolean | null>(null);

  useAttributeChange(ref, attributes, () => {
    const element = ref.current;
    const subject = animated.current;
    if (!element || !subject) return;
    const on = attributes.some((name) => element.hasAttribute(name));
    if (was.current === on) return;
    was.current = on;
    const driver = driverFor(subject);
    if (!driver) return;
    const body = bodyFor(driver);
    const { wobble } = readFluidTokens(subject, defaultMotion.fluid);
    if (on) {
      body.to("sx", 1, getSpring("fluid", "spatial", "fast"), { from });
      body.to("sy", 1, getSpring("fluid", "spatial", "fast"), { from });
      body.to("squash", 0, jelly(wobble), { velocity: 1.4 });
    } else {
      body.to("squash", 0, jelly(wobble), { velocity: -0.8 });
    }
  });

  React.useEffect(() => {
    const element = ref.current;
    if (element) was.current = attributes.some((name) => element.hasAttribute(name));
    // Mark the subject so `fluid:` classes apply from the start.
    if (animated.current) driverFor(animated.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Layout: when one of `attributes` changes, the element jumps to its new
 * layout and then springs there from where it was (FLIP). On the way it
 * stretches with speed, leans into the motion, and wobbles as it settles.
 */
export function useFluidLayout(
  ref: React.RefObject<HTMLElement | null>,
  { attributes, motion }: { attributes: string[]; motion?: MotionProp },
) {
  const driverFor = useFluidDriver(motion);
  const bodyFor = useBody(ref);
  const layout = React.useRef<{ cx: number; cy: number; w: number; h: number } | null>(null);

  const measure = (element: HTMLElement) => ({
    cx: element.offsetLeft + element.offsetWidth / 2,
    cy: element.offsetTop + element.offsetHeight / 2,
    w: element.offsetWidth,
    h: element.offsetHeight,
  });

  useAttributeChange(ref, attributes, () => {
    const element = ref.current;
    if (!element) return;
    const previous = layout.current;
    const driver = driverFor(element); // also sets data-fluid, disabling CSS layout transitions
    const next = measure(element);
    layout.current = next;
    if (!driver || !previous) return;
    const body = bodyFor(driver);
    const { pose } = body;
    const spring = getSpring("fluid", "spatial", "default");
    body.to("x", 0, spring, { from: previous.cx + pose.x - next.cx });
    body.to("y", 0, spring, { from: previous.cy + pose.y - next.cy });
    if (next.w > 0 && next.h > 0) {
      body.to("sx", 1, spring, { from: (previous.w * pose.sx) / next.w });
      body.to("sy", 1, spring, { from: (previous.h * pose.sy) / next.h });
    }
  });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    layout.current = measure(element);
    driverFor(element);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Entrance for elements that mount when opened (dialog popups): returns a
 * callback ref; each time an element attaches, it swells in from `from` with a
 * jelly settle.
 */
export function useFluidEnter({ from = 0.6, motion }: { from?: number; motion?: MotionProp } = {}) {
  const driverFor = useFluidDriver(motion);
  const body = React.useRef<FluidBody | null>(null);
  return React.useCallback(
    (element: HTMLElement | null) => {
      body.current?.stop();
      body.current = null;
      if (!element) return;
      const driver = driverFor(element);
      if (!driver) return;
      const entering = new FluidBody(element, driver);
      body.current = entering;
      const spring = getSpring("fluid", "spatial", "default");
      entering.to("sx", 1, spring, { from });
      entering.to("sy", 1, spring, { from: from * 0.85 });
      entering.to("y", 0, spring, { from: 24 });
      entering.to("squash", 0, jelly(readFluidTokens(element, defaultMotion.fluid).wobble), { velocity: -1.2 });
    },
    [driverFor, from],
  );
}

/** Combine refs (ours + the caller's). */
export function useComposedRef<T>(...refs: Array<React.Ref<T> | undefined>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback((node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  }, refs);
}
