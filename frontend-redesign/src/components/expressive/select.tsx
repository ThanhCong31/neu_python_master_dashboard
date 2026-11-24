import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/expressive/utils";
import type { MotionProp } from "@/lib/expressive/use-motion";
import "./workspace-fields.css";

/*
 * Select (M3 "exposed dropdown menu"): a field that opens a menu of options.
 * It looks like the text field, filled or outlined, with a floating label, and
 * the menu matches Expressive's menus. Base UI handles typeahead, arrow keys,
 * form submission and screen reader semantics.
 *
 *   <Select label="Fruit" items={[{ value: "apple", label: "Apple" }, …]} />
 *
 * Pass `items` (so the field can show the selected label), or children
 * (<SelectItem>, <SelectGroup>) for custom option content.
 */

export interface SelectItemData {
  value: unknown;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps<Value> extends Omit<BaseSelect.Root.Props<Value>, "items" | "children"> {
  label: string;
  /** Filtering toolbars use a static label to keep all controls aligned. */
  labelPlacement?: "floating" | "above";
  items?: SelectItemData[];
  variant?: "filled" | "outlined" | "compact";
  /** Shown in the field while it's open and nothing is chosen. */
  placeholder?: React.ReactNode;
  supportingText?: React.ReactNode;
  /** Replaces `supportingText` while `invalid`. */
  errorText?: React.ReactNode;
  invalid?: boolean;
  leadingIcon?: React.ReactNode;
  /** Outlined fields cut the label out of the border; set the color behind the field when it isn't `surface`. */
  labelBackground?: string;
  motion?: MotionProp;
  className?: string;
  children?: React.ReactNode;
}

export function Select<Value>({
  label,
  labelPlacement = "floating",
  items,
  variant = "filled",
  placeholder,
  supportingText,
  errorText,
  invalid,
  leadingIcon,
  labelBackground,
  disabled,
  motion,
  className,
  children,
  ...root
}: SelectProps<Value>) {
  const filled = variant === "filled";
  const compact = variant === "compact";
  const above = compact || labelPlacement === "above";
  return (
    <Field.Root
      data-slot="select"
      data-variant={variant}
      invalid={invalid}
      disabled={disabled}
      className={cn("group/select flex w-full flex-col gap-1 data-disabled:opacity-(--ex-disabled-content)", className)}
      style={labelBackground ? ({ "--ex-field-label-bg": labelBackground } as React.CSSProperties) : undefined}
    >
      {above && <span data-slot="select-caption" aria-hidden={compact || undefined} className="text-label-medium font-medium text-on-surface-variant">{label}</span>}
      <BaseSelect.Root items={items as BaseSelect.Root.Props<Value>["items"]} disabled={disabled} {...root}>
        <div
          data-slot="select-shell"
          className={cn(
            "relative flex h-14 items-center text-on-surface-variant transition-colors spring-effects-fast",
            "[&_svg]:size-6 [&_svg]:shrink-0",
            compact ? "" : filled
              ? [
                  "rounded-t-shape-extra-small bg-surface-container-highest",
                  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-on-surface-variant after:transition-[height,background-color] after:spring-effects-fast",
                  "has-[[data-popup-open],:focus-visible]:after:h-0.5 has-[[data-popup-open],:focus-visible]:after:bg-primary",
                  "group-data-invalid/select:after:bg-error",
                ]
              : [
                  "rounded-shape-extra-small border border-outline hover:border-on-surface",
                  "has-[[data-popup-open],:focus-visible]:border-primary has-[[data-popup-open],:focus-visible]:shadow-[inset_0_0_0_1px_var(--ex-color-primary)]",
                  "group-data-invalid/select:border-error group-data-invalid/select:shadow-[inset_0_0_0_1px_var(--ex-color-error)]",
                ],
          )}
        >
          <BaseSelect.Trigger
            data-slot="select-trigger"
            aria-label={compact ? label : undefined}
            className={cn(
              "peer absolute inset-0 flex cursor-pointer items-center gap-3 rounded-[inherit] px-4 text-start text-body-large text-on-surface outline-none",
              "hover:bg-on-surface/(--ex-state-hover) data-disabled:cursor-default",
              leadingIcon && "ps-13",
            )}
          >
            <BaseSelect.Value
              placeholder={placeholder}
              className={cn(
                "min-w-0 flex-1 truncate",
                filled && !above && "pt-4",
                // The label sits where the placeholder would be until the field opens.
                "data-placeholder:text-on-surface-variant data-placeholder:opacity-0 in-data-popup-open:data-placeholder:opacity-100",
              )}
            />
            <BaseSelect.Icon className="flex text-on-surface-variant transition-transform spring-spatial-fast data-popup-open:rotate-180">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M7 10l5 5 5-5Z" />
              </svg>
            </BaseSelect.Icon>
          </BaseSelect.Trigger>
          {leadingIcon && <span className="pointer-events-none absolute start-3 flex">{leadingIcon}</span>}
          <BaseSelect.Label
            className={cn(
              above && "sr-only",
              "pointer-events-none absolute start-4 top-1/2 origin-top-left -translate-y-1/2 truncate text-body-large text-on-surface-variant",
              "transition-[transform,top,color] spring-spatial-fast",
              leadingIcon && "start-13",
              // Floated: when something is chosen, or while open.
              "peer-[:not([data-placeholder])]:scale-75 peer-data-popup-open:scale-75 peer-data-popup-open:text-primary",
              filled
                ? "peer-[:not([data-placeholder])]:top-2 peer-[:not([data-placeholder])]:translate-y-0 peer-data-popup-open:top-2 peer-data-popup-open:translate-y-0"
                : [
                    "px-1 -ms-1",
                    "peer-[:not([data-placeholder])]:-top-2 peer-[:not([data-placeholder])]:translate-y-0 peer-[:not([data-placeholder])]:bg-(--ex-field-label-bg,var(--ex-color-surface))",
                    "peer-data-popup-open:-top-2 peer-data-popup-open:translate-y-0 peer-data-popup-open:bg-(--ex-field-label-bg,var(--ex-color-surface))",
                  ],
              leadingIcon && !filled && "peer-[:not([data-placeholder])]:-translate-x-9 peer-data-popup-open:-translate-x-9",
              "group-data-invalid/select:text-error",
            )}
          >
            {label}
          </BaseSelect.Label>
        </div>
        <BaseSelect.Portal>
          <BaseSelect.Positioner alignItemWithTrigger={false} sideOffset={4} collisionPadding={8} className="z-50 outline-none">
            <BaseSelect.Popup
              data-slot="select-menu"
              data-variant={variant}
              data-motion={motion}
              className={cn(
                "flex max-h-(--available-height) min-w-(--anchor-width) flex-col overflow-y-auto rounded-shape-large bg-surface-container p-1 text-on-surface shadow-elevation-2 outline-none",
                "origin-(--transform-origin) transition-[transform,opacity] spring-spatial-fast",
                "data-starting-style:scale-y-75 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
              )}
            >
              <BaseSelect.List className="flex flex-col gap-0.5">
                {children ??
                  items?.map((item) => (
                    <SelectItem key={String(item.value)} value={item.value} disabled={item.disabled}>
                      {item.label}
                    </SelectItem>
                  ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
      {supportingText && !invalid && <Field.Description className="px-4 text-body-small text-on-surface-variant">{supportingText}</Field.Description>}
      {invalid && errorText && (
        <Field.Error match className="px-4 text-body-small text-error">
          {errorText}
        </Field.Error>
      )}
    </Field.Root>
  );
}

export interface SelectItemProps extends Omit<BaseSelect.Item.Props, "className"> {
  icon?: React.ReactNode;
  className?: string;
}

export function SelectItem({ className, icon, children, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      data-slot="select-item"
      className={cn(
        "state-layer relative flex h-12 shrink-0 cursor-pointer select-none items-center gap-3 rounded-shape-small px-3 text-label-large outline-none",
        "transition-[border-radius,background-color,color] spring-spatial-fast",
        "data-highlighted:before:opacity-(--ex-state-hover)",
        "data-selected:rounded-shape-medium data-selected:bg-tertiary-container data-selected:text-on-tertiary-container",
        "data-disabled:cursor-default data-disabled:opacity-(--ex-disabled-content)",
        "[&_svg]:size-5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {icon}
      <BaseSelect.ItemText className="min-w-0 flex-1 truncate">{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="flex">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M9.55 17.65 4.2 12.3l1.43-1.4 3.92 3.92 8.82-8.82 1.43 1.4Z" />
        </svg>
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

export const SelectGroup = BaseSelect.Group;

export function SelectGroupLabel({ className, ...props }: BaseSelect.GroupLabel.Props & { className?: string }) {
  return <BaseSelect.GroupLabel className={cn("px-3 pt-2 pb-1 text-label-medium text-on-surface-variant", className)} {...props} />;
}

export function SelectSeparator({ className, ...props }: BaseSelect.Separator.Props & { className?: string }) {
  return <BaseSelect.Separator className={cn("mx-3 my-1 h-px bg-outline-variant", className)} {...props} />;
}
