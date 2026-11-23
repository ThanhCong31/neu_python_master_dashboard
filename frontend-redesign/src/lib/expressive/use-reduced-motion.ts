import * as React from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const getSnapshot = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);

/** `true` when the user asked the OS for reduced motion. */
export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
