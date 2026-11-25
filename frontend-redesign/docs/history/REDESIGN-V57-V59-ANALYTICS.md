# V57–V59 — Khôi phục biểu đồ nghiệp vụ và sửa lỗi kiểu dữ liệu

## Phạm vi

Tiếp nối [V54–V56](REDESIGN-V54-V56-CORRECTION.md). Khôi phục chức năng phân tích còn thiếu so với frontend `main`, không mở rộng bố cục đã duyệt hoặc thay đổi backend.

| Mốc | Thay đổi | Lý do |
|---|---|---|
| V57 — Kết quả thi | Khôi phục biểu đồ phân tán Vòng loại → Chung kết; boxplot điểm theo trường; điểm TB theo tỉnh/thành và theo tình trạng thanh toán. Giữ bảng số liệu. | Phục hồi khả năng phân tích đã có trong nghiệp vụ gốc. |
| V58 — Chất lượng dữ liệu | Khôi phục biểu đồ cột chồng phân bố vấn đề đầu vào và lý do gộp trùng theo nguồn. Giữ bảng chi tiết và bộ lọc nhật ký. | Không làm mất chiều nguồn khi tổng hợp số liệu. |
| V59 — Lead | Bỏ điều kiện kiểm tra `by_question` dư thừa sau nhánh FAQ; sửa TS2367. | TypeScript đã thu hẹp kiểu sau khi xử lý FAQ; không đổi hành vi. |

## Thiết kế và hợp đồng dữ liệu

- Kết quả thi dùng `shared/charts/Chart.tsx` với ScatterChart, BoxplotChart từ ECharts hiện có; các nhóm phân tích sử dụng bố cục hiện hữu. Bảng giữ dữ liệu ngay cả khi không đủ điều kiện vẽ biểu đồ.
- `/api/exams/summary`: sử dụng `finalists`, `by_school` (tứ phân vị `box`), `by_province`, `by_paid`, `final_by_board`; không coi điểm thiếu là 0. Hai vòng có thể khác tập thí sinh. Điểm là dữ liệu giả lập, không dùng đánh giá cá nhân.
- Tên và trường trong phần so sánh thí sinh chỉ hiển thị khi có quyền PII. Gate giao diện không thay thế phân quyền API.
- `/api/quality/summary`: `by_issue` và `by_reason` giữ cả loại, nguồn và số đếm. `SourceDistribution.tsx` dùng biểu đồ chung, legend và bảng tương ứng; dữ liệu không hợp lệ không bị ép thành số đúng.
- V59 không thay đổi API Lead hoặc điều kiện quyền xem nội dung câu hỏi.

## Nghiệm thu cần xác nhận

Chạy `npm run test:local`, `npm run build`; đối chiếu bảng và biểu đồ với API ở từng bộ dữ liệu, từng phạm vi đối tác và quyền PII. Kiểm tra thiếu điểm, điểm 0, trường nhiều nhóm, nguồn dữ liệu dài và lỗi tải. Lỗi TS2367 đã được ghi nhận trong build local trước V59; chưa có log nghiệm thu đầy đủ sau V64 trong hồ sơ này.

## Ghi chú lưu từ hồ sơ trước

## V57 — Khôi phục biểu đồ kết quả thi theo BA

- Không thêm bố cục mới: biểu đồ hộp theo trường, điểm TB theo tỉnh/thành và thanh toán là chế độ Biểu đồ trong panel Phân tích theo nhóm. Bảng giữ mặc định và đầy đủ dữ liệu.
- Đối chiếu vòng loại/chung kết: thay nút thu gọn bằng biểu đồ phân tán và bảng số liệu, đúng nghiệp vụ gốc. Điểm null/không hợp lệ không bị gán 0; bảng vẫn giữ mọi bản ghi.
- `Chart` chỉ đăng ký thêm `ScatterChart` và `BoxplotChart` từ dependency ECharts hiện có; không thêm dependency. Tooltip dùng theme chung, escape HTML.
- Tên và trường trong bảng/tooltip finalist chỉ hiện khi `can_view_pii`. API summary hiện trả tên; gate UI không thay thế bảo mật backend.
- Kiểm tra scope, PII, hai vòng, trường nhiều dòng, nhóm thanh toán, điểm 0/null; chưa chạy React/ECharts runtime trong môi trường tạo patch.

## V58 — Khôi phục biểu đồ phân bố Quality theo nguồn

Hai panel Vấn đề đầu vào và Nguyên nhân gộp trùng dùng lại biểu đồ cột chồng theo nguồn giống nghiệp vụ gốc. Không đổi vị trí panel, bộ lọc hoặc bảng. Dùng shared Chart, token theme, legend và bảng nguồn; dữ liệu đếm không hợp lệ chuyển sang bảng, không sửa dữ liệu. Các panel Cờ và Phân bố hồ sơ vẫn dùng thiết kế đã duyệt.
