import "./system.css";
import DataManagement from "./admin/Data";

export default function DataImport() {
  return (
    <div className="sys-page">
      <p className="sys-muted">
        Tải lên file Excel trực tiếp từ máy tính hoặc nạp lại pipeline ETL để làm sạch và cập nhật CSDL MongoDB.
      </p>
      <div className="sys-admin-panel" style={{ marginTop: 12 }}>
        <DataManagement />
      </div>
    </div>
  );
}
