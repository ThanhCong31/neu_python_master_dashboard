/**
 * Interaction tokens.
 *
 * Shared by every component through the state layer, ripple and focus ring,
 * so hover/press/focus feel identical regardless of who wrote the component.
 */

export interface InteractionTokens {
  stateLayer: { hover: number; focus: number; pressed: number; dragged: number };
  disabled: { content: number; container: number };
  focusRing: { width: number; offset: number; color: string };
  ripple: { duration: number; opacity: number };
}

export const defaultInteraction: InteractionTokens = {
  stateLayer: { hover: 0.08, focus: 0.1, pressed: 0.1, dragged: 0.16 },
  disabled: { content: 0.38, container: 0.1 },
  focusRing: { width: 3, offset: 2, color: "var(--ex-color-secondary)" },
  ripple: { duration: 450, opacity: 0.12 },
};
