import { useLayoutEffect, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Check, CheckCheck, ChevronRight, Plus, RotateCcw, Save, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { TextField } from "@/components/expressive/text-field";
import { useWorkspace } from "@/app/workspace";
import { api } from "@/services/api";
import { useResource } from "@/services/useResource";
import type { AdminUser, Partner, PartnersResult } from "../types";
import { PasswordReset } from "./Users";
import { Chip, Dialog, formatNumber, Notice, Section, State } from "../components/Elements";
import { SystemSelect } from "../components/SystemSelect";

type Draft = { modules: string[]; can_view_pii: boolean; can_export_reports: boolean; active: boolean };
const toDraft = (p: Partner): Draft => ({ modules: [...p.modules], can_view_pii: p.can_view_pii, can_export_reports: p.can_export_reports, active: p.active });
const sameModules = (a: string[], b: string[]) => a.length === b.length && a.every((key) => b.includes(key));
const same = (a: Draft, b: Draft) => a.active === b.active && a.can_view_pii === b.can_view_pii && a.can_export_reports === b.can_export_reports && sameModules(a.modules, b.modules);

function changes(original: Partner, draft: Draft, labels: Record<string, string>) {
  const list: string[] = [];
  for (const code of draft.modules) if (!original.modules.includes(code)) list.push(`Cấp quyền: ${labels[code] ?? code}`);
  for (const code of original.modules) if (!draft.modules.includes(code)) list.push(`Thu hồi: ${labels[code] ?? code}`);
  if (draft.can_view_pii !== original.can_view_pii) list.push(`${draft.can_view_pii ? "Cho phép" : "Thu hồi quyền"} xem thông tin cá nhân`);
  if (draft.can_export_reports !== original.can_export_reports) list.push(`${draft.can_export_reports ? "Cấp" : "Thu hồi"} quyền xuất báo cáo`);
  if (draft.active !== original.active) list.push(draft.active ? "Mở quyền đăng nhập cho đối tác" : "Khóa quyền đăng nhập của đối tác");
  return list;
}

function Option({ checked, onChange, title, supporting, disabled = false }: {
  checked: boolean; onChange: (checked: boolean) => void; title: string; supporting?: string; disabled?: boolean;
}) {
  return <label className={`sys-permission-tile${checked ? " sys-permission-tile--on" : ""}${disabled ? " sys-permission-tile--disabled" : ""}`}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    <span className="sys-permission-content"><strong>{title}</strong>{supporting && <small>{supporting}</small>}</span>
    {checked && <Check aria-hidden="true" size={17} className="sys-permission-check" />}
  </label>;
}

type InitialAccount = { username: string; temporary_password: string };
type School = { id: string; name: string; type: string | null; has_data: boolean };
const schoolGroups = ["THPT", "Đại học", "Khác"];
const partnerKinds = [
  {value: "school", label: "Trường học", codeHint: "Ví dụ HUST", nameHint: "Tự điền theo trường đã chọn", descriptionHint: "Ví dụ Đối tác tuyển sinh khu vực Hà Nội"},
  {value: "sponsor", label: "Nhà tài trợ", codeHint: "Ví dụ TAITRO01", nameHint: "Ví dụ Nhà tài trợ A", descriptionHint: "Ví dụ Hạng mục hoặc thời gian tài trợ"},
  {value: "business", label: "Doanh nghiệp hợp tác", codeHint: "Ví dụ DOANHNGHIEP01", nameHint: "Ví dụ Công ty A", descriptionHint: "Ví dụ Nội dung và phạm vi hợp tác"},
  {value: "other", label: "Khác", codeHint: "Ví dụ DOITAC01", nameHint: "Ví dụ Đơn vị truyền thông A", descriptionHint: "Ví dụ Vai trò của đơn vị trong chương trình"},
];

function schoolSearchText(value: string) {
  return value.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
}

function SchoolGroup({ title, schools, selected, onChange, multiple, disabled }: {
  title: string; schools: School[]; selected: string[]; onChange: (ids: string[]) => void;
  multiple: boolean; disabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const query = schoolSearchText(search);
  const rows = schools.filter(school => schoolSearchText(`${school.id} ${school.name}`).includes(query));
  const selectedResults = rows.filter(school => selected.includes(school.id)).length;
  const allChecked = rows.length > 0 && selectedResults === rows.length;
  const eligibleResults = rows.filter(school => school.has_data).length;

  function selectResults(checked: boolean) {
    const ids = rows.map(school => school.id);
    onChange(checked ? [...new Set([...selected, ...ids])] : selected.filter(id => !ids.includes(id)));
  }

  return <fieldset className="sys-school-group">
    <legend>{title}</legend>
    <div className="sys-school-toolbar">
      <label className="sys-partner-search">
        <Search size={16} aria-hidden="true" />
        <input type="search" aria-label={`Tìm trường ${title}`} placeholder="Tên hoặc mã trường"
          value={search} onChange={event => setSearch(event.target.value)} disabled={disabled} />
      </label>
      {multiple && <label className="sys-school-select-all">
        <input type="checkbox" checked={allChecked} disabled={disabled || !rows.length}
          ref={input => { if (input) input.indeterminate = selectedResults > 0 && !allChecked; }}
          onChange={event => selectResults(event.target.checked)} />
        Chọn tất cả
      </label>}
    </div>
    <p className="sys-school-count" role="status">
      {query ? `${rows.length}/${schools.length}` : schools.length} trường
      {!multiple && ` · ${eligibleResults} có thể chọn`}
    </p>
    {rows.length ? <ul className="sys-school-list">
      {rows.map(school => <li key={school.id}>
        <label className={multiple || school.has_data ? "sys-school-option" : "sys-school-option sys-school-option--unavailable"}>
          <input type={multiple ? "checkbox" : "radio"} name={multiple ? undefined : "school_id"}
            checked={selected.includes(school.id)} disabled={disabled || (!multiple && !school.has_data)}
            onChange={event => onChange(multiple
              ? event.target.checked ? [...selected, school.id] : selected.filter(id => id !== school.id)
              : [school.id])} />
          <span><strong>{school.id}</strong> · {school.name}
            {!multiple && !school.has_data && <small>Chưa có hồ sơ khớp mã trường</small>}
          </span>
        </label>
      </li>)}
    </ul> : <p className="sys-muted">{query ? "Không tìm thấy trường phù hợp." : "Chưa có trường trong nhóm này."}</p>}
  </fieldset>;
}

function SchoolPicker({ schools, selected, onChange, multiple = false, disabled }: {
  schools: School[]; selected: string[]; onChange: (ids: string[]) => void; multiple?: boolean; disabled: boolean;
}) {
  return <div className="sys-school-groups">
    {schoolGroups.map(title => {
      const rows = schools.filter(school => (school.type === "THPT" || school.type === "Đại học" ? school.type : "Khác") === title);
      if (title === "Khác" && !rows.length) return null;
      return <SchoolGroup key={title} title={title} schools={rows} selected={selected}
        onChange={onChange} multiple={multiple} disabled={disabled} />;
    })}
  </div>;
}

function PartnerEditor({ partner, onClose, onSave, onBusy }: {
  partner?: Partner; onClose: () => void; onSave: (code: string, account?: InitialAccount) => Promise<void>; onBusy: (busy: boolean) => void;
}) {
  const [code, setCode] = useState(partner?.code ?? "");
  const [name, setName] = useState(partner?.name ?? "");
  const [type, setType] = useState(partner?.type ?? "");
  const [description, setDescription] = useState(partner?.description ?? "");
  const [kind, setKind] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const selectedKind = partnerKinds.find(option => option.value === kind);
  const isSchool = kind === "school";
  const schools = useResource<School[]>(!partner && isSchool ? "/admin/partners/schools" : null);
  const school = schools.state === "ready" ? schools.data.find(option => option.id === schoolId && option.has_data) : undefined;
  const canCreate = Boolean(selectedKind && code.trim() && (
    isSchool ? school : name.trim() && (kind !== "other" || type.trim())
  ));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useLayoutEffect(() => { onBusy(busy); return () => onBusy(false); }, [busy, onBusy]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!partner && !canCreate)) return;
    setBusy(true);
    setError("");
    const identity = {name: name.trim(), type: type.trim(), description: description.trim()};
    try {
      if (partner) {
        await api(`/admin/partners/${encodeURIComponent(partner.code)}`, {method: "PATCH", json: identity});
        await onSave(partner.code);
      } else {
        const organization = isSchool ? {school_id: schoolId}
          : {name: identity.name, ...(kind === "other" ? {type: identity.type} : {})};
        const result = await api<{code: string; account: InitialAccount}>("/admin/partners", {
          method: "POST",
          json: {code: code.trim().toUpperCase(), kind, description: identity.description, ...organization},
        });
        await onSave(result.code, result.account);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu đối tác.");
    } finally {
      setBusy(false);
    }
  }

  return <Dialog dismissible={!busy} width={partner ? "normal" : "wide"} title={partner ? "Sửa thông tin đối tác" : "Thêm đối tác"} onClose={onClose}>
    <form className="sys-form sys-partner-form" onSubmit={submit} aria-busy={busy}>
      {!partner && <SystemSelect native label="Loại đối tác" value={kind} allLabel="Chọn loại đối tác"
        options={partnerKinds} disabled={busy} onChange={value => {
          setKind(value);
          setError("");
          if (isSchool) {
            if (code === schoolId) setCode("");
            setSchoolId("");
          }
        }} />}
      {!partner && isSchool && <>
        <p className="sys-muted">Chọn một trường đã có hồ sơ liên hệ hoặc thí sinh khớp mã. Hệ thống sẽ cấp tài khoản và gán dữ liệu của trường khi lưu.</p>
        <State status={schools.state} error={schools.state === "error" ? schools.message : undefined}
          retry={schools.retry} refreshError={schools.refreshError}>
          {schools.state === "ready" && (schools.data.length
            ? <SchoolPicker schools={schools.data} selected={schoolId ? [schoolId] : []} disabled={busy}
                onChange={([id]) => {
                  setSchoolId(id);
                  setError("");
                  if (!code || code === schoolId) setCode(id);
                }} />
            : <Notice>Danh mục trường đang trống.</Notice>)}
        </State>
      </>}
      {(partner || selectedKind) && <>
        <TextField label="Mã đối tác" labelPlacement="above" placeholder={selectedKind?.codeHint ?? "Ví dụ HUST"}
          value={code} onChange={e => setCode(e.target.value)} disabled={busy || !!partner} required maxLength={32} minLength={2}/>
        <TextField label="Tên tổ chức" labelPlacement="above" placeholder={selectedKind?.nameHint ?? "Ví dụ Đại học Bách khoa Hà Nội"}
          value={isSchool ? school?.name ?? "" : name} onChange={e => setName(e.target.value)} readOnly={isSchool} disabled={busy} required={!isSchool} maxLength={160}/>
        {(partner || isSchool || kind === "other") && <TextField label="Loại tổ chức" labelPlacement="above"
          placeholder={isSchool ? "Tự điền theo trường đã chọn" : "Ví dụ Đơn vị truyền thông"}
          value={isSchool ? school?.type ?? "" : type} onChange={e => setType(e.target.value)} readOnly={isSchool} disabled={busy} required={!isSchool} maxLength={80}/>}
        <TextField label="Mô tả" labelPlacement="above" placeholder={selectedKind?.descriptionHint ?? "Ví dụ Đối tác tuyển sinh khu vực Hà Nội"}
          value={description} onChange={e => setDescription(e.target.value)} disabled={busy} maxLength={500}/>
        {!partner && !isSchool && <p className="sys-muted">Sau khi tạo tài khoản, quản trị viên có thể cấp quyền và cấu hình phạm vi dữ liệu.</p>}
      </>}
      {error && <Notice error>{error}</Notice>}
      <div className="sys-dialog-actions">
        <Button type="button" variant="text" onClick={onClose} disabled={busy}>Hủy</Button>
        <Button type="submit" disabled={busy || (!partner && !canCreate)}>{busy ? "Đang lưu…" : "Lưu đối tác"}</Button>
      </div>
    </form>
  </Dialog>;
}

function ScopeEditor({ partner, onClose, onSave, onBusy }: {
  partner: Partner; onClose: () => void; onSave: () => Promise<void>; onBusy: (busy: boolean) => void;
}) {
  const schools = useResource<School[]>("/admin/partners/schools");
  const [selectedSchools, setSelectedSchools] = useState(partner.data_scope?.school_ids ?? []);
  const [contactIds, setContactIds] = useState(partner.data_scope?.contact_ids.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useLayoutEffect(() => { onBusy(busy); return () => onBusy(false); }, [busy, onBusy]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || schools.state !== "ready") return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/partners/${encodeURIComponent(partner.code)}`, {method: "PATCH", json: {
        data_scope: {school_ids: selectedSchools, contact_ids: contactIds.split(/[,\s]+/).filter(Boolean)},
      }});
      await onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu phạm vi.");
    } finally { setBusy(false); }
  }

  return <Dialog dismissible={!busy} width="wide" title={`Phạm vi dữ liệu · ${partner.code}`} onClose={onClose}>
    <form className="sys-form sys-partner-form" onSubmit={submit} aria-busy={busy}>
      {!partner.data_scope && <Notice>Khi lưu, cấu hình này sẽ thay phạm vi ETL cũ của đối tác.</Notice>}
      <p className="sys-muted">Đã chọn {selectedSchools.length} trường. “Chọn tất cả” áp dụng cho các kết quả đang hiện trong từng nhóm. Để trống cả trường và mã liên hệ sẽ không cấp bản ghi nào.</p>
      <State status={schools.state} error={schools.state === "error" ? schools.message : undefined}
        retry={schools.retry} refreshError={schools.refreshError}>
        {schools.state === "ready" && <SchoolPicker schools={schools.data} selected={selectedSchools}
          onChange={setSelectedSchools} multiple disabled={busy} />}
      </State>
      <TextField label="Mã liên hệ được cấp thêm" labelPlacement="above" value={contactIds} disabled={busy} maxLength={12000}
        onChange={event => setContactIds(event.target.value)} supportingText="Nhập mã từ màn Liên hệ, cách nhau bằng dấu phẩy."/>
      {error && <Notice error>{error}</Notice>}
      <div className="sys-dialog-actions">
        <Button type="button" variant="text" onClick={onClose} disabled={busy}>Hủy</Button>
        <Button type="submit" disabled={busy || schools.state !== "ready"}>{busy ? "Đang lưu…" : "Lưu phạm vi"}</Button>
      </div>
    </form>
  </Dialog>;
}

export default function Partners({ onDirtyChange, onBusyChange }: { onDirtyChange?: (dirty: boolean) => void; onBusyChange?: (busy:boolean)=>void }) {
  const { user, retryScope } = useWorkspace();
  const selectionKey = `neu-admin-selected:${user.username}`;
  const remote = useResource<PartnersResult>("/admin/partners");
  // Keep verified server reads locally after mutations to avoid unmounting the editor.
  const [verified, setVerified] = useState<PartnersResult | null>(null);
  const data = verified ?? (remote.state === "ready" ? remote.data : null);
  const [selected, setSelected] = useState<string | null>(() => {
    try { return sessionStorage.getItem(selectionKey); } catch { return null; }
  });
  function select(code: string) {
    setSelected(code);
    try { sessionStorage.setItem(selectionKey, code); } catch { /* ignore */ }
  }
  const [editing, setEditing] = useState<{ code: string; value: Draft } | null>(null);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | "__refresh__" | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [profile, setProfile] = useState<"create" | Partner | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [initialAccount, setInitialAccount] = useState<InitialAccount | null>(null);
  const [resetAccount, setResetAccount] = useState<AdminUser | null>(null);
  const [scopeEditor, setScopeEditor] = useState<Partner | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const list = data?.partners ?? [];
  const rows = useMemo(() => list.filter((p) => `${p.name} ${p.code} ${p.type}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))), [list, search]);
  const active = list.find((p) => p.code === selected) ?? list[0];
  const accounts = useResource<AdminUser[]>(active ? `/admin/users?${new URLSearchParams({partner_code: active.code})}` : null);
  const draft = active && editing?.code === active.code ? editing.value : active ? toDraft(active) : null;
  const dirty = Boolean(active && draft && !same(toDraft(active), draft));
  useLayoutEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useLayoutEffect(()=>{onBusyChange?.(saving || profileBusy);return()=>onBusyChange?.(false);},[saving,profileBusy,onBusyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  const differences = active && draft ? changes(active, draft, data?.modules ?? {}) : [];

  function update(updater: (old: Draft) => Draft) {
    if (!active || !draft) return;
    setEditing({ code: active.code, value: updater(draft) });
    setError(""); setSuccess("");
  }
  function pick(code: string) {
    if (!active || active.code === code || saving || refreshing) return;
    if (dirty) { setPending(code); return; }
    select(code); setEditing(null); setError(""); setSuccess("");
  }
  async function refresh() {
    setRefreshing(true); setError(""); setSuccess("");
    try {
      const fresh = await api<PartnersResult>("/admin/partners");
      setVerified(fresh); setEditing(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể tải lại danh sách đối tác."); }
    finally { setRefreshing(false); }
  }
  function requestRefresh() { if (dirty) setPending("__refresh__"); else void refresh(); }
  function confirmDiscard() {
    if (pending === "__refresh__") { setEditing(null); void refresh(); }
    else if (pending) { select(pending); setEditing(null); setError(""); setSuccess(""); }
    setPending(null);
  }
  async function save() {
    if (!active || !draft || !dirty || saving) return;
    const code = active.code;
    const intended = { modules: [...draft.modules], can_view_pii: draft.can_view_pii, can_export_reports: draft.can_export_reports, active: draft.active };
    setSaving(true); setError(""); setSuccess("");
    try {
      // Optimistic concurrency check with the read-only API: avoid blindly
      // overwriting a configuration modified since this editor opened.
      // This is not atomic; true conflict protection requires an API version/ETag.
      const before = await api<PartnersResult>("/admin/partners");
      const onServer = before.partners.find((p) => p.code === code);
      if (!onServer || !same(toDraft(active), toDraft(onServer))) {
        setVerified(before);
        throw new Error("Quyền đã được thay đổi từ một phiên quản trị khác. Vui lòng làm mới và kiểm tra cấu hình mới trước khi lưu.");
      }
      const patched = await api<{ ok: boolean }>(`/admin/partners/${encodeURIComponent(code)}`, { method: "PATCH", json: intended });
      if (!patched.ok) throw new Error("Máy chủ chưa xác nhận cập nhật phân quyền.");
      // PATCH responds {ok:true}; verify persisted settings through a fresh GET.
      retryScope();
      const fresh = await api<PartnersResult>("/admin/partners");
      const stored = fresh.partners.find((p) => p.code === code);
      setVerified(fresh);
      if (!stored || !same(intended, toDraft(stored))) {
        setError("Máy chủ đã phản hồi nhưng cấu hình đọc lại chưa khớp. Vui lòng kiểm tra trước khi thử lưu thêm lần nữa.");
      } else {
        setEditing({ code, value: toDraft(stored) });
        setSuccess(`Đã lưu và kiểm tra lại quyền của ${stored.name} trên máy chủ.`);
      }
    } catch (e) {
      setError(e instanceof Error ? `${e.message} Nếu thao tác vừa được gửi, hãy tải lại cấu hình từ máy chủ để xác minh trạng thái.` : "Không thể xác minh cập nhật quyền.");
    } finally { setSaving(false); setConfirmSave(false); }
  }

  return <div className="sys-stack sys-partners">
    <Section title="Đối tác & phân quyền" description="Chọn đối tác bên trái, kiểm tra quyền hiện tại và chỉ lưu những thay đổi cần thiết."
      actions={<Button icon={<Plus/>} disabled={dirty || saving || refreshing} onClick={() => setProfile("create")}>Thêm đối tác</Button>}>
      {error && <div className="sys-space-after"><Notice error>{error} <Button type="button" variant="outlined" size="xs" disabled={saving || refreshing} onClick={requestRefresh}>Tải cấu hình từ máy chủ</Button></Notice></div>}
      {success && <div className="sys-space-after"><Notice success>{success}</Notice></div>}
      <State status={data ? "ready" : remote.state} refreshError={remote.refreshError} error={remote.state === "error" ? remote.message : undefined} retry={remote.retry}>
        {data && <div className="sys-partners-layout sys-partners-layout--updated">
          <div className="sys-partner-picker">
            <label className="sys-partner-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Tìm đối tác</span>
              <input value={search} type="search" placeholder="Tìm tên, mã hoặc loại đối tác" onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="sys-picker-meta"><strong>{rows.length} đối tác</strong><span>Chọn để chỉnh sửa quyền</span></div>
            <div className="sys-partner-options" role="group" aria-label="Danh sách đối tác">
              {rows.map((p) => {
                const isSelected = active?.code === p.code;
                return <button type="button" className={`sys-partner-choice${isSelected ? " sys-partner-choice--active" : ""}`}
                  key={p.code} aria-pressed={isSelected} aria-label={`Chọn đối tác ${p.name} (${p.code})`} disabled={saving || refreshing}
                  onClick={() => pick(p.code)}>
                  <span className="sys-partner-avatar" aria-hidden="true">{p.code.slice(0, 2)}</span>
                  <span className="sys-partner-copy"><strong>{p.name}</strong><small>{p.code} · {p.type}</small></span>
                  {!isSelected && <ChevronRight size={18} className="sys-partner-arrow" aria-hidden="true" />}
                </button>;
              })}
              {!rows.length && <p className="sys-partner-empty">Không tìm thấy đối tác phù hợp.</p>}
            </div>
            {active && !rows.some((p) => p.code === active.code) &&
              <p className="sys-muted sys-partner-hidden">Đang chỉnh sửa {active.code}, nhưng đối tác này không có trong kết quả tìm kiếm. <button type="button" onClick={() => setSearch("")}>Hiện đối tác đang chọn</button></p>}
          </div>

          {active && draft && <section className="sys-permissions-editor" aria-labelledby="sys-permissions-title" aria-busy={saving}>
            <header className="sys-permissions-head">
              <div><div className="sys-permissions-eyebrow"><ShieldCheck size={16} aria-hidden="true" /> ĐANG CHỈNH SỬA · {active.code}</div>
                <h3 id="sys-permissions-title">{active.name}</h3><p>{active.description}</p><Button size="xs" variant="outlined" disabled={dirty || saving || refreshing} onClick={() => setProfile(active)}>Sửa thông tin</Button></div>
              <Chip kind={active.active ? "good" : "bad"}>{active.active ? "Đang hoạt động" : "Đã khóa"}</Chip>
            </header>
            <div className="sys-permissions-stats">
              <span><b>{formatNumber(active.users)}</b> tài khoản</span><span><b>{formatNumber(active.records.contacts)}</b> liên hệ</span>
              <span><b>{formatNumber(active.records.leads)}</b> lead</span><span><b>{formatNumber(active.records.exam_candidates)}</b> thí sinh</span>
            </div>
            <div className="sys-permission-section">
              <h4>Tài khoản đăng nhập</h4>
              <State status={accounts.state} error={accounts.state === "error" ? accounts.message : undefined} retry={accounts.retry}>
                {accounts.state === "ready" && (
                  accounts.data.length ? <ul className="sys-partner-accounts">
                    {accounts.data.map(account => <li key={account.username}>
                        <span><strong>{account.username}</strong> · {account.full_name}
                          {account.username === active.default_username ? " · Mặc định" : ""}
                          {account.active ? "" : " · Đã khóa"}
                        </span>
                        <Button size="xs" variant="outlined" disabled={dirty || saving || refreshing}
                          onClick={() => setResetAccount(account)}>Đặt lại mật khẩu</Button>
                    </li>)}
                  </ul> : <p className="sys-muted">Chưa có tài khoản. Có thể cấp thêm trong mục Tài khoản.</p>
                )}
              </State>
            </div>
            <details className="sys-scope-explain">
              <summary>{active.data_scope ? "Phạm vi đã cấu hình" : "Phạm vi dữ liệu do ETL quy định"}</summary>
              <p>{active.scope_rule}</p>
              {active.data_scope && <p>{active.data_scope.school_ids.length} trường · {active.data_scope.contact_ids.length} mã liên hệ được cấp thêm</p>}
              <Button size="xs" variant="outlined" disabled={dirty || saving || refreshing} onClick={() => setScopeEditor(active)}>Cấu hình phạm vi</Button>
            </details>
            <div className="sys-permission-section">
              <div className="sys-permission-title-row"><div><h4>Quyền truy cập module</h4><p>Chọn những trang đối tác được phép mở. Dữ liệu từng dòng vẫn do API giới hạn.</p></div><span className="sys-permission-counter">{draft.modules.length}/{Object.keys(data.modules).length} bật</span></div>
              <div className="sys-permission-choices">
                {Object.entries(data.modules).map(([id, title]) => <Option key={id} title={title} checked={draft.modules.includes(id)} disabled={saving}
                  onChange={(checked) => update((old) => ({ ...old, modules: checked ? [...old.modules, id] : old.modules.filter((x) => x !== id) }))} />)}
              </div>
            </div>
            <div className="sys-permission-section">
              <h4>Truy cập và dữ liệu cá nhân</h4>
              <p className="sys-privileged-hint"><AlertTriangle size={17} aria-hidden="true"/> Quyền nhạy cảm: thay đổi ở đây có thể cho phép xem dữ liệu định danh hoặc chặn đăng nhập toàn bộ đối tác.</p>
              <div className="sys-permission-choices sys-permission-choices--single">
                <Option title="Cho phép xem thông tin cá nhân" supporting="Email, số điện thoại, CCCD và dữ liệu định danh." checked={draft.can_view_pii} disabled={saving} onChange={(value) => update((old) => ({ ...old, can_view_pii: value }))}/>
                <Option title="Cho phép xuất và tải báo cáo" checked={draft.can_export_reports} disabled={saving} onChange={value => update(old => ({ ...old, can_export_reports: value }))}/>
                <Option title="Cho phép đối tác đăng nhập" supporting="Tắt quyền này sẽ chặn các tài khoản thuộc đối tác." checked={draft.active} disabled={saving} onChange={(value) => update((old) => ({ ...old, active: value }))}/>
              </div>
            </div>
            <div className={`sys-save-panel${dirty ? " sys-save-panel--dirty" : ""}`} role="status">
              <div className="sys-save-panel-text">
                {dirty ? <><strong><AlertTriangle size={17} aria-hidden="true" /> {differences.length} thay đổi chưa lưu</strong><span>Chưa có thay đổi nào được gửi đến máy chủ.</span></>
                  : <><strong><CheckCheck size={17} aria-hidden="true" /> Đang hiển thị cấu hình đã lưu</strong><span>Chọn quyền ở trên để thay đổi.</span></>}
              </div>
              <div className="sys-save-panel-actions">
                <Button type="button" variant="text" icon={<RotateCcw />} disabled={!dirty || saving} onClick={() => { setEditing(null); setError(""); }}>Hoàn tác</Button>
                <Button type="button" icon={<Save />} disabled={!dirty || saving} onClick={() => setConfirmSave(true)}>{saving ? "Đang lưu…" : "Lưu thay đổi"}</Button>
              </div>
            </div>
          </section>}
        </div>}
      </State>
    </Section>

    {profile && <PartnerEditor partner={profile === "create" ? undefined : profile} onBusy={setProfileBusy}
      onClose={() => setProfile(null)} onSave={async (code, account) => {
        setProfile(null);
        if (account) setInitialAccount(account);
        setSearch("");
        select(code);
        retryScope();
        await refresh();
      }}/> }
    {initialAccount && <Dialog title="Tài khoản đối tác đã được tạo" onClose={() => setInitialAccount(null)}>
      <div className="sys-form">
        <Notice success>Lưu lại mật khẩu ban đầu trước khi đóng. Đối tác nên đổi mật khẩu sau lần đăng nhập đầu tiên.</Notice>
        <TextField label="Tên đăng nhập" labelPlacement="above" readOnly value={initialAccount.username}/>
        <TextField label="Mật khẩu ban đầu" labelPlacement="above" readOnly value={initialAccount.temporary_password}/>
        <div className="sys-dialog-actions"><Button onClick={() => setInitialAccount(null)}>Đóng</Button></div>
      </div>
    </Dialog>}
    {resetAccount && <PasswordReset user={resetAccount} onBusyChange={setProfileBusy} onClose={() => setResetAccount(null)}
      done={message => { setResetAccount(null); setSuccess(message); }}/>}
    {scopeEditor && <ScopeEditor partner={scopeEditor} onBusy={setProfileBusy} onClose={() => setScopeEditor(null)}
      onSave={async () => {
        setScopeEditor(null);
        retryScope();
        await refresh();
      }}/>}
    {pending && <Dialog title="Bỏ các thay đổi chưa lưu?" description="Bạn đã chỉnh sửa quyền nhưng chưa lưu lên máy chủ." onClose={() => setPending(null)}>
      <p className="sys-muted">{differences.length} thay đổi hiện tại sẽ bị bỏ qua. Cấu hình đã lưu trên máy chủ không bị ảnh hưởng.</p>
      <div className="sys-dialog-actions"><Button type="button" variant="text" onClick={() => setPending(null)}>Tiếp tục chỉnh sửa</Button>
        <Button type="button" onClick={confirmDiscard}>Bỏ thay đổi</Button></div>
    </Dialog>}
    {confirmSave && active && <Dialog dismissible={!saving} title={`Xác nhận phân quyền · ${active.code}`} description="Chỉ những thay đổi dưới đây được áp dụng vào cấu hình đối tác." onClose={() => !saving && setConfirmSave(false)}>
      <ul className="sys-change-list">{differences.map((change) => <li key={change}>{change}</li>)}</ul>
      {draft?.can_view_pii && !active.can_view_pii && <Notice error>Bạn đang cấp quyền xem thông tin định danh cá nhân.</Notice>}
      {!draft?.active && active.active && <Notice error>Bạn đang khóa quyền đăng nhập của đối tác.</Notice>}
      <div className="sys-dialog-actions"><Button type="button" variant="text" disabled={saving} onClick={() => setConfirmSave(false)}>Hủy</Button>
        <Button type="button" icon={<Save />} disabled={saving} onClick={() => void save()}>{saving ? "Đang lưu…" : "Xác nhận lưu"}</Button></div>
    </Dialog>}
  </div>;
}
