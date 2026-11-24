import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { shapePaths, type MaterialShapeName } from '@/lib/expressive/tokens/material-shapes';
import { align, lerpPoints, samplePath, smoothPath, type Point } from '@/lib/expressive/shape-morph';
import { stepSpring, springSettled } from '@/lib/expressive/spring';
import { useReducedMotion } from '@/lib/expressive/use-reduced-motion';
import './loading.css';

// Adapted from Expressive's registry loading.tsx and shape.tsx (eb96d3d).
// Use its Material shapes and spring helpers, without an extra animation dependency.
const sequence: readonly MaterialShapeName[] = ['soft-burst', 'pill', 'pentagon', 'cookie-9', 'sunny', 'cookie-4', 'oval'];
const firstMorphMs = 140;
const morphIntervalMs = 650;
const spring = { dampingRatio: 0.6, stiffness: 200 };
const samples = new Map<MaterialShapeName, Point[] | null>();
function points(name: MaterialShapeName) {
  if (!samples.has(name)) samples.set(name, samplePath(shapePaths[name]));
  return samples.get(name) ?? null;
}

function MorphShape() {
  const [index, setIndex] = useState(0);
  const path = useRef<SVGPathElement>(null);
  const shown = useRef<{ name: MaterialShapeName; outline: Point[] | null }>({ name: sequence[0]!, outline: null });
  const reduced = useReducedMotion();
  const name = reduced ? sequence[0]! : sequence[index]!;
  useEffect(() => {
    if (reduced) return;
    function advance() {
      setIndex(i => (i + 1) % sequence.length);
      timer = window.setTimeout(advance, morphIntervalMs);
    }
    let timer = window.setTimeout(advance, firstMorphMs);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  useLayoutEffect(() => {
    const node = path.current;
    if (!node) return;
    if (reduced) {
      shown.current = { name, outline: null };
      node.setAttribute('d', shapePaths[name]);
      return;
    }
    if (shown.current.name === name && !shown.current.outline) return;
    const from = shown.current.outline ?? points(shown.current.name);
    const target = points(name);
    if (!from || !target) {
      shown.current = { name, outline: null };
      node.setAttribute('d', shapePaths[name]);
      return;
    }
    const to = align(from, target);
    const state = { value: 0, velocity: 0 };
    let last = performance.now();
    let frame = 0;
    node.setAttribute('d', smoothPath(from));
    const tick = (now: number) => {
      stepSpring(state, 1, spring, Math.min((now - last) / 1000, 0.064));
      last = now;
      if (springSettled(state, 1, 1)) {
        shown.current = { name, outline: null };
        node.setAttribute('d', shapePaths[name]);
        return;
      }
      const outline = lerpPoints(from, to, state.value);
      shown.current = { name, outline };
      node.setAttribute('d', smoothPath(outline));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [name, reduced]);
  return <svg className="ex-loading-morph" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path ref={path} d={shapePaths[sequence[0]!]}/></svg>;
}

/** Indeterminate: a meaningful label, no fabricated percentage. */
export function Loading({ label, size = 32, variant = 'circular' }: { label: string; size?: number; variant?: 'morph' | 'circular' }) {
  return <div className="ex-loading" role="status" data-slot="loading">
    <span className={`ex-loading-indicator ex-loading-indicator--${variant}`} style={{ width: size, height: size }} aria-hidden="true">
      {variant === 'morph' ? <MorphShape/> : <svg className="ex-loading-ring" viewBox="0 0 48 48" fill="none"><circle className="ex-loading-track" cx="24" cy="24" r="19" strokeWidth="4"/><circle className="ex-loading-arc" cx="24" cy="24" r="19" strokeWidth="4" strokeLinecap="round" pathLength="200" strokeDasharray="65 200"/></svg>}
    </span>
    <span>{label}</span>
  </div>;
}
