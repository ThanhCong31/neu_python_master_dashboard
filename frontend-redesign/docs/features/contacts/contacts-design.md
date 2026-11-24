# Contacts — Information Architecture & Material 3 Expressive Visual Design

**Trạng thái:** đề xuất thiết kế trước code. Baseline V16. Audit và API contract là nguồn ràng buộc; mọi con số trong wireframe là ví dụ. Không thay Shell, navigation, theme hay quy trình xác thực.

## 1. Vai trò màn hình và nhiệm vụ

Tổng quan trả lời “Tình hình thế nào?”; Liên hệ & chuyển đổi trả lời “Những hồ sơ nào phù hợp với điều kiện, và chúng đang chuyển đổi ra sao?”. Lead từ biểu mẫu trả lời “Nguồn lead ban đầu có gì?”. Không trộn ba tập dữ liệu.

| Người dùng | Nhiệm vụ ưu tiên | Thiết kế đáp ứng |
|---|---|---|
| Ban tuyển sinh | Tìm một người, xem trạng thái, nguồn, ngày đăng ký, PIC | Search → danh sách → chi tiết chỉ đọc |
| Người điều hành | Phân tích tỷ lệ chuyển đổi giữa bảng/miền/nhóm | Filter → Phân tích → bảng số liệu |
| Đối tác được cấp contacts | Xem hồ sơ trong scope và báo cáo được phép | Cùng UI, backend row-level + PII masking |
| Nhà tài trợ không có contacts | Không có quyền truy cập trang | Route guard hiện có, không dựng trang demo thay thế |

Tác vụ chính phải hoàn thành mà không đi qua chart. Đọc nhanh chứ không phải chỉnh sửa hồ sơ: API hiện tại chỉ đọc.

## 2. IA — hai chế độ, một bộ lọc nghiệp vụ

```
Shell (title: Liên hệ & chuyển đổi; scope ở app bar)
  Context: phạm vi đang xem + Cập nhật
  Bộ lọc nghiệp vụ chung (ngày tiếp xúc, bảng, thanh toán, thêm lọc)
  [Hồ sơ liên hệ] [Phân tích tuyển sinh]  ← 2 lựa chọn loại trừ nhau
  ├── Hồ sơ liên hệ (mặc định)
  │    Search danh sách + số kết quả + Xuất CSV + Cột (desktop)
  │    Data table / record list
  │    Phân trang
  │    Chi tiết hồ sơ (overlay, chỉ đọc)
  └── Phân tích tuyển sinh
       Cụm chỉ số + phễu và giải thích
       Đăng ký theo ngày (theo ngày đăng ký, trạng thái hiện tại)
       Phân bố theo nhóm (chọn chiều phân tích)
       Chỉ số chất lượng / dữ liệu giả định nếu liên quan
       Bảng số liệu tương ứng
```

Dùng view query `view=analysis` hoặc mặc định records tại `/crm`, không tạo route/sidebar mới. Tabs hoặc connected toggle có semantics chọn một, focus bàn phím và panel association; không dùng action menu như tab. Giữ filter nghiệp vụ khi chuyển view. Search chỉ danh sách: label và count tách rõ, khi quay lại danh sách vẫn giữ q trong memory; ở phân tích hiển thị “Không áp dụng tìm kiếm danh sách” nếu q tồn tại, không đưa q vào URL. Không đặt KPI tổng toàn trang trước bảng khi q làm thu hẹp kết quả. Tab records không mount chart và không cần summary request; tab analysis không fetch list. Options dùng chung. Việc đổi mode không làm thay đổi scope.

## 3. Wireframe theo content width

Đây là sơ đồ bố cục, không phải ảnh cuối. Shell V16 cung cấp h1; không lặp h1 bên trong feature.

### Expanded (content >= 1000 px)

```
[Scope label]                                     [↻ Cập nhật]
[Ngày tiếp xúc đầu ▾] [Bảng ▾] [Thanh toán ▾] [Bộ lọc +3] [Xóa lọc]
  chip đang áp dụng, wrap nếu nhiều
╭ Hồ sơ liên hệ ● ╮  ╭ Phân tích tuyển sinh ╮
╭─────────────────────────────────────────────────────────────╮
│ Danh sách liên hệ                         128 hồ sơ phù hợp │
│ [⌕ Tìm mã, họ tên, email                 ] [Cột] [Xuất CSV] │
│ Họ tên / mã       Bảng    Thanh toán        Phụ trách     > │
│ Nguyễn …          Bảng A  Đã thanh toán     Ban tuyển sinh > │
│ email / phone ...          500.000 ₫                         │
│ ...                                                         │
│ 1–20 / 128       Số dòng [20 ▾]          ‹ 1 2 3 … 7 ›      │
╰─────────────────────────────────────────────────────────────╯
```

Bảng là một surface liên tục; tên cột/chữ thông tin đủ lớn, row 60–72px khi hai dòng. Không tô cả row theo payment status. Detail mở modal width vừa phải (khoảng 560–640px, giới hạn viewport); ưu tiên side-aligned nếu focus trap hoạt động, không làm table co còn 400px ngoài ý muốn. Modal read-only không đổi route.

### Medium (content 680–999 px)

```
[Scope] [Cập nhật]
[Ngày] [Bảng] [Thanh toán] [Bộ lọc]
[Hồ sơ liên hệ] [Phân tích]
[Search                                      ]
[128 hồ sơ]                      [Cột] [Xuất CSV]
Tên/mã             Bảng   Thanh toán         Chi tiết
... (PIC/địa phương trong detail hoặc cột tùy chọn)
[1–20 / 128]                 [Số dòng] [‹] [›]
```

Search chiếm hàng riêng khi thiếu chiều rộng. Không thu nhỏ font hay button. Nếu thêm cột, chỉ vùng bảng được cuộn ngang, header/label nhìn rõ; có dấu hiệu cuộn và keyboard-focusable region. Cột danh tính ưu tiên giữ; chỉ sticky nếu test đúng với vùng cuộn, không bắt buộc sticky trên mọi kích thước.

### Compact (content < 680 px; đặc biệt 320–430 viewport)

```
[Scope hiện tại]       [↻]
[ Bộ lọc · 2 ] [Xóa]        ← mở dialog full-screen khi hẹp
[Ngày ... ×] [Bảng A ×]      ← wrap, không kéo ngang bắt buộc
[ Hồ sơ liên hệ | Phân tích ]
[⌕ Tìm kiếm                 ]
128 hồ sơ            [Xuất CSV]
╭────────────────────────────╮
│ Nguyễn Văn …           ›   │
│ PT-001 · Bảng A            │
│ Đã thanh toán · 500.000 ₫  │
│ PIC: Ban tuyển sinh        │
├────────────────────────────┤
│ Hồ sơ tiếp theo            │
╰────────────────────────────╯
1–20 / 128        ‹ 1/7 ›
[Số dòng 20 ▾]
```

Mobile là record list dạng semantic list, không phải CSS biến table thành 15 card riêng. Nhóm thành một surface, divider theo item, có nút Chi tiết đầy đủ, không chỉ swipe. Cột tùy chọn desktop không làm mất dữ liệu mobile vì detail có các trường nghiệp vụ. Detail/filter dialog chiếm gần toàn màn hình khi hẹp, vùng body cuộn riêng, title/footer sticky bên trong dialog nếu cần, nút đóng dễ chạm. Không có layout tràn ra document.

### Phân tích expanded

```
[Filter chung] [Hồ sơ | Phân tích ●]
╭ Đăng ký web   100 ╮╭ Đã đóng phí 60 / 60% ╮╭ Lệ phí ghi nhận ╮
│ Liên hệ 150       ││ Miễn phí: ...        ││ số tiền đầy đủ   │
╰───────────────────╯╰──────────────────────╯╰─────────────────╯
╭ Tiến trình chuyển đổi (5/12) ╮╭ Đăng ký chưa ghi nhận đóng phí (7/12) ╮
│ 3 thanh và mẫu số rõ         ││ số lượng + lệ phí nhóm + ghi chú      │
╰──────────────────────────────╯╰───────────────────────────────────────╯
╭ Đăng ký theo ngày · cohort first_touch       [Bảng số liệu] ╮
│ chart responsive, phân tách trạng thái hiện tại              │
╰─────────────────────────────────────────────────────────────╯
╭ Phân bố & chuyển đổi                 [Nhóm theo: Bảng thi ▾] ╮
│ bar / table theo chiều chọn, sort, nhóm thiếu nhãn            │
╰─────────────────────────────────────────────────────────────╯
  [Cờ dữ liệu: số hồ sơ / số cờ khác nhau; xem bảng nếu cần]
```

Trên mobile: KPI 2 cột khi >=360 content và vừa chữ; dưới ngưỡng hoặc giá trị dài, 1 cột. Phễu và khối chú thích xếp dọc; chart đầy chiều rộng, controls xuống hàng. Không tạo hai hero cùng cấp; không dùng fixed-height gây cắt giá trị lớn. Chỉ vẽ chart khi view đang mở; khi đổi chart dimension render theo data thực.

## 4. Bộ lọc — giao diện và state machine

### 4.1 Thường dùng / nâng cao

Desktop 3 trigger ưu tiên: Ngày tiếp xúc đầu tiên, Bảng thi, Trạng thái thanh toán. Nút `Bộ lọc` mở một form duy nhất có đủ 10 nhóm (kể cả 3 nhóm nhanh) và count số nhóm hoạt động. Miền, tỉnh/TP, segment, kênh, nguồn, người phụ trách, điểm thi nằm trong form. Compact chỉ hiển thị nút Bộ lọc và chips đã áp dụng; không bắt người dùng lướt ngang 10 control. Trigger nhanh có thể mở form focus đúng section thay vì tạo nhiều dropdown code khác nhau. Filter chip có accessible label “Bỏ lọc Bảng A”, icon X chỉ khi có thể bỏ; không dùng decorative status chip làm nút lọc.

Form group: thời gian; hồ sơ (bảng, miền, tỉnh); thanh toán; nguồn & phân nhóm; vận hành (PIC, điểm thi). Multi-select qua checkbox group có label, tìm option khi nhiều; không sử dụng listbox có interactive nested sai semantics. Dùng Select chỉ cho single-value như chiều phân tích hoặc page size. Date range bằng native date control hoặc primitive đã có, label `Từ ngày`/`Đến ngày`, hiển thị min/max như gợi ý dữ liệu, không dùng today preset mù. Cho phép toàn thời gian, một đầu, tháng có dữ liệu nếu hữu ích; không tự áp dụng khi nhập.

### 4.2 Tương tác

1. Mở: copy committed filters sang draft; chưa fetch.
2. Chọn nhiều giá trị: chỉ đổi draft; hiển thị count, không trigger API.
3. Apply: validate date và enum; commit một lần + page 1, đóng và trả focus trigger. Chỉ request view đang mở.
4. Cancel/Escape: bỏ draft, committed nguyên vẹn. Xóa trong form chỉ reset draft; xóa chip ngoài form áp dụng ngay. Xóa toàn bộ cấu trúc giữ mode và scope; search có Xóa riêng.
5. Scope đổi: hủy draft, search, selection/detail, reset filter và page có thông báo; chờ options đúng scope; không mount data trước scope ready.
6. Options lỗi: hiển thị retry, không áp dụng lựa chọn thiếu danh mục; không xóa state có điều kiện im lặng. Nếu options đã sẵn sàng và danh mục rỗng, giải thích không có giá trị, không thay bằng fake option.
7. URL: giữ filter allowlist, mode, back/forward; không ghi q có PII. Nếu URL có giá trị không hợp lệ, báo và yêu cầu sửa; không tự fetch toàn scope nếu người dùng nghĩ đang lọc.

### 4.3 Search và pagination

Search là TextField thật, label accessible, clear button; 300ms debounce, Enter commit ngay nếu có hỗ trợ, max 80 ký tự như backend, trim. Tách “tổng kết quả” và “đang cập nhật”; nếu input draft khác q applied thì không gọi export theo giá trị chưa commit. Reset page cùng lần commit, tránh request page cũ. Khi total giảm khiến page vượt giới hạn, clamp và fetch một lần; không loop. Giữ sort/page size khi filter thay đổi, reset page. Khi q không rỗng, phân tích vẫn structural filter; không suy KPI theo q. Pagination mobile chỉ range, trước/sau, trang hiện tại, page size xuống dòng. Desktop thêm nút page số nếu hữu ích, không quá 5 số liền kề.

## 5. Bảng và chi tiết hồ sơ

| Cột mặc định | Nội dung | Sort |
|---|---|---|
| Họ tên / Mã | full_name, contact_id dòng phụ | full_name; menu sort mã mặc định |
| Bảng | board | board |
| Thanh toán | payment_status và revenue dòng phụ | payment_status; chọn doanh thu riêng trong sort menu |
| Người phụ trách | pic | pic |
| Chi tiết | nút mở có aria-label gắn mã | Không |

Desktop rộng có thể thêm `Tỉnh/TP` mặc định nếu test layout vẫn tốt. Cột nâng cao: email, phone (theo dữ liệu đã mask), tỉnh, kênh (cờ giả định), segment, nguồn, first_touch, điểm thi, cờ, revenue, ngày đăng ký; không bật tất cả mặc định. Cột có thể điều chỉnh bằng menu checkbox; danh tính và action không tắt. Nếu preference lưu, chỉ lưu danh sách key không chứa dữ liệu cá nhân; ưu tiên local component state trong vòng đầu. Sort menu desktop/mobile cho các field whitelist; có hướng ASC/DESC, hiển thị sort hiện tại; không cần sort riêng trên label không hợp lệ. Không có checkbox chọn hàng khi không có bulk action.

Chi tiết hồ sơ từ row hiện có: heading họ tên + mã; payment & revenue; liên hệ (email/phone đã mask theo API), bảng/miền/tỉnh/điểm thi; nguồn/kênh/giả định, segment/drip/PIC; ngày tiếp xúc và ngày đăng ký; cờ cần kiểm tra. Trường thiếu dùng “—” và mô tả nếu quan trọng. Không show CCCD, ngày sinh, ghi chú/câu hỏi tự do mặc định. Không nút chỉnh sửa, thêm, xóa, gọi, gửi mail, thay PIC. Khi filter/scope thay đổi hoặc row không còn thuộc page, đóng detail; focus về nút gốc nếu còn, fallback heading/search. Modal có Escape, focus trap, scroll, label. Không gọi thêm detail endpoint giả.

## 6. Inventory nội dung — giữ, gộp, bỏ khỏi view mặc định

| Nội dung cũ | Quyết định | Lý do / điều kiện |
|---|---|---|
| 6 KPI | Gộp trong Phân tích: 3 cụm chính + unpaid/free/flags có ngữ nghĩa | Không làm bảng bị đẩy xuống; phân biệt mẫu số |
| Phễu | Giữ dạng React/CSS thanh ngang 3 bước | Tỷ lệ rõ; reuse logic V16 nếu thật sự dùng chung |
| Đăng ký theo ngày | Giữ, ECharts stacked bar nếu invariant hợp lệ | `registrations-paid` = chưa ghi nhận đóng phí, gồm miễn phí; không phải payment events; ngày zero giữ nguyên |
| Segment, bảng, vùng, tỉnh, PIC | Gộp selector chiều phân tích trong một ChartPanel | Một chart mỗi lần; chọn Bảng thi mặc định; bảng dữ liệu đầy đủ |
| Kênh | Không chart mặc định, xem trong Truyền thông; row/detail vẫn có | Không lặp ROI; không có assumed breakdown trong summary |
| Tổ hợp nguồn | Tùy chọn nhóm phân tích nếu cần, bảng trước | Không nhầm nguồn với attribution, không cộng membership |
| Drip | Chi tiết hồ sơ, hoãn chart | Không chứng minh campaign đang thực thi từ snapshot |
| Điểm thi | Chi tiết / filter; hoãn chart | `by_venue` không chỉ paid |
| Cờ dữ liệu | Chỉ số flagged + bảng cờ tùy mở | Số cờ khác số hồ sơ; không tạo filter flagged giả |
| Heatmap | Hoãn, không infer giờ gọi hiệu quả | 24 cột khó mobile, giá trị chưa rõ; có thể phục hồi khi use case rõ |
| CSV | Giữ ở Hồ sơ | Tất cả dòng khớp, không page, khác export Overview |

Nhóm chart v1: bảng, miền, tỉnh, segment, PIC, tổ hợp nguồn. `by_payment` có thể dùng bảng nhỏ/metric nếu cần kiểm chứng phân bố. Cho phép lọc bằng nhóm đã chọn chỉ khi có exact mapping (`board`, `region`, `province`, `segment`, `pic`); không map tổ hợp nguồn vào `source` vì ngữ nghĩa khác. Hành động “Xem hồ sơ nhóm này” cần người dùng xác nhận filter thay đổi, page=1, view records; nếu group null ngoài PIC chưa có danh mục exact thì không cho drilldown. Không vẽ click interaction giả.

## 7. Material 3 Expressive — hệ thống thị giác

Tôn trọng preference người dùng ở V15: **màu dữ liệu cùng theme**, đường liền, không categorical palette cố định. Dùng các CSS roles `--ex-color-primary`, `--ex-color-on-secondary-container`, `--ex-color-tertiary`, `--ex-color-on-surface`, `--ex-color-on-surface-variant`, `--ex-color-outline-variant`, `--ex-color-surface-container-*`; reuse `useChartPalette()`. Không tự tạo theme riêng. Màu thanh theo trạng thái nhất quán Overview/Contacts: primary hoặc tertiary cho đã đóng phí theo mapping cụ thể, neutral/secondary-container cho phần còn lại; thêm text label/value để màu không phải dấu hiệu duy nhất. Không dùng error đỏ để ám chỉ miễn phí hay lead chưa đóng phí là lỗi. Status pill nhỏ, text đầy đủ, neutral khi unknown; error dùng cho lỗi hệ thống thực.

| Thành phần | Token / thiết kế mục tiêu |
|---|---|
| Surface bảng | surface-container-low hoặc surface; radius shape-large/extra-large, divider outline-variant nhẹ |
| Header bảng | title-medium; header cột label-large 14px mục tiêu; body-medium 14px trở lên, tên row 15–16px; tabular numbers, tiền căn phải |
| Metric hero (chỉ phân tích) | primary-container/on-primary-container, headline-large/display-small theo width, 24–32px padding expanded |
| Metric phụ | surface-container, headline-medium; không thêm sparkline/delta giả |
| Form | TextField outlined/filled thống nhất labelPlacement, filter chip selected tonal, Button/IconButton existing |
| Detail | Dialog modal, shape-extra-large, tiêu đề title-large, field label body-small/medium, grouping divider |
| Interaction | Ripple/state layer, focus-ring, selected shape, reduced motion; không animate layout dài khi paging |
| Spacing | 4/8px base; 12–16px giữa controls, 16/24px panel padding theo content; 44px tối thiểu cho touch target theo tiêu chuẩn project, ưu tiên 48px |

Không bắt buộc mỗi section một card. Expressive qua hierarchy, shape morph/state, typography, containment và layout thay đổi đúng nhiệm vụ. Không biến bảng thành trang trí bento; bento dùng có chủ đích trong phân tích, còn data workspace ưu tiên mật độ đọc.

## 8. Responsive engineering spec (ràng buộc từ V16)

Dùng chiều rộng **content/container**, không viewport alone: Shell sidebar mở có thể làm laptop chỉ còn ~700–900px. Đề xuất CSS container query cho layout Contacts, đo `ResizeObserver` ở chart host qua V16 wrapper. Breakpoint content: <680 compact list, 680–999 table medium, >=1000 expanded; tinh chỉnh theo test, không hardcode theo loại thiết bị. Test 320–1440 viewport và sidebar đóng/mở. Grid children `min-width:0`, `minmax(0,1fr)`, wrap controls, `overflow-wrap:anywhere` cho text dài không có khoảng trắng. Không `overflow-x:hidden` toàn page để che bug. Chỉ table region scroll ngang khi thêm cột; dialog popover không bị cắt bởi vùng overflow. Modal nhỏ mobile dùng `max-height` theo dynamic viewport, padding safe-area khi cần. Focus và close luôn trong vùng nhìn.

Chart reuse V16 `Chart.tsx`/`theme.ts`/`responsive.ts` với makeOption(palette, layout), responsive ticks 3–9 theo host; chỉ giảm nhãn, không giảm data. Ngày đầy đủ trong tooltip/table, chiều cao compact 240–280px tùy chart, trục không chồng. Group chart nhiều category: giới hạn height và ưu tiên top N rõ nhãn “Hiển thị N/M nhóm” + bảng toàn bộ, không tự gộp Other nếu làm sai tổng; trên narrow ưu tiên horizontal bar/label wrap và bảng. Legend chữ 14–15px, tương tác ẩn/hiện với aria-pressed, có reset nếu tất cả tắt hoặc ngăn tắt hết; line/bar/legend/tooltip cùng palette. Tooltip confine/touch, không chỉ hover; có bảng dữ liệu semantic. Kiểm tra 0, 1, 365 ngày, 30+ nhóm, tên tiếng Việt dài, font loading, theme switch, resize không reload API. Không sửa shared chart nếu có thể bằng config riêng; nếu cần mở rộng, kiểm tra Overview regression và teammate.

## 9. Các quyết định cần duyệt (chốt trước code)

| ID | Đề xuất | Điều kiện thay đổi |
|---|---|---|
| D01 | Hồ sơ mặc định, Phân tích mode riêng | Nếu tác vụ chính là báo cáo chứ không tra cứu, review IA lại |
| D02 | Cùng structural filters, q chỉ list/CSV | Nếu muốn q toàn trang, phải đồng bộ KPI/summary và privacy trước |
| D03 | 3 filter nhanh + form 10 nhóm; Apply/Cancel | Không quay về 10 dropdown thường trực |
| D04 | 4 cột dữ liệu chính + action; mobile record list | Cột bổ sung sau review bằng dữ liệu thật |
| D05 | Detail read-only từ row | Mutation/detail server chỉ khi backend contract có |
| D06 | Giữ funnel, daily, 1 grouping panel; hoãn heatmap/drip/venue | Bổ sung khi có use case và kiểm thử semantic |
| D07 | Theme-synchronized chart, V16 responsive | Không palette cố định trừ khi user đổi quyết định |
| D08 | CSV riêng, mọi kết quả; Overview không filter | Không thêm report export toàn trang hoặc giả exact drilldown |

Khi implement, document thay đổi quyết định và lý do; không tự mở rộng scope vì có dữ liệu dư trong response.
