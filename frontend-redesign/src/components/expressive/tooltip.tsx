import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/expressive/utils";
import type { MotionProp } from "@/lib/expressive/use-motion";

/*
 * Plain tooltips label an element briefly; rich tooltips add a title and
 * actions. Wrap the app (or a toolbar) in <TooltipProvider> so neighbouring
 * tooltips open instantly once one is showing.
 */

export const TooltipProvider = BaseTooltip.Provider;

interface TooltipBaseProps {
  /** The trigger. Must be a single element that accepts a ref, e.g. an IconButton. */
  children: React.ReactElement;
  side?: BaseTooltip.Positioner.Props["side"];
  align?: BaseTooltip.Positioner.Props["align"];
  motion?: MotionProp;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: BaseTooltip.Root.Props["onOpenChange"];
  /** Turn the tooltip off without unmounting it, e.g. a label that only shows while a sidebar is collapsed. */
  disabled?: boolean;
}

export interface TooltipProps extends TooltipBaseProps {
  content: React.ReactNode;
}

const popupMotion =
  "origin-(--transform-origin) transition-[transform,opacity] spring-effects-fast data-starting-style:scale-90 data-starting-style:opacity-0 data-ending-style:scale-90 data-ending-style:opacity-0";

export function Tooltip({ children, content, side = "top", align = "center", motion, className, ...root }: TooltipProps) {
  return (
    <BaseTooltip.Root {...root}>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} align={align} sideOffset={4} className="z-50">
          <BaseTooltip.Popup
            data-slot="tooltip"
            data-motion={motion}
            className={cn(
              "flex min-h-6 max-w-50 items-center rounded-shape-extra-small bg-inverse-surface px-2 py-1 text-body-small text-inverse-on-surface",
              popupMotion,
              className,
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export interface RichTooltipProps extends TooltipBaseProps {
  title?: React.ReactNode;
  content: React.ReactNode;
  /** Text buttons, e.g. `<Button variant="text" size="sm">Learn more</Button>`. */
  actions?: React.ReactNode;
}

export function RichTooltip({ children, title, content, actions, side = "bottom", align = "start", motion, className, ...root }: RichTooltipProps) {
  return (
    <BaseTooltip.Root {...root}>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} align={align} sideOffset={4} className="z-50">
          <BaseTooltip.Popup
            data-slot="rich-tooltip"
            data-motion={motion}
            className={cn(
              "flex max-w-80 flex-col gap-1 rounded-shape-medium bg-surface-container px-4 pt-3 pb-2 text-body-medium text-on-surface-variant shadow-elevation-2",
              popupMotion,
              !actions && "pb-3",
              className,
            )}
          >
            {title && <div className="text-title-small text-on-surface">{title}</div>}
            <div>{content}</div>
            {actions && <div className="-ml-3 flex gap-2 pt-1">{actions}</div>}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
