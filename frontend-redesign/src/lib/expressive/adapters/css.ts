import { springDuration, springToLinear } from "@/lib/expressive/spring";
import type { MotionAdapter } from "./types";

/** Default engine: Web Animations API with spring-sampled `linear()` easing. */
export const adapter: MotionAdapter = {
  name: "css",
  animate(element, keyframes, { spring, delay = 0 }) {
    if (typeof element.animate !== "function") {
      return { finished: Promise.resolve(), cancel() {} };
    }
    const animation = element.animate(keyframes as PropertyIndexedKeyframes, {
      duration: springDuration(spring),
      easing: springToLinear(spring),
      delay,
      fill: "forwards",
    });
    return {
      finished: animation.finished.then(
        () => undefined,
        () => undefined,
      ),
      cancel: () => animation.cancel(),
    };
  },
};
