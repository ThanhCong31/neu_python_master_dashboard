import * as React from "react";
import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cn } from "@/lib/expressive/utils";
import { type MaterialShapeName, shapeMask } from "@/lib/expressive/tokens/material-shapes";

/*
 * Avatar: a person's or entity's picture, falling back to initials (or an
 * icon) while the image loads or if it fails. Base UI handles the loading
 * state. Besides a circle, the avatar can take any of the 35 Material shapes,
 * one of M3 Expressive's signature details.
 */

const sizes = {
  xs: "size-6 text-label-small [&_svg]:size-4",
  sm: "size-8 text-label-medium [&_svg]:size-5",
  md: "size-10 text-title-medium [&_svg]:size-6",
  lg: "size-14 text-title-large [&_svg]:size-8",
  xl: "size-24 text-headline-large [&_svg]:size-12",
};

const colors = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
  surface: "bg-surface-container-highest text-on-surface-variant",
};

export interface AvatarProps extends Omit<BaseAvatar.Root.Props, "className"> {
  src?: string;
  /** Describes the person or entity; also the image's alt text. */
  alt: string;
  /** Shown until the image loads, or when there is none. Defaults to initials from `alt`. */
  fallback?: React.ReactNode;
  size?: keyof typeof sizes;
  /** `circle`, or one of the Material shapes (`"cookie-9"`, `"clover-4"`, `"flower"`…). */
  shape?: MaterialShapeName;
  /** Fallback colors. */
  color?: keyof typeof colors;
  className?: string;
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export function Avatar({ className, src, alt, fallback, size = "md", shape = "circle", color = "primary", style, ...props }: AvatarProps) {
  // Circles use border-radius; other shapes are an SVG mask.
  const mask = shape === "circle" ? undefined : shapeMask(shape);
  return (
    <BaseAvatar.Root
      data-slot="avatar"
      data-shape={shape}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden align-middle",
        shape === "circle" && "rounded-shape-full",
        sizes[size],
        colors[color],
        className,
      )}
      style={{ ...(mask ? { mask, WebkitMask: mask } : null), ...(style as React.CSSProperties) }}
      {...props}
    >
      {src && <BaseAvatar.Image src={src} alt={alt} className="size-full object-cover" />}
      <BaseAvatar.Fallback aria-label={src ? undefined : alt} role={src ? undefined : "img"} className="flex size-full items-center justify-center">
        {fallback ?? <span aria-hidden="true">{initials(alt)}</span>}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

export interface AvatarGroupProps extends React.ComponentProps<"div"> {
  /** Show at most this many; the rest become a "+N" avatar. */
  max?: number;
  size?: keyof typeof sizes;
}

/** Overlapping avatars, each ringed in the surface color so they separate. */
export function AvatarGroup({ className, max, size = "md", children, ...props }: AvatarGroupProps) {
  const items = React.Children.toArray(children);
  const shown = max !== undefined && items.length > max ? items.slice(0, max) : items;
  const rest = items.length - shown.length;
  return (
    <div
      role="group"
      data-slot="avatar-group"
      className={cn("flex items-center -space-x-2 [&>[data-slot=avatar]]:ring-2 [&>[data-slot=avatar]]:ring-surface", className)}
      {...props}
    >
      {shown}
      {rest > 0 && (
        <span
          data-slot="avatar"
          role="img"
          aria-label={`${rest} more`}
          className={cn("relative inline-flex shrink-0 items-center justify-center rounded-shape-full bg-surface-container-highest text-on-surface-variant", sizes[size])}
        >
          <span aria-hidden="true">+{rest}</span>
        </span>
      )}
    </div>
  );
}
