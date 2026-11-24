# Contacts — review guide và Definition of Done

**Mục đích:** dùng trước và sau mỗi vòng V17–V19. Đây là checklist kế hoạch, **chưa có test nào của Contacts mới được thực hiện**. Không đánh dấu pass từ wireframe hay phân tích code cũ. Ghi PASS / FAIL / NOT RUN / BLOCKED cùng evidence. Tất cả fixture minh họa là test-only.

## 1. Review theo vai trò

| Vai trò | Câu hỏi đánh giá | Bằng chứng cần |
|---|---|---|
| BA | Đơn vị đếm, mẫu số, first_touch vs registration date, miễn phí có đúng? | API response + fixture expected + screenshot label |
| UX | Tìm người, lọc, mở detail, export, phân tích có ít bước và không mất ngữ cảnh? | Task walkthrough desktop/mobile, keyboard |
| VD | Nhìn giống V16 M3 Expressive, phân cấp hợp lý, token và theme đồng bộ? | Screenshot sáng/tối + theme switch live |
| Architect | State, path, scope, hook, shared boundaries, no duplicate code? | Diff + tests, no teammate changes |
| QA | Responsive, race, lỗi, pagination, CSV và quyền có hoạt động? | Network logs redacted, test result và repro |

## 2. Functional and business tests

| ID | Kịch bản | Kết quả mong đợi | Trace |
|---|---|---|---|
| F01 | Mở `/crm` với quyền contacts | Records mặc định, bảng hiện trước chart; h1 chỉ ở Shell | CT01–05 |
| F02 | Tìm mã, tên Unicode; admin tìm email | Debounce một query, trim/max 80, page 1; không PII URL; count theo API | CT09,27,32 |
| F03 | Search từ trang 5 | Không request trang 5 với q mới; page 1 atomic | CT27 |
| F04 | Chọn 2 bảng + miền + trạng thái | OR trong chiều/AND giữa chiều; query encoded, apply một lần; không fetch draft | CT23 |
| F05 | Cancel/Escape form | Không đổi URL hay committed filter | CT23 |
| F06 | Nhập from > to; one-sided; ngày cuối | Invalid chặn apply, one-sided đúng, inclusive ngày cuối từ backend | CT10,24 |
| F07 | Xóa một chip, xóa tất cả filter | Chỉ điều kiện được chọn đổi; mode/scope giữ nguyên, search xóa riêng | CT25 |
| F08 | Back/forward URL, mở deep link | Structural filter restore; view và count đúng; q không lưu URL | CT25 |
| F09 | Options lỗi/rỗng/giá trị không còn | Retry, không option giả, không silently broaden | CT28 |
| F10 | Sort mỗi whitelist, unsupported sort | API sort đúng dấu; sort control focus được, không gửi unsupported | CT29 |
| F11 | Page size 10/20/50/100, 0 kết quả, last page | Range đúng; trước/sau disabled; page clamp 1 lần khi total giảm | CT27 |
| F12 | Mở detail, đóng, đổi filter/page | Hiển thị field đúng row, không gọi endpoint mới; close/focus restore, không row cũ | CT04,26 |
| F13 | Giá trị 0, null, empty list, long text | 0 ₫ khác —; unknown trạng thái trung tính; không crash | CT21 |
| F14 | Chuyển sang Phân tích trong khi có q | Structural filters giữ; thông báo không áp dụng q; không mount table/chart dư | CT09,35 |
| F15 | Export từ page 2, sort khác mã | Toàn bộ kết quả theo filter/q, sort mã; không hứa xuất page hiện tại | CT30–31 |
| F16 | Export khi q draft chưa debounce, filter pending | Disable hoặc đúng snapshot đã áp dụng; không tải tập khác | CT30 |
| F17 | Click drilldown nhóm board/region/PIC | Exact filter, records mode page 1; không map nguồn tổ hợp sang source | CT08,17 |
| F18 | Overview CTA chưa ghi nhận đóng phí | Chỉ vào `/crm` nếu backend chưa hỗ trợ exact nhóm, không filter payment_status giả | CT12–13 |
| F19 | So total summary với list không q trong cùng scope/filter | Khớp tại cùng dataset snapshot; nếu import đồng thời, refresh/ghi chênh lệch, không ép số | CT09 |
| F20 | Người dùng không quyền contacts | Route guard/403, không fetch/hiện nội dung trái quyền | CT26,32 |

## 3. Fixture nghiệp vụ để chống nhầm

### Fixture A — hồ sơ và miễn phí

Giả sử 5 hồ sơ trong cùng scope: A (web=true, paid=true, fee/revenue=500000); B (web=true, paid=false, fee=500000); C (web=true, paid=false, miễn phí, fee=0); D (web=false, paid=false, payment_status='Chưa thanh toán', fee=0); E (web=true, paid=true, fee/revenue=500000, thiếu ngày đăng ký). Kỳ vọng: total=5, web=4, paid=2, rate=50%, unpaid_registered=2 (B+C), potential_revenue=500000, free=1, leads_only=1, revenue=1000000. Filter payment_status='Chưa thanh toán' có thể trả B+D; **không bằng** tập B+C. KPI unpaid không được đặt tên “2 người nợ phí”; không tính số hồ sơ valid từ số list page. Timeline paid chỉ có 1 bản ghi có ngày, thiếu E phải được chú thích.

### Fixture B — cohort và trục ngày

3 hồ sơ có first_touch 01/08, 02/08, 03/08; đăng ký 02/08, 10/08, null; một hồ sơ đã đóng phí hiện tại có ngày đăng ký 10/08. Filter first_touch 01–03/08 vẫn có điểm đăng ký 10/08; 04–09/08 là zero days, không bỏ khỏi trục. Không gọi đó là giao dịch ngày 10/08. Tooltip/bảng hiển thị ngày đầy đủ, lũy kế không bao gồm người thiếu ngày. Định dạng ngày không đổi khi browser timezone khác; xác nhận timezone của backend bằng data thực.

### Fixture C — breakdown và lỗi

`count=10, web_registered=6, paid=3` → ba nhóm 3 paid, 3 web không paid (có thể miễn phí), 4 chưa web; nếu paid=8, web=6, không vẽ đoạn -2; hiển thị cảnh báo và bảng số liệu gốc. `total=0,web=0,paid=0,paid_rate=null` → empty hợp lệ, không chia 0. 1 hồ sơ có 2 nguồn và 3 cờ → by_source sum=2, by_flag sum=3, flagged=1. by_venue.count khác by_venue.paid; không ghi count là paid. `channel_is_assumed=true` row hiển thị nhãn giả định, aggregate không có assumed count thì không suy.

### Fixture D — robustness

Response có name dài 100 ký tự tiếng Việt, email dài, null PIC, 0 fee, missing arrays, 30 tỉnh, 365 ngày, chỉ một ngày, 0 ngày, giá trị tiền rất lớn, status unknown. Test query values chứa khoảng trắng/Unicode, `__none__`, dấu + trong email, dấu regex literal. Không XSS khi text chứa `<script>`; render text escaped, không dangerouslySetInnerHTML. Tooltip dùng richText hoặc escape nếu HTML. Fixture không phải nguồn dữ liệu production.

## 4. Quyền và concurrency — gate bắt buộc

| ID | Mô phỏng | Đạt khi |
|---|---|---|
| S01 | Admin toàn scope → NEU khi list cũ pending | Không render row, count, detail, options cũ sau đổi scope; abort/ignore late response |
| S02 | Đổi NEU → NH → toàn scope liên tục, response về đảo thứ tự | Chỉ snapshot đúng scope/identity; loading không leak dữ liệu |
| S03 | Partner không PII | Mask giữ nguyên từ API; không reveal, không lưu cache PII; không hiển thị CCCD/dob/notes/question |
| S04 | Scope status loading/error, invalid code | Không gọi contact path chưa ready; retry scope; không tự fallback toàn hệ thống |
| S05 | 401 trong list/summary/export | Session expired xử lý shared service; không download HTML/error blob |
| S06 | 403/400/422/500, mất mạng, abort | Error cụ thể, retry, abort không toast lỗi giả; same path refresh ghi rõ data cũ |
| S07 | Đổi scope/route/q/filter trong lúc CSV download | Abort hoặc chặn save khi snapshot không còn hợp lệ; revoke URL; không hiển thị thông báo của scope cũ |
| S08 | Detail đang mở rồi đổi quyền/account | Đóng detail; không tái dùng row qua identity; focus hợp lý |
| S09 | CSV formula-like cells, search email account masked | Ghi nhận backend risk API-L3, không tuyên bố UI khắc phục; xác minh và gửi yêu cầu backend riêng nếu cần |

Không đưa thông tin cá nhân thật vào screenshot/log gửi cho review; dùng account test và che dữ liệu. Không thay đổi user permissions hoặc seed DB sản xuất để chạy test. Nếu backend không hỗ trợ điều kiện chính xác, đánh BLOCKED cho tính năng đó và không ship control gây hiểu nhầm.

## 5. Responsive matrix — kiểm tra thật trước nghiệm thu

Đo `clientWidth` của vùng nội dung/Chart host, không chỉ viewport. Kích thước viewport dưới đây là bộ test tối thiểu. Ghi actual content width và mode layout. Thực hiện ở sidebar mở/đóng khi có thể; mobile mở/đóng drawer. Zoom 125%, 200%, browser font scale, landscape. Test trên laptop thực người dùng, không chỉ 1920.

| Viewport | Layout phải xem | Trọng tâm |
|---|---|---|
| 320×640 | Compact | Không mất action, tên dài wrap, dialog footer nhìn thấy |
| 360×800 | Compact | Filter chips wrap, search, CSV, pager, detail |
| 390×844 | Compact | Touch targets, tab, chart ticks/legend/tooltip |
| 430×932 | Compact | Long names, horizontal overflow, date inputs |
| 600×800 | Compact/medium theo host | Filter và record list/table chuyển đúng threshold |
| 768×1024 | Theo host | Sidebar rail và popover collision |
| 1024×768 | Medium thường | Table actions, sort, list scroll, chart container |
| 1280×800 | Medium/expanded | Sidebar mở/đóng, row density, top toolbar |
| 1440×900 | Expanded nếu host đủ | Table, metric hierarchy, detail modal |
| 1920×1080 | Expanded | Không kéo dòng chữ quá dài, width/spacing hợp lý |

### Checklist mỗi kích thước (R01–R14)

- [ ] R01: `document.documentElement.scrollWidth <= clientWidth + 1` ở records/analysis; nếu table có thêm cột, chỉ vùng cuộn riêng được scroll ngang.
- [ ] R02: Không dùng CSS hide overflow để che text/controls; focus visible không bị cắt.
- [ ] R03: Filter/date/sort/pageSize/CSV luôn có nhãn và thao tác; menu không vượt viewport hoặc bị shell clip.
- [ ] R04: Mobile danh sách có thông tin chính và chi tiết, không ép 15 cột; các row không thành card có khoảng trống quá lớn.
- [ ] R05: Pagination range đúng, buttons không tràn; cột action nhìn thấy; sort bằng keyboard/mobile menu.
- [ ] R06: Detail/filter modal scroll body, Esc/close, focus trap, focus restore; bàn phím ảo không che Apply/Close.
- [ ] R07: Text tiếng Việt dài, số tiền lớn, status dài, email dài không overlap; chữ body không bị thu nhỏ bất hợp lý.
- [ ] R08: Chart ticks theo host (3–9 V16), không giảm điểm; tên nhóm dài không đè axis; tooltip confined và dùng touch được.
- [ ] R09: Legend wrap hợp lý, label ≥14px mục tiêu, tương tác toggle và aria-pressed; màu trùng/khó đọc vẫn có table thay thế.
- [ ] R10: ECharts resize khi sidebar thay đổi không cần reload; khi chuyển mode dispose/reinit đúng, không canvas size 0.
- [ ] R11: Chart lỗi vẫn đọc được bảng, không infinite retry; table có header scope, scroll region focus.
- [ ] R12: 44px tối thiểu touch target, ưu tiên 48px; focus order logic, selected state không chỉ màu.
- [ ] R13: Dark/light/system và 5 seed theme thật: text/surface contrast, chart token thay ngay, không palette hardcode.
- [ ] R14: prefers-reduced-motion, zoom 200%, loading/error/empty/no options giữ layout đọc được.

Static markup test có giá trị tìm overflow, nhưng chỉ là một phần. Phải kiểm tra ứng dụng React/ECharts thật và tương tác keyboard/touch trước khi tuyên bố responsive pass. Screenshot ghi mode, viewport, theme, sidebar, scope (không PII).

## 6. Design quality review — rubric

Chấm 0 = fail, 1 = chấp nhận nhưng cần chỉnh, 2 = tốt. Không dùng điểm tổng để bỏ qua P0.

| Tiêu chí | Đạt 2 khi |
|---|---|
| IA | Lookup không qua chart; view analysis rõ; filter scope hiểu được |
| Visual hierarchy | Bảng dễ quét, một hero trong analysis, không đồng loạt tô màu |
| M3 Expressive | Token/shape/state layer/focus/motion đúng nền tảng, nhất quán V16 |
| Typography | Tên/số dễ đọc, label hierarchy, no clipping, tabular number |
| Responsive | R01–R14 đạt trên matrix và resize thật |
| Interaction | Apply/Cancel/clear/search/pager predictable, detail read-only rõ |
| Data trust | Null vs 0, date cohort, free vs paid, assumed label, drilldown đúng |
| Accessibility | Semantic table/list, button focus, dialog restore, chart alternative |
| Performance | Không fetch khi draft; chỉ view hiện tại, không render chart dư; kiểm tra network thực |
| Consistency | Không phá Overview, Shell, theme hay teammate feature |

Mục tiêu ít nhất 17/20 và không có điểm 0; mọi gate an toàn, API/data, responsive bắt buộc đều đạt. Nếu chưa có test runtime, điểm tương ứng chưa chấm; không tự cho 2.

## 7. Commands và bằng chứng nghiệm thu

Thực hiện từ `frontend-redesign` trên baseline thực (Node đáp ứng engines; npm ci khi cần). `npm run test:contacts` chỉ chạy sau khi script mới được thêm. Không chạy seed/reset password tự động.

```bash
npm run test:source
npm run test:theme
npm run test:api
npm run test:overview
npm run test:contacts
npm run test:local
npm run build
npm run dev
```

Nếu backend đang chạy tại 8000 và DB test sẵn sàng, kiểm tra `/api/docs` và devtools Network theo đúng account. Không ghi raw response PII vào docs. Record số request mỗi thao tác, status, query key (redact q), và xác nhận count/CSV. Kiểm tra browser console không lỗi chưa xử lý. TypeScript syntax-only không thay cho full tsc/build. Với npm registry offline, ghi rõ các lệnh NOT RUN; không tuyên bố full build pass.

Trước bàn giao, từ repo root:

```bash
git diff --check
git status --short
git diff --stat
git apply --stat path/to/contacts.patch
# chạy --check trên clean copy của baseline tương ứng, không phải tree đã apply
git apply --check path/to/contacts.patch
```

Kiểm tra package/lock nhất quán nếu có đổi; patch không chứa `.env`, data, dist, node_modules, backend, teammate files. File thêm mới phải có trong diff. Nếu commit, stage đúng danh sách Contacts + shared/tests/docs đã duyệt; không `git add -A frontend-redesign/` mù khi teammate có work. Không push tự động.

## 8. Review log template

```
Version / baseline tree or commit:
Date and environment (Node, browser, backend test context):
Issue IDs addressed:
Design decisions changed / why:
Commands executed and exit codes:
Functional Fxx: PASS / FAIL / NOT RUN / BLOCKED + evidence
Security Sxx: ...
Responsive Rxx by viewport/theme/sidebar: ...
Visual rubric: ... /20 (only scored with evidence)
Remaining issues, backend limitations, regressions:
Patch file list / check on clean baseline:
Decision: ready for next iteration / ready for runtime review / ready to merge
```

## 9. Definition of Done

- [ ] API contract and audit traceability reviewed; no fabricated endpoint or metrics.
- [ ] Records, detail, filters, search, paging, CSV và analytics thực sự hoạt động theo scope.
- [ ] Full build/typecheck và tests pass trên môi trường cài dependencies; kết quả recorded.
- [ ] P0 semantics, no stale scope, permission tests pass; backend limitations không bị che.
- [ ] Responsive matrix và accessibility thực nghiệm; chart colors follow theme, no horizontal page overflow.
- [ ] Overview V16 vẫn hoạt động, teammate files không thay đổi; visual rubric đạt.
- [ ] Patch được kiểm tra trên clean baseline; tài liệu update và user review trước commit.

Nếu một điều kiện không đáp ứng, ghi lý do và giữ trạng thái “chưa nghiệm thu”. Đây là quality gate, không phải checklist trang trí.
