# V60–V64 — Tinh chỉnh phân tích, bảng và định dạng dữ liệu

## Nguyên tắc

Giữ nghiệp vụ và API của frontend gốc; dùng thiết kế V38 cùng các component M3 Expressive đã thống nhất. Chỉ cải thiện cách trình bày hoặc sửa lỗi có căn cứ. Không đổi backend, ETL, dữ liệu nguồn, route, theme, dependency hay logic phân quyền.

## V60 — Thời điểm đăng ký web (Liên hệ)

- `/api/contacts/summary` trả `heatmap` theo ngày ISO trong tuần và giờ nhóm của MongoDB. Dữ liệu quan sát có toàn bộ lượt đăng ký ở giờ 0; không thể kết luận đó là giờ đăng ký cao điểm thực tế.
- Khi các lượt có số đếm dương chỉ nằm trong một giờ, chuyển sang biểu đồ số đăng ký theo ngày trong tuần bằng shared Chart. Khi có nhiều giờ, giữ heatmap. Nếu không có dữ liệu hoặc dữ liệu không hợp lệ, dùng trạng thái phù hợp/bảng nguồn.
- Bảng giữ ngày, giờ và số đếm từ API; không tự chuyển múi giờ hoặc thay đổi timestamp. `registrationPattern` tổng hợp và kiểm tra số đếm, bao gồm số 0 và dữ liệu trùng ô.

## V61 — Chất lượng hồ sơ (Liên hệ)

- Bỏ panel riêng khi chỉ có hai thống kê; tích hợp `kpi.flagged` (số hồ sơ có cờ) và `kpi.merged_records` (số bản ghi nguồn đã gộp) vào KPI hiện hữu.
- Giữ biểu đồ/bảng `by_flag` khi có dữ liệu cần kiểm tra. Một hồ sơ có thể có nhiều cờ; tổng cờ không phải số hồ sơ. Không thay thế màn Chất lượng dữ liệu chuyên sâu.

## V62 — Bảng hiệu quả theo kênh (Truyền thông)

- Giữ toàn bộ cột nghiệp vụ; cột Kênh cố định khi cuộn ngang, chiều rộng theo nội dung, số căn phải và dễ đọc. Tooltip giải thích thuật ngữ CPA, CTR, TT/ĐK; ROI dương/âm dùng màu ngữ nghĩa của theme.
- CTR: ETL đọc cột Excel `CTR (%)` bằng `to_float`, API trả nguyên giá trị. Formatter tỷ lệ ở frontend gốc nhân 100 khiến giá trị 3,5 hiển thị thành 350%. Quyết định cuối cùng: dùng formatter riêng cho giá trị đã ở đơn vị phần trăm (`percentagePointsText`), nhất quán trong bảng chính, bảng biểu đồ, trục và tooltip. Ví dụ 3,5 → 3,5%; 4,1 → 4,1%; 0 → 0%. Không dùng suy đoán đơn vị theo ngưỡng giá trị.
- Không đổi `percentText` của ROI, tỷ lệ chuyển đổi và tỷ lệ tương tác. Quy ước CTR được suy ra từ tên cột nguồn và số liệu quan sát; cần BA xác nhận định dạng workbook nếu nguồn dữ liệu thay đổi.

## V63 — Chú thích nghiệp vụ

Đối chiếu nội dung với `frontend/src/pages/` trên nhánh `main`. Ưu tiên thuật ngữ, công thức, đơn vị, giả định và diễn giải ban đầu; không sao chép số lượng cố định hoặc tên màu không còn đúng với dữ liệu/theme.

| Màn hình | Nội dung cần giữ |
|---|---|
| Tổng quan | Phạm vi dữ liệu, thiết kế tổng quan đã duyệt và cảnh báo xuất báo cáo. |
| Liên hệ | Đăng ký theo ngày; PIC và chuyển đổi; nguồn dữ liệu, cờ kiểm tra, hạn chế timestamp. |
| Lead | Kết quả làm sạch, tuần, chiến dịch, nhu cầu FAQ và thông tin tự khai. |
| Kết quả thi | Khoảng điểm, tỷ trọng xếp loại, điểm TB/điểm tối đa, tứ phân vị, so sánh vòng; cảnh báo giả lập. |
| Truyền thông | CPA, CTR, ROI, giả định phân bổ kênh, đối soát báo cáo gốc và giới hạn khi lọc. |
| Nhà tài trợ | Quyền lợi và công thức tương tác / tiếp cận. |
| Chất lượng dữ liệu | Chuẩn hóa, nguyên nhân gộp trùng và phạm vi thống kê. |

Giữ các cảnh báo quyền PII, dữ liệu thiếu, mẫu số khác nhau và tương tác mới khi cần. Không coi các ghi chú chưa khớp anchor trong lần sửa local là đã được xác minh.

## V64 — Thống nhất định dạng số và bán kính biểu đồ

| Loại | Quy tắc hiển thị |
|---|---|
| Điểm, trung bình và số thập phân trong bảng | Tối đa 2 chữ số thập phân; ví dụ 541,3684210526316 → 541,37. |
| Số đếm và số tiền VND | Không thêm chữ số thập phân; giữ formatter theo ngữ nghĩa. |
| Tỷ lệ, CTR | Giữ formatter chuyên biệt; không áp dụng quy tắc phần trăm cho mọi số. |
| Thiếu dữ liệu | Giữ trạng thái thiếu/ dấu gạch theo component; không chuyển thành 0. |
| Mã, số điện thoại, dữ liệu nhật ký thô | Giữ nguyên; không ép chuỗi thành số. |

- `shared/format.ts`: `tableCellValue` xử lý số thập phân chưa được định dạng tại biên hiển thị; bảng có formatter riêng giữ formatter đó. `scoreText` giới hạn 2 chữ số thập phân. Không làm tròn giá trị dùng tính toán, sắp xếp, API, CSV hay xuất báo cáo.
- `shared/charts/chart-style.ts`: cột không chồng có giá trị âm/dương dùng bán kính 4px ở đầu ngoài, cạnh tại mốc 0 vuông. Giữ thuật toán cột chồng không âm và không thay đổi cách xử lý dữ liệu vector hoặc stack âm chưa hỗ trợ. Không đổi dữ liệu, màu hoặc kiểu chart khác.

## Kiểm tra trước khi hợp nhất

- `npm run test:local` và `npm run build`; kiểm tra `test:charts`, `test:exams`, `test:parity`, bao gồm số 0/null, CTR phần trăm điểm, phân bố đăng ký và đầu cột ROI âm/dương.
- Review giao diện thực: bảng ngang trên desktop/mobile, sticky column, dark/light, tooltip, heatmap một/nhiều giờ, bảng điểm, scope và PII.
- Không có log build và nghiệm thu browser đầy đủ sau V64 được cung cấp trong lần cập nhật tài liệu này. Các bài kiểm tra helper/fixture không thay thế nghiệm thu ứng dụng. Tài liệu ghi lại thay đổi dự kiến theo các patch đã triển khai, không khẳng định đã kiểm thử production.
