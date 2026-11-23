import * as React from "react";
import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/expressive/utils";

export interface TextFieldProps extends Omit<Field.Control.Props, "className" | "children"> {
  label: string;
  /** Labels above filter controls instead of mixing floating and fixed labels. */
  labelPlacement?: "floating" | "above";
  variant?: "filled" | "outlined";
  supportingText?: React.ReactNode;
  /** Shown instead of `supportingText` when `invalid`. */
  errorText?: React.ReactNode;
  invalid?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  className?: string;
  /**
   * Outlined fields cut the label's background out of the border. Set this
   * to the color behind the field when it isn't `surface`.
   */
  labelBackground?: string;
}

/*
 * Filled and outlined text fields with a floating label. Base UI's Field wires
 * the label, description and error to the input.
 */
export function TextField({
  label,
  labelPlacement = "floating",
  variant = "filled",
  supportingText,
  errorText,
  invalid,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  labelBackground,
  ...props
}: TextFieldProps) {
  const filled = variant === "filled";
  const above = labelPlacement === "above";
  return (
    <Field.Root
      data-slot="text-field"
      invalid={invalid}
      disabled={disabled}
      className={cn("group/field flex w-full flex-col gap-1 data-disabled:opacity-(--ex-disabled-content)", className)}
      style={labelBackground ? ({ "--ex-field-label-bg": labelBackground } as React.CSSProperties) : undefined}
    >
      {above && <Field.Label className="text-label-medium font-medium text-on-surface-variant">{label}</Field.Label>}
      <div
        className={cn(
          "relative flex h-14 items-center gap-3 px-4 text-on-surface-variant transition-colors spring-effects-fast",
          leadingIcon && "pl-3",
          trailingIcon && "pr-3",
          "[&_svg]:size-6 [&_svg]:shrink-0",
          filled
            ? [
                "rounded-t-shape-extra-small bg-surface-container-highest",
                // Active indicator: 1px line that grows to 2px in the focus color.
                "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-on-surface-variant after:transition-[height,background-color] after:spring-effects-fast",
                "group-data-focused/field:after:h-0.5 group-data-focused/field:after:bg-primary",
                "group-data-invalid/field:after:bg-error",
                "has-[input:hover]:before:absolute has-[input:hover]:before:inset-0 has-[input:hover]:before:bg-on-surface/(--ex-state-hover) has-[input:hover]:before:pointer-events-none has-[input:hover]:before:rounded-[inherit]",
              ]
            : [
                "rounded-shape-extra-small border border-outline",
                "has-[input:hover]:border-on-surface",
                "group-data-focused/field:border-primary group-data-focused/field:shadow-[inset_0_0_0_1px_var(--ex-color-primary)]",
                "group-data-invalid/field:border-error group-data-invalid/field:shadow-[inset_0_0_0_1px_var(--ex-color-error)]",
              ],
        )}
      >
        {leadingIcon}
        <div className="relative flex h-full min-w-0 flex-1 flex-col justify-center">
          {!above && <Field.Label
            className={cn(
              "pointer-events-none absolute left-0 origin-top-left truncate text-body-large text-on-surface-variant",
              "transition-[transform,color,top] spring-spatial-fast",
              "top-1/2 -translate-y-1/2",
              "group-data-focused/field:text-primary group-data-invalid/field:text-error",
              filled
                ? "group-data-filled/field:top-2 group-data-filled/field:translate-y-0 group-data-filled/field:scale-75 group-data-focused/field:top-2 group-data-focused/field:translate-y-0 group-data-focused/field:scale-75"
                : [
                    "px-1 -ml-1",
                    "group-data-filled/field:-top-2 group-data-filled/field:translate-y-0 group-data-filled/field:scale-75 group-data-filled/field:bg-(--ex-field-label-bg,var(--ex-color-surface))",
                    "group-data-focused/field:-top-2 group-data-focused/field:translate-y-0 group-data-focused/field:scale-75 group-data-focused/field:bg-(--ex-field-label-bg,var(--ex-color-surface))",
                  ],
              leadingIcon && !filled && "group-data-filled/field:-translate-x-8 group-data-focused/field:-translate-x-8",
            )}
          >
            {label}
          </Field.Label>}
          <Field.Control
            className={cn(
              "w-full bg-transparent text-body-large text-on-surface caret-primary outline-none placeholder:text-on-surface-variant placeholder:opacity-0 focus:placeholder:opacity-100",
              filled && !above && "pt-4",
              "group-data-invalid/field:caret-error",
            )}
            {...props}
          />
        </div>
        {trailingIcon && <span className="group-data-invalid/field:text-error">{trailingIcon}</span>}
      </div>
      {supportingText && !invalid && (
        <Field.Description className="px-4 text-body-small text-on-surface-variant">{supportingText}</Field.Description>
      )}
      {invalid && errorText && (
        <Field.Error match className="px-4 text-body-small text-error">
          {errorText}
        </Field.Error>
      )}
    </Field.Root>
  );
}
