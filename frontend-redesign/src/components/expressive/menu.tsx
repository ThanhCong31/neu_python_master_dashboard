import * as React from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cn } from "@/lib/expressive/utils";
import type { MotionProp } from "@/lib/expressive/use-motion";

/*
 * Menus show a list of choices on a temporary surface. Base UI handles focus,
 * typeahead, arrow keys, submenus and dismissal; this file adds the M3
 * Expressive look: a rounded container, items that pick up a tinted, rounder
 * shape when selected, and an optional `vibrant` color scheme.
 */

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuGroup = BaseMenu.Group;
export const MenuSubmenu = BaseMenu.SubmenuRoot;

type MenuColor = "standard" | "vibrant";
const MenuColorContext = React.createContext<MenuColor>("standard");

export interface MenuContentProps extends Omit<BaseMenu.Popup.Props, "className"> {
  /** `vibrant` uses tertiary colors for menus that need more emphasis. */
  color?: MenuColor;
  side?: BaseMenu.Positioner.Props["side"];
  align?: BaseMenu.Positioner.Props["align"];
  sideOffset?: number;
  motion?: MotionProp;
  className?: string;
}

/** The popup. Use it inside <Menu> and inside each <MenuSubmenu>. */
export function MenuContent({ className, color, side, align, sideOffset = 4, motion, children, ...props }: MenuContentProps) {
  // Submenus inherit the parent's color unless they set their own.
  const inherited = React.useContext(MenuColorContext);
  const scheme = color ?? inherited;
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset} collisionPadding={8} className="z-50 outline-none">
        <BaseMenu.Popup
          data-slot="menu"
          data-color={scheme}
          data-motion={motion}
          className={cn(
            "group/menu focus-ring flex max-h-(--available-height) min-w-28 max-w-70 flex-col gap-0.5 overflow-y-auto rounded-shape-large p-1 shadow-elevation-2",
            "bg-surface-container text-on-surface data-[color=vibrant]:bg-tertiary-container data-[color=vibrant]:text-on-tertiary-container",
            "origin-(--transform-origin) transition-[transform,opacity] spring-spatial-fast",
            "data-starting-style:scale-y-75 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none",
            className,
          )}
          {...props}
        >
          <MenuColorContext value={scheme}>{children}</MenuColorContext>
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

const item = [
  "state-layer relative flex h-11 shrink-0 cursor-pointer select-none items-center gap-3 rounded-shape-small px-3 text-label-large outline-none",
  "transition-[border-radius,background-color,color] spring-spatial-fast",
  "data-highlighted:before:opacity-(--ex-state-hover)",
  "data-disabled:cursor-default data-disabled:opacity-(--ex-disabled-content)",
  "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  // Selected (checked) items morph to a rounder, tinted shape.
  "data-checked:rounded-shape-medium data-checked:bg-tertiary-container data-checked:text-on-tertiary-container",
  "group-data-[color=vibrant]/menu:data-checked:bg-tertiary group-data-[color=vibrant]/menu:data-checked:text-on-tertiary",
];

interface ItemSlots {
  /** Leading icon. */
  icon?: React.ReactNode;
  /** Trailing text such as a keyboard shortcut ("⌘C"), or a trailing icon. */
  trailing?: React.ReactNode;
  /** A second line of smaller text under the label. */
  supportingText?: React.ReactNode;
}

function ItemContent({ icon, trailing, supportingText, children }: ItemSlots & { children?: React.ReactNode }) {
  return (
    <>
      {icon}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{children}</span>
        {supportingText && <span className="truncate text-body-small opacity-80">{supportingText}</span>}
      </span>
      {trailing && <span className="ms-3 flex items-center text-label-medium opacity-80">{trailing}</span>}
    </>
  );
}

export interface MenuItemProps extends Omit<BaseMenu.Item.Props, "className">, ItemSlots {
  className?: string;
}

export function MenuItem({ className, icon, trailing, supportingText, children, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item data-slot="menu-item" className={cn(item, supportingText && "h-14", className)} {...props}>
      <ItemContent icon={icon} trailing={trailing} supportingText={supportingText}>
        {children}
      </ItemContent>
    </BaseMenu.Item>
  );
}

const check = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M9.55 17.65 4.2 12.3l1.43-1.4 3.92 3.92 8.82-8.82 1.43 1.4Z" />
  </svg>
);

export interface MenuCheckboxItemProps extends Omit<BaseMenu.CheckboxItem.Props, "className">, Omit<ItemSlots, "icon"> {
  className?: string;
}

/** An item that toggles on and off. A check mark shows in the leading slot while it's on. */
export function MenuCheckboxItem({ className, trailing, supportingText, children, ...props }: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem data-slot="menu-checkbox-item" className={cn(item, supportingText && "h-14", className)} {...props}>
      <span className="flex size-5 items-center justify-center">
        <BaseMenu.CheckboxItemIndicator className="flex animate-pop">{check}</BaseMenu.CheckboxItemIndicator>
      </span>
      <ItemContent trailing={trailing} supportingText={supportingText}>
        {children}
      </ItemContent>
    </BaseMenu.CheckboxItem>
  );
}

export const MenuRadioGroup = BaseMenu.RadioGroup;

export interface MenuRadioItemProps extends Omit<BaseMenu.RadioItem.Props, "className">, Omit<ItemSlots, "icon"> {
  className?: string;
}

/** One choice in a <MenuRadioGroup>. */
export function MenuRadioItem({ className, trailing, supportingText, children, ...props }: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem data-slot="menu-radio-item" className={cn(item, supportingText && "h-14", className)} {...props}>
      <span className="flex size-5 items-center justify-center">
        <BaseMenu.RadioItemIndicator className="flex animate-pop">{check}</BaseMenu.RadioItemIndicator>
      </span>
      <ItemContent trailing={trailing} supportingText={supportingText}>
        {children}
      </ItemContent>
    </BaseMenu.RadioItem>
  );
}

export interface MenuSubmenuTriggerProps extends Omit<BaseMenu.SubmenuTrigger.Props, "className">, Omit<ItemSlots, "trailing"> {
  className?: string;
}

/** Opens a nested menu: wrap it and a <MenuContent> in <MenuSubmenu>. */
export function MenuSubmenuTrigger({ className, icon, supportingText, children, ...props }: MenuSubmenuTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger
      data-slot="menu-submenu-trigger"
      className={cn(item, "data-popup-open:before:opacity-(--ex-state-hover)", supportingText && "h-14", className)}
      {...props}
    >
      <ItemContent
        icon={icon}
        supportingText={supportingText}
        trailing={
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="rtl:-scale-x-100">
            <path d="M9.4 18 8 16.6l4.6-4.6L8 7.4 9.4 6l6 6Z" />
          </svg>
        }
      >
        {children}
      </ItemContent>
    </BaseMenu.SubmenuTrigger>
  );
}

export function MenuGroupLabel({ className, ...props }: BaseMenu.GroupLabel.Props & { className?: string }) {
  return <BaseMenu.GroupLabel data-slot="menu-group-label" className={cn("px-3 pt-2 pb-1 text-label-medium opacity-80", className)} {...props} />;
}

/** A gap between groups of items. */
export function MenuSeparator({ className, ...props }: BaseMenu.Separator.Props & { className?: string }) {
  return <BaseMenu.Separator data-slot="menu-separator" className={cn("mx-3 my-1 h-px shrink-0 bg-outline-variant group-data-[color=vibrant]/menu:bg-on-tertiary-container/20", className)} {...props} />;
}
