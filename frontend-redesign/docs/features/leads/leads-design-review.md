# Lead từ biểu mẫu — Design Review trước V21

Ngày 24/11/2026 · Baseline V20 · Trạng thái: chốt thiết kế, chưa triển khai.

Đọc cùng README, leads-issues, leads-api-contract, leads-design, leads-plan và leads-review. Tài liệu này bổ sung quyết định cuối cùng nếu có khác biệt với wireframe ban đầu. Không thay đổi backend, routes, Shell hoặc phần việc của đồng đội. Đã mở lại sáu tài liệu, source Contacts V20, PageActions, useResource, Chart, Dialog, ExportCsv, Records và CSS. Workspace V20 hiện là commit V19 cộng working diff V20; Leads.tsx còn `return null`. Chưa kiểm tra runtime/DB trong vòng review này.

## 1. IA đã chốt

| Quyết định | Lý do |
|---|---|
| Giữ `/lead`, nhãn sidebar V20, nhóm Tuyển sinh | Không thay đổi mental model hay quyền truy cập |
| Hai chế độ `Danh sách lead` (mặc định) / `Phân tích nguồn` | Cùng pattern Contacts; không có KPI/biểu đồ chắn đường tra cứu |
| Một filter dialog và chip applied dùng chung hai chế độ | Giảm toolbar và giữ phạm vi phân tích |
| Search chỉ list + CSV, memory, không URL | Task tra cứu; tránh URL chứa email/họ tên; ghi rõ summary không theo q |
| PageRefresh V20 ở Shell, không thêm H1/refresh cục bộ | Nhất quán vị trí; làm mới danh mục và view active |
| Detail chỉ đọc từ row hiện tại | Backend không có detail/write endpoint |
| Không gộp lead, gửi email, đánh dấu đã gọi, sửa trạng thái | Không có API thực hiện |

Không dùng từ “thí sinh” hoặc “người” cho count dòng. `Lead mới` là kết quả đối soát của dòng theo ETL, không phải khách hàng mới theo thời gian thực. Contact ID là mã tham chiếu CRM, không phải mã lead. Không tạo link hứa tra cứu exact bằng q regex.

## 2. Records workspace — layout cuối

```text
[Shell: Lead từ biểu mẫu                         Scope ↻]
[ Danh sách lead | Phân tích nguồn ]
[ Bộ lọc · n ] [Nguồn ×] [Kết quả đối soát ×] [Xóa lọc]
╭ Danh sách lead ─────────────────────────── n dòng ╮
│ [Tìm mã, họ tên, email*] [Cột] [Xuất CSV*]         │
│ Họ tên / Mã | Nguồn | Kết quả đối soát | Ngày gửi | › │
│ ...                                               │
│ 1–20 / n dòng     Số dòng [20]       ‹ 1/3 ›       │
╰───────────────────────────────────────────────────╯
```

*Theo quyền PII, xem mục 5. Không phải số liệu production. Bốn cột mặc định + action; tại expanded có thể thêm PIC nếu đủ không gian. Không bắt buộc PIC mặc định khi chỉ vừa 1000px. Nguồn và ngày gửi không gộp thành một trường mơ hồ. Campaign/biết Talkshow qua đâu là hai trường khác nhau. Cột tùy chỉnh không cho ẩn identity/detail action. Cột mặc định ưu tiên wrap/độ rộng phù hợp, không gây cuộn ngang bắt buộc. Optional columns có thể cuộn cục bộ. Tất cả sort dựa trên 7 field backend hỗ trợ; không sort PIC hoặc board. Mobile/medium phải có control sort cho field không hiện trong table. Default `-created_at`; không page cũ khi filter, q, sort, size đổi.

### Compact

```text
[ Danh sách lead | Phân tích nguồn ]
[ Bộ lọc ] [chip...]
Danh sách lead · n dòng
[ Tìm kiếm                       ]
[ Sắp xếp: Mới nhất ▼ ] [ CSV*   ]
─────────────────────────────────
Họ tên                          ›
Mã liên kết · Nguồn
Kết quả đối soát
Ngày gửi · Người phụ trách (nếu có)
─────────────────────────────────
1–20 / n       ‹ 1/3 ›
Số dòng [20]
```

Dưới 680px content width: một list ngữ nghĩa, không table ẩn vẫn focusable. 680–999: 4 cột thiết yếu; từ 1000: expanded khi vừa. Dưới 340: toggle có thể xuống hai hàng, không ép chữ nhỏ. Dùng content width cho table/list, viewport/dynamic height cho modal. Dialog có chiều cao giới hạn, body scroll, header/footer luôn truy cập được. Không dùng nguyên `ct-*` làm namespace của Leads. Mobile 320, 360, 390, 430; tablet 600/768; desktop 1024/1280/1440/1920; test thêm 679/680 và 999/1000, sidebar, zoom 200%, tên dài.

## 3. Bộ lọc, state và refresh

- Giữ 9 nhóm: ngày gửi, nguồn, kết quả, bảng quan tâm, miền, nhóm CRM, chiến dịch, nền tảng, PIC. Không tự thêm province, question, wants_talkshow hay self_declared filters.
- Một draft dialog: Apply một lần, Cancel/ESC không đổi URL hoặc fetch; Clear draft khác Clear applied. `__none__` chỉ PIC null; không bao hàm chuỗi rỗng. Option có dấu phẩy không biểu diễn được trong API hiện tại: hiển thị nhưng không cho chọn như giá trị exact, có giải thích.
- Không hardcode min/max ngày hoặc suy ra min/max từ trang hiện tại. Ngày YYYY-MM-DD, range mở, validate trước request. Backend dùng created_at và ngày cuối inclusive. Ghi chú UTC đối với tuần.
- URL structural filters + view, không q/PII/partner. Query ổn định, reset page atomically; summary không q. Identity username/role/effective scope/PII; đóng dialog, detail, export, reset state khi identity đổi. Không giữ data path cũ. Options xác minh viewing_partner.
- PageRefresh gọi options.retry và active.retry nếu hợp lệ; không reset query. Không gọi ETL, không poll. Nếu refreshed options khiến filter không hợp lệ, block list/summary cho đến khi sửa. Chỉ mode active fetch; không mount chart khi list.
- Row selection gắn với response snapshot thực, index chỉ discriminator trong snapshot, không phải ID bền. Nếu response mới, đóng detail kể cả cùng Contact ID. Hỗ trợ row_no null hoặc trùng ở hai nguồn.

## 4. Phân tích nguồn — ba khu vực, không lặp Contacts

1. KPI chính: tổng dòng và số Contact ID duy nhất có giá trị. Hai KPI cùng nhóm visual; không lấy `total - unique_contacts` làm duplicate count.
2. Kết quả đối soát: count/tỷ lệ trên total của ba nhóm chuẩn và nhóm còn lại nếu có; phân bố theo nguồn bằng stacked bars khi dữ liệu hợp lệ. Không funnel. Nhiều source/result hoặc nhãn dài thì table-first; bảng đầy đủ cả unknown/null. Không áp màu success/error cho trùng form vì đây là phân loại đối soát.
3. Biểu đồ cột theo tuần ISO, source series từ API; labels YYYY-Www hoặc ngày thứ Hai tính đúng ISO; `start` không phải Monday. Lấp tuần thiếu chỉ trong span hữu hạn, nếu quá dài chọn khoảng hiển thị rõ ràng; table toàn bộ dữ liệu. Cảnh báo thiếu timestamp bằng chênh count hợp lệ, ghi chú fallback ETL không xác định từng dòng. Không tự sửa ngày theo browser timezone.
4. Phân bố theo một dimension selector (nguồn, bảng, miền, nhóm CRM, PIC, campaign, platform, heard_from, self_declared). Mặc định Nguồn nếu dữ liệu có; không bắt đầu ở campaign khi scope chỉ có Talkshow. Top 10 nếu cần, ghi rõ; bảng đầy đủ, denominator rõ khi facet loại null. Drill-down bằng action trong bảng chỉ với filter chính xác, thu hẹp điều kiện hiện có, reset q/page. Không drill-down heard_from/self_declared.

Mục 2–4 là ba vùng phân tích; KPI là summary, quan tâm Talkshow và tự khai là hai chỉ số phụ ở cuối, không card hero. Không xem `self_declared_registered` là đăng ký đã xác minh. Không biểu đồ nội dung câu hỏi tự do. Không fake data khi summary lỗi hoặc 0. Chart V16: màu từ theme, solid series, theo host width, tooltip trong viewport, table fallback. Không vẽ 2 chart cạnh nhau nếu mỗi host dưới 480px; chuyển 1 cột thay vì thu nhỏ chữ. Đo chart host riêng; giữ dữ liệu khi resize. Giữ màu cùng series theo source/result key trong cùng tập dữ liệu, không hardcode nhãn từ ETL.

## 5. Quyền và CSV — điều kiện phát hành

`apply_pii` chỉ mask email/phone và ẩn note, không mask question; CSV_COLUMNS chứa question. Đây là giới hạn backend đã xác nhận, không thể khẳng định CSV an toàn cho tài khoản không có can_view_pii. Chốt phương án thận trọng trong frontend: với can_view_pii=false, không hiển thị question/note trong detail và không cung cấp CSV từ endpoint hiện tại; giải thích “Xuất CSV chưa khả dụng với quyền xem dữ liệu giới hạn”. Với can_view_pii=true, giữ export toàn bộ match theo filter/q (không sort/page, server ngày tăng dần), cảnh báo dữ liệu cá nhân và mở file tin cậy. Không tự xử lý CSV hoặc lặng lẽ bỏ cột để giả lập bảo mật. Không gửi email/tel action từ masked row. Search UI ở masked role chỉ hướng dẫn mã/tên; API q vẫn tìm email nên không tuyên bố đã ngăn inference. Quyền thật lấy từ user, không suy từ scope admin đang xem.

Đây là UI guard bổ sung, không phải authorization; direct API vẫn cần backend sửa quyền CSV/question và spreadsheet formula injection trước production. Ghi ticket backend riêng, không thay backend ở V21–V23. Không log raw response/PII. Với masked role, hạn chế search email tại backend là backlog riêng, không tự lọc client-side và làm sai tập dữ liệu. Với CSV cho quyền đầy đủ, abort khi query, scope, mode đổi, pending search hoặc unmount; không nói trình duyệt đã lưu file khi chỉ trigger download.

## 6. Reuse đã chốt

Source Contacts có `Dialog` native, focus restoration, class ct-dialog và CSS riêng; ExportCsv có abort/mime validation nhưng filename hardcode lien_he.csv. Không import hai component feature-specific thẳng sang Leads. Dùng chung PageRefresh, useResource, apiFile, format, Expressive Button/ToggleButton/TextField và shared Chart. Có thể extract đúng 2 primitive generic Dialog/CsvDownload với namespace dùng chung nếu regression Contacts có thể xác minh; nếu runtime chưa đủ, giữ implementation Leads nhỏ, độc lập theo hợp đồng hiện có, ghi technical debt. Không generic hóa table/filter domain model. Không thêm dependency. Không sửa Shell, Contacts hay teammate để làm Leads, ngoại trừ extraction được kiểm chứng có diff riêng và không thay hành vi Contacts.

## 7. Gate bổ sung cho V21–V23

- V21: kiểm tra source/row_no collision, null ID, snapshot refresh đóng detail; filter draft/cancel, date không hardcode, comma option, 7 sort, list/CSV equality cho role được phép; CSV masked không có action; refresh options + active; không request thừa mode ẩn.
- V22: fixture 5 dòng trong leads-review: distinct=3, unknown=2, W53 2026→W01 2027, W02 zero, W03 có dòng, 1 undated; không dùng min(start) là Monday. Không sửa source alias ngầm. Chart total không mất unknown; dimension partial coverage; exact drill-down không mở rộng filter đang có. Kiểm tra chart host 339/340/479/480/679/680.
- V23: toàn bộ checklist leads-review, role thật, 5 theme, light/dark/system, keyboard/zoom/touch, scope race, test Contacts/Overview/Shell. PII guard chỉ UI; ghi blocker backend. `git apply --check` trên V20 sạch và `git diff --check`. Chỉ đánh PASS khi có bằng chứng; build/runtime không chạy ghi NOT RUN/BLOCKED, không gọi release-ready.

Kết luận: thiết kế được chốt để triển khai V21–V23. Bước coding tiếp theo bắt đầu từ đúng V20, giao một patch V20→V23; tài liệu review giao riêng để không trùng docs đã áp dụng. Không sửa code trong vòng review này.
