import { Select } from "@/components/expressive/select";

export interface SystemOption { value: string; label: string }

/** Accessible M3 exposed dropdown; sentinel avoids an empty-value selection edge case. */
export function SystemSelect({ label, value, onChange, options, allLabel, disabled, labelPlacement = "floating", labelBackground = "var(--ex-color-surface-container-low)" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SystemOption[];
  allLabel?: string;
  disabled?: boolean;
  labelPlacement?: "floating" | "above";
  labelBackground?: string;
}) {
  const items = allLabel ? [{ value: "__sys_all__", label: allLabel }, ...options] : options;
  return <Select<string> label={label} labelPlacement={labelPlacement} variant="outlined" labelBackground={labelBackground}
    className="sys-expressive-select"
    value={value || (allLabel ? "__sys_all__" : null)}
    onValueChange={(next) => onChange(next === "__sys_all__" ? "" : next ?? "")}
    items={items} disabled={disabled} />;
}
