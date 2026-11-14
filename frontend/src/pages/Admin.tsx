import { useEffect, useState, type FormEvent } from "react";
import { Note, SimpleTable } from "../components/ChartCard";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { fmtInt, fmtUtc } from "../lib/format";
import { useApi } from "../lib/hooks";

type UserRow = { username: string; full_name: string; role: "admin" | "partner"; partner_code: string | null; active: boolean; created_at: string; last_login: string | null };
type PartnerRow = {
  code: string; name: string; type: string; description: string; scope_rule: string; modules: string[]; can_view_pii: boolean; active: boolean;
  users: number; records: Record<string, number>;
};
type AuditRow = { at: string; action: string; username: string | null; ok: boolean; ip: string | null; detail: Record<string, unknown> };

const ACTION_LABEL: Record<string, string> = {
  login: "Đăng nhập", change_password: "Đổi mật khẩu", user_create: "Tạo tài khoản", user_update: "Sửa tài khoản",
  user_reset_password: "Đặt lại mật khẩu", partner_update: "Sửa quyền đối tác",
  data_reload: "Nạp lại dữ liệu", data_upload: "Tải lên file Excel",
};

function CreateUser({ partners, onDone, onClose }: { partners: PartnerRow[]; onDone: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ username: "", full_name: "", role: "partner", partner_code: partners[0]?.code ?? "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api("/admin/users", { method: "POST", json: { ...form, partner_code: form.role === "partner" ? form.partner_code : null } });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <h3>Tạo tài khoản</h3>
        <label className="field"><span>Tên đăng nhập</span><input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required minLength={3} autoFocus /></label>
        <label className="field"><span>Họ tên / đơn vị</span><input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></label>
        <label className="field"><span>Vai trò</span>
          <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="partner">Đối tác</option><option value="admin">Quản trị viên</option>
          </select>
        </label>
        {form.role === "partner" && (
          <label className="field"><span>Đối tác</span>
            <select className="select" value={form.partner_code} onChange={(e) => setForm({ ...form, partner_code: e.target.value })}>
              {partners.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
            </select>
          </label>
        )}
        <label className="field"><span>Mật khẩu ban đầu</span><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete="new-password" /></label>
        {error && <div className="error">{error}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={onClose}>Huỷ</button>
          <button className="btn primary">Tạo tài khoản</button>
        </div>
      </form>
    </div>
  );
}

function ResetPassword({ username, onClose }: { username: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api(`/admin/users/${encodeURIComponent(username)}/reset-password`, { method: "POST", json: { password } });
      setMsg({ ok: true, text: "Đã đặt lại mật khẩu, các phiên cũ của tài khoản đã bị đăng xuất." });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  };
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <h3>Đặt lại mật khẩu · @{username}</h3>
        <label className="field"><span>Mật khẩu mới</span><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoFocus autoComplete="new-password" /></label>
        {msg && <div className={msg.ok ? "badge good" : "error"}>{msg.text}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={onClose}>Đóng</button>
          <button className="btn primary">Đặt lại</button>
        </div>
      </form>
    </div>
  );
}

function PartnerCard({ p, modules, onSaved }: { p: PartnerRow; modules: Record<string, string>; onSaved: () => void }) {
  const [draft, setDraft] = useState({ modules: p.modules, can_view_pii: p.can_view_pii, active: p.active });
  const [state, setState] = useState<string | null>(null);
  useEffect(() => setDraft({ modules: p.modules, can_view_pii: p.can_view_pii, active: p.active }), [p]);
  const dirty = JSON.stringify(draft) !== JSON.stringify({ modules: p.modules, can_view_pii: p.can_view_pii, active: p.active });
  const toggle = (m: string) => setDraft((d) => ({ ...d, modules: d.modules.includes(m) ? d.modules.filter((x) => x !== m) : [...d.modules, m] }));
  const save = async () => {
    try {
      await api(`/admin/partners/${p.code}`, { method: "PATCH", json: draft });
      setState("Đã lưu");
      onSaved();
    } catch (err) {
      setState((err as Error).message);
    }
  };
  return (
    <section className="card col-6">
      <div className="card-head">
        <div>
          <h2>{p.code} · {p.name}</h2>
          <div className="sub">{p.type} — {p.description}</div>
        </div>
        <div className="actions">{p.active ? <span className="badge good">Hoạt động</span> : <span className="badge bad">Đã khoá</span>}</div>
      </div>
      <div className="stack">
        <div className="text-2" style={{ fontSize: 13 }}><b>Phạm vi dữ liệu:</b> {p.scope_rule}</div>
        <div className="row" style={{ fontSize: 13 }}>
          <span className="badge">{fmtInt(p.records.contacts ?? 0)} liên hệ</span>
          <span className="badge">{fmtInt(p.records.leads ?? 0)} lead</span>
          <span className="badge">{fmtInt(p.records.exam_candidates ?? 0)} bản ghi điểm</span>
          <span className="badge">{p.users} tài khoản</span>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Mục dashboard được xem</div>
          <div className="row">
            {Object.entries(modules).map(([m, label]) => (
              <label className="check" key={m}><input type="checkbox" checked={draft.modules.includes(m)} onChange={() => toggle(m)} />{label}</label>
            ))}
          </div>
        </div>
        <div className="row">
          <label className="check"><input type="checkbox" checked={draft.can_view_pii} onChange={(e) => setDraft({ ...draft, can_view_pii: e.target.checked })} />Xem thông tin cá nhân (email, SĐT, CCCD)</label>
          <label className="check"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />Cho phép đăng nhập</label>
        </div>
        <div className="row">
          <button className="btn primary sm" disabled={!dirty} onClick={save}>Lưu thay đổi</button>
          {state && <span className="muted">{state}</span>}
        </div>
      </div>
    </section>
  );
}

type DataStatus = {
  contacts: number;
  signups: number;
  leads: number;
  exam_candidates: number;
  exam_scores: number;
};

function DataManagement() {
  const statusApi = useApi<DataStatus>("/admin/data-status");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; warn?: boolean } | null>(null);
  const [targetName, setTargetName] = useState<string>("Demo_Data_khách_hàng.xlsx");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const reloadData = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api<{ ok: boolean; message: string; counts: Record<string, number> }>("/admin/reload-data", {
        method: "POST",
      });
      setMsg({ text: `${res.message} (Contacts: ${res.counts.contacts}, Leads: ${res.counts.leads}, Thí sinh: ${res.counts.candidates})` });
      statusApi.reload();
    } catch (err) {
      setMsg({ text: (err as Error).message, warn: true });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setMsg(null);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const res = await api<{ ok: boolean; message: string; counts: Record<string, number> }>(
        `/admin/upload-file?filename=${encodeURIComponent(targetName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: buffer,
        }
      );
      setMsg({ text: `${res.message} (Contacts: ${res.counts.contacts}, Leads: ${res.counts.leads}, Thí sinh: ${res.counts.candidates})` });
      setSelectedFile(null);
      statusApi.reload();
    } catch (err) {
      setMsg({ text: (err as Error).message, warn: true });
    } finally {
      setLoading(false);
    }
  };

  const d = statusApi.data;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <Note>
        Tính năng này cho phép Quản trị viên cập nhật hoặc tải file Excel dữ liệu mới trực tiếp lên máy chủ mà không cần thao tác qua dòng lệnh Terminal. Hệ thống sẽ tự động làm sạch, chuẩn hóa và đối soát CSDL ngay lập tức.
      </Note>

      {msg && <Note warn={msg.warn}>{msg.text}</Note>}

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Trạng thái dữ liệu trong CSDL MongoDB</h2>
            <div className="sub">Số lượng bản ghi hiện có trong hệ thống</div>
          </div>
          <div className="actions">
            <button className="btn primary sm" onClick={reloadData} disabled={loading}>
              {loading ? "Đang xử lý…" : "🔄 Nạp lại & làm sạch CSDL"}
            </button>
          </div>
        </div>

        <div className="grid" style={{ gap: 12, padding: "12px 0" }}>
          <div className="card col-2" style={{ padding: 14 }}>
            <div className="sub">Hồ sơ CRM (Contacts)</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmtInt(d?.contacts)}</div>
          </div>
          <div className="card col-2" style={{ padding: 14 }}>
            <div className="sub">Đăng ký Web (Signups)</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmtInt(d?.signups)}</div>
          </div>
          <div className="card col-2" style={{ padding: 14 }}>
            <div className="sub">Lead Talkshow & FB</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmtInt(d?.leads)}</div>
          </div>
          <div className="card col-3" style={{ padding: 14 }}>
            <div className="sub">Thí sinh thi (Candidates)</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmtInt(d?.exam_candidates)}</div>
          </div>
          <div className="card col-3" style={{ padding: 14 }}>
            <div className="sub">Đầu điểm thi (Scores)</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmtInt(d?.exam_scores)}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Tải lên file Excel mới</h2>
            <div className="sub">Chọn file từ máy tính để cập nhật trực tiếp vào hệ thống</div>
          </div>
        </div>

        <form onSubmit={uploadFile} className="stack" style={{ gap: 14, maxWidth: 650, padding: "8px 0" }}>
          <label className="field">
            <span>Loại file dữ liệu cần cập nhật</span>
            <select
              className="select"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
            >
              <option value="Demo_Data_khách_hàng.xlsx">
                Dữ liệu khách hàng (Đăng ký web, Webinar Google, Facebook Ads)
              </option>
              <option value="Điểm giả lập.xlsx">
                Dữ liệu điểm thi (Điểm thi thí sinh, Vòng loại & Chung kết)
              </option>
            </select>
          </label>

          <label className="field">
            <span>Chọn file Excel (.xlsx) từ máy tính</span>
            <input
              className="input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>

          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            <button className="btn primary" type="submit" disabled={loading || !selectedFile}>
              {loading ? "Đang tải lên & nạp CSDL…" : "⬆ Tải lên & Cập nhật CSDL"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"users" | "partners" | "audit" | "data">("users");
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const users = useApi<UserRow[]>("/admin/users");
  const partners = useApi<{ partners: PartnerRow[]; modules: Record<string, string> }>("/admin/partners");
  const audit = useApi<AuditRow[]>(tab === "audit" ? "/admin/audit?limit=200" : null);
  const [error, setError] = useState<string | null>(null);

  const setActive = async (u: UserRow, active: boolean) => {
    setError(null);
    try {
      await api(`/admin/users/${encodeURIComponent(u.username)}`, { method: "PATCH", json: { active } });
      users.reload();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  const partnerName = (code: string | null) => partners.data?.partners.find((p) => p.code === code)?.name ?? code;

  return (
    <>
      <div className="tabs" role="tablist">
        <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}>Tài khoản</button>
        <button className={tab === "partners" ? "on" : ""} onClick={() => setTab("partners")}>Đối tác & phân quyền</button>
        <button className={tab === "data" ? "on" : ""} onClick={() => setTab("data")}>Nạp & Quản lý dữ liệu</button>
        <button className={tab === "audit" ? "on" : ""} onClick={() => setTab("audit")}>Nhật ký truy cập</button>
      </div>
      {error && <Note warn>{error}</Note>}

      {tab === "users" && (
        <section className="card">
          <div className="card-head">
            <div><h2>Tài khoản đăng nhập</h2><div className="sub">Mỗi tài khoản đối tác chỉ xem dữ liệu gắn mã đối tác đó</div></div>
            <div className="actions"><button className="btn primary sm" onClick={() => setCreating(true)} disabled={!partners.data}>+ Tạo tài khoản</button></div>
          </div>
          <SimpleTable<UserRow>
            rows={users.data ?? []}
            columns={[
              { key: "username", label: "Tên đăng nhập", render: (u) => <b>@{u.username}</b> },
              { key: "full_name", label: "Họ tên / đơn vị" },
              { key: "role", label: "Vai trò", render: (u) => (u.role === "admin" ? <span className="badge accent">Quản trị</span> : <span className="badge">Đối tác</span>) },
              { key: "partner_code", label: "Đối tác", render: (u) => (u.partner_code ? `${u.partner_code} · ${partnerName(u.partner_code)}` : "–") },
              { key: "active", label: "Trạng thái", render: (u) => (u.active ? <span className="badge good">Hoạt động</span> : <span className="badge bad">Đã khoá</span>) },
              { key: "last_login", label: "Đăng nhập gần nhất", render: (u) => fmtUtc(u.last_login) },
              {
                key: "actions", label: "", render: (u) => (
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn sm" onClick={() => setResetting(u.username)}>Đặt lại mật khẩu</button>
                    {u.username !== user?.username && (
                      u.active
                        ? <button className="btn sm danger" onClick={() => setActive(u, false)}>Khoá</button>
                        : <button className="btn sm" onClick={() => setActive(u, true)}>Mở khoá</button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      {tab === "partners" && partners.data && (
        <>
          <Note>Phân quyền 2 lớp: (1) mục dashboard được mở theo cấu hình dưới đây; (2) từng dòng dữ liệu được gắn mã đối tác khi nạp từ Excel, API tự lọc theo mã nên đối tác không thể xem dữ liệu ngoài phạm vi kể cả khi gọi API trực tiếp.</Note>
          <div className="grid">
            {partners.data.partners.map((p) => <PartnerCard key={p.code} p={p} modules={partners.data!.modules} onSaved={partners.reload} />)}
          </div>
        </>
      )}

      {tab === "data" && <DataManagement />}

      {tab === "audit" && (
        <section className={`card${audit.loading ? " loading" : ""}`}>
          <div className="card-head"><div><h2>Nhật ký truy cập</h2><div className="sub">200 sự kiện gần nhất</div></div></div>
          <SimpleTable<AuditRow>
            rows={audit.data ?? []}
            columns={[
              { key: "at", label: "Thời điểm", render: (a) => fmtUtc(a.at) },
              { key: "action", label: "Hành động", render: (a) => ACTION_LABEL[a.action] ?? a.action },
              { key: "username", label: "Tài khoản", render: (a) => (a.username ? `@${a.username}` : "–") },
              { key: "ok", label: "Kết quả", render: (a) => (a.ok ? <span className="badge good">Thành công</span> : <span className="badge bad">Thất bại</span>) },
              { key: "ip", label: "IP", render: (a) => a.ip ?? "–" },
              { key: "detail", label: "Chi tiết", render: (a) => Object.entries(a.detail ?? {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(",") : String(v)}`).join(" · ") || "–" },
            ]}
          />
        </section>
      )}

      {creating && partners.data && <CreateUser partners={partners.data.partners} onClose={() => setCreating(false)} onDone={() => { setCreating(false); users.reload(); partners.reload(); }} />}
      {resetting && <ResetPassword username={resetting} onClose={() => setResetting(null)} />}
    </>
  );
}
