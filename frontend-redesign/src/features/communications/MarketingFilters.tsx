import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { Checkbox } from "@/components/expressive/checkbox";
import { useResource } from "@/services/useResource";
import { ResponsiveDialog } from "@/shared/ResponsiveDialog";
import { LoadState } from "./components";

export type MarketingFilters = {
  date_from?: string;
  date_to?: string;
  board?: string[];
  region?: string[];
};

type MarketingOptions = {
  contacts?: { board: string[]; region: string[] };
};

const groups = [
  { key: "board", label: "Bảng thi" },
  { key: "region", label: "Miền" },
] as const;

export function marketingPath(partner: string | null, filters: MarketingFilters) {
  const params = new URLSearchParams();
  if (partner) params.set("partner", partner);
  for (const date of ["date_from", "date_to"] as const) {
    if (filters[date]) params.set(date, filters[date]);
  }
  for (const { key } of groups) {
    if (filters[key]?.length) params.set(key, filters[key].join(","));
  }
  return "/marketing/summary" + (params.size ? "?" + params : "");
}

export function MarketingFilterDialog({ partner, filters, onClose, onApply }: {
  partner: string | null;
  filters: MarketingFilters;
  onClose: () => void;
  onApply: (filters: MarketingFilters) => void;
}) {
  const query = partner ? "?" + new URLSearchParams({ partner }) : "";
  const options = useResource<MarketingOptions>("/meta/options" + query);
  const [draft, setDraft] = useState(filters);
  const invalidDates = Boolean(draft.date_from && draft.date_to && draft.date_from > draft.date_to);

  return <ResponsiveDialog title="Bộ lọc truyền thông" onClose={onClose} footer={<>
    <Button motion="standard" variant="text" onClick={() => setDraft({})}>Đặt lại</Button>
    <span className="flex-1" aria-hidden="true"/>
    <Button motion="standard" variant="outlined" onClick={onClose}>Hủy</Button>
    <Button motion="standard" disabled={invalidDates} icon={<Check aria-hidden="true"/>} onClick={() => onApply(draft)}>Áp dụng</Button>
  </>}>
    <fieldset className="com-filter-group">
      <legend>Ngày tiếp xúc đầu tiên</legend>
      <div className="com-filter-dates">
        <label>Từ ngày<input className="focus-ring" type="date" value={draft.date_from ?? ""} onChange={event => setDraft({ ...draft, date_from: event.target.value })}/></label>
        <label>Đến ngày<input className="focus-ring" type="date" value={draft.date_to ?? ""} onChange={event => setDraft({ ...draft, date_to: event.target.value })}/></label>
      </div>
      {invalidDates && <p role="alert" className="text-error">Từ ngày phải trước hoặc bằng Đến ngày.</p>}
    </fieldset>
    <LoadState state={options.state} message={options.state === "error" ? options.message : undefined} retry={options.retry} label="Đang tải danh mục bộ lọc…">
      <div className="com-filter-dimensions">
        {options.state === "ready" && groups.map(({ key, label }) => {
          const choices = options.data.contacts?.[key] ?? [];
          const selected = draft[key] ?? [];
          return <fieldset className="com-filter-group" key={key}>
            <legend>{label}</legend>
            {choices.length ? choices.map(choice => <Checkbox key={choice} checked={selected.includes(choice)} onChange={checked => {
              const next = checked ? [...selected, choice] : selected.filter(value => value !== choice);
              setDraft({ ...draft, [key]: next.sort() });
            }}>{choice}</Checkbox>) : <p className="text-on-surface-variant">Không có lựa chọn trong phạm vi này.</p>}
          </fieldset>;
        })}
      </div>
    </LoadState>
  </ResponsiveDialog>;
}
