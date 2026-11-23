import * as React from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/expressive/utils";
import type { MotionProp } from "@/lib/expressive/use-motion";
import { useComposedRef, useFluidPress } from "@/lib/expressive/use-fluid";
import { Ripple } from "@/components/expressive/ripple";

/*
 * M3 Expressive button. Shape morphs on press (corners spring toward square)
 * and between round/square when used as a toggle.
 */
export const buttonVariants = cva(
  [
    "state-layer focus-ring relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap",
    "transition-[border-radius,background-color,color,box-shadow] spring-spatial-fast",
    "disabled:cursor-default disabled:bg-on-surface/(--ex-disabled-container) disabled:text-on-surface/(--ex-disabled-content) disabled:shadow-none",
    "data-disabled:cursor-default",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
        outlined: "border border-outline-variant text-on-surface-variant disabled:border-on-surface/(--ex-disabled-container) disabled:bg-transparent",
        text: "text-primary disabled:bg-transparent",
        elevated: "bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2",
      },
      size: {
        xs: "h-(--ex-control-height) [--ex-control-height:2rem] gap-1 px-3 text-label-large [&_svg]:size-5",
        sm: "h-(--ex-control-height) [--ex-control-height:2.5rem] gap-2 px-4 text-label-large [&_svg]:size-5",
        md: "h-(--ex-control-height) [--ex-control-height:3.5rem] gap-2 px-6 text-title-medium [&_svg]:size-6",
        lg: "h-(--ex-control-height) [--ex-control-height:6rem] gap-3 px-12 text-headline-small [&_svg]:size-8",
        xl: "h-(--ex-control-height) [--ex-control-height:8.5rem] gap-4 px-16 text-headline-large [&_svg]:size-10",
      },
      shape: {
        round: "rounded-pill",
        square: "",
      },
      toggle: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Resting square corners.
      { shape: "square", size: ["xs", "sm"], className: "rounded-shape-medium" },
      { shape: "square", size: "md", className: "rounded-shape-large" },
      { shape: "square", size: ["lg", "xl"], className: "rounded-shape-extra-large" },
      // Pressed corners (both shapes morph toward the same pressed radius).
      { size: ["xs", "sm"], className: "active:rounded-shape-small" },
      { size: "md", className: "active:rounded-shape-medium" },
      { size: ["lg", "xl"], className: "active:rounded-shape-large" },
      // Selected toggles swap round ↔ square.
      { toggle: true, shape: "round", size: ["xs", "sm"], className: "data-pressed:rounded-shape-medium" },
      { toggle: true, shape: "round", size: "md", className: "data-pressed:rounded-shape-large" },
      { toggle: true, shape: "round", size: ["lg", "xl"], className: "data-pressed:rounded-shape-extra-large" },
      { toggle: true, shape: "square", className: "data-pressed:rounded-pill" },
      // Toggle colors: unselected → selected.
      { toggle: true, variant: "filled", className: "bg-surface-container text-on-surface-variant data-pressed:bg-primary data-pressed:text-on-primary" },
      { toggle: true, variant: "tonal", className: "data-pressed:bg-secondary data-pressed:text-on-secondary" },
      { toggle: true, variant: "outlined", className: "data-pressed:border-transparent data-pressed:bg-inverse-surface data-pressed:text-inverse-on-surface" },
      { toggle: true, variant: "elevated", className: "data-pressed:bg-primary data-pressed:text-on-primary" },
    ],
    defaultVariants: { variant: "filled", size: "sm", shape: "round", toggle: false },
  },
);

type Variants = Omit<VariantProps<typeof buttonVariants>, "toggle">;

interface ButtonOwnProps extends Variants {
  /** Motion scheme for this button's transitions and ripple. */
  motion?: MotionProp;
  /** Leading icon. */
  icon?: React.ReactNode;
}

export interface ButtonProps extends ButtonOwnProps, Omit<BaseButton.Props, "className"> {
  className?: string;
}

export function Button({ className, variant, size, shape, motion, icon, children, disabled, ref, ...props }: ButtonProps) {
  const local = React.useRef<HTMLElement>(null);
  useFluidPress(local, motion, !disabled);
  return (
    <BaseButton
      ref={useComposedRef(local, ref)}
      data-slot="button"
      data-motion={motion}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, shape }), className)}
      {...props}
    >
      {icon}
      {children}
      <Ripple motion={motion} disabled={disabled} />
    </BaseButton>
  );
}

export interface ToggleButtonProps extends ButtonOwnProps, Omit<BaseToggle.Props, "className"> {
  className?: string;
}

/** A button with a selected state (`aria-pressed`). Use `pressed`/`onPressedChange` or `defaultPressed`. */
export function ToggleButton({ className, variant, size, shape, motion, icon, children, disabled, ref, ...props }: ToggleButtonProps) {
  const local = React.useRef<HTMLElement>(null);
  useFluidPress(local, motion, !disabled);
  return (
    <BaseToggle
      ref={useComposedRef(local, ref)}
      data-slot="button"
      data-motion={motion}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, shape, toggle: true }), className)}
      {...props}
    >
      {icon}
      {children}
      <Ripple motion={motion} disabled={disabled} />
    </BaseToggle>
  );
}
