import { Select } from "@/components/expressive/select";

export interface SystemOption { value: string; label: string }

/** Accessible M3 exposed dropdown; sentinel avoids an empty-value selection edge case. */
export function SystemSelect({ label, value, onChange, options, allLabel, disabled, labelPlacement = "floating", native = false, labelBackground = "var(--ex-color-surface-container-low)" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SystemOption[];
  allLabel?: string;
  disabled?: boolean;
  labelPlacement?: "floating" | "above";
  /** Native select inside a native modal: popup cannot escape the top layer. */
  native?: boolean;
  labelBackground?: string;
}) {
  const items = allLabel ? [{ value: "__sys_all__", label: allLabel }, ...options] : options;
  if (native) return <label className="sys-field"><span>{label}</span><select className="sys-input" value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}>{allLabel&&<option value="">{allLabel}</option>}{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
  return <Select<string> label={label} labelPlacement={labelPlacement} variant={labelPlacement === "above" ? "compact" : "outlined"} motion="standard" labelBackground={labelBackground}
    className="sys-expressive-select"
    value={value || (allLabel ? "__sys_all__" : null)}
    onValueChange={(next) => onChange(next === "__sys_all__" ? "" : next ?? "")}
    items={items} disabled={disabled} />;
}
