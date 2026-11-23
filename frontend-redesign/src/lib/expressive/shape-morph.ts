/**
 * Morphing between Material shapes.
 *
 * Both outlines are sampled into the same number of points, the target is
 * rotated (re-indexed) so each point travels as little as possible, and the
 * in-between outline is a smooth closed curve through the interpolated points.
 * Pure functions, except `samplePath`, which measures a path in the browser.
 */

export type Point = [number, number];

export const SAMPLES = 120;

/**
 * Points evenly spaced along an SVG path, clockwise. Browser only: returns
 * null where SVG geometry isn't available (server, jsdom).
 */
export function samplePath(d: string, count = SAMPLES): Point[] | null {
  if (typeof document === "undefined") return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  try {
    if (typeof path.getTotalLength !== "function") return null;
    const length = path.getTotalLength();
    const points: Point[] = [];
    for (let i = 0; i < count; i++) {
      const p = path.getPointAtLength((length * i) / count);
      points.push([p.x, p.y]);
    }
    return signedArea(points) < 0 ? points.reverse() : points;
  } finally {
    svg.remove();
  }
}

/** Shoelace area; positive for clockwise outlines in y-down coordinates. */
export function signedArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x2, y2] = points[(i + 1) % points.length]!;
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/** Re-index `to` so that, point for point, it's as close to `from` as possible. */
export function align(from: Point[], to: Point[]): Point[] {
  const n = to.length;
  let best = 0;
  let bestCost = Infinity;
  for (let offset = 0; offset < n; offset++) {
    let cost = 0;
    for (let i = 0; i < n && cost < bestCost; i++) {
      const a = from[i]!;
      const b = to[(i + offset) % n]!;
      cost += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = offset;
    }
  }
  return to.map((_, i) => to[(i + best) % n]!);
}

/** Linear interpolation; `t` may overshoot past 1 with bouncy springs. */
export function lerpPoints(from: Point[], to: Point[], t: number): Point[] {
  return from.map(([x, y], i) => [x + (to[i]![0] - x) * t, y + (to[i]![1] - y) * t]);
}

const f = (n: number) => String(Math.round(n * 100) / 100);

/** Closed Catmull-Rom curve through the points, as cubic Béziers. */
export function smoothPath(points: Point[]): string {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n]!;
  let d = `M ${f(at(0)[0])} ${f(at(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
}
