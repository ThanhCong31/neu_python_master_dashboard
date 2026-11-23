import * as React from "react";
import { type MotionProp, useMotion } from "@/lib/expressive/use-motion";

interface RippleProps {
  motion?: MotionProp;
  disabled?: boolean;
}

/**
 * Pointer-origin ripple. Render it as the last child of a `relative`,
 * `overflow-hidden` element; it listens to its parent's pointer events.
 */
export function Ripple({ motion, disabled }: RippleProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const { animate, isFluid, reducedMotion } = useMotion(motion);

  React.useEffect(() => {
    const container = ref.current;
    const host = container?.parentElement;
    if (!container || !host || disabled || reducedMotion) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

      const wave = document.createElement("span");
      wave.setAttribute("aria-hidden", "true");
      Object.assign(wave.style, {
        position: "absolute",
        left: `${x - radius}px`,
        top: `${y - radius}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderRadius: "50%",
        background: "currentColor",
        opacity: "var(--ex-ripple-opacity)",
        transform: "scale(0)",
        pointerEvents: "none",
      });
      container.appendChild(wave);
      const keyframes: Record<string, string[]> = { transform: ["scale(0)", "scale(1)"] };
      if (isFluid(host)) {
        // Fluid: an irregular blob that relaxes into a circle as it spreads.
        const blob = () => `${30 + Math.round(Math.random() * 40)}%`;
        const start = `${blob()} ${blob()} ${blob()} ${blob()} / ${blob()} ${blob()} ${blob()} ${blob()}`;
        wave.style.borderRadius = start;
        keyframes.borderRadius = [start, "50% 50% 50% 50% / 50% 50% 50% 50%"];
      }
      const grow = animate(wave, keyframes, { type: "spatial", speed: "slow" });

      const release = () => {
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
        grow.finished
          .then(() => {
            // Numbers, not the computed-style string: Motion can't animate "0.12" → 0.
            const from = Number.parseFloat(getComputedStyle(wave).opacity) || 0;
            return animate(wave, { opacity: [from, 0] }, { type: "effects", speed: "slow" }).finished;
          })
          .finally(() => wave.remove());
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    };

    host.addEventListener("pointerdown", onPointerDown);
    return () => host.removeEventListener("pointerdown", onPointerDown);
  }, [animate, isFluid, disabled, reducedMotion]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
    />
  );
}
