# V11 — Analysis and adaptive composition
- Phễu HTML/CSS chung thang đo; cảnh báo nếu dữ liệu không đơn điệu, không suy diễn chuyển đổi khi mẫu số 0.
- Timeline ECharts modular, lazy, ngày/lũy kế, bảng HTML thay thế, nhãn ngày đăng ký của paid, số bản ghi thiếu ngày. CSS role + line styles. ResizeObserver, cleanup, reduce motion, thay theme seed và system mode.
- Khi CRM không có quyền: ưu tiên Thi → Tài trợ → Truyền thông. Thi chính có phân bố grade thực từ API, giữ unknown grade, ngưỡng 800/650/500 đúng ETL. Không có số liệu giả trong production.
- Bỏ ROI và chart ngân sách chi tiết, giữ ngân sách nhìn thấy + ghi chú giả định. Không diễn giải tổng lượt reach thành số người duy nhất. Pipeline chuyển thành link Quality khi đúng quyền.
- Review V11: cần kiểm tra API mismatch, export khi scope thay, lỗi chart lazy import, kích thước chart mobile, sự phân biệt null/zero và logic kiểm thử. Cần cải thiện bố cục domain summary để tránh nhiều nested cards.
