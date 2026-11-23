import { Button as BaseButton } from "@base-ui/react/button";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/expressive/utils";
import type { MotionProp } from "@/lib/expressive/use-motion";
import * as React from "react";
import { useComposedRef, useFluidPress } from "@/lib/expressive/use-fluid";
import { Ripple } from "@/components/expressive/ripple";

export const iconButtonVariants = cva(
  [
    "state-layer focus-ring relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center",
    "transition-[border-radius,background-color,color] spring-spatial-fast",
    "disabled:cursor-default disabled:text-on-surface/(--ex-disabled-content)",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        standard: "text-on-surface-variant data-pressed:text-primary",
        filled:
          "bg-primary text-on-primary disabled:bg-on-surface/(--ex-disabled-container)",
        tonal:
          "bg-secondary-container text-on-secondary-container disabled:bg-on-surface/(--ex-disabled-container)",
        outlined:
          "border border-outline-variant text-on-surface-variant disabled:border-on-surface/(--ex-disabled-container) data-pressed:border-transparent data-pressed:bg-inverse-surface data-pressed:text-inverse-on-surface",
      },
      size: {
        xs: "h-(--ex-control-height) [--ex-control-height:2rem] [&_svg]:size-5",
        sm: "h-(--ex-control-height) [--ex-control-height:2.5rem] [&_svg]:size-6",
        md: "h-(--ex-control-height) [--ex-control-height:3.5rem] [&_svg]:size-6",
        lg: "h-(--ex-control-height) [--ex-control-height:6rem] [&_svg]:size-8",
        xl: "h-(--ex-control-height) [--ex-control-height:8.5rem] [&_svg]:size-10",
      },
      width: {
        narrow: "",
        default: "",
        wide: "",
      },
      shape: {
        round: "rounded-pill",
        square: "",
      },
      toggle: { true: "", false: "" },
    },
    compoundVariants: [
      { size: "xs", width: "narrow", className: "w-7" },
      { size: "xs", width: "default", className: "w-8" },
      { size: "xs", width: "wide", className: "w-10" },
      { size: "sm", width: "narrow", className: "w-8" },
      { size: "sm", width: "default", className: "w-10" },
      { size: "sm", width: "wide", className: "w-13" },
      { size: "md", width: "narrow", className: "w-12" },
      { size: "md", width: "default", className: "w-14" },
      { size: "md", width: "wide", className: "w-18" },
      { size: "lg", width: "narrow", className: "w-16" },
      { size: "lg", width: "default", className: "w-24" },
      { size: "lg", width: "wide", className: "w-32" },
      { size: "xl", width: "narrow", className: "w-26" },
      { size: "xl", width: "default", className: "w-34" },
      { size: "xl", width: "wide", className: "w-46" },
      { shape: "square", size: ["xs", "sm"], className: "rounded-shape-medium" },
      { shape: "square", size: "md", className: "rounded-shape-large" },
      { shape: "square", size: ["lg", "xl"], className: "rounded-shape-extra-large" },
      { size: ["xs", "sm"], className: "active:rounded-shape-small" },
      { size: "md", className: "active:rounded-shape-medium" },
      { size: ["lg", "xl"], className: "active:rounded-shape-large" },
      { toggle: true, shape: "round", size: ["xs", "sm"], className: "data-pressed:rounded-shape-medium" },
      { toggle: true, shape: "round", size: "md", className: "data-pressed:rounded-shape-large" },
      { toggle: true, shape: "round", size: ["lg", "xl"], className: "data-pressed:rounded-shape-extra-large" },
      { toggle: true, shape: "square", className: "data-pressed:rounded-pill" },
      { toggle: true, variant: "filled", className: "bg-surface-container text-on-surface-variant data-pressed:bg-primary data-pressed:text-on-primary" },
      { toggle: true, variant: "tonal", className: "data-pressed:bg-secondary data-pressed:text-on-secondary" },
    ],
    defaultVariants: { variant: "standard", size: "sm", width: "default", shape: "round", toggle: false },
  },
);

/** Icon-only buttons have no visible text, so an accessible name is required. */
type AccessibleName = { "aria-label": string } | { "aria-labelledby": string };

type OwnProps = Omit<VariantProps<typeof iconButtonVariants>, "toggle"> & {
  motion?: MotionProp;
  className?: string;
  ref?: React.Ref<HTMLElement>;
};

export type IconButtonProps = OwnProps & Omit<BaseButton.Props, "className"> & AccessibleName;
export type ToggleIconButtonProps = OwnProps & Omit<BaseToggle.Props, "className"> & AccessibleName;

export function IconButton({ className, variant, size, width, shape, motion, children, disabled, ref, ...props }: IconButtonProps) {
  const local = React.useRef<HTMLElement>(null);
  useFluidPress(local, motion, !disabled);
  return (
    <BaseButton
      ref={useComposedRef(local, ref)}
      data-slot="icon-button"
      data-variant={variant ?? "standard"}
      data-motion={motion}
      disabled={disabled}
      className={cn(iconButtonVariants({ variant, size, width, shape }), className)}
      {...props}
    >
      {children}
      <Ripple motion={motion} disabled={disabled} />
    </BaseButton>
  );
}

export function ToggleIconButton({ className, variant, size, width, shape, motion, children, disabled, ref, ...props }: ToggleIconButtonProps) {
  const local = React.useRef<HTMLElement>(null);
  useFluidPress(local, motion, !disabled);
  return (
    <BaseToggle
      ref={useComposedRef(local, ref)}
      data-slot="icon-button"
      data-variant={variant ?? "standard"}
      data-motion={motion}
      disabled={disabled}
      className={cn(iconButtonVariants({ variant, size, width, shape, toggle: true }), className)}
      {...props}
    >
      {children}
      <Ripple motion={motion} disabled={disabled} />
    </BaseToggle>
  );
}
