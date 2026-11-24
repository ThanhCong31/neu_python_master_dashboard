import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const typeRoles = ["display", "headline", "title", "body", "label"].flatMap((role) =>
  ["large", "medium", "small"].flatMap((size) => [`${role}-${size}`, `${role}-${size}-emphasized`]),
);

/** tailwind-merge that knows `text-title-large` is a font size, not a color. */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: typeRoles }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
