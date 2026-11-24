# Component standards & remediation plan — V26–V28 (đề xuất)

Đọc cùng `component-audit.md`. Baseline V25. Mục tiêu: có foundation ổn định trước Kết quả thi, giữ chức năng, API contract, quyền và bố cục hiện có. Chưa triển khai code, chưa chạy các gate mới.

## 1. Kiến trúc

- `components/expressive/`: source registry đã chọn + adaptation nhỏ có lý do; lưu xuất xứ, phiên bản/commit hoặc hash registry snapshot, dependency và diff khi nhập. Không ghi đè file local bằng CLI trực tiếp.
- `shared/`: facade của ứng dụng (PageRefresh, responsive dialog, data workspace primitives, table toolbar, pagination, resource state, status label, download helper). Chỉ tách khi có >=2 consumer và trách nhiệm giống nhau; không import từ feature khác.
- `features/`: filters/query/model, columns, details, request scope, chart options và dữ liệu nghiệp vụ. Không dùng generic schema-driven toàn màn hình.
- `styles/`: color/type/shape/motion tokens, state layer, focus; feature CSS chỉ cho layout và ngoại lệ nghiệp vụ. Không selector rộng sửa primitive theo trang, không !important để che xung đột.

## 2. Quy chuẩn trực quan và hành vi

| Tình huống | Component / rule |
|---|---|
| Hành động chính | Filled Button, một hành động chính mỗi toolbar/form; export thường tonal |
| Action phụ | Tonal, outlined, text theo mức độ; icon-only dùng IconButton + label/tooltip; tránh width morph |
| 2 mode độc quyền | ConnectedButtonGroup qua ViewSwitch facade: giữ đúng một selected, màu selected rõ, 2px gap, không outer shell, check slot cố định, không layout shift |
| 3+ panel điều hướng | Tabs; selected indicator, arrow keys, tab/tabpanel liên kết; Admin dirty guard giữ nguyên |
| Chọn nhiều | Checkbox nếu trong form draft; FilterChip nếu toggle áp dụng ngay |
| Điều kiện đã áp dụng | InputChip có removeLabel tiếng Việt, xóa đúng group, không làm mất điều kiện khác |
| Chọn một giá trị | Select có label; menu radio nếu là lựa chọn setting/action trên menu |
| Status nghiệp vụ | StatusLabel span, text rõ, tone neutral/success/warning/error phù hợp; không dùng màu làm dấu hiệu duy nhất; unknown không tự coi là lỗi hoặc success |
| Form | label above ở toolbar, floating ở form độc lập khi không che label; lỗi inline; preserve native autocomplete |
| Dialog | modal có title, focus trap/restore; header/body/footer; short vs form/detail; full-screen compact, body scroll, safe area; mutation busy không dismiss |
| Table | semantic HTML, numeric align right, sort button/aria-sort, row key thật, sticky header nếu phù hợp; mặc định chỉ cột cần thiết |
| Mobile records | danh sách có tên/mã + status + meta quan trọng; icon/label mở detail; không nested controls, không phải scroll ngang để mở chi tiết |
| Pagination | 1-based, count/range chính xác, page size reset trang, prev/next rõ, số trang khi đủ rộng; empty không hiển thị 1–0 |
| Loading/refresh | initial skeleton hoặc loading indicator, no blank/old scope flash; refresh same query giữ dữ liệu, error rõ; retry đúng request |
| Export | feature toolbar, CSV single button, report nhiều định dạng menu; API, filename, MIME và permission không đổi |
| Surface/card | dùng surface container roles, scale shape 12/16/20/28 phù hợp containment; không card lồng vô ích |
| Chart | ECharts V16, theme sync, responsive labels, table alternative; series toggle multi-select riêng |

### Motion & density

Giữ Expressive theme toàn cục; component công việc dùng `motion="standard"` khi cần. Không animation width/padding/height khi press trong toolbar/table, không spring bounce lớn. Dùng token transition; nếu thật sự cần fixed duration, đặt trong adaptation chung và giải thích. Respect prefers-reduced-motion kể cả JS ripple. Kiểm tra mouse, touch, keyboard, rapid clicks; text và control bounds không đổi khi đổi selected. 48px target cho thao tác chính/mobile, compact desktop có thể 40–44px với spacing/focus đủ; chip visual nhỏ nhưng target không chồng nhau. Không ép toàn bộ button min-height bằng feature selector.

### Responsive

Content-based: <680px record list; 680–999px bảng thiết yếu; >=1000px bảng mở rộng. Giữ container query của V19/V23. Test viewport 320,360,390,430,600,768,1024,1280,1440,1920; content 339/340, 679/680, 999/1000; chart 339/340/479/480. Sidebar open/rail, partner title dài, 200% zoom, keyboard open, 5 palette * light/dark, system theme. Dialog portal lấy viewport; chart lấy host width. Không co cả desktop UI xuống bằng transform.

## 3. V26 — Registry & interaction foundation

1. Xác định registry snapshot tương thích với lockfile 0.0.1, Base UI và CSS local. Dùng temp branch/worktree, lấy source từng component, kiểm tra import, type/API và dependency diff; không giả định latest tương thích. Nếu không thể lấy bản tương thích, giữ adaptation V25 và ghi blocker.
2. Chuẩn hóa Button/IconButton policy, ConnectedButtonGroup + ViewSwitch adapter, dùng cho Contacts/Leads và Overview timeline (giữ ngữ nghĩa cumulative). Xóa old ButtonGroup wrapper và CSS nếu không có consumer.
3. Nhập/điều chỉnh Checkbox, Chip (InputChip/AssistChip/FilterChip), Tabs; thay controls cùng semantics ở Contacts, Leads, Quality/Admin. Không biến status thành chip tương tác.
4. Dùng Select existing cho sort/group/page size qua adapter phù hợp; date native giữ đến khi thử date picker.
5. Review gate: keyboard states, selected, size stable, no layout shift, filtering draft, unsaved-change guard, URL/back, all themes. Build bắt buộc trên môi trường đủ deps.

## 4. V27 — Shared data workspace

1. Shared responsive Dialog facade dựa trên registry nếu đạt focus/close/full-screen gate; chuyển Contacts/Leads trước. Giữ Admin native nếu migration chưa bảo toàn busy guard; ThemeStudio follow-up. AlertDialog chỉ confirmation phù hợp.
2. Shared Table primitives + RecordList layout + Pagination adapter; giữ feature-specific query, column renderer, responsive mandatory columns, row identity. Không import table state library mới nếu không cần. Chuyển từng feature, review trước khi thay tiếp.
3. TableToolbar + status label + ResourceState/Alert. Chuẩn hóa lỗi, retry, empty/loading, sort/select; preserve state isolation, scope, privacy.
4. Chỉ tách CSV lifecycle nếu giữ abort/scope, permission, MIME, file name, status; không tự mở quyền export. Có thể hoãn nếu không đủ regression coverage.
5. Review gate: full list→detail→close; multi filters; search debounce; sort/page_size; scope switch; CSV; mobile 320/390; keyboard + screen reader.

## 5. V28 — System-wide quality review

1. Rà soát Login/Account, Shell, Overview, Contacts, Leads, Admin/Quality. Không sửa file thuộc Marketing/Sponsorship của đồng đội; gửi component guide và API adapter cho họ.
2. Card/section shape, typography, state, toolbar alignment; chọn lọc registry Card/Divider/Alert/Loading. Không đổi IA hoặc bento nếu không có lý do. Không bắt buộc FAB, carousel, split button.
3. Đánh giá native date input vs DatePicker ở browser thực. Giữ native nếu tốt hơn. Giữ ECharts, PageRefresh, Sidebar V20.
4. Thêm `test:contacts`, `test:leads`, test UI nếu môi trường hỗ trợ; `test:local` bao gồm cả hai. Thêm component showcase dev-only hoặc test fixture, không thêm route sản phẩm giả.
5. Review lại code còn selector override hoặc duplicate primitive, ghi lý do nếu giữ. Không tính số component registry như metric thành công.

## 6. Gate nghiệm thu trước Exams

### Functional / regression
- [ ] `npm run build` pass với dependency thật; `npm run test:local` pass và chạy cả Contacts, Leads.
- [ ] Contacts, Leads: options theo scope, draft Apply/Cancel/Reset, remove đúng chip, search chỉ list/CSV, page/sort giữ đúng, modal detail không stale, PII/export guard không đổi.
- [ ] Overview: daily/cumulative, legend toggle giữ ít nhất một series, chart/table, export xlsx/docx/pdf.
- [ ] Admin: dirty changes confirmation, mutation busy không dismiss/double-submit, account edit/reset/lock, ETL confirm, audit; Quality tabs/phân trang/refresh.
- [ ] Login/Account: form submission Enter, validation, password manager/autocomplete, error/success message.
- [ ] Scope, routing, permission, session expired, logout, theme persistence và PageRefresh đúng hành vi cũ.

### Component states & accessibility
- [ ] Keyboard-only: Tab, Shift+Tab, Escape, arrows, Home/End theo component semantics; focus restore/visible; no focus hidden under clipping.
- [ ] Dialog scroll, mobile keyboard, safe-area, no accidental backdrop close during pending mutation.
- [ ] Selected/hover/pressed/disabled/focus state distinct; status text not color-only; accessible name tiếng Việt; no tooltip-only essential info.
- [ ] Focus/ARIA relationships for tab, toggle, input chip remove, table sort, status/live errors; axe nếu có browser runtime, manual screen reader check quan trọng.
- [ ] Motion normal/reduced; rapid switch and touch; no movement of text/control bounds; no duplicate ripple.

### Visual / responsiveness
- [ ] 10 viewport widths và breakpoint content, sidebar expanded/rail/mobile; no whole-page x overflow; optional extra columns local scroll only.
- [ ] 5 palettes x light/dark, system mode, zoom 200%, long Vietnamese labels; text/selected contrast.
- [ ] Real app screenshot desktop/mobile for all touched screens, chart runtime interactions; fixture-only tests marked separate.
- [ ] Visual review: controls serving the same function have same visual/behavior, clear hierarchy, no excess rounding/card nesting, no repeated headings.

### Delivery
- [ ] Incremental commits in isolated workspace (local only) and one verified Git patch V25 → final version. No automatic remote write; no unrelated changes/dependencies.
- [ ] Document exact registry source versions and changes, new facade usage, changed files, tests actually executed and blockers.
- [ ] If full runtime cannot run here: report limitation, do not label static HTML/CSS tests as product review completed. User runtime gate before next feature.

## 7. Acceptance and stop conditions

Keep old implementation if registry replacement worsens keyboard behavior, mobile layout, data consistency or busy guards; adapt instead of forcing migration. Don't block on purely cosmetic registry matching. No new backend endpoints or permission changes. No work on Exams until P1 gate reviewed. V26–V28 names are proposed, not completed versions.
