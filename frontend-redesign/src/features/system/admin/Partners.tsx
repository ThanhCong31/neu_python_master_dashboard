import { useLayoutEffect, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCheck, ChevronRight, RotateCcw, Save, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { useWorkspace } from "@/app/workspace";
import { api } from "@/services/api";
import { useResource } from "@/services/useResource";
import type { Partner, PartnersResult } from "../types";
import { Chip, Dialog, formatNumber, Notice, Section, State } from "../components/Elements";

type Draft = { modules: string[]; can_view_pii: boolean; active: boolean };
const toDraft = (p: Partner): Draft => ({ modules: [...p.modules], can_view_pii: p.can_view_pii, active: p.active });
const sameModules = (a: string[], b: string[]) => a.length === b.length && a.every((key) => b.includes(key));
const same = (a: Draft, b: Draft) => a.active === b.active && a.can_view_pii === b.can_view_pii && sameModules(a.modules, b.modules);

function changes(original: Partner, draft: Draft, labels: Record<string, string>) {
  const list: string[] = [];
  for (const code of draft.modules) if (!original.modules.includes(code)) list.push(`Cấp quyền: ${labels[code] ?? code}`);
  for (const code of original.modules) if (!draft.modules.includes(code)) list.push(`Thu hồi: ${labels[code] ?? code}`);
  if (draft.can_view_pii !== original.can_view_pii) list.push(`${draft.can_view_pii ? "Cho phép" : "Thu hồi quyền"} xem thông tin cá nhân`);
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

export default function Partners({ onDirtyChange, onBusyChange }: { onDirtyChange?: (dirty: boolean) => void; onBusyChange?: (busy:boolean)=>void }) {
  const { user } = useWorkspace();
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
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const list = data?.partners ?? [];
  const rows = useMemo(() => list.filter((p) => `${p.name} ${p.code} ${p.type}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))), [list, search]);
  const active = list.find((p) => p.code === selected) ?? list[0];
  const draft = active && editing?.code === active.code ? editing.value : active ? toDraft(active) : null;
  const dirty = Boolean(active && draft && !same(toDraft(active), draft));
  useLayoutEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useLayoutEffect(()=>{onBusyChange?.(saving);return()=>onBusyChange?.(false);},[saving,onBusyChange]);
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
    const intended = { modules: [...draft.modules], can_view_pii: draft.can_view_pii, active: draft.active };
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

  return <div className="sys-stack">
    <Section title="Đối tác & phân quyền" description="Chọn đối tác bên trái, kiểm tra quyền hiện tại và chỉ lưu những thay đổi cần thiết."
>
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
                <h3 id="sys-permissions-title">{active.name}</h3><p>{active.description}</p></div>
              <Chip kind={active.active ? "good" : "bad"}>{active.active ? "Đang hoạt động" : "Đã khóa"}</Chip>
            </header>
            <div className="sys-permissions-stats">
              <span><b>{formatNumber(active.users)}</b> tài khoản</span><span><b>{formatNumber(active.records.contacts)}</b> liên hệ</span>
              <span><b>{formatNumber(active.records.leads)}</b> lead</span><span><b>{formatNumber(active.records.exam_candidates)}</b> thí sinh</span>
            </div>
            <details className="sys-scope-explain"><summary>Phạm vi dữ liệu do ETL quy định</summary><p>{active.scope_rule}</p></details>
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
