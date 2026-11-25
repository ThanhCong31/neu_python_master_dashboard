# V65–V67 — Hoàn thiện trước PR

Baseline V66: `a50247825002ccdfabbb851d17af711c961954c0`; bản gốc `main`: `89ec8638ddc751f03c38ce4ea0bdb2ca79be0464`. Không thay API, backend, ETL, dữ liệu hay dependency.

- V65: gom bảng phân tích và ChartBoundary dùng chung, định dạng JSX; không đổi nghiệp vụ.
- V66: cột Kênh cố định khi cuộn ngang thu từ 156px xuống 120px trên màn hình thường.
- V67: đối chiếu quyền với frontend gốc và API. Module quyết định quyền truy cập; partner quyết định phạm vi; `can_view_pii` quyết định masking theo backend, không phải quyền xuất CSV độc lập.

| Hạng mục | Quyết định V67 | Lý do |
|---|---|---|
| Kết quả thi | Bỏ điều kiện PII tự đặt với CSV, cột email, chi tiết và nhãn thí sinh/trường trong bảng/biểu đồ hai vòng. Giữ cảnh báo giả lập, xác nhận xuất và điều kiện dữ liệu hợp lệ. | Backend đã hỗ trợ CSV theo module/phạm vi và `apply_pii`; danh sách gốc đã hiển thị tên/trường. Không tự đổi quyền nghiệp vụ. |
| Liên hệ và Tổng quan | Giữ cơ chế xuất hiện có; Excel/Word/PDF chỉ đặt tại Tổng quan. | Giữ quyền gốc, giảm thao tác lặp. |
| Lead | Tạm giữ giới hạn CSV, cột câu hỏi và FAQ với tài khoản thiếu quyền PII. | `question` và `by_question` không được API che; CSV chứa question. Đây là ngoại lệ giảm phơi bày trên UI, không phải bảo mật backend. Sau khi backend sửa, gỡ giới hạn CSV theo hợp đồng gốc. |
| Chất lượng dữ liệu | Admin thấy pipeline và lần nhập toàn hệ thống kể cả khi lọc đối tác; ghi rõ dữ liệu global. Tài khoản đối tác không hiện hai mục global; giữ nhật ký theo scope. | Admin không mất quyền khi xem scope; tránh lẫn metadata toàn hệ thống với dữ liệu đối tác. API vẫn trả metadata global; nếu cần phân quyền phải sửa server. |

Rủi ro backend chưa xử lý: câu hỏi/nội dung tự do của Lead, metadata Quality toàn hệ thống, email/số điện thoại sai định dạng có thể không được mask, tìm kiếm trên trường gốc trước masking, CSV formula injection. Không coi bất kỳ điều kiện render nào là kiểm soát quyền server. BA/backend cần thống nhất chính sách và kiểm thử token giới hạn trước triển khai production.

Nghiệm thu: `npm run test:local`, `npm run build`, `git diff --check`; kiểm tra admin, partner có/không PII, chuyển phạm vi, CSV từng bộ điểm, cột email, tooltip/tên/trường, Lead guard, Quality global/scoped và API trực tiếp. Chưa xác nhận build/browser ở môi trường tạo patch. Hồ sơ V30–V64 là lịch sử; quyết định V67 thay thế đề xuất cũ về giới hạn CSV và email Kết quả thi.
