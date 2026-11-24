# Leads — Information Architecture & Visual Design

## D01. Nhiệm vụ riêng

Lead từ biểu mẫu là màn hình đối soát các dòng thu từ form ngoài và phân tích nguồn/nội dung thu thập. Contacts là hồ sơ người đã hợp nhất; Overview là snapshot, Marketing là hiệu quả kênh, Quality là pipeline. Không gọi lead là thí sinh hoặc khách hàng duy nhất. Không có thao tác sửa CRM, gửi tin, xóa/gộp trùng. Tên route giữ /lead và nhãn V20; không thêm sidebar, không thêm H1 trong body.

## D02. Hai chế độ

Dùng cùng pattern Contacts: Danh sách lead (mặc định), Phân tích nguồn. Một toggle group có selected/pressed semantics, giữ bộ lọc chung khi chuyển chế độ. Search riêng list/CSV, không áp dụng summary, giữ trong memory khi chuyển tab, có note nếu đang có search. Chỉ fetch mode đang hiển thị; options chung. PageRefresh V20 cập nhật options + mode active, không reset sort/search/page/filter. Không có nút Cập nhật cục bộ.

### Desktop wireframe (content ≥1000)

```
[Shell: Lead từ biểu mẫu             Scope             ↻]
[ Danh sách lead | Phân tích nguồn ]
[ Bộ lọc (n) ] [Nguồn ×] [Kết quả ×] [Xóa lọc]
╭ Danh sách lead ────────────────────── 59 dòng* ╮
│ [Tìm mã, họ tên, email] [Cột] [Xuất CSV]        │
│ Họ tên / mã liên kết | Nguồn | Đối soát | Ngày gửi | PIC | › │
│ ...                                                     │
│ 1–20 / ...     Số dòng [20]     ‹ 1 / 3 ›              │
╰────────────────────────────────────────────────────────╯
```

`59` chỉ ví dụ wireframe, không hardcode. Không có KPI trong records mode. Count luôn ghi dòng lead; contact ID là secondary text. Default sort ngày gửi mới nhất; nút header sort cho field hợp lệ, aria-sort, button có focus. Cột mặc định 4–5 + action. Không biến mỗi row thành card riêng. Hover state, divider, selected detail opener; không zebra màu mạnh. Cột email/phone không mặc định; detail/cột tùy chọn hiển thị đúng quyền. Question/note không nằm trong cột mặc định hoặc column picker (tránh PII và hàng rất cao). Cột tùy chỉnh có reset mặc định; không cho ẩn identity/detail action. Hẹp hơn, ẩn optional theo layout, nhưng detail còn đủ dữ liệu được phép.

### Compact wireframe (content <680)

```
[Shell title                     ↻]
[Scope: ...] (Shell quyết định)
[ Danh sách lead | Phân tích nguồn ]
[ Bộ lọc ] [chip...] [Xóa lọc]
Danh sách lead · 59 dòng*
[ Tìm mã, họ tên, email        × ]
[ Sắp xếp: Mới nhất ▼ ] [ CSV ↓ ]
────────────────────────────────
Hồ sơ A                  ›
PT-001 · Talkshow
Lead mới                 26/08/2026
Người phụ trách: ...
────────────────────────────────
...     [ ‹ ] 1 / 3 [ › ]
```

Không kéo ngang body. Record list ngữ nghĩa ul/li hoặc list tương đương, mở detail bằng button rõ ràng, không nested click. Tối thiểu 44px, ưu tiên 48px. Tên dài wrap, action không bị đẩy ra ngoài. Mobile sort menu giữ cùng sort allowlist; page size có thể đặt dưới hàng pager, không mất action. Search full width. CSV không bị ẩn ở 320px.

## D03. Bộ lọc

Một filter button và chip applied giống Contacts V20. Dialog có draft, Apply atomically, Cancel không fetch; Clear trong draft không thay applied trước Apply. Nhóm ngày gửi, nguồn/kết quả, bảng/miền, chiến dịch/nền tảng, nhóm CRM/PIC. Checkboxes multi select có search local đối với nhiều option; clear group; invalid selection báo rõ. Không hardcode date bounds/presets theo dữ liệu cũ; date input native hoặc primitive đã có, cho phép range mở. Không đổi source tự xóa campaign; cả hai AND, giải thích không có kết quả và cho sửa. Chip group hiển thị label/range/count, remove bằng button có accessible name; dài wrap. Dialog full-screen compact; scroll body nội bộ, header/footer cố định; keyboard tab trap, Esc, restore focus, reduced motion.

## D04. Detail chỉ đọc

Header: Họ tên, nguồn, mã dòng gốc (nếu có), contact ID, kết quả đối soát; không gọi Contact ID là ID lead. Sections:
- Biểu mẫu: thời gian, bảng quan tâm, tỉnh/miền, nhóm CRM/PIC.
- Nguồn: campaign và platform nếu có, heard_from label riêng, giữ nhãn không đủ quyền; không tự fetch ad details.
- Quan tâm: wants_talkshow, self_declared (tự khai/ETL, không xác minh), không chuyển thành paid/web_registered.
- Liên hệ: email/phone đúng response, masked state; question/note chỉ hiện với can_view_pii và chính sách cho phép, text thường, wrap; không render HTML.
Không edit, không copy all, không mailto/tel từ masked field. Không làm link Contacts giả exact; hiển thị mã tham chiếu để tra cứu thủ công. Dùng dialog hiện có nếu tách primitive generic không thay đổi semantics, close khi row/query/scope/snapshot đổi. Desktop max-width vừa đọc; mobile full-screen có nút đóng dễ chạm.

## D05. Phân tích nguồn (không làm lại Contacts)

```
[ Danh sách lead | Phân tích nguồn ]
[ Bộ lọc ] [chip...]
╭ Tổng dòng lead ──╮ ╭ Liên hệ có mã duy nhất ─╮
│ count            │ │ distinct contact_id   │
╰──────────────────╯ ╰───────────────────────╯
╭ Kết quả đối soát ─────────────────────────────╮
│ Lead mới     Đã có trong Data    Trùng ngoài  │
│ n / %        n / %              n / %         │
│ [stacked bar theo nguồn, nếu hợp lệ]   [Bảng] │
│ Nhóm khác/chưa rõ nếu có                       │
╰───────────────────────────────────────────────╯
╭ Dòng biểu mẫu theo tuần ISO        [Bảng số liệu] ╮
│ [chart stacked bars hoặc grouped]                 │
│ [legend] [ghi chú ngày thiếu và timezone]         │
╰───────────────────────────────────────────────────╯
╭ Phân bố dòng lead             [Nhóm: Chiến dịch ▼] ╮
│ [horizontal comparison]  [Bảng số liệu]             │
╰─────────────────────────────────────────────────────╯
[Quan tâm Talkshow: n dòng] [Tự khai đã đăng ký: n dòng]
```

Hero total + unique contacts cùng surface hoặc hai tile với hierarchy, không đặt 6 card ngang. Kết quả đối soát 3 count chuẩn + nhóm còn lại nếu có; không biểu thị như funnel. Source-result stack chỉ nếu count hợp lệ; nhãn chính xác từ API, fallback label nhóm chưa rõ; nhiều source/result: table-first thay vì chart legend quá lớn. Weekly dùng ECharts shared V16, không line daily Contacts; cột theo tuần phù hợp count rời rạc. Chỉ render tuần có hợp lệ, lấp tuần trống có giới hạn; không bỏ point để vừa màn hình. Labels ISO year-week hoặc ngày thứ Hai tính từ ISO, tooltip full; không dùng min(start). Chart table luôn truy cập được. Màu theo theme, legend clickable (nếu nhiều series), không dùng màu cố định hoặc pattern dash. Không lấy tự khai làm conversion. Chỉ số quan tâm là phụ, không KPI hero. Nếu total=0 hiển thị empty và clear filter, không mount chart vô nghĩa.

Dimension selector: nguồn, bảng quan tâm, miền, nhóm CRM, PIC, campaign, platform, biết Talkshow qua đâu, tự khai. Nhãn đơn vị dòng, count không phải distinct. Các dimension không có dữ liệu hiển thị empty; phân biệt null với nhóm không có quyền. Top 10 nếu quá nhiều nhóm + bảng toàn bộ, ghi rõ giới hạn chart. Nếu dữ liệu không có giá trị, không tạo fake bar. Drill-down chỉ từ table/button với exact filter mapping, không từ toàn bộ vùng chart không accessible. Không chart câu hỏi tự do. Không dự đoán chủ đề FAQ bằng count câu hỏi nguyên văn.

## D06. Responsive contract

Content container, không viewport: <680 compact list + 1 col charts; 680–999 table essentials, KPI 2 col khi đủ; ≥1000 table default và phân tích 2-col nếu chart host đủ; chart host <480 compact ticks/legend/tooltip theo V16, không ép 2 chart nửa hẹp. Test 679/680/999/1000 và host 339/340/479/480. Desktop detail width capped, compact full-screen. Sidebar mở/đóng, scope wrap V20, zoom 200%. Không đổi layout làm mất state, không mount hai table/list có focus trùng; CSS display none hoặc single render đảm bảo hidden inaccessible. Scroll table cục bộ chỉ khi user chọn nhiều cột, không bắt buộc để hoàn thành task. Sticky header nếu có phải không che focus/row. Legend/table tooltip không tràn màn hình.

## D07. Material 3 Expressive

Reuse Button, ToggleButton, IconButton, Select, TextField, Tooltip/Menu, ripple và token hiện hữu, PageRefresh. Tất cả 5 palettes light/dark/system; semantic surfaces, on-surface/on-surface-variant, primary/secondary/tertiary theme-derived. Màu trạng thái không là tín hiệu duy nhất; text đầy đủ. No hardcoded brand colors for source. Card radius/padding đồng bộ Contacts; spacing 4/8/12/16/24, hierarchy qua typography, không shadow lạm dụng. Không thêm H1. Motion phục vụ selected/hover/loading, prefers-reduced-motion, touch. Contrast text 4.5:1 normal, 3:1 large/UI target; kiểm tra thật theo theme, không đoán pass.

## D08. Loading/error/empty

Initial skeleton có nhãn aria-busy, đổi filter/scope không giữ snapshot cũ; same-path refresh giữ dữ liệu và cảnh báo lỗi. Empty do không có dữ liệu khác empty do filter/search; clear filter/search tương ứng. Options error cho retry; không render filter form nửa có dữ liệu. Search pending disable CSV và ghi rõ đang tìm; no stale export. Page out of range do refresh giảm total thì clamp và refetch once. 401 auth flow, 403 no access, 400/422 message. Không log PII hoặc hiện stack trace. Scope boundary reset filters, search, selection; giữ mode nếu phù hợp. Không polling, không load 2 mode đồng thời.
