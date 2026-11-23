import * as React from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { Drawer } from "@base-ui/react/drawer";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn } from "@/lib/expressive/utils";
import { useFluidPop } from "@/lib/expressive/use-fluid";
import { IconButton } from "@/components/expressive/icon-button";
import { Tooltip } from "@/components/expressive/tooltip";

/*
 * Sidebar: the persistent side panel of an app layout, with a header,
 * scrolling navigation and a footer. On wide screens it collapses to an
 * 80px icon rail (labels become tooltips) or slides away entirely; below
 * 768px it's a modal drawer you can swipe closed. ⌘B / Ctrl+B toggles it, and
 * the expanded state is remembered.
 *
 *   <SidebarProvider>
 *     <Sidebar>
 *       <SidebarHeader>…</SidebarHeader>
 *       <SidebarContent>
 *         <SidebarGroup label="Mail">
 *           <SidebarMenu>
 *             <SidebarMenuItem>
 *               <SidebarMenuButton href="/inbox" icon={<InboxIcon />} active>Inbox</SidebarMenuButton>
 *             </SidebarMenuItem>
 *           </SidebarMenu>
 *         </SidebarGroup>
 *       </SidebarContent>
 *     </Sidebar>
 *     <SidebarInset>
 *       <SidebarTrigger /> …page…
 *     </SidebarInset>
 *   </SidebarProvider>
 *
 * The desktop/mobile switch is Tailwind's `md` breakpoint (768px).
 */

const MOBILE_QUERY = "(max-width: 767.98px)";

interface SidebarContextValue {
  /** Desktop: expanded (true) or collapsed. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Mobile: the drawer is open. */
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  /** Toggles whichever applies to the current screen width. */
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used inside <SidebarProvider>.");
  return context;
}

/** Inside a sidebar: whether it's showing as the icon rail. */
const RailContext = React.createContext(false);

/**
 * Folds content away (height and opacity) instead of removing it, so what's
 * below slides up smoothly rather than jumping. Folded content is inert.
 */
function Fold({ hidden, children }: { hidden: boolean; children: React.ReactNode }) {
  return (
    <div
      inert={hidden || undefined}
      className={cn("grid transition-[grid-template-rows,opacity] spring-effects-default", hidden ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]")}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export interface SidebarProviderProps extends React.ComponentProps<"div"> {
  /** Desktop state when nothing is stored yet. */
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where the expanded state is remembered (localStorage). `null` turns it off. */
  storageKey?: string | null;
  /** Key used with ⌘ / Ctrl to toggle. `false` turns the shortcut off. */
  keyboardShortcut?: string | false;
  /** Expanded width. */
  width?: string;
  /** Icon-rail width. */
  collapsedWidth?: string;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  storageKey = "expressive:sidebar",
  keyboardShortcut = "b",
  width = "18rem",
  collapsedWidth = "5rem",
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [inner, setInner] = React.useState(() => {
    if (openProp !== undefined || !storageKey || typeof window === "undefined") return defaultOpen;
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored === "true" ? true : stored === "false" ? false : defaultOpen;
    } catch { return defaultOpen; }
  });
  const [openMobile, setOpenMobile] = React.useState(false);
  const open = openProp ?? inner;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInner(next);
      onOpenChange?.(next);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(next));
        } catch {}
      }
    },
    [openProp, onOpenChange, storageKey],
  );

  const toggle = React.useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia?.(MOBILE_QUERY).matches) setOpenMobile((value) => !value);
    else setOpen(!open);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!keyboardShortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== keyboardShortcut.toLowerCase() || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      // Leave ⌘B alone in text fields (bold).
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboardShortcut, toggle]);

  const value = React.useMemo(() => ({ open, setOpen, openMobile, setOpenMobile, toggle }), [open, setOpen, openMobile, toggle]);

  return (
    <SidebarContext value={value}>
      <div
        data-slot="sidebar-wrapper"
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full bg-surface",
          // Inset: the page takes the sidebar's surface, and the main area becomes a card on it.
          "md:has-[[data-slot=sidebar][data-variant=inset]]:bg-surface-container",
          className,
        )}
        style={{ "--ex-sidebar-width": width, "--ex-sidebar-collapsed-width": collapsedWidth, ...style } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext>
  );
}

export interface SidebarProps extends React.ComponentProps<"div"> {
  side?: "left" | "right";
  /** What collapsing does on wide screens: shrink to an icon rail, slide away, or nothing. */
  collapsible?: "icon" | "offcanvas" | "none";
  /**
   * `standard`: flush to the edge. `floating`: the sidebar is an inset rounded
   * card. `inset`: the sidebar blends into the page and the main area
   * (<SidebarInset>) becomes a raised rounded card beside it.
   */
  variant?: "standard" | "floating" | "inset";
  /** Names the mobile drawer. */
  "aria-label"?: string;
}

export function Sidebar({
  side = "left",
  collapsible = "icon",
  variant = "standard",
  className,
  children,
  "aria-label": ariaLabel = "Sidebar",
  ...props
}: SidebarProps) {
  const { open, openMobile, setOpenMobile } = useSidebar();
  const collapsed = !open && collapsible !== "none";
  const mode = collapsed ? collapsible : undefined;
  const floating = variant === "floating";
  const inset = variant === "inset";

  const surface = cn(
    "flex h-full flex-col text-on-surface-variant",
    floating && "rounded-shape-extra-large bg-surface-container shadow-elevation-1",
    inset && "bg-transparent",
    variant === "standard" && "bg-surface-container-low",
  );

  return (
    <>
      {/* Wide screens: in the layout, sticky to the viewport. */}
      <div
        data-slot="sidebar"
        data-state={collapsed ? "collapsed" : "expanded"}
        data-collapsible={mode}
        data-side={side}
        data-variant={variant}
        // Offcanvas: once it has slid away, nothing inside should be focusable.
        inert={mode === "offcanvas" ? true : undefined}
        className={cn(
          "group/sidebar sticky top-0 hidden h-svh shrink-0 overflow-hidden md:block",
          // Width springs on the effects curve: an overshooting width would reflow the page twice.
          "w-(--ex-sidebar-width) transition-[width] spring-effects-default",
          "data-[collapsible=icon]:w-(--ex-sidebar-collapsed-width) data-[collapsible=offcanvas]:w-0",
          // Floating: the rail is wider by the card's padding, so icons line up exactly as in the other looks.
          floating && "p-2 data-[collapsible=icon]:w-[calc(var(--ex-sidebar-collapsed-width)+1rem)] data-[collapsible=offcanvas]:p-0",
          side === "right" && "order-last",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            surface,
            // Keep the full width while sliding offcanvas, so content doesn't reflow as it goes.
            mode === "offcanvas" ? (floating ? "w-[calc(var(--ex-sidebar-width)-1rem)]" : "w-(--ex-sidebar-width)") : "w-full",
            variant === "standard" && (side === "left" ? "border-e border-outline-variant/60" : "border-s border-outline-variant/60"),
          )}
        >
          <RailContext value={mode === "icon"}>{children}</RailContext>
        </div>
      </div>

      {/* Narrow screens: a modal drawer. */}
      <Drawer.Root open={openMobile} onOpenChange={setOpenMobile} swipeDirection={side}>
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-50 bg-scrim/32 transition-opacity spring-effects-default data-starting-style:opacity-0 data-ending-style:opacity-0 md:hidden" />
          <Drawer.Viewport className={cn("fixed inset-0 z-50 flex md:hidden", side === "left" ? "justify-start" : "justify-end")}>
            <Drawer.Popup
              data-slot="sidebar-mobile"
              data-state="expanded"
              aria-label={ariaLabel}
              className={cn(
                "group/sidebar relative h-full w-[min(var(--ex-sidebar-width),calc(100vw-3.5rem))] outline-none",
                "[transform:translateX(var(--drawer-swipe-movement-x,0px))] transition-transform spring-spatial-default data-swiping:transition-none",
                side === "left"
                  ? "data-starting-style:[transform:translateX(-100%)] data-ending-style:[transform:translateX(-100%)]"
                  : "data-starting-style:[transform:translateX(100%)] data-ending-style:[transform:translateX(100%)]",
                // Sidebar color past the outer edge, so the spring's overshoot never shows a gap.
                "after:pointer-events-none after:absolute after:inset-y-0 after:w-12 after:bg-surface-container-low after:content-['']",
                side === "left" ? "after:right-full" : "after:left-full",
              )}
            >
              <div className={cn("h-full bg-surface-container-low text-on-surface-variant shadow-elevation-1", side === "left" ? "rounded-e-shape-large" : "rounded-s-shape-large")}>
                <div className="flex h-full flex-col">{children}</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

/** Whether this sidebar is showing as the icon rail; use it to hide things like an app name next to a logo. */
export function useSidebarRail() {
  return React.useContext(RailContext);
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("flex shrink-0 flex-col gap-2 p-3", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("mt-auto flex shrink-0 flex-col gap-2 p-3", className)} {...props} />;
}

export interface SidebarContentProps extends React.ComponentProps<"nav"> {
  "aria-label"?: string;
}

/** The scrolling middle, rendered as the navigation landmark. */
export function SidebarContent({ className, "aria-label": ariaLabel = "Main", ...props }: SidebarContentProps) {
  return (
    <nav
      data-slot="sidebar-content"
      aria-label={ariaLabel}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 py-1",
        // Still scrolls by wheel, touch and keyboard; the bar itself is hidden.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr data-slot="sidebar-separator" className={cn("mx-3 my-1 border-0 border-t border-outline-variant", className)} {...props} />;
}

export interface SidebarGroupProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Section title. Hidden in the icon rail. */
  label?: React.ReactNode;
  /** Let the section open and close from its label. The icon rail always shows its items. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Content after the label, e.g. an "add" IconButton. */
  action?: React.ReactNode;
}

export function SidebarGroup({ className, label, collapsible = false, defaultOpen = true, action, children, ...props }: SidebarGroupProps) {
  const rail = useSidebarRail();
  const [open, setOpen] = React.useState(defaultOpen);
  const labelClass = "flex h-10 min-w-0 flex-1 items-center gap-2 px-4 text-title-small text-on-surface-variant";
  const header = label && (
    <Fold hidden={rail}>
      <div className="flex items-center gap-1">
      {collapsible ? (
        <Collapsible.Trigger className={cn(labelClass, "group/trigger state-layer focus-ring cursor-pointer rounded-shape-full text-start")}>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="size-5 shrink-0 transition-transform spring-spatial-fast group-data-panel-open/trigger:rotate-180">
            <path d="m12 15.4-6-6L7.4 8l4.6 4.6L16.6 8 18 9.4Z" />
          </svg>
        </Collapsible.Trigger>
      ) : (
        <div className={labelClass}>
          <span className="truncate">{label}</span>
        </div>
      )}
      {action}
      </div>
    </Fold>
  );
  if (!collapsible) {
    return (
      <div data-slot="sidebar-group" role="group" aria-label={typeof label === "string" ? label : undefined} className={cn("flex flex-col", className)} {...props}>
        {header}
        {children}
      </div>
    );
  }
  return (
    <Collapsible.Root data-slot="sidebar-group" open={rail || open} onOpenChange={setOpen} className={cn("flex flex-col", className)} {...props}>
      {header}
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] spring-effects-default data-starting-style:h-0 data-ending-style:h-0">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" role="list" className={cn("flex flex-col gap-0.5", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("flex flex-col", className)} {...props} />;
}

export interface SidebarMenuButtonProps extends useRender.ComponentProps<"a"> {
  icon?: React.ReactNode;
  /** Shown instead of `icon` when active (often the filled version). */
  activeIcon?: React.ReactNode;
  /** The current page: `aria-current="page"` and the active indicator. */
  active?: boolean;
  /** Trailing text, e.g. an unread count. In the icon rail it becomes a dot. */
  badge?: React.ReactNode;
  /** For expanded navigation groups: highlight ancestor without claiming this is the current page. */
  ancestorActive?: boolean;
  /** Tooltip text in the icon rail. Defaults to the label when it's a string. */
  tooltip?: string;
}

/**
 * A destination. It's a link: pass `href`, or `render={<Link href="…" />}`;
 * for an action, `render={<button type="button" />}`.
 */
export function SidebarMenuButton({ className, icon, activeIcon, active = false, ancestorActive = false, badge, tooltip, children, render, ref, ...props }: SidebarMenuButtonProps) {
  const rail = useSidebarRail();
  const root = React.useRef<HTMLAnchorElement>(null);
  const indicator = React.useRef<HTMLSpanElement>(null);
  // Fluid: the indicator swells open with a jelly wobble.
  useFluidPop(root, { attributes: ["data-active"], target: indicator, from: 0.6 });

  const element = useRender({
    defaultTagName: "a",
    render,
    ref: [root, ref].filter(Boolean) as React.Ref<HTMLAnchorElement>[],
    props: mergeProps<"a">(
      {
        "data-slot": "sidebar-menu-button",
        "data-active": active ? "" : undefined,
        "data-section-active": ancestorActive ? "" : undefined,
        "aria-current": active ? "page" : undefined,
        className: cn(
          "group/button focus-ring relative flex h-12 w-full shrink-0 cursor-pointer items-center gap-3 overflow-hidden rounded-shape-full ps-4 pe-5 text-label-large whitespace-nowrap text-on-surface-variant",
          // Shrinks on the same curve as the sidebar's width, so the two move as one.
          "transition-[width] spring-effects-default",
          "data-active:text-on-primary-container data-section-active:text-on-primary-container",
          /*
           * Icon rail: a 56px pill. The icon doesn't move: with the content's
           * 12px padding and this 16px start padding, its centre sits 40px from
           * the edge in both states, the middle of the 80px rail.
           */
          rail && "w-14",
          "[&_svg]:size-6 [&_svg]:shrink-0",
          className,
        ),
        children: (
          <>
            <span
              ref={indicator}
              aria-hidden="true"
              className="absolute inset-0 scale-x-[0.6] rounded-shape-full bg-primary-container opacity-0 transition-[transform,opacity] spring-spatial-fast group-data-active/button:scale-x-100 group-data-active/button:opacity-100 group-data-section-active/button:scale-x-100 group-data-section-active/button:opacity-100 fluid:transition-opacity"
            />
            <span
              aria-hidden="true"
              className="state-layer absolute inset-0 rounded-shape-full group-hover/button:before:opacity-(--ex-state-hover) group-active/button:before:opacity-(--ex-state-pressed)"
            />
            {icon && <span className="relative flex">{active && activeIcon ? activeIcon : icon}</span>}
            {/* In the rail the label stays in the accessible name, just not on screen. */}
            {/* In the rail the label fades out but stays in the accessible name. */}
            <span className={cn("relative min-w-0 flex-1 truncate transition-opacity spring-effects-fast group-data-active/button:font-bold", rail && "opacity-0")}>
              {children}
            </span>
            {badge !== undefined && (
              <>
                <span className={cn("relative text-label-large transition-opacity spring-effects-fast", rail && "opacity-0")}>{badge}</span>
                <span
                  aria-hidden="true"
                  className={cn("absolute top-2.5 start-9 size-1.5 rounded-shape-full bg-error transition-opacity spring-effects-fast", !rail && "opacity-0")}
                />
              </>
            )}
          </>
        ),
      } as React.ComponentProps<"a">,
      props,
    ),
  });

  const label = tooltip ?? (typeof children === "string" ? children : undefined);
  if (!label) return element;
  return (
    <Tooltip content={label} side="right" disabled={!rail}>
      {element}
    </Tooltip>
  );
}

/** Nested destinations under a menu item. Hidden in the icon rail. */
export function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  const rail = useSidebarRail();
  return (
    <Fold hidden={rail}>
      <ul data-slot="sidebar-menu-sub" role="list" className={cn("ms-7 flex flex-col gap-0.5 border-s border-outline-variant py-0.5 ps-3", className)} {...props} />
    </Fold>
  );
}

export interface SidebarMenuSubButtonProps extends useRender.ComponentProps<"a"> {
  active?: boolean;
}

export function SidebarMenuSubButton({ className, active = false, render, ...props }: SidebarMenuSubButtonProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        "data-slot": "sidebar-menu-sub-button",
        "data-active": active ? "" : undefined,
        "aria-current": active ? "page" : undefined,
        className: cn(
          "state-layer focus-ring flex h-10 items-center rounded-shape-full px-4 text-label-large text-on-surface-variant",
          "data-active:bg-primary-container data-active:font-bold data-active:text-on-primary-container",
          className,
        ),
      } as React.ComponentProps<"a">,
      props,
    ),
  });
}

export interface SidebarTriggerProps extends Omit<React.ComponentProps<typeof IconButton>, "aria-label" | "aria-labelledby" | "children"> {
  "aria-label"?: string;
  children?: React.ReactNode;
}

/** Opens and closes the sidebar (the drawer on narrow screens). */
export function SidebarTrigger({ "aria-label": ariaLabel = "Toggle sidebar", onClick, children, ...props }: SidebarTriggerProps) {
  const { open, toggle } = useSidebar();
  return (
    <IconButton
      data-slot="sidebar-trigger"
      aria-label={ariaLabel}
      aria-expanded={open}
      onClick={(event) => {
        onClick?.(event as never);
        toggle();
      }}
      {...props}
    >
      {children ?? (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M9 4v16" />
        </svg>
      )}
    </IconButton>
  );
}

/** The main area next to the sidebar. */
export function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "flex min-w-0 flex-1 flex-col",
        // With an `inset` sidebar on wide screens: a raised rounded card, set in from the edges.
        "md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:m-2 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:overflow-hidden",
        "md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:rounded-shape-extra-large md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:bg-surface",
        "md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:shadow-elevation-1",
        className,
      )}
      {...props}
    />
  );
}
