import { SystemSelect } from "../components/SystemSelect";
import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { Database, RotateCcw, UploadCloud } from "lucide-react";
import { RefreshButton } from "@/shared/PageActions";
import { Button } from "@/components/expressive/button";
import { api } from "@/services/api";
import { useResource } from "@/services/useResource";
import type { DataCounts, ImportRun } from "../types";
import { Chip, DataTable, Dialog, formatDate, formatNumber, FormField, Metric, Notice, Section, State } from "../components/Elements";

const FILES = [
  { value: "Demo_Data_khách_hàng.xlsx", label: "Dữ liệu khách hàng / CRM (Webinar Google, FB Ads, Đăng ký web)" },
  { value: "Diểm giả lập.xlsx", label: "Dữ liệu điểm thi (Điểm thi thí sinh, Vòng loại & Chung kết)" },
] as const;

const MAX_BYTES = 25 * 1024 * 1024;
interface Result { ok: boolean; message: string; counts: Record<string, number> }

export default function DataManagement({ onBusyChange }: { onBusyChange?: (busy: boolean) => void } = {}) {
  const status = useResource<DataCounts>("/admin/data-status");
  const history = useResource<ImportRun[]>("/admin/imports");
  const [target, setTarget] = useState<string>(FILES[0].value);
  const inputFile = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dialog, setDialog] = useState<"reload" | "upload" | null>(null);
  const [busy, setBusy] = useState(false);
  useLayoutEffect(() => { onBusyChange?.(busy); return () => onBusyChange?.(false); }, [busy, onBusyChange]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const counts = status.state === "ready" ? status.data : null;

  function updateFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.currentTarget.files?.[0] ?? null);
    setError("");
    setSuccess("");
  }

  function open(kind: "reload" | "upload") {
    setError("");
    setSuccess("");
    if (kind === "upload") {
      if (!file) {
        setError("Vui lòng chọn file từ máy tính trước khi tải lên.");
        return;
      }
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        setError("Chỉ hỗ trợ file định dạng .xlsx, .xls hoặc .csv.");
        return;
      }
      if (file.size === 0 || file.size > MAX_BYTES) {
        setError("File phải có dung lượng lớn hơn 0 và không vượt 25 MB.");
        return;
      }
    }
    setDialog(kind);
  }

  async function execute() {
    if (busy || !dialog) return;
    setBusy(true);
    setError("");
    try {
      let result: Result;
      if (dialog === "reload") {
        result = await api<Result>("/admin/reload-data", { method: "POST" });
      } else {
        if (!file) throw new Error("Không có file tải lên.");
        result = await api<Result>(`/admin/upload-file?filename=${encodeURIComponent(target)}`, {
          method: "POST",
          body: file,
          headers: { "Content-Type": "application/octet-stream" },
        });
      }
      if (!result.ok) throw new Error("Máy chủ chưa xác nhận xử lý dữ liệu.");
      const c = result.counts || {};
      setSuccess(`${result.message} · Contacts: ${formatNumber(c.contacts ?? 0)} · Leads: ${formatNumber(c.leads ?? 0)} · Thí sinh: ${formatNumber(c.candidates ?? 0)}`);
      setDialog(null);
      setFile(null);
      if (inputFile.current) inputFile.current.value = "";
      status.retry();
      history.retry();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể nạp dữ liệu.");
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sys-stack">
      <Notice>
        Tính năng này cho phép Quản trị viên cập nhật hoặc tải file Excel trực tiếp lên máy chủ mà không cần thao tác qua dòng lệnh Terminal. Hệ thống sẽ tự động làm sạch, chuẩn hóa và đối soát CSDL ngay lập tức.
      </Notice>
      {error && <Notice error>{error}</Notice>}
      {success && <Notice success>{success}</Notice>}
      <Section
        title="Trạng thái dữ liệu"
        description="Số bản ghi thực tế hiện có trong MongoDB (toàn hệ thống)."
        actions={
          <RefreshButton
            busy={status.state === "loading" || history.state === "loading" || status.refreshing || history.refreshing}
            disabled={busy}
            onRefresh={() => { status.retry(); history.retry(); }}
            label="Làm mới trạng thái và lịch sử dữ liệu"
          />
        }
      >
        <State status={status.state} refreshError={status.refreshError} error={status.state === "error" ? status.message : undefined} retry={status.retry}>
          {counts && (
            <div className="sys-metrics sys-metrics--inside">
              <Metric label="Liên hệ CRM" value={formatNumber(counts.contacts)} />
              <Metric label="Đăng ký website" value={formatNumber(counts.signups)} />
              <Metric label="Lead" value={formatNumber(counts.leads)} />
              <Metric label="Thí sinh" value={formatNumber(counts.exam_candidates)} />
              <Metric label="Đầu điểm thi" value={formatNumber(counts.exam_scores)} />
            </div>
          )}
        </State>
      </Section>
      <div className="sys-two-cols">
        <Section title="Nạp lại & Làm sạch dữ liệu (Run ETL)" description="Đọc lại dữ liệu nguồn trên máy chủ, chuẩn hóa tên trường THPT, lọc chứng chỉ và nạp vào MongoDB.">
          <div className="sys-data-action">
            <Database size={30} aria-hidden="true" className="text-primary" />
            <p className="sys-muted">Kích hoạt pipeline làm sạch toàn bộ dữ liệu nghiệp vụ và cập nhật các số liệu trên dashboard.</p>
            <Button icon={<RotateCcw />} variant="tonal" onClick={() => open("reload")} disabled={busy}>
              {busy && dialog === "reload" ? "Đang xử lý…" : "Nạp lại CSDL ngay"}
            </Button>
          </div>
        </Section>
        <Section title="Tải lên file Excel mới" description="Chọn file Excel (.xlsx, .csv) từ máy tính để cập nhật trực tiếp vào hệ thống.">
          <div className="sys-form">
            <SystemSelect label="Loại dữ liệu đích" value={target} options={FILES.map((f) => ({ value: f.value, label: f.label }))} onChange={setTarget} />
            <FormField label="Chọn file từ máy tính" hint="Hỗ trợ .xlsx, .xls, .csv. Giới hạn 25 MB.">
              <input
                ref={inputFile}
                type="file"
                className="sys-input sys-file"
                onChange={updateFile}
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              />
            </FormField>
            {file && (
              <p className="sys-muted" style={{ fontWeight: 500 }}>
                📄 {file.name} · {formatNumber(file.size)} bytes
              </p>
            )}
            <Button icon={<UploadCloud />} variant="tonal" disabled={!file || busy} onClick={() => open("upload")}>
              {busy && dialog === "upload" ? "Đang tải lên…" : "Tải lên & Cập nhật CSDL"}
            </Button>
          </div>
        </Section>
      </div>
      <Section title="Lịch sử nhập dữ liệu" description="Mười lần xử lý gần nhất mà backend đã ghi nhận.">
        <State status={history.state} refreshError={history.refreshError} error={history.state === "error" ? history.message : undefined} retry={history.retry}>
          {history.state === "ready" && (
            <DataTable
              rows={history.data}
              rowKey={(r, i) => `${r.started_at ?? "import"}-${i}`}
              columns={[
                { key: "started", heading: "Bắt đầu", get: (r) => formatDate(r.started_at) },
                { key: "ended", heading: "Kết thúc", get: (r) => formatDate(r.finished_at) },
                { key: "result", align: "center", heading: "Kết quả", get: (r) => <Chip kind={r.ok ? "good" : "bad"}>{r.ok ? "Thành công" : "Có lỗi"}</Chip> },
                { key: "files", heading: "Nguồn", get: (r) => (r.files ?? []).map((f) => f.name).join(", ") || "—" },
                { key: "checks", align: "center", heading: "Kiểm tra", get: (r) => `${(r.checks ?? []).filter((c) => c.ok).length}/${(r.checks ?? []).length} khớp` },
              ]}
            />
          )}
        </State>
      </Section>
      {dialog && (
        <Dialog
          dismissible={!busy}
          title={dialog === "reload" ? "Xác nhận nạp lại toàn bộ CSDL" : "Xác nhận tải lên file Excel"}
          description="Hệ thống sẽ chạy pipeline ETL để chuẩn hóa, làm sạch và nạp dữ liệu vào MongoDB."
          onClose={() => !busy && setDialog(null)}
        >
          <div className="sys-stack">
            {dialog === "upload" ? (
              <p>
                File tải lên: <b>{file?.name}</b> ({file ? formatNumber(file.size) : 0} bytes)<br />
                Tên file đích trên server: <b>{target}</b>
              </p>
            ) : (
              <p>Dữ liệu nguồn hiện có trên máy chủ sẽ được đọc lại và nạp mới vào cơ sở dữ liệu MongoDB.</p>
            )}
            <Notice>Thao tác này sẽ cập nhật các chỉ số báo cáo và bảng số liệu trên toàn bộ Dashboard.</Notice>
            <div className="sys-dialog-actions">
              <Button variant="text" disabled={busy} onClick={() => setDialog(null)}>
                Hủy
              </Button>
              <Button disabled={busy} onClick={execute}>
                {busy ? "Đang xử lý…" : dialog === "upload" ? "Tải lên & Nạp CSDL" : "Xác nhận nạp lại"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
