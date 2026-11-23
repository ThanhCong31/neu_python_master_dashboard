import * as React from "react";
import { cn } from "@/lib/expressive/utils";

/*
 * Top app bar. `small` and `center` are 64px; `medium` and `large` are the
 * M3 Expressive flexible bars with a bigger title (and optional subtitle)
 * below the actions row. The container tints to surface-container once the
 * page scrolls.
 */

export interface TopAppBarProps extends Omit<React.ComponentProps<"header">, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  variant?: "small" | "center" | "medium" | "large";
  /** Leading slot, usually a menu or back IconButton. */
  navigation?: React.ReactNode;
  /** Trailing slot for up to three IconButtons. */
  actions?: React.ReactNode;
  /** Force the scrolled look. By default it follows `scrollTarget` (or the window). */
  scrolled?: boolean;
  scrollTarget?: React.RefObject<HTMLElement | null>;
}

function useScrolled(target: TopAppBarProps["scrollTarget"], enabled: boolean) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) return;
    const element = target?.current;
    const read = () => setScrolled((element ? element.scrollTop : window.scrollY) > 0);
    read();
    const source: HTMLElement | Window = element ?? window;
    source.addEventListener("scroll", read, { passive: true });
    return () => source.removeEventListener("scroll", read);
  }, [target, enabled]);
  return scrolled;
}

export function TopAppBar({
  className,
  title,
  subtitle,
  variant = "small",
  navigation,
  actions,
  scrolled: scrolledProp,
  scrollTarget,
  ...props
}: TopAppBarProps) {
  const autoScrolled = useScrolled(scrollTarget, scrolledProp === undefined);
  const scrolled = scrolledProp ?? autoScrolled;
  const flexible = variant === "medium" || variant === "large";

  const heading = (
    <div className={cn("flex min-w-0 flex-col", variant === "center" && "items-center text-center")}>
      <div
        className={cn(
          "truncate text-on-surface",
          variant === "medium" ? "text-headline-medium" : variant === "large" ? "text-display-small" : "text-title-large",
        )}
      >
        {title}
      </div>
      {subtitle && (
        <p className={cn("truncate text-on-surface-variant", flexible ? "text-title-medium" : "text-label-medium")}>{subtitle}</p>
      )}
    </div>
  );

  return (
    <header
      data-slot="top-app-bar"
      data-scrolled={scrolled ? "" : undefined}
      className={cn(
        "flex w-full flex-col bg-surface px-1 transition-colors spring-effects-default data-scrolled:bg-surface-container",
        className,
      )}
      {...props}
    >
      <div className="flex h-16 items-center gap-1">
        <div className="flex w-12 shrink-0 justify-center empty:w-3">{navigation}</div>
        <div className={cn("min-w-0 flex-1", variant === "center" && "flex justify-center")}>{!flexible && heading}</div>
        <div className="flex shrink-0 items-center gap-0 pr-1 empty:w-12">{actions}</div>
      </div>
      {flexible && (
        <div className={cn("flex items-end px-3", variant === "medium" ? "min-h-12 pb-3" : "min-h-14 pb-5")}>{heading}</div>
      )}
    </header>
  );
}
