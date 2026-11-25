# V39–V53 — Functional Parity & Design System

> Cập nhật sau V64: Đây là hồ sơ lịch sử V39–V53, không phải đặc tả cuối cùng. Xem [V54–V56](REDESIGN-V54-V56-CORRECTION.md), [V57–V59](REDESIGN-V57-V59-ANALYTICS.md) và [V60–V64](REDESIGN-V60-V64-REFINEMENT.md) cho các quyết định thay thế về giao diện, biểu đồ, CTR và định dạng số.

## Mục tiêu và phạm vi

Đối chiếu frontend gốc `main` với `frontend-redesign`, backend hiện hữu và quy ước AGENTS.md. Không sửa backend, ETL, dữ liệu, route, shell hoặc dependency. Cho phép sửa module communications của đồng đội theo yêu cầu người quản lý. Không phục hồi bảng trùng ở Tổng quan nếu có đường dẫn đúng quyền đến chức năng chuyên sâu. Các phiên bản là checkpoint ứng viên, cần nghiệm thu riêng.

## API contract

| API | Dữ liệu khôi phục / chuẩn hóa |
|---|---|
| `/overview` | KPI, scope, links phân tích; giữ xuất báo cáo và timeline; không nhân đôi breakdown |
| `/contacts/summary` | `by_drip`, `by_venue`, `heatmap` (ISO weekday, UTC), tỷ lệ so tổng |
| `/contacts/list` | `sources` là cột tùy chọn |
| `/leads/summary`, `/leads/list` | `by_question`, `question`; nội dung tự do chỉ render khi quyền PII cho phép |
| `/exams/summary`, `/exams/list` | `sections`, `box[2]`, `final_by_board`, `by_paid`, `finalists`, điểm từng phần |
| `/marketing/summary` | `original_report`, CPA, CTR, conversion; budget_visible, null khác 0 |
| `/meta/options` | `viewing_partner` và contacts options đối chiếu scope |
| `/sponsorship/summary` | quyền lợi, tiếp cận, tương tác, tỷ lệ và mức độ quan trọng |
| `/quality/summary` | `by_issue`, `by_reason`, `flags`, `merged_distribution` |
| `/admin/upload-file` | file đích `Diểm giả lập.xlsx`, workbook `.xlsx`, bỏ giới hạn 20 MB UI |

## Các checkpoint và review

### V39 — Điều hướng Tổng quan

- Quyết định: Giữ phân quyền và scope; đi thẳng đến phân tích, không thêm bảng trùng.
- Nghiệm thu: test:overview; mở Liên hệ/Kết quả thi từ Tổng quan ở admin và partner.
- File: `src/features/overview/Overview.tsx`

### V40 — KPI cho lĩnh vực chính

- Quyết định: Marketing-only phải có ROI và doanh thu; không thêm KPI phụ vào thẻ lĩnh vực nhỏ. Điểm cao nhất xem Kết quả thi.
- Nghiệm thu: test:overview; kiểm tra ROI null, 0 và âm.
- File: `src/features/overview/components/Domains.tsx`

### V41 — Bố cục Tổng quan thích ứng

- Quyết định: Không đưa bảng chi tiết trở lại; giảm phân cấp thừa, giữ lưới KPI và khoảng trống hợp lý ở màn hẹp.
- Nghiệm thu: test:overview; 375/768/desktop, light/dark; xem cả marketing-only.
- File: `src/features/overview/Overview.tsx`, `src/features/overview/overview.css`

### V42 — Nhóm Drip và điểm thi

- Quyết định: Dùng selector và biểu đồ hiện có; chỉ drill down venue hợp lệ; không thêm filter drip giả.
- Nghiệm thu: test:contacts; null, dấu phẩy, scope.
- File: `src/features/admissions/contacts/model.ts`, `src/features/admissions/contacts/query.ts`, `src/features/admissions/contacts/components/Analytics.tsx`

### V43 — Phân bố thời gian và cột dữ liệu

- Quyết định: Khôi phục heatmap 7×24 UTC, bản số đọc được, không tự dịch timezone; nguồn là cột tùy chọn.
- Nghiệm thu: test:contacts; heatmap 0/null, giờ biên, cuộn ngang, tỷ lệ tổng.
- File: `src/features/admissions/contacts/model.ts`, `src/features/admissions/contacts/components/Analytics.tsx`, `src/features/admissions/contacts/components/Records.tsx`, `src/features/admissions/contacts/contacts.css`

### V44 — FAQ và cột Lead

- Quyết định: Chỉ render free text khi can_view_pii; không tạo filter mới hoặc đưa nội dung vào URL.
- Nghiệm thu: test:leads; kiểm tra PII off/on và nội dung dài.
- File: `src/features/admissions/leads/model.ts`, `src/features/admissions/Leads.tsx`, `src/features/admissions/leads/components/Analytics.tsx`, `src/features/admissions/leads/components/Records.tsx`

### V45 — Bảng điểm theo phần thi

- Quyết định: Bảng/biểu đồ dùng cùng vòng và dữ liệu, không tạo panel trùng.
- Nghiệm thu: test:exams; all/VL/CK; null và 0.
- File: `src/features/results/exams/model.ts`, `src/features/results/exams/components/Analytics.tsx`

### V46 — Thống kê nhóm thi

- Quyết định: Thêm Min–Max, trung vị, TB CK và thanh toán; bool false không bị gộp null; chỉ lọc khi khớp.
- Nghiệm thu: test:exams; median 0/null, paid true/false, filter và dataset.
- File: `src/features/results/exams/components/Analytics.tsx`

### V47 — Đối chiếu hai vòng

- Quyết định: Bảng chi tiết có thể thu gọn, không đồng nhất hồ sơ có điểm CK với advanced; cột điểm phần thi tùy chọn.
- Nghiệm thu: test:exams; PM119 và bộ độc lập, các điểm null.
- File: `src/features/results/exams/components/Analytics.tsx`, `src/features/results/exams/components/Records.tsx`

### V48 — Component chung cho truyền thông/tài trợ

- Quyết định: Bỏ renderer CSS bar riêng, dùng Chart lazy/Suspense, semantic palette, tooltip và legend chung. Dùng AnalysisTable, formatter chung; bảng vẫn hiện khi toàn null hoặc số không hợp lệ.
- Nghiệm thu: test:charts; test:source; so sánh số liệu chart/table, ROI âm, null, zoom và theme.
- File: `src/shared/AnalysisTable.tsx`, `src/shared/data-workspace.css`, `src/features/communications/components.tsx`, `src/features/communications/communications.css`

### V49 — Khôi phục đối soát Truyền thông

- Quyết định: Một panel hai chế độ với ViewSwitch, giữ đủ trường báo cáo gốc; ghi rõ bộ lọc chỉ áp dụng số liệu hệ thống, không loại bỏ ngân sách 0.
- Nghiệm thu: test:source; so sánh original_report, CPA, CTR, conversion với API; kênh không có ngân sách.
- File: `src/features/communications/types.ts`, `src/features/communications/Marketing.tsx`

### V50 — Thống nhất bộ lọc, scope và Nhà tài trợ

- Quyết định: Không lấy dữ liệu scope cũ; metadata kiểm tra viewing_partner; chips và modal hiện có, PageRefresh duy nhất. V54 sửa lại: quyền lợi chỉ dùng danh sách tiến độ như frontend gốc; 4 biểu đồ vẫn có bảng số liệu.
- Nghiệm thu: test:source; đổi scope/admin/partner, lọc ngày/giá trị hết hạn, PII, 375/768/desktop, keyboard.
- File: `src/features/communications/communications.css`, `src/features/communications/Marketing.tsx`, `src/features/communications/Sponsorship.tsx`, `src/features/communications/MarketingFilters.tsx`

### V51 — Bảng Chất lượng dữ liệu

- Quyết định: Dùng lại DataTable System; tổng theo lỗi ở biểu đồ và nguồn ở bảng. Không đổi quyền nhật ký.
- Nghiệm thu: test:source; cùng lỗi nhiều nguồn, empty và scope.
- File: `src/features/system/Quality.tsx`

### V52 — Nhập dữ liệu

- Quyết định: Gỡ giới hạn 20 MB tự đặt, sửa chính tả tên đích theo ETL, giữ workbook .xlsx vì pipeline đọc sheet Excel, giữ xác nhận.
- Nghiệm thu: test:source; fixture đúng workbook, file rỗng, lớn hơn 20 MB; chỉ thử ETL trên DB test đã backup.
- File: `src/features/system/admin/Data.tsx`

### V53 — Tích hợp

Bổ sung `test:parity` vào `test:local`, kiểm tra hợp đồng dữ liệu thuần và source guards. Không coi source assertion là kiểm thử UI thực. Giữ một hồ sơ lịch sử chung V39–V53 thay vì rải 15 file Markdown.

## M3 Expressive review

- Dùng wrapper có sẵn `Button`, `ViewSwitch`, `Checkbox`, `InputChip`, `TextField`; dùng `ResponsiveDialog`, `LoadingState`, `PageRefresh` và shared `Chart`. Không nhập component registry khác hoặc tự thêm dependency.
- Bảng analytics mới `AnalysisTable` dùng CSS/DataWorkspace chung nhưng không có cột Chi tiết trống. HTML semantic, cuộn nội bộ, số căn phải. Chart dùng palette, legend, tooltip, reduced motion và resize từ shared chart engine.
- Biểu đồ/ bảng cùng API. Nếu dữ liệu không đủ vẽ, bảng vẫn đọc được; biểu đồ giới hạn 12 kênh nhưng bảng đầy đủ. Tooltip bổ sung của communications chuyển thành cột trong bảng; tooltip chart dùng kiểu chung. Không tạo số liệu giả.
- Cần kiểm tra desktop, 768px, 375px, bàn phím, dark/light và các trạng thái empty/loading/error; đặc biệt các nhãn dài, ROI âm, filter metadata lỗi và đổi account. Không kết luận đã đạt WCAG hay guideline chỉ qua source review.

## Nghiệp vụ cần lưu ý

- FAQ aggregate có thể chứa PII; UI gate không thay thế authorization phía server. Không ghi log/fixture nội dung thật.
- Heatmap giữ giờ UTC theo MongoDB `$hour` và `$isoDayOfWeek`, không suy diễn thành giờ địa phương. Chưa xác minh ETL timezone trong dữ liệu nguồn; ghi nhãn UTC từ API.
- `finalists` là bản ghi chung kết có tồn tại, không nhất thiết đồng nghĩa với cờ vào chung kết. Điểm giả lập không dùng đánh giá người thật. Bảng so sánh phục hồi dữ liệu; không phục hồi scatter chỉ để nhân đôi bảng.
- Báo cáo gốc kênh là dữ liệu cấp kênh, không đổi theo filter; khi lọc chỉ dùng so sánh tham khảo. Không loại bỏ ngân sách 0 khỏi tập budget_visible.
- Backend upload chấp nhận tên đích `.xlsx/.xls/.csv` nhưng ETL đọc workbook nhiều sheet bằng openpyxl/pandas; không chứng minh XLS/CSV thực sự chạy. Giữ `.xlsx` và giải thích. Không đổi tên file local thành định dạng khác. API ghi file trước ETL và không rollback; chỉ test trên nguồn test có backup, cần bảo mật server riêng.

## Nghiệm thu local

Chạy `npm run test:local` và `npm run build` sau mỗi checkpoint (V39–V52 dùng suite hiện hữu, V53 thêm parity). Dùng Node tương thích loader; nếu Node 26 gặp lỗi strip-types, dùng Node 22 LTS hoặc phiên bản đã kiểm chứng với dự án. Kiểm tra scope admin/partner, PII on/off, biểu đồ và bảng đồng nhất, lỗi refresh, xuất báo cáo, và import trên DB test. Không sửa dữ liệu thật để kiểm thử.

Baseline review: commit `2d6875aae34bee8a6e888ee19715e5a8682dc341`. Trạng thái: source review trên GitHub, chưa có build/runtime/ETL acceptance ở môi trường tạo patch. Kết quả kiểm thử thực tế cần ghi lại khi chạy trên repository local.
