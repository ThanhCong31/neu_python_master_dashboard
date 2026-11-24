# Contacts — sổ vấn đề frontend cũ (`main/frontend/`)

## 1. Mục đích và phạm vi

Phân tích trước khi thiết kế lại màn hình Liên hệ & chuyển đổi (`/crm`). Đây là đánh giá từ code, không phải tuyên bố đã quan sát mọi lỗi trên ứng dụng đang chạy. Phân loại: **C** = xác nhận code; **U** = đánh giá UX; **R** = rủi ro cần kiểm thử. P0 = chặn nghiệm thu (sai phạm vi, số liệu, quyền); P1 = ảnh hưởng tác vụ chính; P2 = cải tiến chất lượng. ID dùng để truy vết đến thiết kế và test.

## 2. Màn hình cũ thực sự có gì?

`Contacts.tsx` lấy `opts.contacts` từ `/meta/options`, 11 tham số lọc từ URL (hai đầu khoảng ngày + 9 chiều), `/contacts/summary` cho KPI và chart; `DataTable` gọi `/contacts/list` riêng. Bộ lọc UI gồm 10 control: thời gian, bảng, miền, tỉnh/TP, thanh toán, segment, kênh, nguồn, PIC, điểm thi.

| Thứ tự | Thành phần | Nội dung |
|---|---|---|
| 1 | Mô tả | Hardcode 145 hồ sơ vàng, 3 nguồn, cam kết mọi chart/bảng chung filter |
| 2 | FilterBar | 10 nhóm lọc ngang, lựa chọn nhiều, thời gian tùy chỉnh |
| 3 | 6 KPI | Liên hệ, đăng ký web, đã thanh toán, doanh thu, doanh thu tiềm năng, cần kiểm tra |
| 4 | 11 chart | Phễu; đăng ký theo ngày; segment; tỉnh; PIC; tổ hợp nguồn; bảng A/B; drip; điểm thi; cờ; heatmap |
| 5 | Danh sách | 15 cột, tìm mã/tên/email, phân trang server, sort, CSV |

**Cách kiểm đếm:** 11 chart gồm từng `FunnelCard`, `ChartCard`, 4 `StatusStackCard`, `ChartCard` bảng, 3 `SimpleBarCard`, `HeatmapCard` (1+1+4+1+3+1=11). Mười nhóm filter UI, không nhầm với số tham số API. Bảng có 15 cột theo `COLUMNS` thực tế. Không dùng con số 145 làm KPI mặc định.

## 3. Sổ vấn đề

### A. IA và hành trình người dùng

| ID | Ưu tiên / loại | Bằng chứng | Tác động |
|---|---|---|---|
| CT01 | P1 U | 11 chart trước `DataTable` trong `Contacts.tsx` | Tra cứu một người phải cuộn qua cả báo cáo |
| CT02 | P1 U | KPI và phễu lặp Overview | Mục đích của hai trang chưa phân biệt rõ |
| CT03 | P1 C/U | 15 cột hiển thị mặc định | Khó quét nhanh, nhất là laptop/mobile; danh tính và trạng thái bị tách xa |
| CT04 | P1 C | `DataTable` không có hành động mở chi tiết | Nhiều trường API trả về nhưng không thể đọc tập trung theo hồ sơ |
| CT05 | P1 U | Tất cả chart cạnh nhau, ít ưu tiên | Chuyển đổi, vận hành và vấn đề chất lượng cạnh tranh thị giác |
| CT06 | P2 U | Nhãn CRM/Segment/PIC/Drip/attribution | Người không chuyên khó hiểu, không phân biệt liên hệ hợp nhất và lead nguồn |
| CT07 | P1 C/U | `page-desc` hardcode 145/3 nguồn | Sai khi dữ liệu hoặc phạm vi thay đổi; không có dấu hiệu nguồn số thực |
| CT08 | P2 U | Không có lối chuyển từ chỉ số nhóm sang bảng trừ lọc thủ công | Mất thời gian khi chuyển từ nhận biết vấn đề tới tra cứu |

### B. Tính chính xác dữ liệu

| ID | Ưu tiên / loại | Bằng chứng | Tác động |
|---|---|---|---|
| CT09 | P0 C | `DataTable` giữ `q` riêng; summary chỉ nhận `params` | Tìm tên/mã làm đổi tổng bảng nhưng KPI/chart không đổi; câu “mọi biểu đồ và bảng chung bộ lọc” dễ gây nhầm |
| CT10 | P0 C | `ContactFilters.match` lọc `first_touch`, nhưng chart ngày dùng `web_registered_at` | Khoảng ngày lọc cohort tiếp xúc đầu, không phải khoảng ngày đăng ký/phát sinh doanh thu |
| CT11 | P0 C | `t_reg.paid` cộng cờ `$paid` theo ngày đăng ký | Không phải số giao dịch thanh toán thực hiện trong ngày |
| CT12 | P0 C | `UNPAID_REG = web_registered AND NOT paid`; từ điển nghiệp vụ có miễn phí hợp lệ | `unpaid_registered` có thể bao gồm miễn phí; không thể coi mọi hồ sơ là nợ hay cần đòi phí |
| CT13 | P0 C | `process_and_seed.py` có lead `web_registered=False`, `payment_status='Chưa thanh toán'`; list không project `web_registered` | Chọn trạng thái chưa thanh toán không bảo đảm đúng tập đã đăng ký web chưa đóng phí |
| CT14 | P1 C | `StatusStackCard` dùng `web_registered-paid` và `count-web_registered` | Nhãn nhóm chưa thanh toán có thể gồm miễn phí; dữ liệu không nhất quán có thể sinh đoạn âm |
| CT15 | P0 C | `by_venue` nhóm toàn bộ tập `match`, chart ghi “thí sinh đã thanh toán” và vẽ `count` | Số lượng điểm thi không được giới hạn người đã đóng phí theo code hiện tại |
| CT16 | P1 C | `by_flag` unwind nhiều flag trên mỗi hồ sơ; `flagged` đếm hồ sơ | Tổng số cờ có thể vượt số hồ sơ; không cộng như số người |
| CT17 | P1 C | `by_source` unwind mảng sources, `by_source_combo` nhóm tổ hợp | Cộng số nguồn có thể đếm trùng; tổ hợp nguồn không phải kênh attribution |
| CT18 | P1 C/U | `channel` vs `channel_base` trong Data Dictionary; API summary nhóm `channel`, list chỉ có `channel` + cờ assumed | Không gọi biểu đồ kênh là first-touch; phân bổ giả định phải có nhãn |
| CT19 | P1 C | `dailyOption` bỏ ngày không có registrations/new_contacts | Khoảng trống ngày bị nén trên trục category, trong khi backend đã tạo ngày liên tục |
| CT20 | P1 C/U | `HeatmapCard` suy từ giờ đăng ký sang giờ nên gọi/nhắn chốt phí | Giờ đăng ký không chứng minh thời điểm liên hệ hiệu quả; cần phân biệt quan sát với khuyến nghị |
| CT21 | P1 C | `revenue ? fmtVnd(...) : '–'` | Doanh thu bằng 0 bị hiển thị giống thiếu dữ liệu |
| CT22 | P1 C/R | `date_min/max` lấy theo first_touch, preset 7/30/90 dùng ngày hiện tại | Dữ liệu lịch sử có thể rỗng mặc định theo preset; biên ngày và timezone cần kiểm chứng |

### C. Bộ lọc, bảng và trạng thái

| ID | Ưu tiên / loại | Bằng chứng | Tác động |
|---|---|---|---|
| CT23 | P1 C/U | `MultiFilter.toggle` gọi onChange ngay, nút Xong chỉ đóng | Người dùng nghĩ đang chọn nháp; mỗi click có thể tạo request |
| CT24 | P1 C | DateFilter áp dụng mỗi đầu ngày ngay, không chặn from > to; backend không kiểm tra thứ tự | Khoảng ngày đảo ngược dễ tạo kết quả rỗng khó hiểu |
| CT25 | P1 C | `useUrlFilters.clear` thay bằng URLSearchParams rỗng | Xóa cả tham số không thuộc bộ lọc, khó mở rộng tab/view |
| CT26 | P0 C/R | `useApi` giữ data cũ trong khi path mới loading/lỗi, không AbortController | Dữ liệu partner trước có thể xuất hiện trong scope mới; request cũ vẫn chạy |
| CT27 | P1 C/R | `DataTable` reset page trong effect sau khi params/q/sort/pageSize đổi | Có thể request page cũ trước khi page=1, phát sinh trạng thái rỗng ngắn và đua request |
| CT28 | P1 C | opts chỉ lấy theo partner, không theo filter; UI không báo lỗi options rõ ràng | Không phải cascading facets; không có lý do để tự xóa lựa chọn còn hợp lệ theo scope |
| CT29 | P1 C | `DataTable` sort click trên `<th>`; row key theo index | Thiếu control bàn phím cho sort, khó giữ focus theo danh tính |
| CT30 | P1 C | Download CSV gửi sort nhưng backend CSV luôn sort `contact_id`, không dùng page | Không đúng nếu UI hứa xuất thứ tự/trang đang thấy; cần mô tả hợp đồng thật |
| CT31 | P1 C | Global `ExportBar` gọi `/overview/export` ngay cả tại Contacts | Báo cáo tổng quan và xuất danh sách bị nhầm mục đích |
| CT32 | P0 R | `apply_pii` mask email/phone và null dob/cccd/notes, nhưng q tìm trên email thô; `question` không bị null | UI không thể thay thế kiểm soát backend; tìm email có thể làm lộ thông tin suy diễn, question có thể chứa thông tin tự do; cần review riêng, không tuyên bố lỗ hổng đã khai thác |
| CT33 | P1 U/R | `FilterBar` nhiều dropdown, custom listbox gồm nút và input; bảng scroll ngang | Trải nghiệm bàn phím, focus, touch, popover bị cắt và mobile cần test thực |
| CT34 | P1 U | Biểu đồ nhiều tỉnh/PIC/heatmap 24h có chiều rộng/chiều cao và label cố định theo chart cũ | Có thể khó đọc trên vùng nội dung hẹp; chưa đo thực tế |
| CT35 | P2 C/U | `ChartCard` có chế độ bảng nhưng mọi chart render cùng lúc; bảng dài theo data | Tải/chiều dài trang, cần đo trước khi quyết định lazy mount |

## 4. Giá trị phải giữ

- API server-side pagination, sort whitelist, search, CSV, danh mục theo scope; không thay bằng lọc chỉ một page.
- Tất cả 10 nhóm lọc nghiệp vụ có thể dùng, nhưng không cần 10 nút thường trực.
- Phân tích chuyển đổi có ngữ nghĩa đúng và bảng số liệu thay thế chart.
- Phân biệt hồ sơ hợp nhất, lead từ biểu mẫu, đăng ký web, đã đóng phí, miễn phí.
- Các trường danh sách hữu ích còn truy cập được qua detail/column options; giảm mặc định không đồng nghĩa xóa dữ liệu.

## 5. Dẫn chứng source

Các link sau trỏ nhánh `main` đã đọc; có thể thay đổi sau audit. Dùng định danh cây trong README để đối chiếu thời điểm.

- [Contacts.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/pages/Contacts.tsx): `contactFilterDefs`, `COLUMNS`, `dailyOption`, `boardOption`, `Contacts`.
- [DataTable.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/DataTable.tsx): debounce, reset, CSV, sort, pager.
- [FilterBar.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/FilterBar.tsx): `MultiFilter`, `DateFilter`, `FilterBar`.
- [Viz.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/Viz.tsx): `FunnelCard`, `StatusStackCard`, `HeatmapCard`.
- [hooks.ts](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/lib/hooks.ts): `useApi`, `useUrlFilters`.
- [Layout.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/Layout.tsx) và [ExportBar.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/ExportBar.tsx).
- [contacts.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/routers/contacts.py): `contact_summary`, `LIST_FIELDS`, `SORTABLE`, `list_contacts`.
- [filters.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/filters.py): `scope_match`, `ContactFilters`, `apply_pii`, `add_search`.
- [misc.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/routers/misc.py): `options`.
- [process_and_seed.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/etl/process_and_seed.py): dựng contact cho đăng ký và lead; [seed.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/etl/seed.py); [DATA_DICTIONARY.md](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/docs/DATA_DICTIONARY.md).

## 6. Ưu tiên xử lý

P0: CT09–13, CT15, CT26, CT32 (CT32 là review backend/rủi ro, không tự sửa server). P1: IA, filter semantics, responsive, detail, export, số 0/null, access. P2: chart density và polish. Xem [API contract](contacts-api-contract.md) cho những gì backend thực sự hỗ trợ, [design](contacts-design.md) cho phương án thay thế, [review](contacts-review.md) để nghiệm thu. Không coi tất cả issue P0 đã sửa chỉ vì thay frontend: các giới hạn backend vẫn phải ghi nhận.
